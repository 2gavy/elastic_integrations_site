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
  assert.ok(custom.every((item) => item.status === undefined || item.status === "Experimental"));
  assert.ok(custom.every((item) => item.validationStatus));
  assert.ok(custom.filter((item) => item.status === "Experimental").every((item) => item.experimentalReason));
  assert.ok(custom.some((item) => item.status === undefined));
  assert.equal(custom.filter((item) => item.status === "Production").length, 0);
  assert.ok(custom.some((item) => item.status === "Experimental"));
  assert.ok(custom.filter((item) => item.status === "Experimental").length < custom.length / 4);
});

test("publishes the bounded FortiDDoS experimental contract", () => {
  const item = custom.find((record) => record.slug === "fortinet_fortiddos");
  assert.ok(item);
  assert.equal(item.version, "0.1.1");
  assert.equal(item.status, "Experimental");
  assert.equal(item.validationStatus, "Static validated");
  assert.match(item.experimentalReason, /two bounded KV shapes/);
  assert.match(item.experimentalReason, /real-appliance captures/);
  assert.ok(item.fields.some((field) => field.field === "fortinet_fortiddos.log.type"));
});

test("publishes the bounded DigitalArts i-FILTER experimental contract", () => {
  const item = custom.find((record) => record.slug === "digitalarts_ifilter");
  assert.ok(item);
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.equal(item.validationStatus, "Static validated");
  assert.match(item.experimentalReason, /exact 250-byte official Ver\.10/);
  assert.match(item.experimentalReason, /current real-source records/);
  assert.ok(item.fields.some((field) => field.field === "digitalarts_ifilter.access.checksum"));
});

test("publishes the bounded Airlock IAM experimental contract", () => {
  const item = custom.find((record) => record.slug === "airlock_iam");
  assert.ok(item);
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.equal(item.validationStatus, "Static validated");
  assert.match(item.experimentalReason, /bounded authoritative documentation/);
  assert.ok(item.fields.some((field) => field.field === "airlock_iam.log_id"));
  assert.equal(item.icon, "airlock-iam.svg");
});

