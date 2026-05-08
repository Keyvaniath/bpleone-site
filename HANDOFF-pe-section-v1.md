# bpleon.com — Private Equity Section Handoff (v1)

**Last updated:** May 7, 2026
**Owner:** Brandon Leon (brandon@bpleon.com)
**Live site:** https://bpleon.com
**Repo:** https://github.com/Keyvaniath/bpleone-site

This document plans the buildout of a dedicated Private Equity vertical on bpleon.com. The point isn't to chase a PE seat instead of an ER seat — it's that PE-grade analytical skills (LBO modeling, returns attribution, reverse-LBO, take-private screens) are *the* differentiator in ER coverage of cyclicals and rerate candidates. A PE section signals that you can think like a buyer, not just a sell-side modeler.

It also opens up a paid-tier surface: PE templates command higher price points than public-equity templates because the buyers (sponsor associates, family offices, search funds, IB analysts prepping for PE recruiting) are more willing to pay.

---

## 0. Why now / strategic positioning

Three audiences this section serves, in priority order:

1. **ER recruiters at Goldman / MS / boutiques.** They want analysts who can reverse-LBO any name on the watchlist. A visible PE section says "I think about every public company as a potential take-private candidate; here's the math."
2. **PE recruiting cycle (associate / VP-level laterals).** Even if you're not in the on-cycle, having shipped LBO models with worked examples is a dossier-builder. Search funds and family offices are particularly receptive to non-traditional channels.
3. **Paying customers.** PE associates pay for templates that save them weekend work. A through-cycle LBO with proper returns attribution and reverse-LBO is genuinely useful and currently $79/$249-pricable.

Positioning sentence for the page header: *"Private equity templates and case work. The same models I'd use on the buy-side, with worked public-company examples so you can see the math end-to-end."*

---

## 1. Site IA / nav

### Option A — New top-level tab "PE"
Add **PE** between Toolkit and Reports. Pros: maximum visibility, signals the dedicated vertical. Cons: 8 nav items (currently 7), edges toward crowded.

### Option B — Subsection of Toolkit
Group all PE tools under `/toolkit#pe` with section anchors. Pros: keeps nav at 7. Cons: PE work is harder to discover.

### Option C — New top-level tab "Buy-Side" (covers PE + value-style ER)
Reframe as "Buy-Side" and house both LBO templates AND the through-cycle long format. Pros: the broadest banner that fits Brandon's actual angle. Cons: requires rebranding existing artifacts.

**Recommendation: Option A.** Add a "PE" tab. It's the cleanest signal and the discoverability win outweighs the nav-density cost. The existing `LBO/M&A` template moves under it.

---

## 2. Content map — what goes in the PE section

Three pillars, each with concrete artifacts:

### Pillar 1: Templates and tools (the paid surface)

| Tool | Status | Tier | Notes |
|---|---|---|---|
| LBO / M&A Template (17-tab) | **shipped** | Free + $79 / $249 | Already live; two worked MU examples. |
| **Take-Private Screener** | new | Free demo + $79 | Spreadsheet that scores public companies on LBO-ability: leverage capacity, FCF stability, asset coverage, takeout precedent multiples, sponsor interest signals. Feed: any S&P 1500 ticker. |
| **Reverse-LBO Calculator** | new | Free | Solves backwards: at today's price, what entry multiple, debt structure, and 5-year EBITDA growth justify a 25% sponsor IRR? Browser-only (no Excel needed), like the DCF calc. |
| **Returns Waterfall Builder** | new | $79 | Inputs: capital structure (TLA, TLB, mezz, sponsor equity), entry/exit multiple, hold period. Outputs: IRR, MOIC, returns attribution (multiple expansion vs. EBITDA growth vs. debt paydown). With sensitivity heatmap. |
| **Distribution Waterfall** | new | $249 | American vs. European waterfall calculator. 8% pref, 100% catch-up, 80/20 carry. Models GP and LP cash flows year by year, with sponsor-vs.-LP IRR breakdown. |
| **QofE Quick-Check** | new | $79 | Quality-of-Earnings adjustments framework: one-time items, run-rate normalizations, working capital, capex reclass. Worked example on a real public-company filing. |
| **Cap Table & Waterfall** | new | $79 | Pre/post-money cap table with options pool, anti-dilution adjustments (broad-based weighted-average), liquidation preference scenarios (1×/2×/participating). |
| **Term Sheet Teardown** | new (educational) | Free | A real-style term sheet with side-by-side annotation: what each clause means, what to negotiate, what's red-flag. Builds the "I understand the document" credential. |

