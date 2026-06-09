# bpleon.com — Project Context

This file is the project memory for Claude Code. It is loaded automatically when Claude Code starts in this directory.

## What this repository is

**bpleon.com** — Brandon Leon's personal research site. Hand-written HTML / CSS / a few small JS scripts. Deployed via Cloudflare Pages from `main`. Sister Substack at https://bpleon.substack.com.

The site doubles as a portfolio of research work: single-name pitches, weekly macro outlooks, methodology pieces. Written voice; IB-quality rigor; falsifiable theses; no marketing-speak.

## Stack and conventions

- **Static site.** No build step. Edit HTML directly, commit, push, Cloudflare serves.
- **Fonts:** Newsreader (serif) + Inter (sans) from Google Fonts. CSS variables `--serif` and `--sans`.
- **Palette:** cream `#fbf7ef`, ink `#1c1a16`, accent terracotta `#b56a3f`, accent-2 gold `#c9a961`.
- **Versioning:** `style.css?v=N` and `script.js?v=N`. Bump N when CSS or JS changes.
- **Article HTML files** live at the repo root (e.g., `mu-june-outlook-2026-05-31.html`).
- **Chart PNGs** live in `assets/reports/`. Naming: `<article-slug>-c<N>-<topic>.png`.
- **Brand assets** in `assets/brand/`.

## Article scaffolding pattern

Every published article uses the same structure. The canonical template is `mu-june-outlook-2026-05-31.html`. Copy its `<head>` block, the embedded page-scoped `<style>`, `site-header`, `<main class="prose">`, and footer wholesale when starting a new piece.

Key class hooks:
- `header.page-head` containing `.eyebrow`, `h1`, `.pitch-meta`, `.pitch-thesis`
- `section.pitch-section` for body sections with H2s
- `figure.article-chart` with `.chart-title`, `.chart-headline`, `.chart-img`, `.chart-caption`
- `table.pitch-table` with optional row classes `row-warn` and `row-exit`
- `.pull-quote` for inline quotes
- `.disclosure` paragraph at the end
- `.pitch-cta` with Substack subscribe button before the footer

## Voice and writing conventions (Brandon's preferences)

1. **Story-driven, not data-dump.** Lead with the question, then the data, then the framework.
2. **Falsifiable.** Every meaningful claim has either a primary source or is labeled `[ESTIMATE]`. Every thesis has explicit kill-shots.
3. **Discipline-forward.** Pre-committed trim ladders. Exits. No chasing.
4. **No emojis. No marketing-speak.** Brandon dislikes both. Don't compliment him either.
5. **Honest about misses.** When a non-consensus call breaks, name it directly.
6. **Read time** stated in meta: 5-6 min for updates, 10-12 min for full pitches.
7. **Pull-quotes** anchor the read. Use them sparingly but deliberately.

## Source rules (HARD CONSTRAINTS — non-negotiable)

- **Quarterly financials** must come from MU/Dell/issuer **8-K filings on SEC EDGAR**. Period.
- **Sell-side notes** must be cross-referenced across at least two of: Bloomberg, Investing.com, MarketBeat, TipRanks, TheStreet.
- **Industry data** (DRAM pricing, HBM share) must come from TrendForce, IDC, Counterpoint, Mercury Research with explicit attribution.
- **Macro data** (PCE, CPI, NFP) must come from BEA / BLS / Fed primary releases.
- **If a number cannot be primary-sourced, mark it `[ESTIMATE]` inline in the article body.** Do not assert it as fact.
- The truth table for MU is `MU-VERIFIED-DATA-REFERENCE.md` at the repo root. **Read it before writing any MU number.**

## Repo layout