test("publishes every declared custom logo and keeps the unresolved set explicit", async () => {
  for (const item of custom.filter((record) => record.icon)) {
    const extension = item.icon.slice(item.icon.lastIndexOf("."));
    const bytes = await readFile(new URL(`../public/icons/custom/${item.slug}${extension}`, import.meta.url));
    assert.ok(bytes.length > 0, `empty logo for ${item.slug}`);
    if (extension === ".png") assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `invalid PNG for ${item.slug}`);
    if (extension === ".ico") assert.deepEqual([...bytes.subarray(0, 4)], [0, 0, 1, 0], `invalid ICO for ${item.slug}`);
    if (extension === ".svg") assert.match(bytes.toString("utf8", 0, 512), /<svg\b/, `invalid SVG for ${item.slug}`);
  }

  const repaired = [
    "ibm_verify_identity_access", "nvidia_triton", "nvidia_nim", "aws_ec2_vpcs",
    "cisco_identity_intelligence", "citrix_analytics", "oauth2_proxy",
    "ray", "temporal_cloud", "red_hat_directory_server",
    "airlock_iam",
  ];
  for (const slug of repaired) {
    const item = custom.find((record) => record.slug === slug);
    assert.match(item.icon, /\.svg$/);
    const svg = await readFile(new URL(`../public/icons/custom/${slug}.svg`, import.meta.url), "utf8");
    assert.match(svg, /<(?:path|circle|rect|polygon|ellipse|line|polyline)\b/);
  }

  assert.deepEqual(
    custom.filter((record) => !record.icon).map((record) => record.slug).sort(),
    [
      "appdynamics_controller_audit", "dragos", "logicmonitor", "nasuni_file_services",
      "netapp_ontap", "onfido", "sciencelogic_sl1", "securityscorecard", "upx_antiddos", "veza", "vsftpd",
    ],
  );

  const phoenix = custom.find((record) => record.slug === "arize_phoenix");
  assert.equal(phoenix.icon, "arize_phoenix.png");
  const phoenixPng = await readFile(new URL("../public/icons/custom/arize_phoenix.png", import.meta.url));
  assert.deepEqual([...phoenixPng.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("publishes the Experimental Veza integration with an initials fallback", () => {
  const item = custom.find((record) => record.slug === "veza");
  assert.equal(item.name, "Veza");
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.equal(item.buildDuration, "1 hour 21 minutes 48 seconds (measured)");
  assert.equal(item.icon, null);
  assert.equal(item.repositoryUrl, "https://github.com/2gavy/elastic_integrations/tree/main/packages/veza");
  assert.match(item.experimentalReason, /current customer-tenant capture/);
  assert.ok(item.fields.some((field) => field.field === "@timestamp"));
  assert.ok(item.fields.some((field) => field.field === "veza.audit" && field.type === "flattened"));
  assert.ok(item.fields.some((field) => field.field === "veza.event" && field.type === "flattened"));
});

test("publishes the Experimental Dragos Platform integration with an initials fallback", () => {
  const item = custom.find((record) => record.slug === "dragos");
  assert.equal(item.name, "Dragos Platform");
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.equal(item.buildDuration, "36 minutes 15 seconds (measured)");
  assert.equal(item.validationStatus, "Package, pipeline, and system validated");
  assert.equal(item.icon, null);
  assert.equal(item.repositoryUrl, "https://github.com/2gavy/elastic_integrations/tree/main/packages/dragos");
  assert.match(item.experimentalReason, /licensed-tenant production captures/);
  assert.match(item.experimentalReason, /LEEF recognition/);
  assert.ok(item.fields.some((field) => field.field === "event.original"));
  assert.ok(item.fields.some((field) => field.field === "dragos.notification" && field.type === "flattened"));
});

test("publishes the Experimental SecurityScorecard Ratings integration with an initials fallback", () => {
  const item = custom.find((record) => record.slug === "securityscorecard");
  assert.equal(item.name, "SecurityScorecard Ratings");
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.equal(item.buildDuration, "5 hours 43 minutes 24 seconds (measured)");
  assert.equal(item.validationStatus, "Package, pipeline, and system validated");
  assert.equal(item.icon, null);
  assert.equal(item.repositoryUrl, "https://github.com/2gavy/elastic_integrations/tree/main/packages/securityscorecard");
  assert.match(item.experimentalReason, /current customer-tenant capture/);
  assert.match(item.experimentalReason, /date-bound semantics/);
  assert.ok(item.fields.some((field) => field.field === "event.module" && field.type === "constant_keyword"));
  assert.ok(item.fields.some((field) => field.field === "securityscorecard.event" && field.type === "flattened"));
});

test("publishes the bounded Experimental ScienceLogic Skylar One receiver with an initials fallback", () => {
  const item = custom.find((record) => record.slug === "sciencelogic_sl1");
  assert.equal(item.name, "ScienceLogic Skylar One");
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.equal(item.buildDuration, "20 minutes 8 seconds (measured)");
  assert.equal(item.validationStatus, "Package and negative raw-fallback pipeline validated; positive fixtures blocked");
  assert.equal(item.icon, null);
  assert.equal(item.repositoryUrl, "https://github.com/2gavy/elastic_integrations/tree/main/packages/sciencelogic_sl1");
  assert.match(item.experimentalReason, /complete outbound record/);
  assert.match(item.experimentalReason, /TCP framing/);
  assert.ok(item.fields.some((field) => field.field === "event.module" && field.type === "constant_keyword"));
  assert.ok(item.fields.some((field) => field.field === "sciencelogic_sl1.syslog.structured_data" && field.type === "keyword"));
});

test("publishes the Experimental Microsoft Entra ID Graph integration with its official icon", () => {
  const item = custom.find((record) => record.slug === "microsoft_entra_id_graph");
  assert.equal(item.name, "Microsoft Entra ID Graph");
  assert.equal(item.version, "0.1.1");
  assert.equal(item.status, "Experimental");
  assert.equal(item.buildDuration, "1 hour 41 minutes 53 seconds (measured)");
  assert.match(item.validationStatus, /live tenant validation blocked/);
  assert.equal(item.icon, "microsoft_entra_id_graph.svg");
  assert.equal(item.repositoryUrl, "https://github.com/2gavy/elastic_integrations/tree/main/microsoft_entra_id_graph");
  assert.match(item.experimentalReason, /without a current customer-tenant capture/);
  assert.ok(item.fields.some((field) => field.field === "event.module" && field.type === "constant_keyword"));
  assert.ok(item.fields.some((field) => field.field === "microsoft_entra_id_graph.risky_user.additional" && field.type === "flattened"));
});

test("publishes Microsoft Graph Activity Logs without Event Hub and with its official icon", () => {
  const item = custom.find((record) => record.slug === "microsoft_graph_activity_logs");
  assert.equal(item.name, "Microsoft Graph Activity Logs");
  assert.equal(item.version, "0.1.0");
  assert.equal(item.status, "Experimental");
  assert.match(item.validationStatus, /system collection validated/);
  assert.equal(item.icon, "microsoft_graph_activity_logs.svg");
  assert.equal(item.repositoryUrl, "https://github.com/2gavy/elastic_integrations/tree/main/microsoft_graph_activity_logs");
  assert.match(item.experimentalReason, /Log Analytics mock contract/);
  assert.ok(item.fields.some((field) => field.field === "event.module" && field.type === "constant_keyword"));
  assert.ok(item.fields.some((field) => field.field === "microsoft_graph_activity_logs.activity.raw" && field.type === "flattened"));
});
