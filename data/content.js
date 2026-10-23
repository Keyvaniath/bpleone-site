/* data/content.js — renders bpleon.com from data/content.json. Vanilla JS, no build step.
 *
 * Mount points: any element with data-bp="<view>" is filled on DOMContentLoaded.
 *   latest        newest article as a large card + the next N as a list   (data-n="4")
 *   archive       every article, month-grouped, with chips + search; reads ?type= ?sector= ?ticker= ?q=
 *   on-deck       items with status "upcoming" only — anything published drops out automatically
 *   coverage      the public coverage table; live prices from the quotes Worker
 *   history       rating / target history tables, one per covered ticker (data-ticker="MU" for one)
 *   toolkit       calculators + templates in one grid, free vs gated labelled
 *   lead-pick     the newest coverage call, read from the latest note so it cannot contradict it
 *   related       articles sharing a ticker or sector with the current page (data-slug="...")
 *   prev-next     previous / next article by date (data-slug="...")
 *
 * Add an article: one entry in data/content.json. Nothing here needs editing.
 */
(function () {
  'use strict';

  var me = document.currentScript;
  var ROOT = (me && me.getAttribute('data-root')) || '.';
  var WORKER = 'https://bpleon-quotes.brandonpleone.workers.dev/';
  var NEW_DAYS = 30;
  var cache = null;

  function load() {
    if (cache) return Promise.resolve(cache);
    return fetch(ROOT + '/data/content.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('content.json ' + r.status); return r.json(); })
      .then(function (d) { cache = d; return d; });
  }

  // ---- helpers --------------------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function parts(iso) { var p = iso.split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function fmtDate(iso) { if (!iso) return ''; var p = parts(iso); return MONTHS[p.m - 1].slice(0, 3) + ' ' + p.d + ', ' + p.y; }
  function monthLabel(iso) { var p = parts(iso); return MONTHS[p.m - 1] + ' ' + p.y; }
  function daysAgo(iso) {
    var p = parts(iso), then = Date.UTC(p.y, p.m - 1, p.d), now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - then) / 86400000);
  }
  function rel(iso) {
    var n = daysAgo(iso);
    if (n <= 0) return 'today';
    if (n === 1) return 'yesterday';
    if (n < 14) return n + ' days ago';
    if (n < 60) return Math.round(n / 7) + ' weeks ago';
    if (n < 365) return Math.round(n / 30) + ' months ago';
    return fmtDate(iso);
  }
  function isNew(iso) { return iso && daysAgo(iso) < NEW_DAYS; }
  function href(item) { return item.url ? ROOT + '/' + item.url : '#'; }
  function money(n) { return n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function pct(n, digits) { return (n > 0 ? '+' : '') + n.toFixed(digits == null ? 1 : digits) + '%'; }
  function qs() {
    var o = {}; location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return; var p = kv.split('='); o[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    }); return o;
  }
  // old pages fold into the archive as filtered views; these aliases keep those links meaningful
  var TYPE_ALIAS = { report: 'Initiation', reports: 'Initiation', pitch: 'Initiation', initiation: 'Initiation',
    update: 'Coverage update', updates: 'Coverage update', weekly: 'Weekly outlook', weeklies: 'Weekly outlook',
    essay: 'Essay', essays: 'Essay', sector: 'Sector note', tool: 'Tool', tools: 'Tool', template: 'Template', templates: 'Template' };
  function normType(t) { if (!t) return ''; return TYPE_ALIAS[t.toLowerCase()] || t; }

  function published(d) { return d.items.filter(function (i) { return i.status === 'published' && i.date; }); }
  function articles(d) { return published(d).filter(function (i) { return i.type !== 'Tool' && i.type !== 'Template'; })
    .sort(function (a, b) { return b.date < a.date ? -1 : b.date > a.date ? 1 : 0; }); }
  function bySlug(d, slug) { for (var i = 0; i < d.items.length; i++) if (d.items[i].slug === slug) return d.items[i]; return null; }

  // ---- atoms ----------------------------------------------------------------
  function typeTag(t) { return '<span class="writing-tag">' + esc(t) + '</span>'; }
  function tickerChips(ts) {
    return (ts || []).map(function (t) {
      return '<a class="chip chip-ticker" href="' + ROOT + '/writing.html?ticker=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
    }).join('');
  }
  function ratingBadge(r) {
    if (!r) return '';
    var k = r.toLowerCase().replace(/[^a-z]+/g, '-');
    return '<span class="badge badge-' + k + '">' + esc(r) + '</span>';
  }
  function newBadge(iso) { return isNew(iso) ? '<span class="badge badge-new">New</span>' : ''; }
  function meta(item) {
    var bits = ['<time datetime="' + esc(item.date) + '" title="' + fmtDate(item.date) + '">' + rel(item.date) + '</time>'];
    if (item.readMin) bits.push(item.readMin + ' min read');
    return '<span class="card-meta">' + bits.join(' · ') + '</span>';
  }
  function card(item, large) {
    return '<article class="card ' + (large ? 'card-large' : 'card-row') + '">' +
      '<div class="card-tags">' + typeTag(item.type) + newBadge(item.date) + ratingBadge(item.rating) + '</div>' +
      '<h3 class="card-title"><a href="' + href(item) + '">' + esc(item.title) + '</a></h3>' +
      (large && item.summary ? '<p class="card-summary">' + esc(item.summary) + '</p>' : '') +
      '<div class="card-foot">' + meta(item) + '<span class="card-chips">' + tickerChips(item.tickers) + '</span></div>' +
    '</article>';
  }

  // ---- views ----------------------------------------------------------------
  function renderLatest(el, d) {
    var n = +(el.getAttribute('data-n') || 4), list = articles(d);
    if (!list.length) { el.innerHTML = ''; return; }
    el.innerHTML = card(list[0], true) + '<div class="card-list">' + list.slice(1, 1 + n).map(function (i) { return card(i, false); }).join('') + '</div>';
  }

  function renderOnDeck(el, d) {
    var up = d.items.filter(function (i) { return i.status === 'upcoming'; });
    if (!up.length) { el.closest('section') && el.closest('section').setAttribute('hidden', ''); return; }
    el.innerHTML = '<ul class="ondeck">' + up.map(function (i) {
      return '<li>' + typeTag(i.type) + ' <strong>' + esc(i.title) + '</strong>' +
        (i.summary ? ' <span class="muted">— ' + esc(i.summary) + '</span>' : '') +
        (i.date ? ' <span class="muted">(' + fmtDate(i.date) + ')</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function renderArchive(el, d) {
    var q = qs(), state = { type: normType(q.type || ''), sector: q.sector || '', ticker: (q.ticker || '').toUpperCase(), q: q.q || '' };
    var all = published(d).sort(function (a, b) { return b.date < a.date ? -1 : 1; });
    var types = [], sectors = [], tickers = {};
    all.forEach(function (i) {
      if (types.indexOf(i.type) < 0) types.push(i.type);
      (i.sectors || []).forEach(function (s) { if (sectors.indexOf(s) < 0) sectors.push(s); });
      (i.tickers || []).forEach(function (t) { tickers[t] = (tickers[t] || 0) + 1; });
    });
    var topTickers = Object.keys(tickers).sort(function (a, b) { return tickers[b] - tickers[a]; }).slice(0, 10);

    function chipBar(name, values, current) {
      return '<div class="chip-bar" data-filter="' + name + '">' +
        '<button class="chip' + (current ? '' : ' is-on') + '" data-v="">All</button>' +
        values.map(function (v) { return '<button class="chip' + (v === current ? ' is-on' : '') + '" data-v="' + esc(v) + '">' + esc(v) + '</button>'; }).join('') +
      '</div>';
    }
    function matches(i) {
      if (state.type && i.type !== state.type) return false;
      if (state.sector && (i.sectors || []).indexOf(state.sector) < 0) return false;
      if (state.ticker && (i.tickers || []).indexOf(state.ticker) < 0) return false;
      if (state.q) {
        var hay = (i.title + ' ' + (i.summary || '') + ' ' + (i.tickers || []).join(' ')).toLowerCase();
        if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
      }
      return true;
    }
    function listHtml() {
      var rows = all.filter(matches), out = '', month = '';
      if (!rows.length) return '<p class="muted">Nothing matches. Clear a filter.</p>';
      rows.forEach(function (i) {
        var m = monthLabel(i.date);
        if (m !== month) { month = m; out += '<h2 class="writing-section-head">' + esc(m) + '</h2>'; }
        out += '<article class="arch-row">' +
          '<div class="arch-date"><time datetime="' + esc(i.date) + '">' + fmtDate(i.date) + '</time></div>' +
          '<div class="arch-body">' +
            '<div class="card-tags">' + typeTag(i.type) + newBadge(i.date) + ratingBadge(i.rating) + '</div>' +
            '<h3 class="card-title"><a href="' + href(i) + '">' + esc(i.title) + '</a></h3>' +
            (i.summary ? '<p class="card-summary">' + esc(i.summary) + '</p>' : '') +
            '<div class="card-foot"><span class="card-chips">' + tickerChips(i.tickers) + '</span>' +
              (i.readMin ? '<span class="card-meta">' + i.readMin + ' min read</span>' : '') +
              (i.access === 'gated' ? '<span class="badge badge-gated">Gated</span>' : '') + '</div>' +
          '</div></article>';
      });
      return out + '<p class="muted small arch-count">' + rows.length + ' of ' + all.length + '</p>';
    }
    function sync() {
      var p = [];
      if (state.type) p.push('type=' + encodeURIComponent(state.type));
      if (state.sector) p.push('sector=' + encodeURIComponent(state.sector));
      if (state.ticker) p.push('ticker=' + encodeURIComponent(state.ticker));
      if (state.q) p.push('q=' + encodeURIComponent(state.q));
      history.replaceState(null, '', location.pathname + (p.length ? '?' + p.join('&') : ''));
      el.querySelector('.arch-list').innerHTML = listHtml();
      el.querySelectorAll('.chip-bar').forEach(function (bar) {
        var name = bar.getAttribute('data-filter');
        bar.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-on', (c.getAttribute('data-v') || '') === (state[name] || '')); });
      });
    }
    el.innerHTML =
      '<div class="arch-controls">' +
        '<label class="arch-search"><span class="sr-only">Search</span><input type="search" placeholder="Search titles, summaries, tickers" value="' + esc(state.q) + '" /></label>' +
        chipBar('type', types, state.type) + chipBar('sector', sectors, state.sector) + chipBar('ticker', topTickers, state.ticker) +
      '</div><div class="arch-list"></div>';
    el.addEventListener('click', function (e) {
      var c = e.target.closest('.chip-bar .chip'); if (!c) return;
      var name = c.closest('.chip-bar').getAttribute('data-filter');
      state[name] = c.getAttribute('data-v') || ''; sync();
    });
    var t; el.querySelector('input[type=search]').addEventListener('input', function (e) {
      clearTimeout(t); t = setTimeout(function () { state.q = e.target.value.trim(); sync(); }, 120);
    });
    sync();
  }

  function renderCoverage(el, d) {
    var cov = d.coverage || [];
    el.innerHTML = '<div class="table-wrap"><table class="pitch-table cov">' +
      '<thead><tr><th>Ticker</th><th>Company</th><th>Rating</th><th>Target</th><th>Price</th><th>To target</th><th>Updated</th><th>Latest note</th></tr></thead><tbody>' +
      cov.map(function (c) {
        return '<tr data-sym="' + esc(c.ticker) + '">' +
          '<th scope="row"><a href="' + ROOT + '/writing.html?ticker=' + esc(c.ticker) + '">' + esc(c.ticker) + '</a></th>' +
          '<td>' + esc(c.company) + '</td><td>' + ratingBadge(c.rating) + '</td>' +
          '<td class="num">' + money(c.target) + '</td><td class="num live-px">…</td><td class="num live-tt">…</td>' +
          '<td><time datetime="' + esc(c.updated) + '">' + fmtDate(c.updated) + '</time></td>' +
          '<td><a href="' + ROOT + '/' + esc(c.latestSlug) + '.html">' + esc(c.latestTitle) + '</a></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted small">Prices are live (15-minute delayed) and change; ratings and targets change only when a note publishes. Not investment advice &mdash; <a href="' + ROOT + '/disclaimer.html">disclaimer</a>.</p>';
    var syms = cov.map(function (c) { return c.ticker; });
    if (!syms.length) return;
    fetch(WORKER + '?symbols=' + encodeURIComponent(syms.join(','))).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var list = (j && j.quoteResponse && j.quoteResponse.result) || [];
      list.forEach(function (qt) {
        var row = el.querySelector('tr[data-sym="' + qt.symbol + '"]'); if (!row) return;
        var px = qt.regularMarketPrice, chg = qt.regularMarketChangePercent, c = cov.filter(function (x) { return x.ticker === qt.symbol; })[0];
        if (px == null) return;
        row.querySelector('.live-px').innerHTML = money(px) + (chg != null ? ' <span class="chg ' + (chg >= 0 ? 'up' : 'down') + '">' + pct(chg, 2) + '</span>' : '');
        if (c && c.target) { var tt = (c.target / px - 1) * 100; row.querySelector('.live-tt').innerHTML = '<span class="' + (tt >= 0 ? 'up' : 'down') + '">' + pct(tt, 1) + '</span>'; }
        else row.querySelector('.live-tt').textContent = '—';
      });
      el.querySelectorAll('.live-px, .live-tt').forEach(function (td) { if (td.textContent === '…') td.textContent = '—'; });
    }).catch(function () { el.querySelectorAll('.live-px, .live-tt').forEach(function (td) { td.textContent = '—'; }); });
  }

  function renderHistory(el, d) {
    var only = el.getAttribute('data-ticker');
    el.innerHTML = (d.coverage || []).filter(function (c) { return !only || c.ticker === only; }).map(function (c) {
      return '<section class="pitch-section"><h2>' + esc(c.company) + ' <span class="muted">(' + esc(c.ticker) + ')</span></h2>' +
        '<table class="pitch-table"><thead><tr><th>Date</th><th>Rating</th><th>Target</th><th>Note</th></tr></thead><tbody>' +
        c.history.slice().reverse().map(function (h, i) {
          return '<tr' + (i === 0 ? ' class="row-pass"' : '') + '><td><time datetime="' + esc(h.date) + '">' + fmtDate(h.date) + '</time></td><td>' + ratingBadge(h.rating) + '</td>' +
            '<td class="num">' + money(h.target) + '</td><td><a href="' + ROOT + '/' + esc(h.slug) + '.html">' + esc(h.title) + '</a>' + (i === 0 ? '' : ' <span class="muted small">superseded</span>') + '</td></tr>';
        }).join('') + '</tbody></table></section>';
    }).join('');
  }

  function renderToolkit(el, d) {
    var tools = d.items.filter(function (i) { return i.status === 'published' && (i.type === 'Tool' || i.type === 'Template'); });
    var groups = [['Valuation calculators', function (i) { return i.type === 'Tool' && i.sectors[0] !== 'Buy-side/PE'; }],
                  ['Buy-side & reverse-LBO', function (i) { return i.type === 'Tool' && i.sectors[0] === 'Buy-side/PE'; }],
                  ['Templates & worked examples', function (i) { return i.type === 'Template'; }]];
    el.innerHTML = groups.map(function (g) {
      var items = tools.filter(g[1]); if (!items.length) return '';
      return '<h3 class="section-sub">' + esc(g[0]) + '</h3><div class="tool-grid">' + items.map(function (i) {
        return '<a class="tool-card" href="' + href(i) + '"><span class="tool-name">' + esc(i.title) + '</span>' +
          '<span class="badge ' + (i.access === 'gated' ? 'badge-gated' : 'badge-free') + '">' + (i.access === 'gated' ? 'Free preview' : 'Free') + '</span></a>';
      }).join('') + '</div>';
    }).join('');
  }

  function renderLeadPick(el, d) {
    var c = (d.coverage || [])[0]; if (!c) { el.innerHTML = ''; return; }
    var note = bySlug(d, c.latestSlug) || {};
    el.innerHTML = '<p class="lp-eyebrow">Latest call</p>' +
      '<h3 class="lp-name">' + esc(c.company) + ' <span class="lp-symbol">' + esc(c.ticker) + '</span></h3>' +
      '<p class="lp-pitch-row">' + ratingBadge(c.rating) + (c.target ? ' <strong>' + money(c.target) + '</strong> target' : '') +
      ' <span class="muted">· ' + rel(c.updated) + '</span></p>' +
      (note.summary ? '<p class="lp-thesis">' + esc(note.summary) + '</p>' : '') +
      '<a class="lp-link" href="' + ROOT + '/' + esc(c.latestSlug) + '.html">Read the note →</a>';
  }

  function renderRelated(el, d) {
    var cur = bySlug(d, el.getAttribute('data-slug')); if (!cur) { el.innerHTML = ''; return; }
    var pool = articles(d).filter(function (i) { return i.slug !== cur.slug; });
    var score = function (i) {
      var s = 0; (cur.tickers || []).forEach(function (t) { if ((i.tickers || []).indexOf(t) >= 0) s += 3; });
      (cur.sectors || []).forEach(function (t) { if ((i.sectors || []).indexOf(t) >= 0) s += 1; });
      return s;
    };
    var rel_ = pool.map(function (i) { return [score(i), i]; }).filter(function (p) { return p[0] > 0; })
      .sort(function (a, b) { return b[0] - a[0] || (b[1].date < a[1].date ? -1 : 1); }).slice(0, 4).map(function (p) { return p[1]; });
    if (!rel_.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<h2>Related research</h2><div class="card-list">' + rel_.map(function (i) { return card(i, false); }).join('') + '</div>';
  }

  function renderPrevNext(el, d) {
    var slug = el.getAttribute('data-slug'), list = articles(d), idx = -1;
    list.forEach(function (i, k) { if (i.slug === slug) idx = k; });
    if (idx < 0) { el.innerHTML = ''; return; }
    var newer = list[idx - 1], older = list[idx + 1];
    el.innerHTML = '<nav class="prev-next" aria-label="Adjacent research">' +
      (older ? '<a class="pn-prev" href="' + href(older) + '"><span class="muted small">Earlier</span><br />' + esc(older.title) + '</a>' : '<span></span>') +
      (newer ? '<a class="pn-next" href="' + href(newer) + '"><span class="muted small">Later</span><br />' + esc(newer.title) + '</a>' : '<span></span>') + '</nav>';
  }

  function renderHeadlines(el, d) {
    var c = (d.coverage || [])[0]; if (!c) { el.innerHTML = ''; return; }
    var sym = el.getAttribute('data-ticker') || c.ticker, name = c.company, fresh = +(el.getAttribute('data-max-days') || 7);
    fetch(WORKER + '?headlines=' + encodeURIComponent(sym) + '&n=8').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var items = ((j && j.items) || []).filter(function (i) { return i.pubDate && !isNaN(new Date(i.pubDate).getTime()); })
        .sort(function (a, b) { return new Date(b.pubDate) - new Date(a.pubDate); });
      var ageDays = items[0] ? (Date.now() - new Date(items[0].pubDate).getTime()) / 86400000 : Infinity;
      if (!items.length || ageDays > fresh) {
        el.innerHTML = '<h3>On the wire</h3><p class="muted small">No headlines on ' + esc(sym) + ' in the last ' + fresh + ' days. <a href="https://finance.yahoo.com/quote/' + esc(sym) + '/news/" rel="noopener">Yahoo Finance news →</a></p>';
        return;
      }
      el.innerHTML = '<h3>On the wire — ' + esc(name) + '</h3>' + items.slice(0, 5).map(function (i) {
        var iso = new Date(i.pubDate).toISOString().slice(0, 10);
        return '<a class="hl-row" href="' + esc(i.link) + '" target="_blank" rel="noopener"><span class="hl-title">' + esc(i.title) + '</span>' +
          '<span class="hl-meta">' + (i.source ? esc(i.source) + ' · ' : '') + rel(iso) + '</span></a>';
      }).join('');
    }).catch(function () { el.innerHTML = ''; });
  }

  // Table of contents built from the article's own H2s. Ids are assigned where missing so the
  // links work on older pages; renders nothing on pages with fewer than three sections.
  function renderToc(el) {
    var main = document.getElementById('main') || document.querySelector('main'); if (!main) { el.innerHTML = ''; return; }
    var hs = [].slice.call(main.querySelectorAll('h2')).filter(function (h) { return !h.closest('[data-bp]') && !h.closest('.site-footer') && h.textContent.trim(); });
    if (hs.length < 3) { el.innerHTML = ''; el.setAttribute('hidden', ''); return; }
    var seen = {};
    hs.forEach(function (h) {
      if (!h.id) {
        var base = h.textContent.trim().toLowerCase().replace(/^\d+[\.\)]\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
        var id = base, n = 2; while (seen[id] || document.getElementById(id)) { id = base + '-' + (n++); }
        h.id = id;
      }
      seen[h.id] = true;
    });
    el.innerHTML = '<p class="toc-label">In this note</p><ol class="toc-list">' + hs.map(function (h) {
      return '<li><a href="#' + esc(h.id) + '">' + esc(h.textContent.trim().replace(/^\d+[\.\)]\s*/, '')) + '</a></li>';
    }).join('') + '</ol>';
  }

  var VIEWS = { toc: renderToc, headlines: renderHeadlines, latest: renderLatest, archive: renderArchive, 'on-deck': renderOnDeck, coverage: renderCoverage,
    history: renderHistory, toolkit: renderToolkit, 'lead-pick': renderLeadPick, related: renderRelated, 'prev-next': renderPrevNext };

  function mountAll() {
    var els = document.querySelectorAll('[data-bp]'); if (!els.length) return;
    load().then(function (d) {
      els.forEach(function (el) { var v = VIEWS[el.getAttribute('data-bp')]; if (v) { try { v(el, d); } catch (e) { console.error('[content] ' + el.getAttribute('data-bp'), e); } } });
      var stamp = document.querySelector('[data-bp-generated]'); if (stamp && d.generated) stamp.textContent = 'Index updated ' + fmtDate(d.generated);
    }).catch(function (e) {
      console.error('[content] load failed', e);
      els.forEach(function (el) { el.innerHTML = '<p class="muted small">Content index unavailable. <a href="' + ROOT + '/writing.html">Browse the archive.</a></p>'; });
    });
  }
  // ---- site chrome: mobile menu + opt-in dark theme (tokens already exist in style.css) ----
  function chrome() {
    var btn = document.querySelector('.nav-toggle'), nav = document.getElementById('site-nav');
    if (btn && nav) btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open'); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var KEY = 'bp-theme', root = document.documentElement, saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'dark') root.setAttribute('data-theme', 'dark');
    var t = document.querySelector('.theme-toggle');
    if (t) {
      var paint = function () { var dark = root.getAttribute('data-theme') === 'dark'; t.textContent = dark ? 'Light' : 'Dark'; t.setAttribute('aria-pressed', dark ? 'true' : 'false'); };
      t.addEventListener('click', function () {
        var dark = root.getAttribute('data-theme') === 'dark';
        if (dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'dark');
        try { localStorage.setItem(KEY, dark ? 'light' : 'dark'); } catch (e) {}
        paint();
      });
      paint();
    }
  }

  function boot() { chrome(); mountAll(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.BP = { load: load, rel: rel, fmtDate: fmtDate, isNew: isNew, views: VIEWS };
})();
