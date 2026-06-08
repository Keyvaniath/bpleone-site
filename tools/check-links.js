#!/usr/bin/env node
/*
 * Internal-link integrity guard.
 *
 * Walks every .html file and resolves each href/src that points inside the
 * site. Fails (exit 1) if any internal link or asset reference does not map to
 * a real file. Companion to the HTML-truncation guard in manifests.yml: that
 * one catches a broken PAGE, this one catches a broken LINK BETWEEN pages —
 * the regression you get when a calculator is renamed/removed and a stale href
 * is left behind, or a chart PNG is moved.
 *
 * Deliberately INTERNAL-ONLY: external URLs (http/https/mailto/tel) are skipped
 * so the check never depends on the network — no flaky failures the way an
 * external link-checker would have (cf. the calc-smoke Google-Fonts incident).
 *
 * Case-SENSITIVE by construction (membership in a Set of real filenames, not
 * fs.existsSync), so it reproduces Cloudflare's Linux behaviour even when run
 * on a case-insensitive Windows/macOS dev box — catching "works locally, 404s
 * in production" case mismatches.
 *
 * Honours the .html -> clean-URL convention (href="dcf" and href="dcf.html"
 * both resolve to dcf.html), anchors (#frag) and query strings (?v=49).
 *
 * Run:  node tools/check-links.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
// Mirror the non-deployed exclusions in build-site-index.js: drafts/ (gitignored
// working files), build/CI dirs. Only DEPLOYED pages should gate the build.
const SKIP_DIRS = new Set(['.git', 'node_modules', '.github', 'exports', 'drafts', '.cache', 'dist']);

// --- collect every real file path (POSIX-style, exact case) ---
const FILES = new Set();
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name));
    } else {
      const rel = path.relative(ROOT, path.join(dir, ent.name)).split(path.sep).join('/');
      FILES.add(rel);
    }
  }
})(ROOT);

// clean-URL map: a request for "dcf" should satisfy "dcf.html"
const CLEAN = new Set();
for (const f of FILES) if (f.endsWith('.html')) CLEAN.add(f.slice(0, -5));

const htmlFiles = [...FILES].filter((f) => f.endsWith('.html')).sort();

function exists(rel) {
  if (rel === '' || rel === '.') rel = 'index.html';
  if (FILES.has(rel)) return true;        // exact file (asset or .html)
  if (CLEAN.has(rel)) return true;        // clean-URL -> .html
  if (FILES.has(rel + '.html')) return true;
  if (rel.endsWith('/') && FILES.has(rel + 'index.html')) return true;
  return false;
}

const HREF = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const EXTERNAL = /^(https?:|mailto:|tel:|data:|javascript:|\/\/|#)/i;

const broken = [];
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  let m;
  while ((m = HREF.exec(html)) !== null) {
    const raw = m[1].trim();
    if (raw === '' || EXTERNAL.test(raw)) continue;
    const clean = raw.split('#')[0].split('?')[0];
    if (clean === '') continue; // pure anchor/query on same page
    // resolve relative to the source file's directory
    const srcDir = path.posix.dirname(f);
    const rel = path.posix.normalize(path.posix.join(srcDir, clean)).replace(/^\.\//, '');
    if (exists(rel) || exists(clean.replace(/^\//, ''))) continue;
    const line = html.slice(0, m.index).split('\n').length;
    broken.push({ file: f, line, target: raw });
  }
}

console.log(`Checked ${htmlFiles.length} HTML files for internal-link integrity.`);
if (broken.length === 0) {
  console.log('All internal links and asset references resolve. ✓');
  process.exit(0);
}
console.error(`\n${broken.length} BROKEN internal link(s):`);
for (const b of broken) {
  console.error(`::error file=${b.file},line=${b.line}::broken internal link -> ${b.target}`);
}
process.exit(1);
