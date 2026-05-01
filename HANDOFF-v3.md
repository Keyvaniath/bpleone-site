# bpleon.com — Handoff v3 (post April 30, 2026 session)

**Last updated:** April 30, 2026
**Owner:** Brandon Leon (brandon@bpleon.com — Cloudflare Email Routing forwards to brandonpleone@gmail.com)
**Live site:** https://bpleon.com
**Repo:** https://github.com/Keyvaniath/bpleone-site
**Workspace folder (active):** `C:\Dev\bpleone-site\`
**Workspace folder (legacy, do not use):** `C:\Users\Owner\Desktop\bpleone\bpleone-site\` (OneDrive-corrupted; superseded by C:\Dev migration)

This document supersedes `HANDOFF.md` (v2, April 29). Read v2 for the broader architecture (Cloudflare Worker, KV, R2, ticker design, world markets clock, etc.); read this doc for the post-April-30 state, the immediate next tasks, and the lessons from the file-corruption incidents that hit this session. Both docs live at the repo root.

---

## 0. Quick-start checklist for the next session

When you start, do these in order:

1. **Read this document end to end** — most of what changed isn't documented in v2.
2. **Read v2's HANDOFF.md** for the underlying architecture (Cloudflare Worker, ticker design, watchlist, KV/R2 admin, world markets clock).
3. **`git log --oneline -10`** from `C:\Dev\bpleone-site` to see commit state.
4. **Open `https://bpleon.com` in incognito** and verify: hero S&P chart loads with hover crosshair, "Just published" Fed feature card renders right after the hero, lead-pick Micron card has hover crosshair on its sparkline, watchlist + headlines populate, world markets render, ticker rolls.
5. **Confirm the Substack post went out** (see section 3) at 7 AM Friday May 1.
6. **Section 3 has the immediate task queue** — do those in the listed order.

---

## 1. Where the site is right now

**First real research piece is published.** The April 29 FOMC notes ("The Fed After Powell") are live at `https://bpleon.com/fed-april-2026.html`, surfaced as a "Just Published" feature card immediately after the hero on the homepage, and listed under "Recent" on `writing.html`. The piece is also queued (or should be queued — verify) for a Substack send at 7 AM Friday May 1 with email distribution to all subscribers.

**Site features added this session (all live):**

- **Hover crosshair + price/date tooltip on the hero S&P chart.** Mouse over the chart to get a vertical crosshair line, a dot on the nearest data point, and a dark tooltip with the price (big serif) and date (small caps below). Works across the 1D/5D/1M/6M/YTD/1Y/5Y range toggles. Touch-enabled too.
- **Same hover treatment on the lead-pick Micron sparkline** (lower on the homepage). Same UX, scaled down.
- **Worker now returns timestamps with sparkline data** when called with `&withDates=1`. Old callers (watchlist row sparklines) still get the flat array shape — backward-compatible.
- **Fed article styling** (`fed-april-2026.html`) introduces a few new patterns: scenario probability table, "what would change my mind" pillared list, sources block at article foot. Inline page-scoped CSS (no global style.css changes), so it doesn't pollute other pages.

**Cache key is at v=17.** All HTML files reference `style.css?v=17` and `script.js?v=17`. Bump only if you change those two files.

---

## 2. What changed in this session (April 30, 2026)

In rough dependency order:

- **Fixed the "lp-spark" sparkline visual on the homepage Lead Pick card.** Centered the chart (max-width 420px), bumped height to 140px so it isn't a squashed strip, gave it 1D/1W/1M/3M/1Y/5Y range toggles defaulting to 1M.
- **Implemented `niceTicks()` algorithm** in `script.js` — picks round-number tick values (e.g. 100/110/120 instead of 97.42/108.31/119.20) for both the hero chart and the lead-pick sparkline.
- **Built hover crosshair + price/date tooltip** for both charts. Lead pick first, then hero. Both share a common pattern (overlay div siblings of the SVG, positioned absolutely, mouse handler maps clientX → viewBox X → nearest data index → pixel coords for the crosshair/dot/tooltip). See `script.js` lines around 745 (`loadLeadPickSpark`), 786 (`attachSparkHover`), 1205 (`loadHeroChart`), 1301 (`attachHeroHover`).
- **Worker (`worker-source.js`) modified to return timestamps.** `getYahooSparkline()` now returns `{values, timestamps}`. The route handler honors `&withDates=1` for new callers; without it, callers get the legacy flat array.
- **Wrote and published the Fed article.** Source markdown at `drafts/fed-april-2026.md`, polished HTML at `fed-april-2026.html` (root). Verified all key facts via web search (vote count, dissenters' names, Powell's "until well and truly over" language, Senate Banking 13–11 vote, May 15 chair end date, May 11 expected full Senate vote, March 2026 SEP showing one cut '26 / one cut '27, core PCE at 3.2%).
- **Added the Fed piece to the homepage** as a "Just published" feature card right after the hero (terracotta tile with Greek-temple/pillars motif), and as the first entry in `writing.html` "Recent" section (replacing the empty-state placeholder).
- **Drafted the Substack post** at `drafts/substack-fed-april-2026.md`. Teaser format (~400 words) with a CTA link back to the canonical bpleon.com URL — preserves SEO and drives traffic to the portfolio surface.

