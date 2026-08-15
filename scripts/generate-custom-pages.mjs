import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("../dist-pages/", import.meta.url);
const custom = JSON.parse(await readFile(new URL("../public/data/custom.json", import.meta.url), "utf8"));
const index = new URL("index.html", output);

for (const item of custom) {
  const directory = new URL(`custom/${item.slug}/`, output);
  await mkdir(directory, { recursive: true });
  await copyFile(index, new URL("index.html", directory));
}
await copyFile(index, new URL("404.html", output));
await writeFile(new URL(".nojekyll", output), "");
console.log(`Generated ${custom.length} custom detail routes`);
