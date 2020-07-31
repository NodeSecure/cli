"use strict";

// Require Node.js Dependencies
const { join, extname, dirname } = require("path");
const { mkdtemp, readFile, rmdir, access } = require("fs").promises;
const { EventEmitter } = require("events");
const os = require("os");

// Require Third-party Dependencies
const { red, white, yellow, cyan, gray, green } = require("kleur");
const combineAsyncIterators = require("combine-async-iterators");
const Arborist = require("@npmcli/arborist");
const Spinner = require("@slimio/async-cli-spinner");
const Registry = require("@slimio/npm-registry");
const difference = require("lodash.difference");
const isMinified = require("is-minified-code");
const Lock = require("@slimio/lock");
const builtins = require("builtins");
const iter = require("itertools");
const pacote = require("pacote");
const semver = require("semver");
const ntlp = require("ntlp");
const ms = require("ms");
const is = require("@slimio/is");
const { runASTAnalysis } = require("js-x-ray");

// Require Internal Dependencies
const {
    getTarballComposition, mergeDependencies, cleanRange, getRegistryURL,
    isSensitiveFile, getPackageName, readPackageLock, constants
} = require("./utils");
const { hydrateNodeSecurePayload } = require("./vulnerabilities");
const Dependency = require("./dependency.class");
const applyWarnings = require("./warnings");
const i18n = require("./i18n");

// CONSTANTS
const DIRECT_PATH = new Set([".", "..", "./", "../"]);
const NODE_CORE_LIBS = new Set(builtins());
const REGISTRY_DEFAULT_ADDR = getRegistryURL();

// Vars
const npmReg = new Registry(REGISTRY_DEFAULT_ADDR);
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};
Spinner.DEFAULT_SPINNER = "dots";

async function getExpectedSemVer(depName, range) {
    try {
        const { versions, "dist-tags": { latest } } = await pacote.packument(depName, {
            registry: REGISTRY_DEFAULT_ADDR,
            ...token
        });
        const currVersion = semver.maxSatisfying(Object.keys(versions), range);

        return [currVersion === null ? latest : currVersion, semver.eq(latest, currVersion)];
    }
    catch (err) {
        return [cleanRange(range), true];
    }
}

async function getCleanDependencyName([depName, range]) {
    const [depVer, isLatest] = await getExpectedSemVer(depName, range);

    return [`${depName}@${range}`, `${depName}@${depVer}`, isLatest];
}

async function* searchDeepDependencies(packageName, gitURL, options) {
    const isGit = typeof gitURL === "string";
    const { exclude, currDepth = 0, parent, maxDepth } = options;
    parent.dependencyCount++;

    const { name, version, deprecated, ...pkg } = await pacote.manifest(isGit ? gitURL : packageName, {
        ...token,
        registry: REGISTRY_DEFAULT_ADDR,
        cache: `${os.homedir()}/.npm`
    });
    const { dependencies, customResolvers } = mergeDependencies(pkg);
    if (dependencies.size > 0) {
        parent.hasIndirectDependencies = true;
    }

    const current = new Dependency(name, version, parent);
    if (isGit) {
        current.isGit(gitURL);
    }
    current.isDeprecated = deprecated === true;
    current.hasCustomResolver = customResolvers.size > 0;
    current.hasDependencies = dependencies.size > 0;

    if (currDepth !== maxDepth) {
        const config = {
            exclude, currDepth: currDepth + 1, parent: current, maxDepth
        };

        const gitDependencies = iter.filter(customResolvers.entries(), ([, valueStr]) => valueStr.startsWith("git+"));
        for (const [depName, valueStr] of gitDependencies) {
            yield* searchDeepDependencies(depName, valueStr.slice(4), config);
        }

        const depsNames = await Promise.all(iter.map(dependencies.entries(), getCleanDependencyName));
        for (const [fullName, cleanName, isLatest] of depsNames) {
            if (!isLatest) {
                current.hasOutdatedDependency = true;
            }

            if (exclude.has(cleanName)) {
                exclude.get(cleanName).add(current.fullName);
            }
            else {
                exclude.set(cleanName, new Set([current.fullName]));
                yield* searchDeepDependencies(fullName, void 0, config);
            }
        }
    }

    yield current;
}

