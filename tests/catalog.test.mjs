import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const official = JSON.parse(await readFile(new URL("../public/data/official.json", import.meta.url), "utf8"));
const custom = JSON.parse(await readFile(new URL("../public/data/custom.json", import.meta.url), "utf8"));

test("contains the complete official catalogue", () => {
  assert.ok(official.length >= 400);
  assert.equal(official.find((item) => item.name === "1Password")?.destinationUrl, "https://www.elastic.co/docs/reference/integrations/1password");
  assert.ok(official.some((item) => item.solutions.includes("Security")));
  assert.ok(official.some((item) => item.solutions.includes("Observability")));
});

test("keeps custom metadata protected and namespaced", () => {
  assert.ok(custom.length > 0);
  assert.ok(custom.every((item) => item.source === "custom"));
  assert.ok(custom.every((item) => item.repositoryUrl.startsWith("https://github.com/2gavy/elastic_integrations/tree/main/")));
  assert.ok(custom.every((item) => !("download" in item) && !("readme" in item)));
  assert.ok(custom.every((item) => Array.isArray(item.fields) && item.fields.length > 0));
  assert.ok(custom.every((item) => item.fields.every((field) => field.field && field.description && field.type)));
  const allowedStatuses = new Set(["Production", "Experimental", "Reuse", "Extend", "Vendor-native", "Hold", "Remap", "Retired"]);
  assert.ok(custom.every((item) => allowedStatuses.has(item.status)));
  assert.ok(custom.every((item) => item.validationStatus));
  assert.ok(custom.filter((item) => item.status === "Experimental").every((item) => item.experimentalReason));
  assert.ok(custom.some((item) => item.status === "Production"));
  assert.ok(custom.some((item) => item.status === "Experimental"));
  assert.ok(custom.filter((item) => item.status === "Experimental").length < custom.length / 10);
});

test("publishes the bounded FortiDDoS experimental contract", () => {
  const item = custom.find((record) => record.slug === "fortinet_fortiddos");
  assert.ok(item);
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.equal(item.validationStatus, "Static validated");
  assert.match(item.experimentalReason, /two bounded KV shapes/);
  assert.match(item.experimentalReason, /real-appliance captures/);
  assert.ok(item.fields.some((field) => field.field === "fortinet_fortiddos.log.type"));
});
