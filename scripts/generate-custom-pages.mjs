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
// Preserve bookmarks to the historical custom Netskope card without listing
// both the retired same-name fork and its replacement collector.
if (published.some((item) => item.slug === "netskope_api") && !published.some((item) => item.slug === "netskope")) {
  const directory = new URL("custom/netskope/", output);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=../netskope_api/"><title>Netskope API Collector — Elastic Integrations (AI)</title></head><body><p>This integration has moved to <a href="../netskope_api/">Netskope API Collector</a>.</p></body></html>\n');
}
await copyFile(index, new URL("404.html", output));
await writeFile(new URL(".nojekyll", output), "");
console.log(`Generated ${published.length} custom detail routes (${custom.length - published.length} held)`);