async function processPackageTarball(name, version, options) {
    const { ref, tmpLocation, tarballLocker } = options;

    const dest = tmpLocation === null ? process.cwd() : join(tmpLocation, `${name}@${version}`);
    const free = await tarballLocker.acquireOne();

    try {
        if (tmpLocation !== null) {
            await pacote.extract(ref.flags.isGit ? ref.gitUrl : `${name}@${version}`, dest, {
                ...token,
                registry: REGISTRY_DEFAULT_ADDR,
                cache: `${os.homedir()}/.npm`
            });
            await new Promise((resolve) => setImmediate(resolve));
        }
        let depsInLocalPackage = null;
        let devDepsInLocalPackage = [];

        // Read the package.json file in the extracted tarball
        try {
            const packageStr = await readFile(join(dest, "package.json"), "utf-8");
            const {
                description = "", author = {}, scripts = {},
                dependencies = {}, devDependencies = {}
            } = JSON.parse(packageStr);
            ref.description = description;
            ref.author = author;
            depsInLocalPackage = [...Object.keys(dependencies)];
            devDepsInLocalPackage = Object.keys(devDependencies);

            ref.flags.hasScript = [...Object.keys(scripts)].some((value) => constants.NPM_SCRIPTS.has(value.toLowerCase()));
        }
        catch (err) {
            ref.flags.hasManifest = false;
        }

        // Get the composition of the extracted tarball
        const { ext, files, size } = await getTarballComposition(dest);
        ref.size = size;
        ref.composition.extensions.push(...ext);
        ref.composition.files.push(...files);
        ref.flags.hasBannedFile = files.some((path) => isSensitiveFile(path));

        // Search for minified and runtime dependencies
        const jsFiles = files.filter((name) => constants.EXT_JS.has(extname(name)));
        const dependencies = [];
        const filesDependencies = new Set();
        const inTryDeps = new Set();

        for (const file of jsFiles) {
            try {
                const str = await readFile(join(dest, file), "utf-8");
                const isMin = file.includes(".min") || isMinified(str);

                const ASTAnalysis = runASTAnalysis(str, { isMinified: isMin });
                ASTAnalysis.dependencies.removeByName(name);
                for (const depName of ASTAnalysis.dependencies) {
                    // eslint-disable-next-line max-depth
                    if (depName.startsWith(".")) {
                        const indexName = DIRECT_PATH.has(depName) ? join(depName, "index.js") : join(dirname(file), depName);
                        filesDependencies.add(indexName);
                    }
                    else {
                        dependencies.push(depName);
                    }
                }
                [...ASTAnalysis.dependencies.getDependenciesInTryStatement()]
                    .forEach((depName) => inTryDeps.add(depName));

                if (!ASTAnalysis.isOneLineRequire && isMin) {
                    ref.composition.minified.push(file);
                }
                ref.warnings.push(...ASTAnalysis.warnings.map((curr) => Object.assign({}, curr, { file })));
            }
            catch (err) {
                if (!Reflect.has(err, "code")) {
                    ref.warnings.push({
                        file, kind: "ast-error", value: err.message,
                        start: { line: 0, column: 0 }, end: { line: 0, column: 0 }
                    });
                    ref.flags.hasWarnings = true;
                }
            }
        }

        ref.flags.hasWarnings = ref.warnings.length > 0;
        const required = [...new Set(dependencies)];

        if (depsInLocalPackage !== null) {
            const thirdPartyDependencies = required
                .map((name) => (depsInLocalPackage.includes(name) ? name : getPackageName(name)))
                .filter((name) => !name.startsWith("."))
                .filter((name) => !NODE_CORE_LIBS.has(name))
                .filter((name) => !devDepsInLocalPackage.includes(name))
                .filter((name) => !inTryDeps.has(name));
            ref.composition.required_thirdparty = thirdPartyDependencies;

            const unusedDeps = difference(
                depsInLocalPackage.filter((name) => !name.startsWith("@types")), thirdPartyDependencies);
            const missingDeps = new Set(difference(thirdPartyDependencies, depsInLocalPackage));

            ref.flags.hasMissingOrUnusedDependency = unusedDeps.length > 0 || missingDeps.length > 0;
            ref.composition.unused.push(...unusedDeps);
            ref.composition.missing.push(...missingDeps);
        }

        ref.composition.required_files = [...filesDependencies]
            .filter((depName) => depName.trim() !== "")
            // .map((depName) => {
            //     return files.includes(depName) ? depName : join(depName, "index.js");
            // })
            .map((depName) => (extname(depName) === "" ? `${depName}.js` : depName));
        ref.composition.required_nodejs = required.filter((name) => NODE_CORE_LIBS.has(name));
        ref.flags.hasExternalCapacity = ref.composition.required_nodejs
            .some((depName) => constants.EXT_DEPS.has(depName));
        ref.flags.hasMinifiedCode = ref.composition.minified.length > 0;

        await new Promise((resolve) => setImmediate(resolve));
        const licenses = await ntlp(dest);
        ref.flags.hasLicense = licenses.uniqueLicenseIds.length > 0;
        ref.flags.hasMultipleLicenses = licenses.hasMultipleLicenses;
        ref.license = licenses;
        ref.license.uniqueLicenseIds = licenses.uniqueLicenseIds;
    }
    catch (err) {
        ref.flags.hasLicense = true;
    }
    finally {
        free();
    }
}