```
C:\Dev\bpleone-site
├── index.html, writing.html, about.html, etc.  — site pages
├── mu-*.html, weekly-outlook-*.html, etc.       — published articles
├── assets/
│   ├── brand/                                    — logos, favicons
│   └── reports/                                  — chart PNGs
├── style.css                                     — site styles
├── script.js                                     — ticker + small UI
├── CLAUDE.md                                     — THIS FILE
├── MU-VERIFIED-DATA-REFERENCE.md                 — MU truth table (gitignored)
├── DELL-RESEARCH-HANDOFF.md                      — Dell project kickoff (gitignored)
├── SESSION-HANDOFF-2026-06-01.md                 — Cowork handoff (gitignored)
├── .gitignore                                    — keep the above three out of public site
└── .git/                                         — usual git plumbing
```

Files prefixed with `MU-`, `DELL-`, `SESSION-` are gitignored and stay local. Do not remove that.

## Project state (as of June 8, 2026)

### MU position

- **Rating:** BUY with trim discipline
- **Base PT:** $1,100 (unchanged since May 7)
- **Bull PT:** $1,500
- **Bear PT:** $280
- **First trim:** fired May 29 at $923 avg fill $919; position now ~4% of book
- **Second trim trigger:** $1,100 — did not fire on the Jun 3 peak of $1,079.57
- **Last reference:** ~$948 intraday Jun 8 after a Jun 4-5 selloff
- **Next decision date:** June 24, 2026 — MU FQ3 earnings print

### What's shipped

All articles at https://bpleon.com/. Recent set:
- `mu-through-cycle.html` — May 7 original pitch
- `mu-after-ubs-2026-05-28.html` — variant view became consensus (updated May 29)
- `mu-june-outlook-2026-05-31.html` — FQ3 setup + scenario tree (updated Jun 8)
- `weekly-outlook-2026-05-29.html` — May recap, "we were wrong on the math"

### What's pending

1. **Push the Jun 8 update.** The current working tree has unpushed updates to the June outlook + chart + writing.html.
2. **Dell research kickoff.** See `DELL-RESEARCH-HANDOFF.md`. Brandon wants to start single-name work on DELL in parallel with MU.
3. **June 25 morning piece** committed in the June outlook: a same-day reaction to MU FQ3 print.
4. **Possible DCF/methodology piece** for `/dcf-template.html`.

### Errors to never repeat

(From the May 31 audit pass that caught these.)

- MU FQ2'26 GM is **75.0%**, not 74%
- MU FQ2'26 revenue is **$23.86B**, not $12.4B
- MU FQ1'26 revenue is **$13.64B**, not $8.71B
- Goldman is at **$400 NEUTRAL**, not $235 (raised Mar 19, 2026)
- Morgan Stanley is at **$450 OVERWEIGHT** (top US semi pick), not "stale $350"
- Susquehanna at **$1,750** (May 29) and Cantor at **$1,500** (Jun 8) are the highest non-UBS targets — do not forget them
- Mizuho raised **three** times; final PT $1,150
- Wells Fargo (Jun 8, $1,220) and Cantor (Jun 8, $1,500) raised THROUGH the Jun 4-5 selloff — that's a material signal
- DA Davidson initiated Apr 28 (not May 13); HSBC was May 18; Melius May 19; TD Cowen Apr 28-29

## Site design system in one screen

```css
:root {
  --bg: #fbf7ef;          /* cream */
  --bg-soft: rgba(245,238,225,0.6);
  --ink: #1c1a16;
  --ink-soft: #4a4540;
  --muted: #8a8275;
  --rule: #e5dcc8;
  --accent: #b56a3f;      /* terracotta */
  --accent-2: #c9a961;    /* gold */
  --serif: "Newsreader", "Georgia", serif;
  --sans: "Inter", system-ui, sans-serif;
}
```

Bump the stylesheet version (`?v=N`) any time you change CSS, and the same N in `script.js?v=N` for cache busting.

## Workflows

### Writing a new article

