#!/usr/bin/env node
// Generate sitemap.xml + feed.xml from the page/article HTML so neither drifts
// stale when you publish. Run via `npm run feeds`, the pre-commit hook, or CI.
//
//   sitemap.xml — every deployed root .html (minus 404), priority/changefreq by type.
//   feed.xml    — pages with <meta property="og:type" content="article"> that have a
//                 real (filename or visible) date, newest first, capped at FEED_MAX.
//
// Adding a new article = just publish the .html with an og:type=article tag and a
// date in the filename (YYYY-MM-DD) or a visible "Month DD, YYYY". No manual edits.

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://bpleon.com';
const FEED_MAX = 25;

// Evergreen pages: explicit [priority, changefreq]. Anything unlisted gets a
// default based on whether it's a dated article or a tool/page.
const CORE = {
  'index.html':        ['1.0', 'weekly'],
  'writing.html':      ['0.9', 'weekly'],
  'toolkit.html':      ['0.9', 'monthly'],
  'reports.html':      ['0.9', 'monthly'],
  'research.html':     ['0.9', 'monthly'],
  'projects.html':     ['0.8', 'monthly'],
  'about.html':        ['0.8', 'monthly'],
  'markets.html':      ['0.7', 'daily'],
  'dcf-template.html': ['0.9', 'monthly'],
  'dcf.html':          ['0.7', 'yearly'],
  'reading-list.html': ['0.6', 'monthly'],
  'now.html':          ['0.6', 'weekly'],
  'contact.html':      ['0.5', 'yearly'],
  'disclaimer.html':   ['0.2', 'yearly'],
};
const EXCLUDE = new Set(['404.html']);
// og:type=article pages that are standing analysis, not dated newsletter posts —
// keep them in the sitemap but out of the RSS feed.
const FEED_DENY = new Set(['mu-through-cycle.html', 'mu-reverse-lbo.html', 'wdc-take-private.html']);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON3   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const ENT = {
  '&mdash;':'—','&ndash;':'–','&middot;':'·','&rsquo;':'’',
  '&lsquo;':'‘','&ldquo;':'“','&rdquo;':'”','&hellip;':'…',
  '&rarr;':'→','&times;':'×','&nbsp;':' ','&amp;':'&','&quot;':'"',
  '&apos;':"'", '&lt;':'<','&gt;':'>',
};
function decodeEntities(s){
  if (!s) return '';
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_,h)=>String.fromCharCode(parseInt(h,16)))
       .replace(/&#(\d+);/g, (_,n)=>String.fromCharCode(+n));
  for (const k in ENT) s = s.split(k).join(ENT[k]);
  return s.replace(/\s+/g, ' ').trim();
}
const xmlEscape = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const first = (re, txt) => { const m = re.exec(txt); return m ? m[1] : ''; };
// Extract an attribute value where the delimiter is captured as group 1 and the
// content as group 2, matched via backreference. Critical so an apostrophe
// inside a double-quoted content="...didn't..." doesn't truncate the value.
const attrContent = (re, txt) => { const m = re.exec(txt); return m ? m[2] : ''; };

function readMeta(file, txt){
  let title = decodeEntities(first(/<title>([\s\S]*?)<\/title>/i, txt))
                .replace(/\s*[·—|–-]\s*Brandon Leon\s*$/i, '').trim();
  const desc = decodeEntities(
    attrContent(/<meta\s+property=["']og:description["']\s+content=(["'])([\s\S]*?)\1/i, txt) ||
    attrContent(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i, txt)
  );
  const ogType = (first(/<meta\s+property=["']og:type["']\s+content=["']([^"']*)["']/i, txt) || '').toLowerCase();

  // Date: filename YYYY-MM-DD -> first visible "Month DD, YYYY" -> file mtime.
  let iso = '', src = '';
  const fn = file.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (fn) { iso = `${fn[1]}-${fn[2]}-${fn[3]}`; src = 'filename'; }
  if (!iso) {
    const vm = txt.match(new RegExp('(' + MONTHS.join('|') + ')\\s+(\\d{1,2}),\\s+(20\\d{2})'));
    if (vm) { iso = `${vm[3]}-${String(MONTHS.indexOf(vm[1])+1).padStart(2,'0')}-${String(vm[2]).padStart(2,'0')}`; src = 'visible'; }
  }
  if (!iso) { iso = fs.statSync(path.join(ROOT, file)).mtime.toISOString().slice(0,10); src = 'mtime'; }

  return { file, title, desc, ogType, iso, dateSrc: src, isArticle: ogType === 'article' };
}

function rfc822(iso){
  const [y,m,d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m-1, d, 16, 0, 0));   // 16:00Z == 09:00 -0700, deterministic
  return `${DOW[dt.getUTCDay()]}, ${String(d).padStart(2,'0')} ${MON3[m-1]} ${y} 09:00:00 -0700`;
}

function main(){
  const recs = fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !EXCLUDE.has(f))
    .map(f => readMeta(f, fs.readFileSync(path.join(ROOT, f), 'utf8')));

  const prio = r => parseFloat((CORE[r.file] && CORE[r.file][0]) || (r.isArticle ? '0.8' : '0.7'));

  // ---- sitemap.xml ----
  const urlBlock = r => {
    const [p, cf] = CORE[r.file] || [r.isArticle ? '0.8' : '0.7', r.isArticle ? 'never' : 'monthly'];
    // Emit <lastmod> only when we actually know the date (filename/visible),
    // never from mtime — mtime varies per checkout and would churn the file.
    const lastmod = r.dateSrc !== 'mtime' ? `\n    <lastmod>${r.iso}</lastmod>` : '';
    const loc = r.file === 'index.html' ? `${SITE}/` : `${SITE}/${r.file}`;
    return `  <url>\n    <loc>${loc}</loc>${lastmod}` +
           `\n    <changefreq>${cf}</changefreq>\n    <priority>${p}</priority>\n  </url>`;
  };
  const sorted = recs.slice().sort((a,b) =>
    (a.file === 'index.html' ? -1 : 0) - (b.file === 'index.html' ? -1 : 0) ||
    prio(b) - prio(a) || a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
      sorted.map(urlBlock).join('\n')}\n</urlset>\n`);

  // ---- feed.xml ----
  const articles = recs
    .filter(r => r.isArticle && r.dateSrc !== 'mtime' && !FEED_DENY.has(r.file))
    .sort((a,b) => b.iso.localeCompare(a.iso) || a.file.localeCompare(b.file))
    .slice(0, FEED_MAX);
  const items = articles.map(r => {
    const loc = `${SITE}/${r.file}`;
    return `    <item>\n      <title>${xmlEscape(r.title)}</title>\n      <link>${loc}</link>\n` +
           `      <guid isPermaLink="true">${loc}</guid>\n      <pubDate>${rfc822(r.iso)}</pubDate>\n` +
           `      <description>${xmlEscape(r.desc)}</description>\n    </item>`;
  });
  fs.writeFileSync(path.join(ROOT, 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n` +
    `    <title>Brandon Leon</title>\n    <link>${SITE}/</link>\n` +
    `    <description>Essays and research notes on public markets.</description>\n    <language>en-us</language>\n` +
    `    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />\n\n${items.join('\n\n')}\n\n  </channel>\n</rss>\n`);

  console.log(`sitemap.xml — ${recs.length} urls`);
  console.log(`feed.xml    — ${articles.length} items (newest: ${articles[0] ? articles[0].file + ' ' + articles[0].iso : 'none'})`);
}
main();