async function fetchPackageMetadata(name, version, options) {
    const { ref, regEE } = options;

    try {
        const publishers = new Set();
        const oneYearFromToday = new Date();
        oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() - 1);

        const pkg = await npmReg.package(name);
        ref[version].flags.isOutdated = semver.neq(version, pkg.lastVersion);
        ref.metadata.publishedCount = pkg.versions.length;
        ref.metadata.lastUpdateAt = pkg.publishedAt(pkg.lastVersion);
        ref.metadata.hasReceivedUpdateInOneYear = !(oneYearFromToday > ref.metadata.lastUpdateAt);
        ref.metadata.lastVersion = pkg.lastVersion;
        ref.metadata.homepage = pkg.homepage || null;
        ref.metadata.maintainers = pkg.maintainers;
        ref.metadata.author = pkg.author.name || pkg.author;

        for (const version of pkg.versions) {
            const { npmUser } = pkg.version(version);
            if (!is.nullOrUndefined(npmUser)) {
                const name = npmUser.name || version.npmUser;
                if (!publishers.has(name)) {
                    publishers.add(name);
                    ref.metadata.publishers.push({ name, version, at: pkg.publishedAt(version) });
                }
            }

            if (is.nullOrUndefined(ref.metadata.author) || is.nullOrUndefined(version.author)) {
                continue;
            }

            const name = version.author.name || version.author;
            if (is.string(name) && name !== ref.metadata.author) {
                ref.metadata.hasChangedAuthor = true;
            }
        }

        ref.metadata.hasManyPublishers = publishers.size > 1;
    }
    catch (err) {
        // Ignore
    }
    finally {
        regEE.emit("done");
    }
}

async function* deepReadEdges(edges, parent) {
    for (const [packageName, { to }] of edges) {
        if (to.dev) {
            continue;
        }
        const { version, integrity = to.integrity } = to.package;
        parent.dependencyCount++;

        const { deprecated, _integrity, ...pkg } = await pacote.manifest(`${packageName}@${version}`, {
            ...token, registry: REGISTRY_DEFAULT_ADDR, cache: `${os.homedir()}/.npm`
        });
        const { dependencies, customResolvers } = mergeDependencies(pkg);
        if (dependencies.size > 0) {
            parent.hasIndirectDependencies = true;
        }

        const current = new Dependency(packageName, version, parent);
        current.hasValidIntegrity = _integrity === integrity;
        current.isDeprecated = deprecated === true;
        current.hasDependencies = to.edgesOut.size > 0;
        current.hasCustomResolver = customResolvers.size > 0;

        if (current.hasDependencies) {
            yield* deepReadEdges(to.edgesOut, current);
        }
        yield current;
    }
}