**Build order:** Reverse-LBO Calculator first (browser-only, ships fast, big SEO upside). Then Returns Waterfall Builder (paid, highest demand). Then Take-Private Screener (data product, more involved). QofE / Distribution / Term-Sheet are Tier 2.

### Pillar 2: Worked examples / case studies (the credibility surface)

PE without specific deal work is just theory. These are pitch-quality write-ups, parallel to the MU through-cycle long.

| Case | Hook | Format | Status |
|---|---|---|---|
| **Take-private case: Western Digital (or similar cyclical)** | NAND-only pure play, 8x EBITDA take-private math, sponsor IRR sensitivity | Long-form HTML + PDF | new |
| **Carve-out case: Intel Foundry vs. Intel Products** | What's the IRR of taking Foundry private; what's the standalone valuation; what's the spin math | Long-form | new |
| **Buy-and-build case: HVAC distributors** | Fragmented market, consolidation thesis, multiple arbitrage math | Long-form | new |
| **LBO post-mortem: Refinitiv (Blackstone → LSEG)** | Returns attribution on a real exited deal | Short-form note | new |
| **Reverse-LBO: NVIDIA (just for the lulz)** | At what price, with what assumptions, would NVIDIA make sense as a take-private? Spoiler: it doesn't, but the analysis is the point. | Short-form note | new |

**Build order:** Reverse-LBO post on a name you already know cold (MU? — leverage your existing model). Then a real take-private case (WDC is good; SanDisk-spinoff context is current). Then carve-out and buy-and-build as you have time.

### Pillar 3: Educational / SEO content (the discovery surface)

Short, searchable, evergreen. These are what a junior associate or recruiting candidate Googles at 11 PM. Each one is a soft-sell into the corresponding paid template.

| Post | Anchor concept | Length | Links to |
|---|---|---|---|
| **"How to read a sponsor LP letter"** | Carry, hurdle, catch-up, recycling | 1,500w | Distribution Waterfall |
| **"Reverse-LBO in five minutes"** | The intuition, when to use it, common errors | 1,200w | Reverse-LBO Calculator |
| **"Why 7x EBITDA isn't always the right multiple"** | Cyclical adjustment, mid-cycle EBITDA, comp set discipline | 1,500w | Trading Comps Template |
| **"What's actually in a credit agreement"** | TLB covenants, incremental capacity, restricted payments | 2,000w | LBO Template |
| **"Sponsor returns demystified"** | Multiple expansion, EBITDA growth, debt paydown, leverage | 1,800w | Returns Waterfall Builder |
| **"How to size a management rollover"** | Equity comp, vesting, performance pool, dilution | 1,200w | Cap Table tool |
| **"Reading a take-private offer letter"** | Premium math, breakup fee, fiduciary out, financing condition | 1,500w | Take-Private Screener |

Each post has the same structure: a real example or hypothetical → the math → the rule of thumb → the gotcha → the link to the template. Keep them tight; PE practitioners don't read filler.

---

## 3. Charts and visualizations to standardize

A library of chart types we use across the section. Build once, reuse everywhere.

### Returns bridge (waterfall)
Stacked-bar showing how MOIC decomposes:
- Entry equity → +EBITDA growth → +debt paydown → ±multiple change → +recycle / dividend recap → exit equity
Used in every LBO case study. SVG, ~6 bars, clear color coding (positive = green, negative = red).

### Capital structure stack
Vertical bar showing the cap table at entry vs. exit:
- TLA / TLB / mezz / unsecured / sponsor equity / management rollover
Used in LBO templates and case studies.

### IRR / MOIC sensitivity heatmap
2D table: exit multiple (rows) × EBITDA CAGR (cols) → IRR or MOIC color-coded.
Used in every LBO model output. Standard across the section.

