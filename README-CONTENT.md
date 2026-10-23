# Content index — how the site stays current

Since 2026-10-23 the homepage, the archive (`writing.html`), the coverage page (`coverage.html`) and the toolkit grid render from **one file: `data/content.json`**. A small vanilla script, `data/content.js`, fills any element carrying `data-bp="<view>"`. No build step, no framework.

"Latest", "New" badges, "On deck" and the coverage table are **computed**, never typed. Nothing on the homepage can go stale unless the JSON does.

## Add an article

1. Publish the page as usual (`<slug>.html` at the repo root, with `article:published_time` in its `<head>`).
2. Add one entry to the `items` array in `data/content.json`:

```json
{
  "slug": "be-q3-update-2026-10-23",
  "url": "be-q3-update-2026-10-23.html",
  "title": "Bloom Is Growing Faster Than It Can Bill",
  "date": "2026-10-23",
  "type": "Coverage update",
  "tickers": ["BE"],
  "sectors": ["Energy"],
  "rating": "Hold",
  "target": 235,
  "summary": "One or two sentences. Shown on cards and in the archive.",
  "readMin": 11,
  "status": "published"
}
```

`type` is one of: `Initiation` · `Coverage update` · `Weekly outlook` · `Sector note` · `Essay` · `Tool` · `Template`.
`sectors` is one or more of: `Semis/AI` · `Energy` · `Commodities/Macro` · `Buy-side/PE` · `Valuation` · `Other`.
`rating` is free text but the badge colours recognise `Buy`, `Accumulate`, `Hold`, `Reduce`, `Sell`, `Not rated`, `Coverage closed`.

3. Commit. The pre-commit hook regenerates `sitemap.xml` and `feed.xml` from the page itself (unchanged mechanism — it reads the HTML's dates and descriptions), so the feed stays correct whether or not the JSON is perfect. `writing.html` no longer needs editing.

## Update a rating or target

Do **not** edit the coverage table. It is derived: for each ticker, the newest `published` item of type `Initiation` or `Coverage update` that carries a `rating` supplies the row and the top of the history table. So the way to change a public target is the way it should be — **publish the note that changes it**, with the new `rating` and `target` on its entry. Every earlier call stays in the history as "superseded".

If an older entry's rating or target in the JSON is wrong, correct that entry; the seed for the back catalogue was reconstructed from the notes and the May–July MU sequence in particular deserves a read-through (see "Open items").

## Upcoming work

An item with `"status": "upcoming"` (no `url`, `date` optional) appears under **On deck** and nowhere else. The moment you flip it to `published` with a URL and a date, it leaves On deck and enters the archive and the latest list. Anything already published can never sit in On deck.

## Views available to any page

Put `<script src="data/content.js" data-root="."></script>` before `</body>` (`data-root=".."` from a subfolder), then any of:

| `data-bp=` | Renders |
|---|---|
| `latest` (`data-n="4"`) | newest article as a large card + the next N |
| `archive` | everything, month-grouped, with type/sector/ticker chips and search; honours `?type= ?sector= ?ticker= ?q=` |
| `coverage` | the public table with live prices from the quotes Worker |
| `history` (`data-ticker="MU"` optional) | rating/target history tables |
| `toolkit` | calculators and templates in one grid, free vs gated |
| `on-deck` | upcoming only; hides its section when empty |
| `lead-pick` | the newest coverage call |
| `headlines` (`data-max-days="7"`) | five newest headlines for the lead ticker; hides itself with a fallback link if the newest is older than the limit |
| `related` (`data-slug="…"`) | up to four articles sharing a ticker or sector |
| `prev-next` (`data-slug="…"`) | earlier / later article by date |

`content.js` also wires the mobile menu (`.nav-toggle`) and the opt-in dark theme (`.theme-toggle`, persisted in `localStorage`). The dark tokens already existed in `style.css`; auto-dark via `prefers-color-scheme` is deliberately **not** enabled, per the note at the top of the stylesheet.

## How the news feed works

No new pipeline. The quotes Worker already exposes `?headlines=<ticker>&n=<count>` (Google News / Yahoo RSS, parsed server-side, cached 30 minutes). The `headlines` view calls it for the lead ticker and applies a freshness guard: if the newest item is older than `data-max-days`, the block shows a one-line fallback with a link to Yahoo Finance news instead of stale items. The old TradingView timeline widget is gone from the homepage.

Live prices in the coverage table use the same Worker's `?symbols=` route. The ticker tape at the top of the homepage is the one remaining TradingView widget and is mounted by `script.js`.

## Old URLs → new

| Old | Now | How |
|---|---|---|
| `/projects.html`, `/projects` | `/coverage.html` | 301 in `_redirects` |
| `/writing.html` | same URL, now the full archive | nav label is **Research** |
| `/research.html` | kept; it is the **data-sources** page, linked from the footer | retitled |
| `/reports.html` | kept; it is the MU deck download page, reachable from the MU initiation | removed from nav only |
| `/writing.html?type=report` | filtered archive (Initiations) | alias in `content.js` |
| `/writing.html?type=weekly`, `?type=update`, `?type=essay`, `?ticker=MU` | filtered archive | query parameters |

Nav is now six items: Research · Coverage · Toolkit · Markets · About · Subscribe. Now, Reading list, Data sources, Track record, Contact, Disclaimer and RSS live in the footer.

## Not done yet (stage 2)

- **Per-article chrome** via the `related` and `prev-next` views, a table of contents, and JSON-LD on the 26 article pages that lack it. The views exist; the article pages have not been edited beyond the shared nav and cache-version bump.
- `toolkit.html` keeps its hand-written per-tool descriptions and JSON-LD `ItemList`; only its nav changed. The homepage grid is the deduplicated one.
- The smoke test (`.github/workflows/smoke.yml`) now asserts the content index rendered instead of the removed hero chart.

## Open items for Brandon

- Confirm the reconstructed MU rating history in `data/content.json` (May 5 not rated → May 7 Buy $895 → $1,100 → Jun 28 $1,500 → Jul 2 Hold → Jul 30 coverage closed → Sep 28 not rated → Oct 19 Hold $1,090).
- Give the two `upcoming` items real dates, or remove them.
- Dell shows the live note's $340; the staged re-underwrite carries $350 and will update the row when it ships.
