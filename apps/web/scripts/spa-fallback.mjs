import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));

await copyFile(`${dist}index.html`, `${dist}404.html`);
