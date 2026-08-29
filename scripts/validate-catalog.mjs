import { readFile } from "node:fs/promises";

const official = JSON.parse(await readFile(new URL("../public/data/official.json", import.meta.url), "utf8"));
const custom = JSON.parse(await readFile(new URL("../public/data/custom.json", import.meta.url), "utf8"));

function validate(records, source, minimum) {
  if (!Array.isArray(records) || records.length < minimum) throw new Error(`${source} catalogue is incomplete`);
  const seen = new Set();
  for (const record of records) {
    if (!record.slug || !record.name || !record.description || record.source !== source) throw new Error(`Invalid ${source} record`);
    if (seen.has(record.slug)) throw new Error(`Duplicate ${source} slug: ${record.slug}`);
    seen.add(record.slug);
    if (source === "official" && !record.destinationUrl?.startsWith("https://")) throw new Error(`Invalid official URL: ${record.slug}`);
    if (source === "custom" && !record.repositoryUrl?.startsWith("https://github.com/2gavy/elastic_integrations/tree/main/")) throw new Error(`Invalid custom URL: ${record.slug}`);
    if (source === "custom" && record.status !== undefined && record.status !== "Experimental") throw new Error(`Invalid custom status: ${record.slug}`);
    if (source === "custom" && !record.validationStatus) throw new Error(`Missing validation status: ${record.slug}`);
    if (record.status === "Experimental" && !record.experimentalReason) throw new Error(`Missing experimental reason: ${record.slug}`);
  }
  if (source === "custom" && records.every((record) => record.status === "Experimental")) {
    throw new Error("Blanket Experimental classification is forbidden");
  }
}

validate(official, "official", 400);
validate(custom, "custom", 1);
const onePassword = official.find((record) => record.name === "1Password");
if (onePassword?.destinationUrl !== "https://www.elastic.co/docs/reference/integrations/1password") throw new Error("1Password canonical URL is incorrect");
console.log(`Validated ${official.length} official and ${custom.length} custom integrations`);
