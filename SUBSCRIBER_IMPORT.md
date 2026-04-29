# Subscriber import workflow — Formspree → Substack

## How the gate-to-list pipe works

The `/dcf-template` page has a Formspree form gating the download. Visitors submit their email; an unchecked checkbox lets them opt in to the newsletter. The two cases:

| Field state              | Meaning                                              | What we do with it                |
|---|---|---|
| `subscribe=yes`          | They explicitly opted in                             | Add to `bpleon.substack.com`      |
| (no `subscribe` field)   | They just wanted the file, no marketing consent      | Leave alone. Don't import.        |

Importing without the explicit opt-in risks spam complaints and (in the EU) GDPR violation. Filter every time.

## Manual import workflow (do this every 1–2 weeks)

1. **Pull the new submissions from Formspree.**
   - Go to https://formspree.io/forms/xdayqzkj/submissions
   - Filter / sort by date so you only see submissions since your last import
   - Click "Export" (top right) → choose CSV
   - Save the CSV locally

2. **Filter to opt-ins only.**
   - Open the CSV in Excel or Google Sheets
   - Sort or filter by the `subscribe` column
   - Keep only rows where `subscribe = yes`
   - Save just the `email` column to a fresh CSV (one email per row, header `email`)

3. **Import into Substack.**
   - Sign in at https://substack.com → switch to your `bpleon` publication
   - Settings → Subscribers → Import subscribers
   - Upload the filtered CSV
   - Substack will dedupe against existing subscribers; new ones get a confirmation email

4. **Note the import date** somewhere (a journal, a sticky note, here in this file). Each import only needs to cover submissions newer than the previous import date.

## When to automate

You can keep doing the manual flow indefinitely. But if any of these become true, it's time to put Zapier or n8n in front of it:

- You're importing more than ~20 emails per week (the 5-minute manual task gets old fast)
- Submissions arrive on weekends and you don't want to babysit
- You add more gated assets (a second template, a paid report, etc.) and now you're juggling multiple Formspree forms

Recommended automation: **Zapier free tier** — trigger on "New Formspree submission with subscribe=yes", action "Add subscriber to Substack" (Substack integration available). 100 tasks/mo on the free tier is plenty for low volume.

Long-term, if Formspree's 50/mo cap becomes a constraint, the cleaner path is to swap Formspree on the gate form for a direct POST to Substack's subscriber API or to a Cloudflare Worker that writes to your list of choice. One system instead of two.

## What's currently wired up

- **Gate form**: `/dcf-template` — Formspree form ID `xdayqzkj`, destination `brandonpleone@gmail.com`
- **Subscribe surfaces**: Homepage `/index.html` (iframe), every page footer (button injected by `script.js`)
- **Substack publication**: `bpleon.substack.com` (handle `@bpleon`)

## Spam / unsubscribe hygiene

- If anyone hits Formspree's spam-complaint threshold, Formspree may pause your form. Don't import non-opt-in addresses.
- Keep the checkbox unchecked by default. Pre-checking is more aggressive and fragile.
- When you publish your first Substack post, set the "Welcome email" so freshly imported subscribers know who you are. Otherwise they may flag it as unfamiliar.
