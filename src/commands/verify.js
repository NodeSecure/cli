// Import Node.js Dependencies
import { styleText } from "node:util";

// Import Third-party Dependencies
import cliui from "@topcli/cliui";
import { verify } from "@nodesecure/scanner";
import { formatBytes, locationToString } from "@nodesecure/utils";

function separatorLine() {
  return styleText("grey", "-".repeat(80));
}

export async function main(
  packageName = undefined,
  options,
  verifyFn = verify
) {
  const payload = await verifyFn(packageName);

  if (options.json) {
    return console.log(JSON.stringify(payload, null, 2));
  }
  const { files, directorySize, uniqueLicenseIds, ast } = payload;

  const ui = cliui({ width: 80 });
  ui.div(
    { text: styleText(["cyan", "bold"], "directory size:"), width: 20 },
    { text: styleText(["yellow", "bold"], formatBytes(directorySize)), width: 10 }
  );
  ui.div(
    { text: styleText(["cyan", "bold"], "unique licenses:"), width: 20 },
    { text: styleText(["white", "bold"], uniqueLicenseIds.join(", ")), width: 10 }
  );
  console.log(`${ui.toString()}\n`);
  ui.resetOutput();

  {
    ui.div(
      { text: styleText(["white", "bold"], "ext"), width: 10, align: "center" },
      { text: styleText(["white", "bold"], "files"), width: 40 },
      { text: styleText(["white", "bold"], "minified files"), width: 30 }
    );

    const maxLen = files.list.length > files.extensions.length ? files.list.length : files.extensions.length;
    const divArray = Array.from(Array(maxLen), () => ["", "", ""]);
    files.extensions.forEach((value, index) => (divArray[index][0] = value));
    files.list.forEach((value, index) => (divArray[index][1] = value));
    files.minified.forEach((value, index) => (divArray[index][2] = value));

    for (const [ext, file, min] of divArray) {
      ui.div(
        { text: styleText(["cyan", "bold"], ext), width: 10, align: "center" },
        { text: file, width: 40 },
        { text: styleText(["red", "bold"], min), width: 30 }
      );
    }
  }
  console.log(`${ui.toString()}\n`);
  ui.resetOutput();

  ui.div({ text: separatorLine() });
  ui.div({ text: styleText(["cyan", "bold"], "Required dependency and files"), align: "center" });
  ui.div({ text: separatorLine() });
  ui.div();

  for (const [fileName, deps] of Object.entries(ast.dependencies)) {
    ui.div({ text: styleText(["magenta", "bold"], fileName), align: "center" });
    ui.div({ text: separatorLine() });
    ui.div(
      { text: styleText(["white", "bold"], "required stmt"), width: 30 },
      { text: styleText(["white", "bold"], "try/catch"), width: 20, align: "center" },
      { text: styleText(["white", "bold"], "source location"), width: 30, align: "right" }
    );
    for (const [depName, infos] of Object.entries(deps)) {
      const { start, end } = infos.location;
      const position = `[${start.line}:${start.column}] - [${end.line}:${end.column}]`;

      ui.div(
        { text: depName, width: 30 },
        {
          text: infos.inTry ?
            styleText(["green", "bold"], infos.inTry) : styleText(["red", "bold"], infos.inTry), width: 20, align: "center"
        },
        { text: styleText(["grey", "bold"], position), width: 30, align: "right" }
      );
    }
    ui.div();
    console.log(`${ui.toString()}`);
    ui.resetOutput();
  }

  ui.div({ text: separatorLine() });
  ui.div({ text: styleText(["cyan", "bold"], "AST Warnings"), align: "center" });
  ui.div({ text: separatorLine() });
  ui.div();

  ui.div(
    { text: styleText(["white", "bold"], "file"), width: 30 },
    { text: styleText(["white", "bold"], "kind"), width: 20, align: "center" },
    { text: styleText(["white", "bold"], "source location"), width: 30, align: "right" }
  );

  for (const warning of ast.warnings) {
    const position = warning.kind === "encoded-literal" ?
      warning.location.map((loc) => locationToString(loc)).join(" // ") :
      locationToString(warning.location);

    ui.div(
      { text: warning.file || styleText(["grey", "bold"], "NONE"), width: 30 },
      { text: styleText(["magenta", "bold"], warning.kind), width: 20, align: "center" },
      { text: styleText(["grey", "bold"], position), width: 30, align: "right" }
    );
    if (warning.value) {
      ui.div();
      ui.div({ text: styleText(["yellow", "bold"], warning.value), align: "center" });
    }
    ui.div({ text: separatorLine() });
  }

  console.log(`${ui.toString()}`);
  ui.resetOutput();

  return void 0;
}