### Returns attribution chart
Donut or bar showing what % of returns came from:
- Multiple expansion (optimistic — 30%+ is a yellow flag)
- EBITDA growth (the operational story)
- Debt paydown (the financial engineering)
- Cash sweep / recap

### LBO operational model strip
6-panel small-multiples: revenue, EBITDA margin, capex, FCF, leverage ratio, interest coverage.
Used in every LBO case write-up.

### Take-private premium chart
Scatter of recent take-privates: announcement date (x) vs. premium-to-undisturbed (y), bubble-sized by deal value.
Used in Take-Private Screener.

### Distribution waterfall timeline
Year-by-year chart showing GP vs. LP cash flows with hurdle, catch-up, and carry phases marked.
Used in Distribution Waterfall calculator.

**Implementation:** all SVGs, inline. Reuse the pattern from the existing hero S&P chart and lead-pick sparkline (vanilla JS + D3-style math, no libs). Keep palette consistent: navy `#0B1F3A`, gold `#C9A961`, terracotta `#B56A3F`, sage `#5B7F6B`.

---

## 4. Comps and data products

PE buyers care about three comp sets:

### 4.1 LBO / take-private precedents
A curated dataset of recent take-privates with key fields:
- Target ticker / name / sector
- Sponsor(s) (incl. consortia)
- Announcement date / close date
- Deal value (equity / EV)
- Premium to undisturbed (1d, 30d, 90d)
- Entry multiple (EV/EBITDA, EV/Revenue)
- Cap structure at entry (debt / equity split)
- Sources & uses (rough)
- Status (closed, terminated, pending)

**Where to source:** SEC filings (DEFM14A proxies are a goldmine), S&P CapIQ if you have access, Pitchbook (paid), free sources like Mergr (limited), public Bloomberg/Reuters articles.

**MVP:** a manual table of 30 deals (SailPoint, Squarespace, Endeavor, etc.) updated quarterly. Eventual automation: SEC EDGAR scraper for DEFM14A filings.

**Format:** JSON file → renders as filterable table on `pe-precedents.html`. Filter by sector, year, sponsor.

### 4.2 PE multiples by sector
Median EV/EBITDA TTM and NTM for completed LBOs, by sector and deal size cohort. Compare to public trading multiples. The "sponsor pays X turns more / less than the market" delta is the most-used analytic in PE comp work.

### 4.3 Sponsor screen
Top sponsors ranked by:
- Recent fund size
- Vintage (active deployment)
- Sector focus
- Average deal size
- Notable wins / losses

Less rigorous than the precedents database but useful for "who'd buy this" questions.

---

## 5. Specific deliverables — first 90 days

Sequenced from highest-leverage / lowest-effort first.

### Week 1 (immediate)
- [ ] Add **PE** tab to nav (10-min change across all 20 HTML files via the same Python pattern).
- [ ] Create `pe.html` landing page with section anchors for each tool/case (mirrors `toolkit.html` structure).
- [ ] Move the existing **LBO/M&A Template** entry from Toolkit to PE. Update internal links.
- [ ] Write the educational post **"Reverse-LBO in five minutes"** (1,200 words, ~3 hours). Highest SEO ROI.

### Week 2-3
- [ ] Build **Reverse-LBO Calculator** (browser-only, like the DCF calc). Inputs: ticker (autocomplete), entry assumptions, debt structure, hold period, target IRR. Output: implied EBITDA growth required.
- [ ] Write **"Sponsor returns demystified"** (1,800 words). Pair with a returns-bridge chart.
- [ ] Write the **MU reverse-LBO post** as a worked example (1,500 words). Use existing model.

### Week 4-6
- [ ] Build **Returns Waterfall Builder** (paid template, $79). Excel + Python pipeline. Same architecture as the DCF Template.
- [ ] Write **"Why 7x EBITDA isn't always the right multiple"** with cyclical adjustment math. Cross-link to Trading Comps Template.
- [ ] Build **Take-Private Precedents** v1: hand-curated table of 30 deals, filterable on `pe-precedents.html`.

