# bpleone.com

Personal site for Brandon Leon. Static HTML/CSS/JS, hosted free on Cloudflare Pages, with the domain at Squarespace pointing DNS to Cloudflare.

**Total cost:** just the domain renewal (~$12–20/yr at Squarespace, or ~$10/yr if you transfer to Cloudflare Registrar). Hosting, SSL, CDN, and DNS are all $0.

---

## The big picture

You have **two folders** in your `outputs` directory:

```
outputs/
├── bpleone-site/   <-- your website's source code (this is what goes on GitHub)
└── wizard/         <-- helper scripts that automate the busywork (stays on your computer)
```

Going live is a 6-phase journey. The wizard scripts handle the tedious parts; the rest is short clicking in two browser dashboards (GitHub, Cloudflare) and one tweak in Squarespace.

| # | Phase | What does it | Script |
|---|---|---|---|
| 1 | **Confirm domain ownership** | RDAP / WHOIS check | `wizard/1-check-domain.bat` |
| 2 | **Preview the site** | Opens index.html in your browser | `wizard/2-preview-site.bat` |
| 3 | **Personalize the placeholders** | Search & replace `YOURNAME`, fill in bio | (manual edits in any text editor) |
| 4 | **Push code to GitHub** | Installs git+gh, creates public repo, pushes | `wizard/3-push-to-github.bat` |
| 5 | **Connect Cloudflare Pages + custom domain** | One-time clicks in Cloudflare dashboard + Squarespace nameserver swap | (manual — full steps below) |
| 6 | **Verify it's live** | Hits every URL, checks DNS, checks SSL | `wizard/4-verify-live.bat` |

If anything blows up, screenshot the script output and ask for help — almost nothing here is irreversible.

---

## What's in `bpleone-site/`

```
index.html        Home — hero, projects, recent writing, subscribe
about.html        About / bio
projects.html     Full project list
writing.html      Writing index (mirrors Substack posts)
contact.html      Contact / links
404.html          Friendly not-found page
style.css         All styling — light + dark, responsive
script.js         Tiny JS that auto-updates the year in the footer
robots.txt        Tells search engines they can index
sitemap.xml       Helps Google find your pages
_headers          Cloudflare Pages: security + cache headers
_redirects        Cloudflare Pages: www → root, pretty URLs
.gitignore        Stuff git should ignore
README.md         This file
```

All internal links are relative, so you can preview by just **double-clicking `index.html`** — no server required.

---

## Phase 1 — Confirm you still own bpleone.com (1 min)

Double-click **`wizard/1-check-domain.bat`**.

You'll see one of three outcomes:

- **"You still own the domain. You are clear to proceed."** → continue.
- **"Domain expires in less than 30 days. Renew it FIRST."** → log in at https://account.squarespace.com → Domains → bpleone.com → Renew. Then re-run the script.
- **"It looks like bpleone.com may NOT be registered anymore."** → first check Squarespace (you might still own it but DNS is just down). If the domain has truly been released, you can re-register it cheaply — Cloudflare Registrar (~$10/yr) is the lowest-margin option; Namecheap and Porkbun are also fine.

---

## Phase 2 — Preview the site locally (30 sec)

Double-click **`wizard/2-preview-site.bat`** (or just double-click `bpleone-site/index.html` directly).

The site opens in your default browser. Click around — About, Projects, Writing, Contact. Everything should work. The only things that won't work yet are the Substack embed (no Substack created) and the LinkedIn/GitHub/X links (placeholders).

---

## Phase 3 — Personalize the placeholders (5–15 min)

