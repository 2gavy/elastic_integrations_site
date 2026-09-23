import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("../dist-pages/", import.meta.url);
const custom = JSON.parse(await readFile(new URL("../public/data/custom.json", import.meta.url), "utf8"));
const index = new URL("index.html", output);
// Keep source-only records out of the published catalogue until explicitly approved.
const heldSlugs = new Set(["ingest_volume_monitor"]);
const published = custom.filter((item) => !heldSlugs.has(item.slug));
await writeFile(new URL("data/custom.json", output), `${JSON.stringify(published, null, 2)}\n`);

for (const item of published) {
  const directory = new URL(`custom/${item.slug}/`, output);
  await mkdir(directory, { recursive: true });
  await copyFile(index, new URL("index.html", directory));
}
await copyFile(index, new URL("404.html", output));
await writeFile(new URL(".nojekyll", output), "");
console.log(`Generated ${published.length} custom detail routes (${custom.length - published.length} held)`);
