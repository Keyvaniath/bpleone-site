#!/usr/bin/env node
// Walk the repo and emit assets/site-index.json — a flat list of every
// deployed file, used by the admin "Site" tab to surface everything you
// can grab from one place.
//
// Usage:  node tools/build-site-index.js
//
// Excludes git/CI/internal paths and gitignored drafts/. Categorises by
// path/extension so the admin can render filterable groups.

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'assets', 'site-index.json');

// Hard exclusions (never show in admin)
const EXCLUDE_DIRS = new Set([
  '.git', '.github', 'node_modules', 'drafts', 'tools', '.cache', 'dist'
]);
const EXCLUDE_FILES = new Set([
  // Local-only docs / state. The git check-ignore pass in main() is the real
  // safety net for .gitignore; this static list is the fallback for build
  // environments where git may not be on PATH.
  'HANDOFF.md', 'HANDOFF-v3.md', 'HANDOFF-pe-section-v1.md', 'README.md',
  'SUBSCRIBER_IMPORT.md', 'worker-source.js', '.test-write', '.gitignore',
  // Local-only research docs (also gitignored) — must never appear publicly.
  'MU-VERIFIED-DATA-REFERENCE.md', 'DELL-RESEARCH-HANDOFF.md'
]);
const EXCLUDE_SUFFIX = ['.broken', '.broken2', '.head', '.tail', '.tmp', '.swp', '.DS_Store'];

// Dated / variant private docs the static set can't enumerate by name
// (e.g. SESSION-HANDOFF-2026-06-01.md, a future MU-VERIFIED-* spin-off).
function isPrivateDoc(name) {
  return /^SESSION-HANDOFF-/i.test(name) ||
         /-HANDOFF(\b|[-.])/i.test(name) ||
         /^MU-VERIFIED-DATA/i.test(name);
}

function shouldExclude(rel, name) {
  if (EXCLUDE_FILES.has(name)) return true;
  if (isPrivateDoc(name)) return true;
  if (name.startsWith('.')) return true; // dotfiles like .gitkeep, .vscode, etc
  for (const suf of EXCLUDE_SUFFIX) if (name.endsWith(suf)) return true;
  // Exclude site-index/manifest themselves from listing? No — leave them in.
  return false;
}

function categorise(rel, name) {
  const lower = name.toLowerCase();
  const ext = path.extname(lower);
  if (rel.startsWith('admin/'))               return 'admin';
  if (rel.startsWith('assets/reports/'))      return 'reports';
  if (rel.startsWith('assets/toolkit/'))      return 'toolkit';
  if (rel.startsWith('assets/brand/'))        return 'brand';
  if (rel.startsWith('assets/'))              return 'assets';
  if (ext === '.html')                        return 'pages';
  if (['.css','.js','.json'].includes(ext))   return 'site-code';
  if (['.xml','.txt'].includes(ext))          return 'site-meta';
  return 'other';
}

function fmtSizeRough(bytes) {
  if (!isFinite(bytes)) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(2) + ' MB';
}

function walk(dir, rel) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      out.push(...walk(path.join(dir, entry.name), rel ? rel + '/' + entry.name : entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    const relPath = rel ? rel + '/' + entry.name : entry.name;
    if (shouldExclude(relPath, entry.name)) continue;
    const stat = fs.statSync(path.join(dir, entry.name));
    out.push({
      path: relPath,
      name: entry.name,
      size: stat.size,
      sizeText: fmtSizeRough(stat.size),
      modified: stat.mtime.toISOString().slice(0, 10),  // date-only to avoid per-second CI churn
      ext: path.extname(entry.name).toLowerCase(),
      category: categorise(relPath, entry.name)
    });
  }
  return out;
}

// Drop anything git actually ignores (worker-source.js, drafts/, the local
// research truth tables/handoffs, etc.) so the public site-index never reveals
// a private file's name or size. Degrades gracefully if git isn't on PATH.
function filterGitIgnored(files) {
  if (!files.length) return files;
  let ignoredOut = '';
  try {
    ignoredOut = execFileSync('git', ['-C', ROOT, 'check-ignore', '--stdin'],
      { input: files.map(f => f.path).join('\n'), encoding: 'utf8' });
  } catch (e) {
    if (e && e.status === 1) {
      ignoredOut = (e.stdout || '');            // exit 1 = nothing ignored (not an error)
    } else {
      console.warn('  [warn] git check-ignore unavailable — relying on static excludes');
      return files;
    }
  }
  const ignored = new Set(ignoredOut.split(/\r?\n/).map(s => s.trim()).filter(Boolean));
  return ignored.size ? files.filter(f => !ignored.has(f.path)) : files;
}

function main() {
  const files = filterGitIgnored(walk(ROOT, '')).sort((a,b) =>
    a.category.localeCompare(b.category) || a.path.localeCompare(b.path)
  );
  const counts = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1; return acc;
  }, {});
  const totalBytes = files.reduce((n, f) => n + f.size, 0);

  const out = {
    _comment: 'Auto-generated by tools/build-site-index.js. Run after adding/removing site files.',
    version: 1,
    generated: new Date().toISOString().slice(0, 10),  // date-only
    fileCount: files.length,
    totalBytes,
    countsByCategory: counts,
    files
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${path.relative(ROOT, OUT)} — ${files.length} files, ${fmtSizeRough(totalBytes)} total`);
  console.log('  by category:', counts);
}

main();