Open the files in any editor (Notepad works; [VS Code](https://code.visualstudio.com/) is nicer if you want to install it). Search & replace these:

| Find                              | Replace with                                  |
|-----------------------------------|------------------------------------------------|
| `YOURNAME.substack.com`           | `your-actual-substack.substack.com`            |
| `https://www.linkedin.com/in/`    | your full LinkedIn URL                         |
| `https://github.com/`             | your full GitHub URL (after Phase 4)           |
| `https://x.com/`                  | your X / Twitter URL (or delete the line)      |
| `[City]`                          | where you're based                             |
| `[Most recent role]`, `[Firm]`    | your actual job history                        |
| `[Education]`, `[School]`         | your actual schooling                          |
| The "Project One/Two/Three..." copy on `index.html` and `projects.html` | your real projects |

Don't sweat perfection on day one. You can edit anytime — see "Editing later" below.

> **Tip:** you can do this AFTER pushing to GitHub too. Edits via github.dev (Phase 4) are the fastest way once the repo is up.

---

## Phase 4 — Push to GitHub (5 min)

Double-click **`wizard/3-push-to-github.bat`**.

The script will:
1. Install Git and the GitHub CLI if you don't already have them (via Windows' built-in `winget`).
2. Open a browser so you can sign in to GitHub. If you don't have a GitHub account, click "Sign up" first — use your gmail.
3. Ask for your name and email (one-time, for commit history).
4. Create a public repo named `bpleone-site` under your GitHub account.
5. Push everything in `bpleone-site/` to it.

When it finishes, you'll have a URL like `https://github.com/your-username/bpleone-site`. Copy it — you'll need it next.

> **Why public?** Cloudflare Pages requires either a public repo or a paid plan. There's nothing sensitive in this code.

---

## Phase 5 — Connect Cloudflare Pages + your custom domain (15 min + DNS wait)

This is the only fully-manual phase. It's two short trips through the Cloudflare dashboard plus one tweak at Squarespace.

### 5a. Sign up for Cloudflare (3 min)

- Go to https://dash.cloudflare.com/sign-up
- Use the same email as your GitHub
- Verify the email
- Skip any "add a site" prompt — we'll do that from Pages.

### 5b. Connect the GitHub repo to Cloudflare Pages (5 min)

1. In the Cloudflare dashboard → left sidebar **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**.
2. Click **Connect GitHub**, authorize Cloudflare, select your `bpleone-site` repo.
3. Click **Begin setup**. Settings:
   - **Project name:** `bpleone` (this gives you a free `bpleone.pages.dev` URL too)
   - **Production branch:** `main`
   - **Framework preset:** *None*
   - **Build command:** *leave empty*
   - **Build output directory:** `/` (just a slash)
4. Click **Save and Deploy**.

After ~30 seconds the site is live at `bpleone.pages.dev`. Click the link to verify it looks right.

> 🎉 **From now on, every push to GitHub auto-deploys.** That's the automation: you edit a file on GitHub.com (or via github.dev), commit, and ~20 seconds later the live site updates. No FTP, no manual deploys.

### 5c. Add bpleone.com to Cloudflare (5 min)

1. Cloudflare dashboard → **Websites** (left sidebar) → **+ Add a site**.
2. Enter `bpleone.com` → continue.
3. Choose the **Free** plan → continue.
4. Cloudflare will scan existing DNS records — just continue.
5. Cloudflare will give you **two nameservers** like `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`. **Copy them.**

### 5d. Point Squarespace at Cloudflare's nameservers (3 min + propagation)

1. https://account.squarespace.com → **Domains** → click `bpleone.com`.
2. Find **Nameservers** (or "Advanced" → "Custom nameservers"). Switch from "Squarespace nameservers" to **Custom / external nameservers**.
3. Paste the two Cloudflare nameservers. Save.

> ⚠️ DNS propagation takes 5 minutes to 24 hours (usually under an hour). Cloudflare will email you when it sees the change. In the meantime your site is "between addresses" — that's normal.

### 5e. Attach bpleone.com to your Pages project (2 min)

1. Cloudflare → **Workers & Pages** → click your `bpleone` project.
2. **Custom domains** tab → **Set up a custom domain**.
3. Enter `bpleone.com` → **Continue** → **Activate domain**.
4. Repeat for `www.bpleone.com` (the `_redirects` file in the repo will 301 www → root automatically).

Wait until both show **Active** in the dashboard (a few minutes).

---

## Phase 6 — Verify it's live (30 sec)

Double-click **`wizard/4-verify-live.bat`**.

It checks DNS resolution, HTTPS reachability, and that every page on bpleone.com returns 200. If anything fails it tells you which URL and most often the cause is "DNS still propagating" — wait 30 minutes and re-run.

When all checks pass: 🎉 you're done. Visit https://bpleone.com from any device.

---

## Phase 7 — Set up Substack (5 min)

Now that the site is live, give it a newsletter:

1. Go to https://substack.com → sign up.
2. Pick a publication name (e.g., "Brandon Leon's Notes").
3. Pick a subdomain → becomes `YOURHANDLE.substack.com`. **Write it down.**
4. In your `bpleone-site` files, find every `YOURNAME.substack.com` and replace with `YOURHANDLE.substack.com`. Same for the bare `YOURNAME`.
5. Commit on GitHub (push or use github.dev). Cloudflare auto-deploys in ~20 seconds.

---

## Editing later (from any device)

You have three good options:

### Option A — Edit on GitHub.com (any browser, any device)
Go to your repo → click any file → click the **pencil icon** → edit → **Commit changes**. Site updates in ~20 seconds.

### Option B — Edit in github.dev (full editor in any browser)
Open your repo and press the **`.`** (period) key on your keyboard. A full VS Code editor loads in your browser. Edit, save (Ctrl/Cmd-S), then click the source-control icon → write a commit message → commit & push.

### Option C — Edit locally with VS Code
Install [VS Code](https://code.visualstudio.com/) and [GitHub Desktop](https://desktop.github.com/). Clone the repo with GitHub Desktop, edit in VS Code, commit & push from GitHub Desktop.

---

## Adding a new writing post

1. Publish on Substack as usual.
2. Copy the post URL.
3. In `writing.html`, find the `<ol class="writing-index">` block and add a new `<li>` at the top:

```html
<li id="post-3">
  <a class="post" href="https://YOURNAME.substack.com/p/your-slug">
    <time datetime="2026-05-01">May 1, 2026</time>
    <h2>Your post title</h2>
    <p>One-sentence summary that makes someone want to click.</p>
  </a>
</li>
```

4. Optionally add the same in `index.html` under "Recent writing" (and remove the oldest one to keep the home page tidy).
5. Commit. Done.

---

## Adding a new project

In `projects.html`, copy any existing `<article class="project-card">` block and edit the title, meta line, and description. Add a link to wherever the artifact lives (Substack, Google Sheets, GitHub repo, PDF in the repo, etc.).

---

## Troubleshooting

**"DNS_PROBE_FINISHED_NXDOMAIN" after Phase 5d.**
DNS propagation. Wait 1–24 hours. Use https://dnschecker.org/#NS/bpleone.com to watch it propagate globally.

**Cloudflare Pages deployment fails.**
Check the build log in Pages dashboard. Most common cause: build output directory is wrong. Re-edit settings → set to `/` → re-deploy.

**The Substack embed shows "Subscribe to YOURNAME".**
You forgot to replace `YOURNAME` with your actual Substack handle. Search the repo for `YOURNAME` and re-commit.

**I want a custom email like brandon@bpleone.com.**
Cloudflare Email Routing is free. In the Cloudflare dashboard → bpleone.com → **Email** → enable. Forward `brandon@bpleone.com` (and any other address) to your gmail. Receiving only — sending requires a paid email service like Fastmail or Google Workspace.

**I want analytics.**
Cloudflare's built