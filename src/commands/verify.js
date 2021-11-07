// Import Third-party Dependencies
import cliui from "cliui";
import kleur from "kleur";
import { verify } from "@nodesecure/scanner";
import { formatBytes, locationToString } from "@nodesecure/utils";

// VARS
const { yellow, grey, white, green, cyan, red, magenta } = kleur;

export async function main(packageName = null, options) {
  const payload = await verify(packageName);
  if (options.json) {
    return console.log(JSON.stringify(payload, null, 2));
  }
  const { files, directorySize, uniqueLicenseIds, ast } = payload;

  const ui = cliui();
  ui.div(
    { text: cyan().bold("directory size:"), width: 20 },
    { text: yellow().bold(formatBytes(directorySize)), width: 10 }
  );
  ui.div(
    { text: cyan().bold("unique licenses:"), width: 20 },
    { text: white().bold(uniqueLicenseIds.join(", ")), width: 10 }
  );
  console.log(`${ui.toString()}\n`);
  ui.resetOutput();

  {
    ui.div(
      { text: white().bold("ext"), width: 15, align: "center" },
      { text: white().bold("files"), width: 45 },
      { text: white().bold("minified files"), width: 30 }
    );

    const maxLen = files.list.length > files.extensions.length ? files.list.length : files.extensions.length;
    const divArray = Array.from(Array(maxLen), () => ["", "", ""]);
    files.extensions.forEach((value, index) => (divArray[index][0] = value));
    files.list.forEach((value, index) => (divArray[index][1] = value));
    files.minified.forEach((value, index) => (divArray[index][2] = value));

    for (const [ext, file, min] of divArray) {
      ui.div(
        { text: cyan().bold(ext), width: 15, align: "center" },
        { text: file, width: 45 },
        { text: red().bold(min), width: 30 }
      );
    }
  }
  console.log(`${ui.toString()}\n`);
  ui.resetOutput();

  ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
  ui.div({ text: cyan().bold("Required dependency and files"), width: 70, align: "center" });
  ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
  ui.div({ text: "\n", width: 70, align: "center" });

  for (const [fileName, deps] of Object.entries(ast.dependencies)) {
    ui.div({ text: magenta().bold(fileName), width: 70, align: "center" });
    ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
    ui.div(
      { text: white().bold("required stmt"), width: 32, align: "left" },
      { text: white().bold("try/catch"), width: 12, align: "center" },
      { text: white().bold("source location"), width: 26, align: "center" }
    );
    for (const [depName, infos] of Object.entries(deps)) {
      const { start, end } = infos.location;
      const position = `[${start.line}:${start.column}] - [${end.line}:${end.column}]`;

      ui.div(
        { text: depName, width: 32 },
        { text: (infos.inTry ? green : red)().bold(infos.inTry), width: 12, align: "center" },
        { text: grey().bold(position), width: 26, align: "center" }
      );
    }
    ui.div({ text: "", width: 70, align: "center" });
    console.log(`${ui.toString()}`);
    ui.resetOutput();
  }

  ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
  ui.div({ text: cyan().bold("AST Warnings"), width: 70, align: "center" });
  ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
  ui.div({ text: "", width: 70, align: "center" });

  ui.div(
    { text: white().bold("file"), width: 30 },
    { text: white().bold("kind"), width: 15, align: "center" },
    { text: white().bold("source location"), width: 25, align: "center" }
  );

  for (const warning of ast.warnings) {
    const position = warning.kind === "encoded-literal" ?
      warning.location.map((loc) => locationToString(loc)).join(" // ") :
      locationToString(warning.location);

    ui.div(
      { text: warning.file || grey().bold("NONE"), width: 30 },
      { text: magenta().bold(warning.kind), width: 15, align: "center" },
      { text: grey().bold(position), width: 25, align: "center" }
    );
    if (warning.value) {
      ui.div({ text: "", width: 70, align: "center" });
      ui.div({ text: yellow().bold(warning.value), width: 70, align: "center" });
    }
    ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
  }

  console.log(`${ui.toString()}`);
  ui.resetOutput();

  return void 0;
}