### Week 7-12
- [ ] Build **Take-Private Screener** (free demo + $79 paid). Score public companies on LBO-ability.
- [ ] Build **Distribution Waterfall Calculator** ($249 paid). American vs. European, full year-by-year cash flow waterfall.
- [ ] Write the **Western Digital take-private case study** (long-form, 3,000 words, with the Returns Waterfall + reverse-LBO outputs embedded).
- [ ] Build **Cap Table & Waterfall** template ($79).

### Tier 2 (after first 90 days)
- QofE Quick-Check
- Term Sheet Teardown (educational, free)
- Carve-out case study (Intel Foundry?)
- Buy-and-build case study (HVAC distribution or similar)
- Sponsor screen / database
- LBO post-mortem series (one per quarter)

---

## 6. Pricing and monetization

### Free tier (the lead-magnet surface)
- LBO / M&A Template (already shipped)
- Reverse-LBO Calculator (browser-only)
- Term Sheet Teardown (educational)
- All blog posts and case studies (lead-capture via Formspree gate where appropriate)

### Standard tier ($79)
- Returns Waterfall Builder
- QofE Quick-Check
- Cap Table & Waterfall
- Take-Private Screener
- Sponsor screen access

### Pro tier ($249)
- Distribution Waterfall (American + European)
- Combined PE Toolkit Bundle (everything above + Python automation)
- White-label license for internal team use
- Quarterly precedents database refresh

### Bundle (new): "PE Starter" $399
- LBO Template + Returns Waterfall + Reverse-LBO Calc + 1-on-1 walkthrough call (45 min)
- Sells well to PE recruiting candidates and search-fund ops people

---

## 7. SEO / discoverability

PE search terms are higher-intent than public-equity terms. The audience is smaller but converts better. Target keywords:

- "lbo model template"
- "reverse lbo calculator"
- "sponsor returns waterfall"
- "take-private precedents 2026"
- "carry waterfall calculator"
- "qofe template"
- "distribution waterfall lbo"
- "ebitda multiple cyclical"

Each blog post should target one keyword cluster. Existing site already ranks for "ib-grade dcf" — same pattern works for PE.

Cross-post key pieces to:
- Substack (existing — bpleon.substack.com)
- LinkedIn long-form (highest signal for ER/PE recruiting eyes)
- WSO if you're active there
- Hacker News for the more methodology-heavy posts

---

## 8. Decisions to make before building

1. **Nav placement** — add **PE** tab? (recommended) Or fold under Toolkit?
2. **Branding** — keep the same navy/gold palette across PE? Or use a sub-palette (deeper navy, different accent) to visually distinguish? Recommendation: keep same palette, use the sage `--accent-2` more heavily on PE pages so the section reads as adjacent-but-distinct.
3. **Case study pace** — one major case per month, or one short-form post per week? Recommendation: short-form weekly, major case monthly.
4. **Existing through-cycle long format** — does the same template work for PE case studies? Largely yes, but add a "Returns Bridge" section between scenarios and risks. Most PE write-ups need the IRR / MOIC bridge front-and-center.
5. **Live data for take-private screener** — automate via SEC EDGAR scraper, or hand-update? Recommendation: hand-update v1 (30 deals quarterly), automate v2.
6. **Q&A drill sheets for PE interview prep** — same format as the Goldman ER drill sheet, but PE-flavored (modeling case, paper LBO, sponsor returns Q&A)? Useful as a free lead magnet.
7. **Substack cadence** — does each PE post get a Substack send? Recommended: only the major case studies and the educational evergreen pieces, not the short-form notes.

---

## 9. File / repo structure

Proposed additions to the repo:

