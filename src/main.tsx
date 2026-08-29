import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";

type Source = "official" | "custom";
type IntegrationStatus = "Production" | "Experimental" | "Reuse" | "Extend" | "Vendor-native" | "Hold" | "Remap" | "Retired";

type ExportedField = {
  field: string;
  description: string;
  type: string;
};

type Integration = {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  categories: string[];
  solutions: string[];
  capabilities: string[];
  source: Source;
  version?: string;
  destinationUrl?: string;
  repositoryUrl?: string;
  created?: string;
  fields?: ExportedField[];
  status?: IntegrationStatus;
  validationStatus?: string;
  experimentalReason?: string;
};

const base = import.meta.env.BASE_URL;

function customIcon(item: Integration) {
  if (!item.icon) return null;
  const dot = item.icon.lastIndexOf(".");
  const extension = dot >= 0 ? item.icon.slice(dot).toLowerCase() : ".svg";
  return `${base}icons/custom/${item.slug}${extension}`;
}

function itemIcon(item: Integration) {
  return item.source === "custom" ? customIcon(item) : item.icon;
}

function itemStatus(item: Integration): IntegrationStatus {
  return item.status ?? (item.source === "official" ? "Production" : "Experimental");
}

function PlaceholderIcon({ name }: { name: string }) {
  return <span className="placeholder-icon" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>;
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

function DetailPage({ item }: { item: Integration }) {
  const icon = itemIcon(item);
  const status = itemStatus(item);
  return (
    <div className="site-shell detail-shell">
      <header className="topbar">
        <a className="brand" href={base}><BrandMark /><span>Elastic Integrations <b>(AI)</b></span></a>
      </header>
      <main className="detail-main">
        <a className="back-link" href={base}>← Back to all integrations</a>
        <article className="detail-card">
          <div className="detail-icon-wrap">
            {icon ? <img src={icon} alt="" /> : <PlaceholderIcon name={item.name} />}
          </div>
          <div className="badge-row">
            <span className="source-badge custom">Custom</span>
            <span className={`status-badge status-${status.toLowerCase().replaceAll("-", "_")}`}>{status}</span>
          </div>
          <h1>{item.name}</h1>
          <p className="detail-description">{item.description}</p>
          {status === "Experimental" && (
            <aside className="experimental-warning" aria-label="Experimental integration warning">
              <strong>Experimental</strong>
              <p>Built from bounded authoritative documentation or structural evidence. Real-world compatibility and completeness validation are still required.</p>
              {item.experimentalReason && <p>{item.experimentalReason}</p>}
            </aside>
          )}
          <dl className="detail-meta">
            {item.version && <><dt>Latest version</dt><dd>{item.version}</dd></>}
            <dt>Status</dt><dd>{status}</dd>
            {item.validationStatus && <><dt>Validation</dt><dd>{item.validationStatus}</dd></>}
            <dt>Capabilities</dt><dd>{item.capabilities.join(", ")}</dd>
            <dt>Categories</dt><dd>{item.categories.filter((x) => x !== "Custom").join(", ")}</dd>
          </dl>
          <a className="primary-link" href={item.repositoryUrl} target="_blank" rel="noreferrer">
            Open protected repository <span aria-hidden="true">↗</span>
          </a>
          <p className="protected-note">Repository access is limited to authorized GitHub users.</p>
          <section className="exported-fields" aria-labelledby="exported-fields-heading">
            <div className="fields-heading">
              <div>
                <span className="eyebrow">DATA REFERENCE</span>
                <h2 id="exported-fields-heading">Exported fields</h2>
              </div>
              <span className="field-count">{item.fields?.length ?? 0} fields</span>
            </div>
            <p>Fields exported by this integration package, generated from its Fleet documentation.</p>
            <div className="fields-table-wrap">
              <table>
                <thead><tr><th scope="col">Field</th><th scope="col">Description</th><th scope="col">Type</th></tr></thead>
                <tbody>
                  {(item.fields ?? []).map((field, index) => (
                    <tr key={`${field.field}-${field.type}-${index}`}>
                      <td><code>{field.field}</code></td>
                      <td>{field.description}</td>
                      <td><code>{field.type}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <p>Nick &amp; Zing maintained. Not an official Elastic website.</p>
    </footer>
  );
}

function Catalogue({ items }: { items: Integration[] }) {
  const [query, setQuery] = useState("");
  const [solution, setSolution] = useState("All Solutions");
  const [source, setSource] = useState("All");
  const [status, setStatus] = useState("All Statuses");
  const [categories, setCategories] = useState<string[]>([]);
  const [visible, setVisible] = useState(48);

  const allCategories = useMemo(() => {
    const values = new Set(items.flatMap((item) => item.categories));
    values.delete("Custom");
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (solution !== "All Solutions" && !item.solutions.includes(solution)) return false;
      if (source !== "All" && item.source !== source.toLowerCase()) return false;
      if (status !== "All Statuses" && itemStatus(item) !== status) return false;
      if (categories.length && !categories.every((category) => item.categories.includes(category))) return false;
      if (!needle) return true;
      return [item.name, item.description, item.source, ...item.categories, ...item.capabilities, ...item.solutions]
        .join(" ").toLowerCase().includes(needle);
    });
  }, [items, query, solution, source, status, categories]);

  useEffect(() => setVisible(48), [query, solution, source, status, categories]);

  function toggleCategory(category: string) {
    setCategories((current) => current.includes(category)
      ? current.filter((value) => value !== category)
      : [...current, category]);
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href={base}><BrandMark /><span>Elastic Integrations <b>(AI)</b></span></a>
        <a className="about-link" href="#about">About this catalogue</a>
      </header>
      <main>
        <section className="hero">
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <div className="hero-content">
            <span className="eyebrow">OFFICIAL + CUSTOM</span>
            <h1>Elastic Integrations <span>(AI)</span></h1>
            <p>Connect your data from every source. Search official integrations alongside AI-built custom integrations in one complete catalogue.</p>
            <div className="notice">Nick &amp; Zing maintained. Not an official Elastic website.</div>
          </div>
        </section>

        <section className="catalogue" aria-labelledby="catalogue-heading">
          <h2 id="catalogue-heading" className="sr-only">Integration catalogue</h2>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search integrations" aria-label="Search integrations" />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}
          </label>

          <div className="solution-tabs" role="group" aria-label="Filter by solution">
            {["All Solutions", "Search", "Security", "Observability"].map((value) => (
              <button key={value} className={solution === value ? "active" : ""} onClick={() => setSolution(value)}>{value}</button>
            ))}
          </div>

          <div className="source-row">
            <span>Source</span>
            <div className="source-tabs" role="group" aria-label="Filter by source">
              {["All", "Official", "Custom"].map((value) => (
                <button key={value} className={source === value ? "active" : ""} onClick={() => setSource(value)}>{value}</button>
              ))}
            </div>
          </div>

          <div className="source-row">
            <span>Status</span>
            <div className="source-tabs status-tabs" role="group" aria-label="Filter by integration status">
              {["All Statuses", "Production", "Experimental", "Reuse", "Extend", "Vendor-native", "Hold", "Remap", "Retired"].map((value) => (
                <button key={value} className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{value}</button>
              ))}
            </div>
          </div>

          <div className="category-list" aria-label="Filter by category">
            {allCategories.map((category) => (
              <button key={category} aria-pressed={categories.includes(category)} className={categories.includes(category) ? "active" : ""} onClick={() => toggleCategory(category)}>{category}</button>
            ))}
          </div>

          <div className="result-heading" aria-live="polite">
            <div><strong>{filtered.length}</strong> integrations</div>
            {(query || solution !== "All Solutions" || source !== "All" || status !== "All Statuses" || categories.length > 0) && (
              <button onClick={() => { setQuery(""); setSolution("All Solutions"); setSource("All"); setStatus("All Statuses"); setCategories([]); }}>Reset filters</button>
            )}
          </div>

          {filtered.length ? (
            <div className="card-grid">
              {filtered.slice(0, visible).map((item) => {
                const icon = itemIcon(item);
                const href = item.source === "official" ? item.destinationUrl! : `${base}custom/${item.slug}/`;
                return (
                  <a className="integration-card" key={`${item.source}-${item.slug}`} href={href} target={item.source === "official" ? "_blank" : undefined} rel={item.source === "official" ? "noreferrer" : undefined}>
                    <div className="card-top">
                      <div className="icon-wrap">{icon ? <img src={icon} alt="" loading="lazy" /> : <PlaceholderIcon name={item.name} />}</div>
                      <div className="badge-row">
                        <span className={`source-badge ${item.source}`}>{item.source === "official" ? "Official" : "Custom"}</span>
                        <span className={`status-badge status-${itemStatus(item).toLowerCase().replaceAll("-", "_")}`}>{itemStatus(item)}</span>
                      </div>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="capability-row">
                      {item.capabilities.slice(0, 3).map((capability) => <span key={capability}>{capability}</span>)}
                    </div>
                    <span className="card-arrow" aria-hidden="true">{item.source === "official" ? "↗" : "→"}</span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><h3>No integrations found</h3><p>Try a different search or remove a filter.</p></div>
          )}

          {visible < filtered.length && <button className="load-more" onClick={() => setVisible((count) => count + 48)}>Load more integrations</button>}
        </section>

        <section className="about" id="about">
          <span className="eyebrow">ONE CATALOGUE</span>
          <h2>Official coverage. Custom reach.</h2>
          <p>Official results take you to Elastic’s public documentation. Custom results contain only approved public metadata and link authorized contributors to the protected source.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [items, setItems] = useState<Integration[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${base}data/official.json`).then((response) => response.json()),
      fetch(`${base}data/custom.json`).then((response) => response.json()),
    ]).then(([official, custom]) => {
      setItems([...official, ...custom].sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => setError(true));
  }, []);

  if (error) return <main className="loading-state"><h1>Catalogue unavailable</h1><p>Please refresh and try again.</p></main>;
  if (!items.length) return <main className="loading-state" role="status"><BrandMark /><p>Loading integrations…</p></main>;

  const match = window.location.pathname.match(/\/custom\/([^/]+)\/?$/);
  if (match) {
    const item = items.find((candidate) => candidate.source === "custom" && candidate.slug === decodeURIComponent(match[1]));
    if (item) return <DetailPage item={item} />;
  }
  return <Catalogue items={items} />;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