---

## 3. Immediate next tasks (in priority order)

### Task A — Verify Substack post went out at 7 AM May 1 (TIME-BOUND, top priority)

If Brandon scheduled this Thursday night (April 30), it should auto-send Friday morning. Verify:

1. Brandon's Substack dashboard shows the post in "Sent" not "Scheduled."
2. Open one of the sent emails (have Brandon forward to `brandonpleone@gmail.com`) and confirm the link to `https://bpleon.com/fed-april-2026.html` is clickable.
3. Cloudflare Web Analytics dashboard should show a traffic spike to `/fed-april-2026.html` between 7 AM and 9 AM Friday.

If the post DIDN'T schedule properly, Brandon needs to log into Substack and either send-now or reschedule for the next viable morning slot. The teaser body and instructions are in `drafts/substack-fed-april-2026.md`.

### Task B — Set up `brandon@bpleon.com` via Cloudflare Email Routing

This is the second-most-important task. Brandon's personal Gmail (`brandonpleone@gmail.com`) is currently exposed in the site footer and `mailto:` links across every HTML page. He wants a domain-based email that forwards to his Gmail so he can keep his personal address private.

**Brandon's setup steps (~10 min):**

1. Cloudflare dashboard → `bpleon.com` → **Email** in left sidebar → **Email Routing**.
2. Click **Get started**. Cloudflare auto-configures MX records since DNS is already on Cloudflare.
3. Add destination: `brandonpleone@gmail.com`. Verify by clicking the link Cloudflare emails him.
4. Add custom address: `brandon@bpleon.com` → forward to `brandonpleone@gmail.com`.
5. (Optional but recommended) In Gmail: Settings → Accounts → "Send mail as" → add `brandon@bpleon.com`. Cloudflare provides SMTP creds during setup. This lets Brandon reply from the public address without revealing the Gmail.

**Agent's site-update steps after Brandon confirms routing is live (~20 min):**

1. Search and replace `brandonpleone@gmail.com` → `brandon@bpleon.com` across all HTML files.
2. Update `mailto:` links the same way.
3. Update the `<meta name="description">` and any other places where the address appears.
4. Bump cache version to v=18 (since this is just HTML changes, only HTML files need to change).
5. Commit + push.

**Files to touch:** `index.html`, `about.html`, `markets.html`, `projects.html`, `writing.html`, `contact.html`, `now.html`, `disclaimer.html`, `dcf.html`, `dcf-template.html`, `404.html`, `reports.html`, `toolkit.html`, `mu-through-cycle.html`, `fed-april-2026.html`. Plus `HANDOFF-v3.md` (top of file). Possibly `worker-source.js` if it references the email anywhere (check first).

### Task C — Set the Friday cadence in motion

Brandon committed to a weekly Friday research note. The Fed piece is week 1. To make this sustainable:

1. Confirm Brandon set a recurring **Thursday 6 PM calendar reminder** titled "Draft Friday Substack post."
2. Help Brandon pick a topic for **Friday May 8**. The natural candidate is a Warsh confirmation reaction piece (Senate vote is expected the week of May 11; a Friday-after-vote recap works well).
3. The topic queue lives in `drafts/substack-fed-april-2026.md` ("Going forward" section). It includes: May 8 Warsh reaction, May 15 handover-day note, May 22 Micron earnings reaction, May 29 MU through-cycle pitch.

### Task D — MU through-cycle pitch (the marquee equity piece)

`mu-through-cycle.html` is currently a `noindex`-flagged scaffold with placeholder blocks. Brandon's plan is to ship this as the first big single-name pitch. He has not yet done the deep research — he knows the high-level story (memory cycle, HBM ramp, mid-cycle margin normalization, reverse-DCF, peer comp) but the specifics need work.

