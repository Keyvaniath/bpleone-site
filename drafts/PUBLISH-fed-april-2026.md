# Publish Handoff: The Fed After Powell

**Status:** Ready to ship. All file edits complete.
**Article URL after deploy:** `https://bpleon.com/fed-april-2026.html`
**Date:** April 30, 2026

---

## What's been done in the repo

Four files touched — all already saved to `C:\Dev\bpleone-site`. Nothing has been pushed yet; that's your decision.

| File | Change |
|---|---|
| `fed-april-2026.html` | **New article page.** ~600 lines. Self-contained, styled to match site, includes scenario table, "what would change my mind" list, and source references at the bottom. |
| `writing.html` | Replaced the "Nothing published yet" empty-state in the Recent section with a real link to the new article. |
| `index.html` | Added a new "Latest" section above "On deck" that surfaces the Fed piece on the homepage. The MU Featured card stays put. |
| `drafts/fed-april-2026.md` | The polished markdown draft (your editing source for any future revisions). |

The MU through-cycle pitch remains as the marquee Featured card on the homepage — this Fed piece runs alongside it as your first published research output.

---

## Pre-flight checks (do these before pushing)

### 1. Read the article in your browser locally

Open `C:\Dev\bpleone-site\fed-april-2026.html` directly in Chrome (drag the file into a new tab, or right-click → Open with → Chrome). Read it once end-to-end. Look for:

- **Voice.** Does it sound like you? If any sentence reads as too AI-flavored or too formal, mark it and we'll fix.
- **Defendability.** Every number in the piece — 3.50–3.75% target range, 8–4 vote, "most since October 1992", May 15 chair end, Senate Banking 13–11, Core PCE 3.2%, 10-year near 4.4%, May 11 Senate vote — should be something you can recall in conversation. If any of these would trip you up if a partner asked, flag it.
- **The dissenters' names.** Stephen Miran (Governor, wanted a cut). Beth Hammack (Cleveland), Neel Kashkari (Minneapolis), Lorie Logan (Dallas) — wanted to scrub the easing-bias language. These are easy to remember as "the governor wanted to cut, the three regional presidents wanted to drop the dovish lean."

### 2. Verify the four claims you're least likely to have memorized

These are the ones that came from web search, not your direct reading of the meeting:

- **Senate Banking Committee vote was 13–11 along party lines** (first fully partisan committee vote on a Fed chair) — verify on a CNBC or WaPo recap.
- **Powell's chair term ends May 15** — verify on the Federal Reserve Board's bio page.
- **Core PCE at 3.2%** — verify on the BEA release for March 2026.
- **The renovation investigation language** ("until this investigation is well and truly over") — verify on the CNBC Powell quote.

If any of these don't match what you find, edit the relevant line in `fed-april-2026.html` before pushing.

### 3. Click the source links at the bottom of the article

The five source links in the article all came from web search. Click each one to confirm the URL still resolves and the content matches what's described. If a link is dead, either find a replacement or remove it.

---

## Publish: push to live

Once you're satisfied with the article, push from your terminal:

```
del C:\Dev\bpleone-site\.git\index.lock
cd C:\Dev\bpleone-site
git add fed-april-2026.html writing.html index.html drafts\
git status
git commit -m "First piece: The Fed After Powell (Apr 29 FOMC notes)"
git push
```

Notes on this command:
- `del .git\index.lock` — runs first as a safety belt; the lock file may or may not exist. Deleting a nonexistent file errors silently, which is fine.
- The `git add` line adds only the four touched paths (article + writing + index + the drafts folder which is `.gitignore`d so it'll be skipped). This avoids accidentally committing other unrelated work-in-progress.
- `git status` lets you visually confirm the right files are staged before committing.

After `git push`, watch Cloudflare Pages dashboard — the build typically completes in 30–45 seconds. The site URL will reload automatically.

---

## Post-publish smoke test

In an **incognito window** (no caching), visit each of these and confirm:

1. **`https://bpleon.com/`** — the new "Latest" section appears above "On deck", with the Fed piece linked.
2. **`https://bpleon.com/writing.html`** — the "Recent" section shows the Fed piece (no more empty-state).
3. **`https://bpleon.com/fed-april-2026.html`** — the article loads with proper styling, the scenario table renders, the source links work.

If any of those don't render correctly, let me know and we'll fix.

---

## After it's live: distribution

The piece is most useful in the next 7 days while it's still topical. Consider:

- **Substack cross-post.** Copy the body into a new Substack post with a link back to the canonical bpleon.com URL at the bottom. This gives you the email send to subscribers without splitting SEO.
- **LinkedIn share.** Short post — quote the differentiated thesis ("the market is watching the rate path; it should be watching the institution") and link the article. Tag people you want to read it (recruiters, network).
- **Twitter/X if applicable.** Same pattern — pull-quote + link.
- **Update `now.html`.** Add "Just published: notes on the April FOMC. Working on the MU pitch next" to your /now page so anyone landing there sees current activity.

---

## What's NOT done — for the next session

- **MU pitch is still scaffolding** with `noindex`. The Fed piece going live doesn't change that. When you're ready, we'll fill in the MU draft with real content (HBM contribution, mid-cycle margin, reverse-DCF, bear case kill shot) and ship it as the marquee equity piece.
- **Reports.html still empty-state.** The Fed piece is a "macro note," not a long-form report PDF, so it stays on the writing page. The first true /reports entry will be MU when it ships.
- **No RSS update.** The site has a `feed.xml` reference in the `<head>` of writing.html but I haven't generated/updated the actual feed file. If you want the Fed piece to appear in RSS readers, we'd need to author `feed.xml`.
- **No social card image.** The OG image points to `assets/brand/og-image.png` which is your default. A bespoke card for this piece would be nice-to-have but not essential.

---

## Rollback (if something goes wrong post-publish)

If the article looks broken on the live site and you can't quickly fix:

```
cd C:\Dev\bpleone-site
git revert HEAD
git push
```

That creates a new commit reversing the publish. The article URL will 404 until you push again, but the rest of the site stays clean. Do this only if the issue is severe — small typos can be fixed in place and pushed normally.
