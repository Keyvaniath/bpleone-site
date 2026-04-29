# bpleon.com — Handoff v2 (post April 28-29 session)

**Last updated:** April 29, 2026
**Owner:** Brandon Leon (brandonpleone@gmail.com)
**Live site:** https://bpleon.com
**Repo:** https://github.com/Keyvaniath/bpleone-site
**Workspace folder:** `C:\Users\Owner\Desktop\bpleone\bpleone-site\`

This supersedes the original `HANDOFF.md` (April 28, 2026) at `C:\Users\Owner\Desktop\bpleone\HANDOFF.md`. The site has gained substantial functionality since v1 — Cloudflare Worker, live equities/rates/commodities on Markets, homepage watchlist, world markets clock, drag/click ticker. **Brandon is starting next session in autonomous mode** to fix templates and visual issues. Read sections 0, 9, 10, and 11 before touching anything.

---

## 0. Quick-start checklist for the next session

When you start, do these in order:

1. **Read this entire document.** Most of the architecture is only explained here.
2. **Read `index.html`, `markets.html`, `script.js`, `style.css`, `_headers`** — confirm reality matches what's documented. The bash sandbox often shows stale snapshots; trust the file tools.
3. **`git log --oneline -10`** to see what's been committed since this was written.
4. **Open https://bpleon.com in incognito** and verify the ticker, homepage watchlist, world-markets board, and Markets page all work. F12 → Console should show three `HTTP 200`s: CoinGecko, currency-api, Worker.
5. **Audit each page systematically** (section 8) before making changes.
6. **DO NOT FABRICATE Brandon's personal info** (section 10).

---

## 1. What this site is

Static personal finance/markets site for essays, research notes, and tools. Cheap (only domain renewal cost), editable from any device, looks professional, depends on no platform that could disappear. Newsreader serif headings, Inter sans, warm cream + terracotta + sage palette. Live ticker tape across every page; full markets dashboard; personal watchlist with price targets; world markets open/closed clock.

---

## 2. What changed in the April 28-29 session

Major items in dependency order:

- **Restored truncated `index.html`.** File was 125 lines, chopped mid-`<svg>`, missing the `<script>` tag and the entire bottom half (Selected work, Recent writing, Reading & watching, Subscribe, footer). Restored to 260 lines using the bottom of commit `cc00e14`.
- **Replaced Frankfurter** (`api.frankfurter.app/latest` dropped CORS in early 2026) with `fawazahmed0/currency-api` on jsDelivr. CORS-bulletproof, no key, no rate limit, hosted on a CDN.
- **Tried U.S. Treasury Fiscal Data API for the 10Y yield. CORS doesn't work** from a browser. Abandoned — 10Y now flows through Yahoo `^TNX` via the Worker.
- **Built and deployed a Cloudflare Worker** (`bpleon-quotes`) that proxies Yahoo Finance with CORS headers. Yahoo Finance locked down `/v7/finance/quote` to authenticated requests in 2026; the Worker uses `/v8/finance/chart` per symbol and reshapes the response to the `/v7` format the page expected. Source lives in Cloudflare dashboard, NOT in the repo (see section 6 — full source archived there for recovery).
- **Ticker now has 15 items**: BTC, ETH, SOL, GOLD → 10Y → SPY, QQQ, IWV → FTSE, DAX, NIKKEI, HANG → USD/EUR, USD/GBP, USD/JPY. Order is "risk → rates → currencies" (standard Bloomberg/Reuters convention).
- **Ticker behaviors added**: pause on hover, drag-to-scrub, click-to-source on each item. Drag uses `animation: none` while dragging (NOT `play-state: paused`, which doesn't override inline transforms — fought this for two rounds).
- **Homepage gained two new sections** (between hero and Featured): "What I'm watching" (live watchlist with price targets, daily change, % to target) and "World markets" (open/closed status for 8 exchanges, live ET clock, IANA-tz-aware DST handling).
- **Markets page rebuilt**: renamed from "What I'm watching" to "Markets at a glance" (avoided collision with the new homepage section); FX swapped Frankfurter→currency-api; equities/treasuries/commodities upgraded from outbound links to live cards. **25 total tiles** across crypto/FX/equities/rates/commodities + Economic Calendar links.

---

## 3. Stack and infrastructure

| Piece | Service | Cost | Notes |
|---|---|---|---|
| Domain registrar | Squarespace | ~$20/yr | Migrated from Google Domains. Only thing Brandon pays for. |
| DNS / CDN / SSL | Cloudflare | $0 | Apex + www CNAME-flatten to `bpleon.pages.dev`, proxied. |
| Hosting | Cloudflare Pages | $0 | Auto-deploys from GitHub on push to `main`. ~30-60s build time. |
| Source code | github.com/Keyvaniath/bpleone-site | $0 | Public repo. |
| Live data — crypto, gold | CoinGecko `/api/v3/simple/price` | $0 | No key. CORS open. |
| Live data — FX | currency-api on jsDelivr (`@fawazahmed0/currency-api`) | $0 | No key, no rate limit. |
| Live data — equities, rates, commodities | Cloudflare Worker → Yahoo `/v8/finance/chart` | $0 | Worker free tier 100k req/day. Source in CF dashboard. |

**No TradingView, no third-party widgets, no API keys, no domain restrictions.** Everything either has universal CORS or runs through infrastructure Brandon controls.

---

## 4. File layout (bpleone-site repo)

```
bpleone-site/
├── HANDOFF.md               This file. Update it when major architecture changes.
├── index.html               Homepage. Hero + Watchlist + World Markets + Featured + Tools + Selected work + Recent writing + Reading & watching + Subscribe.
├── about.html               Bio. PLACEHOLDERS — needs Brandon's input.
├── markets.html             Live markets dashboard. 25 tiles + econ calendar links. Has its own inline <script> at the bottom.
├── toolkit.html             Tools/templates. SKELETON.
├── projects.html            Selected projects. SKELETON. Linked from homepage "All picks →".
├── writing.html             Essays. ONE PLACEHOLDER post.
├── contact.html             Email + social URLs. PLACEHOLDERS for socials.
├── now.html                 "Now" page (nownownow.com convention). SKELETON.
├── disclaimer.html          Legal fig leaf. DO NOT TOUCH (final).
├── dcf.html                 DCF calculator with sensitivity grid. WORKS — math verified — DO NOT "improve" without re-testing.
├── reports.html             Long-form reports listing. SKELETON.
├── 404.html                 Custom 404 page. Fine.
├── style.css                ~1100 lines. All site styles. Sections labeled with comment dividers.
├── script.js                ~600 lines. Two IIFEs: (1) ticker + watchlist + world-markets-status. (2) footer-subscribe injection.
├── _headers                 Cloudflare Pages headers. 5-min revalidation cap on CSS/JS, security headers on /*.
└── assets/
    └── brand/               SVG logos and favicons.
```

---

## 5. Data architecture — what calls what

| Element | API | Where called | Why this API |
|---|---|---|---|
| Ticker tape (every page) | CoinGecko + currency-api + Worker | `script.js` IIFE 1 | One pipe per asset class; falls through gracefully on individual failures. |
| Homepage watchlist | Worker | `script.js` IIFE 1 (renderWatchlist) | Needs Yahoo regularMarketPrice + change for every pick. |
| Homepage world markets | (none — Date + Intl) | `script.js` IIFE 1 (renderMarketsStatus) | All schedule logic; no network calls. IANA timezones handle DST automatically. |
| Markets page crypto | CoinGecko | `markets.html` inline `<script>` | Same as ticker. |
| Markets page FX | currency-api | `markets.html` inline `<script>` | Same as ticker. |
| Markets page equities, rates, commodities | Worker | `markets.html` inline `<script>` | One Worker call per refresh batches all 15 Yahoo symbols. |
| Footer subscribe injection | (none — DOM mutation) | `script.js` IIFE 2 | Adds the Substack CTA to every page's footer from one place. |

**`script.js` and `markets.html`'s inline script don't share code by design** — they have different rendering targets (scrolling marquee vs. card grids). They DO share the `WORKER_URL` constant; if you change it, change both.

---

## 6. The Cloudflare Worker (`bpleon-quotes`)

**URL:** `https://bpleon-quotes.brandonpleone.workers.dev/`
**Source location:** Cloudflare dashboard → Workers & Pages → `bpleon-quotes` → Edit code. **NOT in this repo.**
**Endpoint contract:** `?symbols=SPY,^TNX,...` (comma-separated, URL-encoded).
**Returns:** `{quoteResponse: {result: [{symbol, regularMarketPrice, regularMarketChange, regularMarketChangePercent}, ...], error: null}}`

### Why it exists
Yahoo Finance's `/v7/finance/quote` started returning 401 Unauthorized to anonymous browser requests in 2026. We had two choices: pay for an API or build a proxy. Worker is free, gives us full control, and isolates us from future Yahoo changes.

### How it works
Fans out one `fetch` per symbol to `query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=5d`, extracts `meta.regularMarketPrice` and `meta.chartPreviousClose`, computes change, aggregates results into a `/v7`-shaped envelope. CORS headers added on output. 60-second `Cache-Control` for Cloudflare edge caching.

### Source code (archive — recover from this if dashboard ever loses it)

```javascript
// bpleon-quotes — proxies Yahoo Finance with CORS.
// Uses /v8/finance/chart per-symbol (still open without auth) instead of
// /v7/finance/quote (Yahoo started returning 401 on it in 2026).
// Aggregates results back into a /v7-shaped response so the page parser
// doesn't need to change.

async function getQuote(sym) {
  const url =
    'https://query1.finance.yahoo.com/v8/finance/chart/' +
    encodeURIComponent(sym) +
    '?interval=1d&range=5d';
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; bpleon.com quotes proxy)',
      'Accept': 'application/json',
    },
  });
  if (!r.ok) return null;
  const data = await r.json();
  const result = data && data.chart && data.chart.result && data.chart.result[0];
  if (!result || !result.meta) return null;
  const m = result.meta;
  const price = m.regularMarketPrice;
  const prev = m.chartPreviousClose != null ? m.chartPreviousClose : m.previousClose;
  const change = isFinite(price) && isFinite(prev) ? price - prev : null;
  const changePct = isFinite(change) && prev ? (change / prev) * 100 : null;
  return {
    symbol: sym,
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: changePct,
  };
}

export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    const url = new URL(request.url);
    const symbols = url.searchParams.get('symbols');
    if (!symbols) {
      return new Response(
        JSON.stringify({ error: 'symbols param required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
    const list = symbols.split(',').map((s) => s.trim()).filter(Boolean);
    const quotes = await Promise.all(list.map(getQuote));
    const result = quotes.filter(Boolean);
    const body = JSON.stringify({
      quoteResponse: { result, error: null },
    });
    return new Response(body, {
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  },
};
```

### Debugging the Worker
Test it directly in a browser: `https://bpleon-quotes.brandonpleone.workers.dev/?symbols=SPY,^TNX`.

- **Returns `{"finance":{"error":...}}`** → Yahoo's auth wall returned. Yahoo changed something on `/v8/finance/chart`. Try `/v8/finance/spark?symbols=...` or look for the latest community workaround.
- **Returns `quoteResponse.result.length === 0`** → all symbols failed. Network or Yahoo outage. Check Cloudflare Worker logs.
- **Some symbols missing from `result`** → those specific tickers aren't on Yahoo's chart endpoint. Try alternate symbols (e.g., for Russell 3000 use `IWV` ETF instead of `^RUA` index).

### To update the Worker
Cloudflare dashboard → Workers & Pages → `bpleon-quotes` → Edit code → paste new code → Deploy. Takes ~10 seconds. Brandon owns these credentials.

---

## 7. Cache and deploy

### Push flow
```
git status                   # sanity check first
git add <files>
git commit -m "describe change"
git push
```
Cloudflare rebuilds in 30-60 seconds. Hard-refresh in incognito (`Ctrl+Shift+N` then `Ctrl+Shift+R`) to bypass browser cache during testing.

### `_headers`
Sets `Cache-Control: max-age=300, must-revalidate` site-wide. So after pushing, browsers re-validate within 5 minutes. Plus security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

**DO NOT** add a 1-year `immutable` cache to CSS/JS — that traps users on stale files. The previous owner of this site got bitten by exactly that and v1 of the handoff explicitly warns against it.

### Cache busting
`?v=4` query strings on every `<link rel="stylesheet">` and `<script src="">` reference. To force-refresh everyone immediately, bump `v=4` → `v=5` across all HTML files (find/replace).

---

## 8. Page-by-page status

### index.html — DONE
Hero (decorative SVG kept by design — gives the page room to breathe) + new Watchlist section + new World Markets section + Featured (one placeholder card) + Tools row + Selected work (3 placeholder projects) + Recent writing (1 placeholder + "Coming soon") + Reading & watching (placeholders) + Subscribe (Substack URL hardcoded in script.js IIFE 2).

**Audit needed:** Does any placeholder text read too obviously as a placeholder?

### markets.html — DONE
25 live tiles + Economic Calendar links. Don't change without testing the inline `<script>`.

**Audit needed:** Does every tile have data after a hard refresh? If any show "—" persistently, that symbol failed on Yahoo `/v8/finance/chart` and we'd need to swap it.

### about.html — HEAVY PLACEHOLDERS
`[City]`, `[Firm]`, `[School]`, etc. Brandon must fill in. Don't fabricate.

### contact.html — PLACEHOLDERS
LinkedIn, GitHub, X URLs are placeholders. Brandon's email link works (`mailto:brandonpleone@gmail.com`).

### writing.html — ONE PLACEHOLDER POST
"Welcome — what this site is for." Awaiting Brandon's first real essay.

### toolkit.html — SKELETON
Awaiting real DCF .xlsx, screener checklist .pdf dropped into `/assets/`.

### projects.html — SKELETON
Three placeholder project cards. Linked from homepage "All picks →".

### now.html — SKELETON
nownownow.com convention. Brandon updates monthly.

### reports.html — SKELETON
Listing for long-form research PDFs.

### disclaimer.html — DONE — DO NOT TOUCH
Legal fig leaf. Final.

### dcf.html — WORKING — DO NOT BREAK
DCF calculator with sensitivity grid. Math has been verified per v1 handoff. Don't "improve" without re-testing.

### 404.html — FINE
Custom 404 page.

---

## 9. Known quirks and gotchas

### Bash sandbox shows stale snapshots
When `mcp__workspace__bash` reports a file is truncated or has different content than what `Read` shows, **trust `Read`**. The bash tool runs in a separate filesystem mount that lags behind the host. This caused two separate false alarms in the previous session ("script.js is 100 lines!" when it was 357). Use file tools (`Read`/`Write`/`Edit`/`Grep`) for anything authoritative. Use bash for `git log` and similar.

### `.git/index.lock` from prior aborted session
If git commands fail with "Unable to create '.git/index.lock'", a previous session left a stale lock. From PowerShell:
```
Remove-Item .git\index.lock
```

### Yahoo `/v7/finance/quote` is auth-walled
Don't try to "simplify" the Worker by switching back to `/v7/quote`. The Worker uses `/v8/chart`, which is the only endpoint still open as of April 2026.

### Treasury Fiscal Data API doesn't send CORS headers
We tried, gave up. 10Y now comes from Yahoo `^TNX` via the Worker. Don't waste time re-attempting.

### Lunch breaks not modeled in world markets board
Tokyo (11:30-12:30 local) and Hong Kong (12:00-13:00 local) display "OPEN" through their lunch break. Easy to add — see `MARKETS` array in `script.js`.

### Holidays not modeled
The board will say OPEN on Christmas Day if it falls on a weekday. Acceptable for v1. Could pull a static holiday JSON later.

### Cache-bust query string is `?v=4` everywhere
If you change `script.js` or `style.css` and don't see changes after pushing, bump it to `?v=5` across all HTML files.

### `WORKER_URL` is hardcoded in two places
`script.js` (look for `var WORKER_URL =`) and `markets.html` (inline `<script>`, also `var WORKER_URL =`). Keep them in sync if you ever change the Worker URL.

### The bash tool can't unlink some files
Operation Not Permitted errors when trying to overwrite via shell. Use `Read`/`Write`/`Edit` tools instead.

### CRLF line ending warnings in git
PowerShell git will emit `warning: in the working copy of 'X', LF will be replaced by CRLF`. Harmless. Cloudflare normalizes it.

---

## 10. What needs Brandon's input — DO NOT FABRICATE

If Brandon hasn't supplied any of this, leave a clearly-marked placeholder (or improve the existing placeholder text so it's obvious to him what's missing). Never put fabricated specifics on the live site as if they were Brandon's.

- **about.html bio:** city/region, current firm, school, age, etc. The page has `[City]`, `[Firm]`, `[School]` brackets.
- **Real social URLs:**
  - LinkedIn: `markets.html` footer has `linkedin.com/in/brandonpleon` — **verify with Brandon** (note: `pleon` not `pleone`, possibly intentional to match domain).
  - GitHub: placeholder `https://github.com/`.
  - X/Twitter: placeholder `https://x.com/`.
- **Watchlist (homepage):** `WATCHLIST` array near top of `script.js` IIFE 1 has one placeholder MU entry. Brandon needs to replace with his actual picks (sym, name, target, thesis, posted date, optional note_url).
- **First real essay:** `writing.html` has "Welcome — what this site is for" as a placeholder. Brandon needs to write the real content. Replace `feature-card` href on `index.html` once it exists.
- **First real DCF template:** drop `.xlsx` into `/assets/`, link from `toolkit.html`.
- **First real research report PDF:** drop into `/assets/`, link from `projects.html` and `reports.html`.
- **Substack URL confirmation:** `script.js` IIFE 2 has `https://bpleon.substack.com/subscribe` hardcoded. Confirm this is the actual Substack name.
- **Featured card on homepage:** currently links to `writing.html#post-1` (placeholder). Should point at the first real essay once it exists.

---

## 11. Priority TODOs for next session

In order of impact-per-effort. **Tackle 1-3 without Brandon input; pause for input on 4-7.**

### 1. Page-by-page visual audit and cleanup
Open each `.html` page in turn, read carefully, spot:
- Placeholders that read awkwardly
- Layout issues (broken grids, cramped cards, weird spacing)
- Inconsistencies with the homepage/markets page styling
- Typos and grammar issues
- Mobile responsiveness problems (use the browser's mobile inspector)

Fix what you can without needing Brandon's actual content.

### 2. Add lunch breaks to the world markets board
Tokyo `11:30-12:30` local and Hong Kong `12:00-13:00` local. Extend the `MARKETS` array entries with optional `lunch: ['11:30','12:30']` and update `isOpen()` to skip lunch.

### 3. Improve loading states
Right now the watchlist and markets cards just say "Loading…". Add a skeleton-screen feel with subtle pulsing if it improves perceived speed.

### 4. Polish the watchlist for multi-pick
Verify the grid handles 5+ items well on mobile + desktop. May need media queries. Currently uses `repeat(auto-fill, minmax(280px, 1fr))`.

### 5. Fill in About bio
Needs Brandon's words. Frame the request precisely: "Where do you live? What firm/role? What school?" If Brandon supplies, replace `[City]` etc. throughout `about.html`.

### 6. Real social URLs
Replace placeholders in `contact.html` and the footer of every page. The footer is in each HTML file — find/replace `https://github.com/`, `https://x.com/`, `https://www.linkedin.com/in/`.

### 7. Replace MU placeholder with real picks
If Brandon supplies real picks, swap them into the `WATCHLIST` array in `script.js`. Also swap the placeholder Featured card link.

---

## 12. Forward ideas / nice-to-haves

Things to suggest to Brandon if there's time and runway, not to build without permission:

- **Sparkline on each watchlist card.** `/v8/finance/chart` returns intraday timestamps; we throw them away. Showing a small inline trend line per pick costs almost nothing visually and adds a lot.
- **`/picks` track-record page.** Once Brandon has 3+ real picks, build a page showing entry price, current price, return since posted, % to target, days since posted. Sortable. This is what makes the site distinctive and gives readers a reason to come back.
- **RSS feed for writing.** Static, regenerated from `writing.html` post list. Adds shareability with zero ongoing cost.
- **Search.** Static-site search (Pagefind, lunr.js) once there's enough content to search.
- **Dark mode toggle.** The `[data-theme="dark"]` selectors exist in `style.css` for ticker/watchlist colors but no toggle is wired up.
- **Holiday handling for world markets.** Pull a static JSON of major exchange holidays per year and check before marking OPEN.
- **2-year Treasury yield.** Yahoo doesn't have a clean `^US2Y` symbol. Could use SHY (1-3 yr ETF) as a proxy, or skip.
- **More crypto on Markets page.** `BNB`, `XRP`, `ADA`, `DOGE` for breadth. Brandon already trimmed crypto on the ticker — let him decide.
- **"Last updated" stamp on Markets cards.** Subtle timestamp showing when each tile last refreshed.
- **Sector ETFs.** Add XLK / XLF / XLE / XLV cards under US Equities for sector context.

---

## 13. Things I (Claude) cannot do

- I cannot see what Brandon's actual social profiles look like — can't verify a URL is correct.
- I cannot fabricate biographical details (city, firm, education).
- I cannot make actual investment picks or thesis statements.
- I cannot change the Cloudflare Worker source from this environment — Brandon has to paste updates into the Cloudflare dashboard.
- I cannot push to GitHub directly from the bash sandbox — credentials live on Brandon's Windows machine. He runs `git push` from PowerShell.
- I cannot guarantee Yahoo Finance's `/v8/finance/chart` keeps working forever. If it gets locked down, the Worker needs a new upstream.

---

## 14. Things I (Claude) should do every session

- **Visual sanity check after any change** — walk Brandon through what to look for in incognito.
- **Always check `git status` before committing**, paste the output if anything unexpected shows.
- **Always provide exact `git add` / `git commit` / `git push` commands**, not generic "push it" instructions.
- **Never push code that contains placeholder fabricated content as if it were real** (e.g., made-up watchlist picks).
- **Use the `Edit` tool for changes**, not `Write`, when modifying existing files.
- **Watch for stale bash snapshots** — if a file looks truncated, re-read via `Read` first.
- **Update this document** when major architecture changes ship. Don't let it go stale.

---

## 15. Smoke test after any push

Run this checklist after any commit + push to confirm nothing regressed:

1. Open `https://bpleon.com` in incognito. Hard refresh.
2. **Ticker tape** at the top — 15 items rotating: BTC, ETH, SOL, GOLD, 10Y, SPY, QQQ, IWV, FTSE, DAX, NIKKEI, HANG, USD/EUR, USD/GBP, USD/JPY.
3. Hover the ticker — it should pause.
4. Drag it left/right — it should follow the cursor.
5. Click any item — opens source in new tab.
6. **What I'm watching** section — at least one card showing live MU (or whatever Brandon's set) price.
7. **World markets** section — 8 tiles. The current ET clock in the section header. Each tile shows OPEN (green dot) or CLOSED (red dot, with "Opens [day] [time] ET").
8. **F12 → Console** — three `HTTP 200`s: `[ticker] CoinGecko response: HTTP 200`, `[ticker] currency-api response: HTTP 200`, `[ticker] Worker response: HTTP 200`. No red errors (other than `ERR_BLOCKED_BY_CLIENT` from Brandon's ad blocker on Datadog — those are noise, not site errors).
9. Navigate to `/markets.html` — title "Markets at a glance." 25 live tiles across crypto/FX/equities/treasuries/commodities. None showing "—" persistently.
10. Navigate to `/dcf.html` — calculator should still work. Punch in test inputs.

If any of those fail, that's the regression to investigate. Compare against `git diff HEAD~1` to find the cause.

---

## 16. Contact for the next AI session

If you (Brandon) are picking this up later with a fresh Claude session, paste this whole file in (or point Claude at it) and say:

> "Read C:\\Users\\Owner\\Desktop\\bpleone\\bpleone-site\\HANDOFF.md and continue from section 11."

That gets the assistant fully caught up in one read.

If the site looks broken when you arrive, check section 9 first, then run section 15.