Approach for the next session:

1. Ask Brandon what content he has in any form (notes file, model output, slide deck, voice memo).
2. If he has anything: port it into the scaffold, tighten prose, cite specific numbers from the audited DCF workbook he keeps referencing.
3. If he doesn't: do a research pass — pull MU's last four quarterly reports, the most recent investor day, sell-side notes. Draft a structured pitch following the template he set up. Have him review/edit.
4. Once content is in: remove the `<meta name="robots" content="noindex, nofollow" />` line, remove the `.draft-banner` div, update `writing.html` to move MU from "Forthcoming" to "Recent," update `index.html` Featured card to point at the live URL, update `projects.html`, push.

**Important:** Brandon explicitly does NOT want to invent numbers. The MU pitch needs to be something he can defend in interview down to the last assumption. If a number isn't sourced from a real model output, mark it as a placeholder until he provides the real one.

---

## 4. New files added this session

| File | Purpose | Status |
|---|---|---|
| `fed-april-2026.html` | Published article — Fed notes from April 29 FOMC | Live |
| `drafts/fed-april-2026.md` | Source markdown (editing copy) | Local only (`drafts/` is gitignored) |
| `drafts/PUBLISH-fed-april-2026.md` | Publish workflow doc (pre-flight checks, push commands, rollback procedure) | Local only |
| `drafts/substack-fed-april-2026.md` | Substack post text + scheduling instructions + Friday cadence plan | Local only |
| `HANDOFF-v3.md` | This document | Will commit on next push |

**Modified files this session:**

- `index.html` — added "Just published" Fed feature card after hero; added hero-chart-wrap div for hover overlay; bumped to v=17
- `writing.html` — replaced empty-state with Fed piece in Recent; bumped to v=17
- `style.css` — added overlay styles for both hover crosshairs (lead pick + hero); bumped through to v=17 across all HTMLs
- `script.js` — added `niceTicks()`, `attachSparkHover()`, `attachHeroHover()`, modified `loadLeadPickSpark()` and `loadHeroChart()` to support `withDates=1`
- `worker-source.js` — `getYahooSparkline()` now returns `{values, timestamps}`; route handler honors `&withDates=1`. **Note: this file is gitignored. Brandon must paste it into the Cloudflare Worker dashboard manually after editing locally.** Already deployed in this session.
- `.gitignore` — added `drafts/` and `*.broken*` / `*.head` / `*.tail` (recovery temp files from the heredoc surgery, see section 6)

---

## 5. Reference info (unchanged from v2 unless noted)

- **Cloudflare Pages site:** auto-deploys from `main` branch on github.com/Keyvaniath/bpleone-site
- **Cloudflare Worker:** `bpleon-quotes` at `https://bpleon-quotes.brandonpleone.workers.dev/`. Source archived at `worker-source.js` (gitignored, paste into dashboard to deploy)
- **KV namespace:** `bpleon_admin` (id: `0ce17d6041334fcab291e4f17e193d45`). Stores watchlist + DCF sessions
- **R2 bucket:** `bpleon-files`. Stores files for the admin file vault
- **Cloudflare Web Analytics token:** `7b2ea33ed910421582a8d5e1cad4c038`
- **Finnhub API key:** `d7poeqpr01qosaapbe20d7poeqpr01qosaapbe2g` — **PASTED IN CHAT IN PRIOR SESSION; SHOULD BE ROTATED** at https://finnhub.io/dashboard. New key goes into Worker via the dashboard's Variables tab as `FINNHUB_KEY`.
- **Worker secret (admin auth):** `BPL09201996JPL861994JI4!` — also pasted in chat history; consider rotating
- **Substack:** https://bpleon.substack.com (subscribe URL: https://bpleon.substack.com/subscribe)

---

## 6. Lessons from this session — gotchas to avoid

These are the failure modes that cost real time. Avoid them in the next session.

**A) Edit tool can silently truncate large files.** Twice this session, the Edit tool reported "successfully updated" but the file on disk was actually truncated mid-write (script.js cut off mid-`toLocaleString()` at line 1310; index.html cut off mid-`<ul cl` at line 365). Both required bash heredoc surgery to recover. Mitigation: **after any large Edit, run `wc -l <file>` and `node --check <file>` (for JS) immediately to confirm the file is intact.** If the line count is suspiciously short or syntax check fails, recover from git or the Read tool's cached content before doing more edits.