1. Read `MU-VERIFIED-DATA-REFERENCE.md` for all MU numbers (or pull the appropriate verified data for the subject).
2. Use `mu-june-outlook-2026-05-31.html` as the structural template — copy the `<head>` + `<style>` block exactly.
3. Build charts with `matplotlib` (Python). Save PNGs to `assets/reports/`. Use this header in every chart script for consistency:

   ```python
   plt.rcParams.update({
       "font.family": "DejaVu Sans",
       "font.size": 10,
       "axes.edgecolor": "#595959",
       "axes.linewidth": 0.8,
       "axes.spines.top": False,
       "axes.spines.right": False,
       "axes.labelcolor": "#1F2A44",
       "axes.titleweight": "bold",
       "axes.titlesize": 13,
       "axes.titlecolor": "#1F2A44",
       "xtick.color": "#595959",
       "ytick.color": "#595959",
       "grid.color": "#EEEEEE",
       "grid.linewidth": 0.5,
       "figure.dpi": 150,
       "text.parse_math": False,   # so $ signs render as text, not math
   })
   ```

   Use these named colors: `NAVY="#1F2A44"`, `ACCENT="#b56a3f"`, `ACCENT_2="#c9a961"`, `GREEN="#548235"`, `RED="#a12b2b"`, `BLUE="#2E75B6"`, `ORANGE="#ED7D31"`, `GREY="#595959"`.

4. Add a new `<article>` entry at the TOP of the Recent list in `writing.html`. Include `<time>`, `<h2>` link, `<span class="writing-tag">` tag, and a 2-3 sentence teaser.
5. Ship: `git add` the article + charts + writing.html, commit with a `ship:` prefix and short summary, `git push origin main`.

### Substack workflow

After the bpleon.com push lands and the article is live:
- Title: same as `<h1>`
- Subtitle: the article's lede sentence or `<meta name="description">`
- Body: paste from the rendered bpleon.com page; drag in chart PNGs from `assets/reports/`
- **Canonical URL** in Substack's "Original source" field: `https://bpleon.com/<article-slug>.html`
- Tag: "Single-name pitch", "Week ahead", "Week recap", or "Methodology" as appropriate

### Git troubleshooting

If `git status` says "fatal: not a git repository" — `.git\HEAD` is missing. Recover with:

```powershell
Set-Content -Path .git\HEAD -Value "ref: refs/heads/main" -Encoding ascii -NoNewline
"`n" | Add-Content -Path .git\HEAD -Encoding ascii
```

This is a recurring OneDrive sync issue that's nothing to do with the repo.

### Verifying data before writing

Cross-reference every assertion with primary source. Examples:
- "MU FQ2 revenue was $X" → SEC EDGAR 8-K for MU FQ2'26
- "Goldman raised PT to $X" → minimum two of MarketScreener, Investing.com, MarketBeat
- "DRAM contract prices rose X%" → TrendForce press center
- "Hyperscaler 2026 capex aggregate" → Tom's Hardware analyst piece + each hyperscaler's most recent 10-Q

## Tools available to Claude Code

- File read/write/edit on this repo
- Bash for shell commands and running Python scripts
- Web search via `WebSearch` tool (when configured) for source verification
- Git operations via shell

Claude Code can edit the `.html` files directly. Brandon prefers small, targeted Edits over Write-replace-whole-file when iterating. Use Edit by default; Write only for new files or full rewrites that you've thought through.

## What to do at session start

If Brandon hasn't given a directive: read `MU-VERIFIED-DATA-REFERENCE.md` and `DELL-RESEARCH-HANDOFF.md` to see the current state, then ask what he wants to work on. Do not invent work.

If Brandon's message references the MU project, treat the verified-data file as authoritative for any number that's already there. Do not re-derive.

## What NOT to do

- Do not commit `MU-VERIFIED-DATA-REFERENCE.md`, `DELL-RESEARCH-HANDOFF.md`, `SESSION-HANDOFF-*.md`, or `CLAUDE.md` itself to the public site if Brandon does not want them visible. **Check `.gitignore` before adding any of these.**
- Do not push automatically. Brandon runs `git push origin main` himself from PowerShell after reviewing the diff.
- Do not invent prices, sell-side targets, or insider activity. Verify first.
- Do not change the site palette or fonts without an explicit ask.
- Do not write in marketing voice. Keep it analyst-grade.

---

*This file is the project context for Claude Code. Update it when project conventions change or major state shifts (e.g., a new article series, a re-positioned thesis, a new sub-project).*
