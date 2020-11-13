"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { mkdtemp, rmdir, access } = require("fs").promises;
const os = require("os");

// Require Third-party Dependencies
const { red, white, yellow, cyan, gray, green } = require("kleur");
const combineAsyncIterators = require("combine-async-iterators");
const Arborist = require("@npmcli/arborist");
const Spinner = require("@slimio/async-cli-spinner");
const Registry = require("@slimio/npm-registry");
const Lock = require("@slimio/lock");
const iter = require("itertools");
const pacote = require("pacote");
const semver = require("semver");
const ms = require("ms");
const is = require("@slimio/is");

// Require Internal Dependencies
const { mergeDependencies, cleanRange, constants } = require("./utils");
const { hydrateNodeSecurePayload } = require("./vulnerabilities");
const { analyzeDirOrArchiveOnDisk } = require("./tarball");
const Dependency = require("./dependency.class");
const applyWarnings = require("./warnings");
const i18n = require("./i18n");

// VARS
const npmReg = new Registry(constants.DEFAULT_REGISTRY_ADDR);
Spinner.DEFAULT_SPINNER = "dots";

async function getExpectedSemVer(depName, range) {
    try {
        const { versions, "dist-tags": { latest } } = await pacote.packument(depName, {
            ...constants.NPM_TOKEN, registry: constants.DEFAULT_REGISTRY_ADDR
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

    const { name, version, deprecated, ...pkg } = await pacote.manifest(isGit ? gitURL : packageName, {
        ...constants.NPM_TOKEN,
        registry: constants.DEFAULT_REGISTRY_ADDR,
        cache: `${os.homedir()}/.npm`
    });
    const { dependencies, customResolvers } = mergeDependencies(pkg);

    const current = new Dependency(name, version, parent);
    isGit && current.isGit(gitURL);
    current.addFlag("isDeprecated", deprecated === true);
    current.addFlag("hasCustomResolver", customResolvers.size > 0);
    current.addFlag("hasDependencies", dependencies.size > 0);

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
                current.addFlag("hasOutdatedDependency");
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

async function* deepReadEdges(currentPackageName, { to, parent, exclude, fullLockMode }) {
    const { version, integrity = to.integrity } = to.package;

    const updatedVersion = version === "*" || typeof version === "undefined" ? "latest" : version;
    const current = new Dependency(currentPackageName, updatedVersion, parent);

    if (fullLockMode) {
        const { deprecated, _integrity, ...pkg } = await pacote.manifest(`${currentPackageName}@${updatedVersion}`, {
            ...constants.NPM_TOKEN, registry: constants.DEFAULT_REGISTRY_ADDR, cache: `${os.homedir()}/.npm`
        });
        const { customResolvers } = mergeDependencies(pkg);

        current.addFlag("hasValidIntegrity", _integrity === integrity);
        current.addFlag("isDeprecated");
        current.addFlag("hasCustomResolver", customResolvers.size > 0);
    }
    current.addFlag("hasDependencies", to.edgesOut.size > 0);

    for (const [packageName, { to: toNode }] of to.edgesOut) {
        if (toNode.dev) {
            continue;
        }
        const cleanName = `${packageName}@${toNode.package.version}`;

        if (exclude.has(cleanName)) {
            exclude.get(cleanName).add(current.fullName);
        }
        else {
            exclude.set(cleanName, new Set([current.fullName]));
            yield* deepReadEdges(packageName, { parent: current, to: toNode, exclude });
        }
    }
    yield current;
}

async function fetchPackageMetadata(name, version, options) {
    const { ref, metadataLocker } = options;
    const free = await metadataLocker.acquireOne();

    try {
        const publishers = new Set();
        const oneYearFromToday = new Date();
        oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() - 1);

        const pkg = await npmReg.package(name);
        if (semver.neq(version, pkg.lastVersion)) {
            ref[version].flags.push("isOutdated");
        }
        ref.metadata.publishedCount = pkg.versions.length;
        ref.metadata.lastUpdateAt = pkg.publishedAt(pkg.lastVersion);
        ref.metadata.hasReceivedUpdateInOneYear = !(oneYearFromToday > ref.metadata.lastUpdateAt);
        ref.metadata.lastVersion = pkg.lastVersion;
        ref.metadata.homepage = pkg.homepage || null;
        ref.metadata.maintainers = pkg.maintainers;
        ref.metadata.author = pkg?.author?.name || "N/A";

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
        free();
    }
}

async function* getRootDependencies(manifest, options) {
    const { maxDepth = 4, exclude, usePackageLock, fullLockMode } = options;

    const { dependencies, customResolvers } = mergeDependencies(manifest, void 0);
    const parent = new Dependency(manifest.name, manifest.version);
    parent.addFlag("hasCustomResolver", customResolvers.size > 0);
    parent.addFlag("hasDependencies", dependencies.size > 0);

    let iterators;
    if (usePackageLock) {
        const arb = new Arborist({ ...constants.NPM_TOKEN, registry: constants.DEFAULT_REGISTRY_ADDR });
        let tree;
        try {
            await access(join(process.cwd(), "node_modules"));
            tree = await arb.loadActual();
        }
        catch {
            tree = await arb.loadVirtual();
        }

        iterators = iter.filter(tree.edgesOut.entries(), ([, { to }]) => !to.dev)
            .map(([packageName, { to }]) => deepReadEdges(packageName, { to, parent, fullLockMode, exclude }));
    }
    else {
        const configRef = { exclude, maxDepth, parent };
        iterators = [
            ...iter.filter(customResolvers.entries(), ([, valueStr]) => valueStr.startsWith("git+"))
                .map(([depName, valueStr]) => searchDeepDependencies(depName, valueStr.slice(4), configRef)),
            ...iter.map(dependencies.entries(), ([name, ver]) => searchDeepDependencies(`${name}@${ver}`, void 0, configRef))
        ];
    }
    for await (const dep of combineAsyncIterators(...iterators)) {
        yield dep;
    }

    // Add root dependencies to the exclude Map (because the parent is not handled by searchDeepDependencies)
    // if we skip this the code will fail to re-link properly dependencies in the following steps
    const depsName = await Promise.all(iter.map(dependencies.entries(), getCleanDependencyName));
    for (const [, fullRange, isLatest] of depsName) {
        if (!isLatest) {
            parent.addFlag("hasOutdatedDependency");
        }
        if (exclude.has(fullRange)) {
            exclude.get(fullRange).add(parent.fullName);
        }
    }

    yield parent;
}

async function depWalker(manifest, options = Object.create(null)) {
    const { verbose = true, forceRootAnalysis = false, usePackageLock = false, fullLockMode = false } = options;

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
        const metadataLocker = new Lock({ maxConcurrent: 10 });
        metadataLocker.on("freeOne", () => {
            processedRegistryCount++;
            const stats = gray().bold(`[${yellow().bold(processedRegistryCount)}/${allDependencyCount}]`);
            regSpinner.text = white().bold(`${i18n.getToken("depWalker.fetch_metadata")} ${stats}`);
        });
        tarballLocker.on("freeOne", () => {
            processedTarballCount++;
            const stats = gray().bold(`[${yellow().bold(processedTarballCount)}/${allDependencyCount}]`);
            tarballSpinner.text = white().bold(`${i18n.getToken("depWalker.analyzed_tarball")} ${stats}`);
        });

        const rootDepsOptions = { maxDepth: options.maxDepth, exclude, usePackageLock, fullLockMode };
        for await (const currentDep of getRootDependencies(manifest, rootDepsOptions)) {
            const { name, version } = currentDep;
            const current = currentDep.exportAsPlainObject(name === manifest.name ? 0 : void 0);
            let processDep = true;

            if (payload.dependencies.has(name)) {
                // TODO: how to handle different metadata ?
                const dep = payload.dependencies.get(name);

                const currVersion = current.versions[0];
                if (Reflect.has(dep, currVersion)) {
                    processDep = false;
                }
                else {
                    dep[currVersion] = current[currVersion];
                    dep.versions.push(currVersion);
                }
            }
            else {
                payload.dependencies.set(name, current);
            }

            if (processDep) {
                allDependencyCount++;
                promisesToWait.push(fetchPackageMetadata(name, version, { ref: current, metadataLocker }));
                promisesToWait.push(analyzeDirOrArchiveOnDisk(name, version, {
                    ref: current[version],
                    tmpLocation: forceRootAnalysis && name === manifest.name ? null : tmpLocation,
                    tarballLocker
                }));
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