```
bpleone-site/
├── pe.html                          # PE landing page
├── pe-precedents.html               # Take-private precedents table
├── pe-reverse-lbo.html              # Browser-based reverse-LBO calc
├── pe-returns-bridge.html           # Standalone returns-bridge tool
├── pe-mu-reverse-lbo.html           # Worked MU reverse-LBO case
├── pe-wdc-take-private.html         # WDC take-private case study
├── pe-intel-carve-out.html          # Intel Foundry carve-out case
├── posts/                           # Educational PE posts
│   ├── reverse-lbo-in-five-minutes.html
│   ├── sponsor-returns-demystified.html
│   ├── why-7x-ebitda-isnt-right.html
│   └── ...
├── assets/
│   ├── pe-toolkit/
│   │   ├── reverse-lbo-template.zip
│   │   ├── returns-waterfall-template.zip
│   │   ├── distribution-waterfall.zip
│   │   ├── qofe-template.zip
│   │   ├── take-private-screener.zip
│   │   └── README.txt
│   ├── pe-cases/
│   │   ├── wdc-take-private.pdf
│   │   ├── intel-carve-out.pdf
│   │   └── mu-reverse-lbo.pdf
│   └── pe-data/
│       ├── precedents.json          # Hand-curated take-private database
│       └── sponsor-screen.json
└── tools/
    ├── build-pe-precedents.js       # Renders precedents.json into pe-precedents.html table
    └── build-returns-bridge.js      # Generates returns-bridge SVG charts
```

This mirrors the existing toolkit/ structure so there's nothing new to learn.

---

## 10. What success looks like (first 6 months)

Concrete, measurable:

- **3 paid PE templates shipping** (Returns Waterfall, Distribution Waterfall, Take-Private Screener)
- **1 long-form case study published per month** (≥ 6 by month 6)
- **8-12 educational posts** in the PE section indexed by Google
- **~50 paying customers across PE templates** at average $120 per buyer = ~$6K incremental revenue (conservative)
- **PE templates downloaded by ≥ 2 named sponsors** (use Formspree CSV to track domains)
- **At least 1 inbound recruiter conversation** that mentions the PE work specifically

Higher-order signals:
- A PE associate or VP shares one of your posts on LinkedIn
- A search fund principal pings you to discuss a target
- A buy-side recruiter explicitly references the PE section

---

## 11. Open risks / what could go wrong

- **Time fragmentation.** PE buildout pulls focus from public-equity coverage. Mitigation: keep public-equity content shipping (one MU update per quarter, plus one new name per quarter); use PE buildout in dedicated Saturday blocks.
- **Quality dilution.** Templates that aren't audited end-to-end create reputation risk. Mitigation: every paid template ships with a worked public-company example you've personally pressure-tested, like the MU example for the LBO/DCF.
- **Audience overlap.** Some buyers see "buy-side" templates and think you're not serious about ER. Mitigation: keep the framing tight in copy — these are *analyst* tools that happen to be useful in PE, not a pivot to PE-only.
- **Data freshness.** Take-private precedents go stale fast. Mitigation: quarterly refresh schedule built into the manifest workflow. Last-refreshed date prominent on the page.
- **Customer support load.** Paid templates create email volume. Mitigation: per-template FAQ section + 48-hour SLA mention in the README. Bundle a 1-on-1 call into Pro tier so the high-touch buyers self-select to the price point that justifies it.

---

## 12. Open questions for the next session

- Which case study do we ship first? (My vote: WDC take-private. The post-SanDisk-spinoff cap structure is current and the comp work is straightforward.)
- Do we add a paid-tier on the LBO/M&A Template (currently free) once the PE section is up? Or keep it as the lead magnet for the bundle?
- Do we want a sponsor-side persona on the PE landing ("if you're at a sponsor and reading this, here's how I'd think about that target") or keep it analyst-voice throughout?
- Stripe Payment Links vs. a real checkout? (Stripe Links work fine up to ~$5K/mo of revenue. Beyond that we need a real flow.)
- Is there appetite to build a **Capital Markets** sub-section eventually (debt issuance, IPO modeling, follow-on math) or is that a year-2 question?

---

## Quick reference — what to build first if you only have one weekend

1. Add **PE** tab to nav, point at `pe.html`.
2. Build `pe.html` landing — three sections: Tools, Cases, Posts.
3. Move existing LBO/M&A Template entry from Toolkit into the Tools section.
4. Write **"Reverse-LBO in five minutes"** (educational post, lives at `posts/reverse-lbo-in-five-minutes.html`).
5. Cross-link from the MU through-cycle long: "If you'd rather see this as a reverse-LBO, here's the math →".

That's a one-day buildout that signals the section exists, plants an SEO flag, and links into your existing best work. Everything else follows from there.

---

*End of v1. Update this doc as you ship — bump to v2 when the first three tools are live.*