async function* getRootDependencies(manifest, options) {
    const { maxDepth = 4, exclude, usePackageLock } = options;

    const { dependencies, customResolvers } = mergeDependencies(manifest, void 0);
    const parent = new Dependency(manifest.name, manifest.version);
    parent.hasCustomResolver = customResolvers.size > 0;
    parent.hasDependencies = dependencies.size > 0;

    let iterators = [];
    if (usePackageLock) {
        const arb = new Arborist({ ...token, registry: REGISTRY_DEFAULT_ADDR });
        let tree;
        try {
            await access(join(process.cwd(), "node_modules"));
            tree = await arb.loadActual();
        }
        catch {
            tree = await arb.loadVirtual();
        }

        for await (const dep of deepReadEdges(tree.edgesOut, parent)) {
            yield dep;
        }
    }
    else {
        const configRef = { exclude, maxDepth, parent };
        iterators = [
            ...iter.filter(customResolvers.entries(), ([, valueStr]) => valueStr.startsWith("git+"))
                .map(([depName, valueStr]) => searchDeepDependencies(depName, valueStr.slice(4), configRef)),
            ...iter.map(dependencies.entries(), ([name, ver]) => searchDeepDependencies(`${name}@${ver}`, void 0, configRef))
        ];
        for await (const dep of combineAsyncIterators(...iterators)) {
            yield dep;
        }
    }

    // Add root dependencies to the exclude Map (because the parent is not handled by searchDeepDependencies)
    // if we skip this the code will fail to re-link properly dependencies in the following steps
    const depsName = await Promise.all(iter.map(dependencies.entries(), getCleanDependencyName));
    for (const [, fullRange, isLatest] of depsName) {
        if (!isLatest) {
            parent.hasOutdatedDependency = true;
        }
        if (exclude.has(fullRange)) {
            exclude.get(fullRange).add(parent.fullName);
        }
    }

    yield parent;
}

