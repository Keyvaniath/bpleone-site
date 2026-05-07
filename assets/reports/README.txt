This folder holds long-form research PDFs that the /reports page links to,
plus a manifest.json that the admin panel reads from.

Adding a new report
-------------------
1. Drop the PDF in this folder. Naming convention:
   <slug>-<YYYY>-<MM>[-full-<random>].pdf  (gated full deck)
   <slug>-<YYYY>-<MM>-preview.pdf          (public preview)

   Example:
     mu-er-initiation-2026-05-full-r4f7x9k2.pdf
     mu-er-initiation-2026-05-preview.pdf

   The "-full-<random>" suffix obscures the URL so it can't be guessed.
   The "-preview" suffix marks the public-facing teaser.

2. Regenerate the manifest:
     node tools/build-reports-manifest.js

3. Open assets/reports/manifest.json and edit the human-readable fields
   for the new report: title, subtitle, type, published, page.
   (sizes, paths, and gated flags are derived automatically.)

4. The admin panel (Reports tab) auto-discovers the new entries on next
   page load. The /reports.html page is hand-curated; add a new <article>
   block there if you want it on the public surface too.

Current files
-------------
  manifest.json                                  - source of truth for admin
  mu-er-initiation-2026-05-preview.pdf           - public 5-slide preview
  mu-er-initiation-2026-05-full-r4f7x9k2.pdf     - full 14-slide deck (gated)
