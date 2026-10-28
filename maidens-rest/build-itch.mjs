import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, "itch-build");
const zipPath = path.join(root, "MaidensRest-itch.zip");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "fonts"), { recursive: true });

for (const name of ["scene.js", "sound.js", "client.js"]) {
  fs.copyFileSync(path.join(root, "public", name), path.join(out, name));
}
const css = fs.readFileSync(path.join(root, "public", "styles.css"), "utf8").replaceAll('url("/fonts/', 'url("fonts/');
fs.writeFileSync(path.join(out, "styles.css"), css);
fs.copyFileSync(path.join(root, "itch", "index.html"), path.join(out, "index.html"));

for (const [from, to] of [
  ["game.mjs", "game.js"],
  ["paper.mjs", "paper.js"],
  ["itch/host.mjs", "host.js"],
  ["itch/boot.mjs", "boot.js"],
]) {
  const source = fs.readFileSync(path.join(root, from), "utf8").replaceAll(".mjs", ".js");
  fs.writeFileSync(path.join(out, to), source);
}

const fontDir = path.join(root, "..", "assets", "fonts");
for (const name of fs.readdirSync(fontDir)) {
  if (name.endsWith(".woff2")) fs.copyFileSync(path.join(fontDir, name), path.join(out, "fonts", name));
}

fs.rmSync(zipPath, { force: true });
execFileSync("zip", ["-r", "-X", zipPath, "."], { cwd: out });
const bytes = fs.statSync(zipPath).size;
console.log(`${zipPath} ${bytes} bytes`);
