const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const roots = ["backend"];
const ignored = new Set(["node_modules", "dist", ".git"]);

const collect = (directory) => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) return collect(fullPath);
    if (entry.name.endsWith(".js")) return [fullPath];

    return [];
  });
};

const files = roots.flatMap((directory) =>
  collect(path.join(root, directory)),
);

let failures = 0;

for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failures += 1;
    console.error(`Syntax check failed: ${path.relative(root, file)}`);
    console.error(error.stderr?.toString() ?? error.message);
  }
}

if (failures > 0) {
  console.error(`\n${failures} file(s) failed the syntax check.`);
  process.exit(1);
}

console.log(`Syntax check passed for ${files.length} file(s).`);
