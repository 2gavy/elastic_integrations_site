import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const pageUrl = "https://www.elastic.co/integrations/data-integrations";
const registryUrl = "https://epr.elastic.co/search?package_policy_template=true&prerelease=false";
const output = new URL("../public/data/official.json", import.meta.url);

function text(value) {
  return String(value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeUrl(url, packageName) {
  if (!url) return `https://www.elastic.co/docs/reference/integrations/${packageName}`;
  const match = url.match(/(?:docs\.elastic\.co\/(?:en\/)?integrations|elastic\.co\/(?:docs\/(?:current|reference)\/integrations|guide\/en\/integrations\/current))\/([^/?#]+)/i);
  if (match) return `https://www.elastic.co/docs/reference/integrations/${match[1]}`;
  return url;
}

function packageNameFromUrl(url) {
  const match = url?.match(/(?:docs\.elastic\.co\/(?:en\/)?integrations|elastic\.co\/(?:docs\/(?:current|reference)\/integrations|guide\/en\/integrations\/current))\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export function selectDestination(integrationTypes = []) {
  const urls = integrationTypes.map((item) => item.url).filter(Boolean);
  return urls.find((url) => packageNameFromUrl(url)) || urls[0];
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "elastic-integrations-ai-catalogue/1.0" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function refresh() {
  const [pageResponse, packages] = await Promise.all([
    fetch(pageUrl, { headers: { "user-agent": "elastic-integrations-ai-catalogue/1.0" } }),
    fetchJson(registryUrl),
  ]);
  if (!pageResponse.ok) throw new Error(`${pageUrl} returned ${pageResponse.status}`);
  const html = await pageResponse.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Elastic catalogue data was not found in the page");
  const nextData = JSON.parse(match[1]);
  const entries = nextData?.props?.pageProps?.integrationDetail;
  if (!Array.isArray(entries) || entries.length < 400) throw new Error("Official catalogue is unexpectedly incomplete");

  const packagesByName = new Map(packages.map((item) => [item.name, item]));
  const packagesByTitle = new Map(packages.map((item) => [item.title.toLowerCase(), item]));
  const seen = new Map();

  for (const entry of entries) {
    if (entry.active === false) continue;
    const name = text(entry.title_l10n || entry.title);
    const types = (entry.integration_types || []).map((item) => text(item.cta_title_l10n)).filter(Boolean);
    const destination = selectDestination(entry.integration_types);
    const hintedPackage = packageNameFromUrl(destination);
    const pkg = (hintedPackage && packagesByName.get(hintedPackage)) || packagesByTitle.get(name.toLowerCase());
    const packageName = pkg?.name || hintedPackage || slugify(name).replace(/-/g, "_");
    const baseSlug = slugify(name) || packageName;
    const count = seen.get(baseSlug) || 0;
    seen.set(baseSlug, count + 1);
    const slug = count ? `${baseSlug}-${count + 1}` : baseSlug;
    const categories = [...new Set((entry.category || []).map((item) => text(item.title_l10n || item.title)).filter(Boolean))];
    const solutions = [...new Set((entry.solution || []).map((item) => text(item.title_l10n || item.title)).filter(Boolean))];
    const capabilities = [...new Set(types.length ? types : (pkg?.data_streams || []).map((stream) => stream.type === "metrics" ? "Metrics" : "Logs"))];
    const description = text(entry.paragraph_l10n) || pkg?.description || `Connect ${name} data to Elastic${capabilities.length ? ` for ${capabilities.join(" and ").toLowerCase()}` : ""}.`;

    seen.set(`record:${slug}`, {
      slug,
      name,
      description,
      icon: entry.image?.url || (pkg?.icons?.[0]?.path ? `https://epr.elastic.co${pkg.icons[0].path}` : null),
      categories,
      solutions: solutions.length ? solutions : ["Search"],
      capabilities: capabilities.length ? capabilities : ["Integration"],
      source: "official",
      version: pkg?.version,
      destinationUrl: normalizeUrl(destination, packageName),
    });
  }

  const records = [...seen.entries()].filter(([key]) => key.startsWith("record:")).map(([, value]) => value).sort((a, b) => a.name.localeCompare(b.name));
  if (records.length < 400) throw new Error(`Refusing to publish only ${records.length} official records`);
  await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
  const temporary = new URL("../public/data/official.next.json", import.meta.url);
  await writeFile(temporary, JSON.stringify(records, null, 2) + "\n");
  await rename(temporary, output);
  console.log(`Refreshed ${records.length} official integrations`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) refresh().catch(async (error) => {
  try {
    const previous = JSON.parse(await readFile(output, "utf8"));
    if (Array.isArray(previous) && previous.length >= 400) {
      console.warn(`Refresh failed; preserving ${previous.length} last-known-good records: ${error.message}`);
      return;
    }
  } catch {}
  console.error(error);
  process.exitCode = 1;
});