**B) `.git/index.lock` blocks `git add` silently.** When git operations fail (often from concurrent processes or hung edits), they leave behind `.git/index.lock`. Subsequent `git add` and `git commit` commands fail without producing visible errors — they just don't stage anything. The user then runs `git push` and gets "Everything up-to-date" because no commit was made, even though they think they pushed real changes. **Mitigation: when a push reports "Everything up-to-date" but the user expects new commits to land, immediately check `dir .git\index.lock` (Windows) — if present, `del .git\index.lock` and retry the add/commit/push.**

**C) Bash sed on CRLF files can mangle them.** The site repo uses CRLF line endings (Windows). Running `sed -i` on those files works for simple substitutions but can leave the file in a weird state if anything else interrupts. Mitigation: prefer `Edit` tool for surgical changes. Use bash sed only for clearly-bounded multi-file string substitutions (like cache version bumps), and verify each file with `tail` immediately after.

**D) Cloudflare Pages doesn't auto-deploy the Worker.** The Worker code lives separately in the Cloudflare dashboard. Editing `worker-source.js` locally has zero effect on production until Brandon pastes the new code into the Cloudflare Worker editor and clicks "Save and deploy." This is documented in v2 but is worth re-stating because it's easy to forget.

**E) Cache busting via `?v=N` only invalidates style.css and script.js.** HTML files are served fresh by Pages (no edge cache). So bumping `v=N` is only required when CSS or JS changes. New articles do NOT need a version bump — just push the HTML.

---

## 7. Stray temp files to clean up (Brandon-side)

The script.js heredoc recovery left these in `C:\Dev\bpleone-site`. They're already in `.gitignore` so they won't pollute commits, but Brandon should delete them from File Explorer at his convenience (bash can't because of Windows file permissions on the Linux mount):

- `C:\Dev\bpleone-site\script.js.broken`
- `C:\Dev\bpleone-site\script.js.broken2`
- `C:\Dev\bpleone-site\script.js.head`
- `C:\Dev\bpleone-site\script.js.tail`

Right-click → Delete in File Explorer. Or `del script.js.broken script.js.broken2 script.js.head script.js.tail` from the terminal.

---

## 8. What's still NOT done — rolling backlog

Not urgent, but tracked so they don't get lost:

- **MU through-cycle pitch** — see Task D in section 3. The marquee piece. Currently a `noindex` scaffold.
- **Energy tier list (XOM, CVX, COP, SHEL, BP)** — listed as forthcoming on writing.html.
- **Methodology piece on reading 10-Ks** — listed as forthcoming.
- **`reports.html` empty-state** — will populate when MU PDF version ships.
- **`feed.xml`** — referenced in `writing.html` `<head>` but not actually generated. Needed if Brandon wants RSS readers (Feedly etc.) to pick up new pieces. Low priority — most readers will discover via Substack.
- **Bespoke OG/social cards per article** — currently every page uses the default `assets/brand/og-image.png`. A custom card for each article would improve link-preview appearance on LinkedIn / Twitter / Substack. Low priority.
- **Rotate the Finnhub API key + Worker secret** — both were pasted in chat during prior sessions. Not actively exploited but should be rotated as housekeeping.
- **Admin area auth** — the `/admin` editor currently uses a token in URL or localStorage; there's no Cloudflare Access gating. Documented in v2; still a TODO.
- **MU snapshot panel on homepage Lead Pick card** — the card currently shows watchlist data only; the snapshot stats grid (Mkt Cap, P/E, 52W Range, Day Range, Volume, Avg Volume) populates via the Worker but some fields show em-dashes when Yahoo's quoteSummary is rate-limited. The Finnhub fallback was added; verify all six cells populate consistently across page reloads.

---

## 9. Final note for the next session

The site is in genuinely good shape after this session. First piece is published, the publishing pipeline (write in markdown → polish to HTML → link from writing/index → push → schedule on Substack) is proven, and the visual polish (hover crosshairs, niceTicks, centered sparkline) is at a level that won't embarrass Brandon when a recruiter visits.

The two highest-leverage things the next session can do are:

1. **Get Brandon onto the email setup.** He should not be receiving research-related correspondence in his personal inbox. The Cloudflare Email Routing setup is fast and the privacy benefit is meaningful.
2. **Help Brandon ship the MU pitch.** That's the marquee piece. Everything else on the site exists to frame that pitch when a recruiter clicks through.

Don't get pulled into adding more features to the site. The infrastructure is done. The pages render. The data flows. The next 80% of value comes from publishing real research, not from polishing the chrome.