async function depWalker(manifest, options = Object.create(null)) {
    const { verbose = true, forceRootAnalysis = false, usePackageLock = false } = options;

    // Create TMP directory
    const tmpLocation = await mkdtemp(join(os.tmpdir(), "/"));
    const id = tmpLocation.slice(-6);

    const payload = {
        id,
        rootDepencyName: manifest.name,
        warnings: [],
        dependencies: new Map()
    };

    // We are dealing with an exclude Map to avoid checking a package more than one time in searchDeepDependencies
    const exclude = new Map();

    {
        const treeSpinner = new Spinner({ verbose })
            .start(white().bold(i18n.getToken("depWalker.fetch_and_walk_deps")));
        const tarballSpinner = new Spinner({ verbose })
            .start(white().bold(i18n.getToken("depWalker.waiting_tarball")));
        const regSpinner = new Spinner({ verbose })
            .start(white().bold(i18n.getToken("depWalker.fetch_on_registry")));

        let allDependencyCount = 0;
        let processedTarballCount = 0;
        let processedRegistryCount = 0;
        const promisesToWait = [];

        const tarballLocker = new Lock({ maxConcurrent: 5 });
        const regEE = new EventEmitter();
        regEE.on("done", () => {
            processedRegistryCount++;
            const stats = gray().bold(`[${yellow().bold(processedRegistryCount)}/${allDependencyCount}]`);
            regSpinner.text = white().bold(`${i18n.getToken("depWalker.fetch_metadata")} ${stats}`);
        });
        tarballLocker.on("freeOne", () => {
            processedTarballCount++;
            const stats = gray().bold(`[${yellow().bold(processedTarballCount)}/${allDependencyCount}]`);
            tarballSpinner.text = white().bold(`${i18n.getToken("depWalker.analyzed_tarball")} ${stats}`);
        });

        for await (const currentDep of getRootDependencies(manifest, { maxDepth: options.maxDepth, exclude, usePackageLock })) {
            allDependencyCount++;
            const { name, version } = currentDep;
            const current = currentDep.exportAsPlainObject(name === manifest.name ? 0 : void 0);

            // Note: These are not very well handled in my opinion (not so much lazy ...).
            promisesToWait.push(fetchPackageMetadata(name, version, { ref: current, regEE }));
            promisesToWait.push(processPackageTarball(name, version, {
                ref: current[version],
                tmpLocation: forceRootAnalysis && name === manifest.name ? null : tmpLocation,
                tarballLocker
            }));

            if (payload.dependencies.has(name)) {
                // TODO: how to handle different metadata ?
                const dep = payload.dependencies.get(name);

                const currVersion = current.versions[0];
                if (!Reflect.has(dep, currVersion)) {
                    dep[currVersion] = current[currVersion];
                    dep.versions.push(currVersion);
                }
            }
            else {
                payload.dependencies.set(name, current);
            }
        }

        const execTree = cyan().bold(ms(Number(treeSpinner.elapsedTime.toFixed(2))));
        treeSpinner.succeed(white().bold(
            i18n.getToken("depWalker.success_fetch_deptree", yellow().bold(i18n.getToken("depWalker.dep_tree")), execTree)));

        // Wait for all extraction to be done!
        await Promise.allSettled(promisesToWait);
        await new Promise((resolve) => setImmediate(resolve));

        const execTarball = cyan().bold(ms(Number(tarballSpinner.elapsedTime.toFixed(2))));
        tarballSpinner.succeed(white().bold(
            i18n.getToken("depWalker.success_tarball", green().bold(allDependencyCount), execTarball)));
        regSpinner.succeed(white().bold(i18n.getToken("depWalker.success_registry_metadata")));
    }

    // Search for vulnerabilities in the local .json db
    await hydrateNodeSecurePayload(payload.dependencies);

    // In case we walk with the package-lock we need to re-create all link between dependencies
    // We need to do it here because the package-lock is not ordered
    if (usePackageLock) {
        for await (const [depName, infos] of readPackageLock()) {
            for (const [name, range] of Object.entries(infos.requires || {})) {
                const currDep = payload.dependencies.get(name);
                currDep.versions
                    .filter((version) => semver.satisfies(version, range))
                    .forEach((version) => (currDep[version].usedBy[depName] = infos.version));
            }
        }
    }

    // We do this because it "seem" impossible to link all dependencies in the first walk.
    // Because we are dealing with package only one time it may happen sometimes.
    for (const [packageName, descriptor] of payload.dependencies) {
        for (const verStr of descriptor.versions) {
            const fullName = `${packageName}@${verStr}`;
            const usedDeps = exclude.get(fullName) || new Set();
            if (usedDeps.size === 0) {
                continue;
            }

            const usedBy = Object.create(null);
            for (const [name, version] of [...usedDeps].map((name) => name.split(" "))) {
                usedBy[name] = version;
            }
            Object.assign(descriptor[verStr].usedBy, usedBy);
        }
    }

    // Apply warnings!
    payload.warnings = applyWarnings(payload.dependencies);

    // Cleanup tmpLocation dir
    try {
        await new Promise((resolve) => setImmediate(resolve));
        await rmdir(tmpLocation, { recursive: true });
    }
    catch (err) {
        /* istanbul ignore next */
        console.log(red().bold(i18n.getToken("depWalker.failed_rmdir", yellow().bold(tmpLocation))));
    }
    if (verbose) {
        console.log("");
    }

    payload.dependencies = Object.fromEntries(payload.dependencies);

    return payload;
}

module.exports = { depWalker };
