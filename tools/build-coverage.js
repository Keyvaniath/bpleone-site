#!/usr/bin/env node
/**
 * build-coverage.js — derive the `coverage` array in data/content.json from
 * its own `items`, so the public coverage table, the homepage lead pick and
 * the per-ticker history tables can never drift from the published notes.
 *
 * Rule (matches how the table was described in README-CONTENT.md):
 *   - a coverage event is a published item of type "Initiation" or
 *     "Coverage update" with exactly one ticker and a non-null rating
 *     ("Not rated" counts: it stays in the history as an honest entry);
 *   - history per ticker = all events, oldest first;
 *   - the row (rating/target/updated/latest*) = the newest event;
 *   - rows are ordered newest-updated first (coverage[0] feeds the
 *     homepage lead-pick and headlines views).
 *
 * Company names come from the `companies` map in content.json. The script
 * REFUSES to write if a covered ticker has no company name — add it to the
 * map rather than letting a row ship nameless.
 *
 * Run via `npm run manifests` (or node tools/build-coverage.js). Idempotent.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "content.json");
const raw = fs.readFileSync(FILE, "utf8");
const data = JSON.parse(raw);

const companies = data.companies || {};
const events = (data.items || []).filter(
  (i) =>
    i.status === "published" &&
    (i.type === "Initiation" || i.type === "Coverage update") &&
    Array.isArray(i.tickers) &&
    i.tickers.length === 1 &&
    i.rating != null
);

const byTicker = new Map();
for (const i of events) {
  const t = i.tickers[0];
  if (!byTicker.has(t)) byTicker.set(t, []);
  byTicker.get(t).push({
    date: i.date,
    rating: i.rating,
    target: i.target ?? null,
    slug: i.slug,
    title: i.title,
  });
}

const missing = [...byTicker.keys()].filter((t) => !companies[t]);
if (missing.length) {
  console.error(
    "build-coverage: no company name for " +
      missing.join(", ") +
      ' — add to the "companies" map in data/content.json. Nothing written.'
  );
  process.exit(1);
}

const coverage = [...byTicker.entries()]
  .map(([ticker, history]) => {
    history.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const last = history[history.length - 1];
    return {
      ticker,
      company: companies[ticker],
      history,
      rating: last.rating,
      target: last.target,
      updated: last.date,
      latestSlug: last.slug,
      latestTitle: last.title,
    };
  })
  .sort((a, b) => (a.updated > b.updated ? -1 : a.updated < b.updated ? 1 : 0));

data.coverage = coverage;
const out = JSON.stringify(data, null, 1) + "\n";
if (out !== raw) {
  fs.writeFileSync(FILE, out, "utf8");
  console.log(
    `build-coverage: wrote ${coverage.length} rows (` +
      coverage.map((c) => c.ticker).join(", ") +
      ")"
  );
} else {
  console.log(`build-coverage: unchanged (${coverage.length} rows)`);
}
