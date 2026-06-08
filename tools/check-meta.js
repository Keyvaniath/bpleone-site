#!/usr/bin/env node
/*
 * Meta / HTML-validity integrity — WARN-ONLY tripwire.
 *
 * Sibling to check-links.js. Where that one fails the build on a dead link,
 * this one only *warns* (always exits 0) on a class of silent defects that
 * don't break rendering but quietly hurt SEO / sharing / accessibility:
 *
 *   1. canonical / og:url pointing at a DIFFERENT page (copy-paste — the exact
 *      bug found in toolkit.html's JSON-LD: a templated page carrying another
 *      page's URL)
 *   2. two pages claiming the SAME canonical / og:url
 *   3. duplicate <title> across pages
 *   4. duplicate id="" within one page (breaks getElementById / label-for / aria)
 *   5. <html> missing a lang attribute
 *   6. og:image pointing at a local file that doesn't exist
 *
 * WARN-ONLY on purpose: each check has a rare legitimate exception (intentional
 * cross-canonicalisation, a deliberately shared title), so this must never block
 * a push — it surfaces the likely-mistake as a GitHub ::warning for a human to
 * judge. The repo is clean on all six today, so this emits nothing until a
 * future regression trips it. Internal-only (no network).
 *
 * Run:  node tools/check-meta.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', 'node_modules', '.github', 'exports', 'drafts', '.cache', 'dist']);

const FILES = new Set();
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name));
    } else {
      FILES.add(path.relative(ROOT, path.join(dir, ent.name)).split(path.sep).join('/'));
    }
  }
})(ROOT);

const htmlFiles = [...FILES].filter((f) => f.endsWith('.html')).sort();

function attr(html, re) { const m = html.match(re); return m ? m[1].trim() : null; }
const canonicalOf = (h) => attr(h, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
                        || attr(h, /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
const metaProp = (h, p) => attr(h, new RegExp('<meta[^>]+property=["\']' + p + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'));
const titleOf = (h) => attr(h, /<title[^>]*>([^<]*)<\/title>/i);

// expected self-URLs for a page (clean-URL + .html + index special-case)
function selfUrls(f) {
  if (f === 'index.html') return ['https://bpleon.com/', 'https://bpleon.com'];
  const stem = f.slice(0, -5);
  return ['https://bpleon.com/' + stem, 'https://bpleon.com/' + f];
}
const norm = (u) => u.replace(/\/$/, '');

const warnings = [];
const warn = (file, msg) => warnings.push({ file, msg });

const canonMap = new Map(), ogurlMap = new Map(), titleMap = new Map();

for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');

  const canon = canonicalOf(html);
  const ogurl = metaProp(html, 'og:url');
  const title = titleOf(html);
  const expected = selfUrls(f).map(norm);

  // (1) self-URL mismatch
  for (const [label, val] of [['canonical', canon], ['og:url', ogurl]]) {
    if (val && !expected.includes(norm(val))) {
      warn(f, `${label} points elsewhere: ${val} (expected ${selfUrls(f)[0]})`);
    }
  }
  // collect for (2)/(3)
  if (canon) (canonMap.get(canon) || canonMap.set(canon, []).get(canon)).push(f);
  if (ogurl) (ogurlMap.get(ogurl) || ogurlMap.set(ogurl, []).get(ogurl)).push(f);
  if (title) (titleMap.get(title) || titleMap.set(title, []).get(title)).push(f);

  // (4) duplicate id within the page
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const seen = new Set(), dups = new Set();
  for (const id of ids) { if (seen.has(id)) dups.add(id); seen.add(id); }
  if (dups.size) warn(f, `duplicate id(s): ${[...dups].join(', ')}`);

  // (5) <html> missing lang
  const htmlTag = html.match(/<html\b([^>]*)>/i);
  if (!htmlTag || !/\blang\s*=/i.test(htmlTag[1])) warn(f, '<html> missing lang attribute');

  // (6) og:image local file missing
  const ogimg = metaProp(html, 'og:image');
  if (ogimg) {
    const rel = ogimg.replace(/^https?:\/\/[^/]+\//, '').split(/[?#]/)[0].replace(/^\//, '');
    if (rel && !/^https?:/i.test(ogimg.replace('https://bpleon.com/', '')) && !FILES.has(rel)) {
      warn(f, `og:image missing file: ${ogimg}`);
    }
  }
}

// (2) duplicate canonical / og:url ; (3) duplicate title
for (const [label, map] of [['canonical', canonMap], ['og:url', ogurlMap], ['<title>', titleMap]]) {
  for (const [val, fs2] of map) {
    if (fs2.length > 1) warn(fs2[0], `${label} "${val}" shared by ${fs2.length} pages: ${fs2.join(', ')}`);
  }
}

console.log(`Meta/validity tripwire: scanned ${htmlFiles.length} pages.`);
if (!warnings.length) {
  console.log('Clean — no meta/validity warnings. ✓');
  process.exit(0);
}
console.log(`${warnings.length} warning(s):`);
for (const w of warnings) console.log(`::warning file=${w.file}::${w.msg}`);
process.exit(0); // WARN-ONLY: never block the build
