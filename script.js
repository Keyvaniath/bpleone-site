// =============================================================================
// bpleon.com -- progressive enhancements
// Market data on the public pages comes from TradingView's embeddable widgets,
// which are free with TradingView branding (tradingview.com/widget, read
// 2026-09-30). Until 2026-09-30 the ticker and cards drew Yahoo Finance,
// Finnhub and CoinGecko data through the bpleon-quotes Worker; those licenses
// cover personal use only, so the public pages no longer use them. The Worker
// still serves the admin watchlist and the private tools.
// =============================================================================

(function () {

  // Auto-update the year in any element with id="year".
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // --- TradingView widgets ------------------------------------------------
  // Yahoo-style symbols used in the page markup, mapped to TradingView symbols
  // the free widgets can display (each checked 2026-09-30). Equities pass
  // through unchanged: TradingView resolves bare tickers.
  var TV_SYMBOLS = {
    '^GSPC': 'FOREXCOM:SPXUSD', '^TNX': 'FRED:DGS10', '^TYX': 'FRED:DGS30',
    '^IRX': 'FRED:DTB3', '^FVX': 'FRED:DGS5', 'DX-Y.NYB': 'CAPITALCOM:DXY',
    'EURUSD=X': 'FX_IDC:EURUSD', 'USDJPY=X': 'FX_IDC:USDJPY',
    '^VIX': 'CAPITALCOM:VIX', 'HYG': 'AMEX:HYG'
  };
  function tvSym(s) { return TV_SYMBOLS[s] || s; }
  // Mount one TradingView widget into el, keeping TradingView's default credit
  // link: the widgets are free on condition that the branding stays.
  function tvEmbed(el, widget, config) {
    if (!el) return;
    el.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'tradingview-widget-container tv-embed';
    var inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    box.appendChild(inner);
    var credit = document.createElement('div');
    credit.className = 'tradingview-widget-copyright';
    credit.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">Track all markets on TradingView</a>';
    box.appendChild(credit);
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-' + widget + '.js';
    s.innerHTML = JSON.stringify(config);
    box.appendChild(s);
    el.appendChild(box);
  }
  window.bpleonTV = { embed: tvEmbed, sym: tvSym };

  var mount = document.getElementById('ticker-tape');
  if (!mount) return;

  var WORKER_URL = 'https://bpleon-quotes.brandonpleone.workers.dev/';  // admin watchlist (KV) only

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  // --- Ticker tape (TradingView, 2026-09-30) -----------------------------
  // Edit TV_TICKER to change what scrolls. Index CFDs keep their own names
  // (UK 100, JAPAN 225, HK 50): they track the indexes but are not them.
  var TV_TICKER = [
    { proName: 'FRED:DGS10',      title: '10Y' },
    { proName: 'CAPITALCOM:VIX',  title: 'VIX' },
    { proName: 'AMEX:SPY',        title: 'SPY' },
    { proName: 'NASDAQ:QQQ',      title: 'QQQ' },
    { proName: 'AMEX:IWV',        title: 'IWV' },
    { proName: 'FOREXCOM:UKXGBP', title: 'UK 100' },
    { proName: 'XETR:DAX',        title: 'DAX' },
    { proName: 'FOREXCOM:JPXJPY', title: 'JAPAN 225' },
    { proName: 'FOREXCOM:HKXHKD', title: 'HK 50' },
    { proName: 'BITSTAMP:BTCUSD', title: 'BTC' },
    { proName: 'BITSTAMP:ETHUSD', title: 'ETH' },
    { proName: 'COINBASE:SOLUSD', title: 'SOL' },
    { proName: 'OANDA:XAUUSD',    title: 'GOLD' },
    { proName: 'FX_IDC:EURUSD',   title: 'EUR/USD' },
    { proName: 'FX_IDC:GBPUSD',   title: 'GBP/USD' },
    { proName: 'FX_IDC:USDJPY',   title: 'USD/JPY' }
  ];
  mount.classList.add('tv-ticker');
  tvEmbed(mount, 'ticker-tape', {
    symbols: TV_TICKER, showSymbolLogo: false, isTransparent: true,
    displayMode: 'compact', colorTheme: 'light', locale: 'en'
  });

  // =========================================================================
  // Watchlist (homepage "What I'm watching" widget)
  // -------------------------------------------------------------------------
  // EDIT THIS ARRAY to change what shows on the homepage. Each entry needs:
  //   sym      Yahoo Finance symbol (e.g. 'MU', 'NVDA', '^TNX')
  //   name     Short company/ETF name shown on the card
  //   target   Your price target (number, USD)
  //   thesis   One-sentence thesis shown below the price
  //   posted   YYYY-MM-DD when you posted/updated the call
  //   note_url Optional: link to longer write-up (e.g. 'writing.html#mu')
  //
  // The live source of truth is the /admin watchlist editor, which writes
  // to Cloudflare KV via the Worker. The array below is only a fallback
  // shown if the KV fetch fails (Worker down, KV cold, etc.) -- editing it
  // here will NOT change what visitors see on the homepage. Edit picks at
  // https://bpleon.com/admin instead.
  // =========================================================================
  var WATCHLIST_FALLBACK = [
    {
      sym: 'BE',
      name: 'Bloom Energy',
      target: 235,
      thesis: 'Initiated HOLD Sep 9. The AI-power bottleneck is real and revenue is doubling; at roughly 103x guided earnings the price already assumes it. Target is a 12-18mo probability-weighted value, not a buy call.',
      posted: '2026-09-09',
      note_url: 'be-initiation-2026-09-09.html'
    }
  ];
  // Mutable; replaced by loadWatchlist() if the KV read succeeds.
  var WATCHLIST = WATCHLIST_FALLBACK.slice();

  function loadWatchlist(callback) {
    var url = WORKER_URL + '?watchlist=read';
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (list) {
        if (Array.isArray(list) && list.length) {
          WATCHLIST = list;
          console.log('[watchlist] loaded ' + list.length + ' entries from KV');
        } else {
          console.log('[watchlist] using fallback (KV empty or unparseable)');
        }
        if (callback) callback();
      })
      .catch(function (e) {
        console.warn('[watchlist] KV read failed, using fallback:', e && e.message);
        if (callback) callback();
      });
  }

  // Populate the unified Lead Pick card (replaces the old separate watchlist
  // card + snapshot panel). Pitch info (name / thesis / target / posted)
  // comes straight from the WATCHLIST entry. Live price + % change comes
  // from the Worker's ?symbols= route. Sparkline + stats grid + symbol
  // exchange prefix are filled in by loadSnapshotForFirstPick(), which
  // calls ?metrics= and ?spark=.
  function renderWatchlist() {
    var leadEl = document.getElementById('lead-pick');
    if (!leadEl || !WATCHLIST.length) return;

    var first = WATCHLIST[0];

    // Static pitch info (instant, no network)
    var nameEl    = document.getElementById('lp-name');
    var symEl     = document.getElementById('lp-symbol');
    var thesisEl  = document.getElementById('lp-thesis');
    var targetEl  = document.getElementById('lp-target');
    var postedEl  = document.getElementById('lp-posted');
    var linkEl    = document.getElementById('lp-link');
    if (nameEl)   nameEl.textContent   = first.name;
    if (symEl)    symEl.textContent    = first.sym;
    if (thesisEl) thesisEl.textContent = first.thesis || '';
    // Target: render the dollar value when present; render "Under review"
    // when the field is null / missing / non-numeric (e.g. PT pulled pending
    // a full pitch). This avoids broadcasting a stale or placeholder number.
    if (targetEl) {
      if (first.target != null && isFinite(first.target)) {
        targetEl.textContent = '$' + Number(first.target).toFixed(2);
      } else {
        targetEl.textContent = 'Under review';
      }
    }
    if (postedEl) postedEl.textContent = first.posted || '';
    if (linkEl)   linkEl.href = 'https://finance.yahoo.com/quote/' + encodeURIComponent(first.sym) + '/';

    // Live price, chart and news: TradingView widgets (2026-09-30). The Yahoo
    // quote, stats grid, sparkline and headline feeds are retired, and so is
    // the "to target" figure, which needed a live price.
    var tvS = tvSym(first.sym);
    var sparkEl = document.getElementById('lp-spark');
    if (sparkEl && sparkEl.getAttribute('data-tv') !== tvS) {
      sparkEl.setAttribute('data-tv', tvS);
      sparkEl.classList.add('tv-lp');
      sparkEl.removeAttribute('aria-hidden');
      tvEmbed(sparkEl, 'mini-symbol-overview', {
        symbol: tvS, width: '100%', height: 220, locale: 'en', dateRange: '1M',
        colorTheme: 'light', isTransparent: true, autosize: false, largeChartUrl: ''
      });
    }
    ['.lp-priceblock', '.lp-spark-periods', '#lp-stats', '.lp-section-label'].forEach(function (q) {
      var el = leadEl.querySelector(q);
      if (el) el.style.display = 'none';
    });
    var ttCell = document.getElementById('lp-totarget');
    if (ttCell && ttCell.parentNode) ttCell.parentNode.style.display = 'none';
    var hl = document.getElementById('headlines-list');
    if (hl && hl.getAttribute('data-tv') !== tvS) {
      hl.setAttribute('data-tv', tvS);
      tvEmbed(hl, 'timeline', {
        feedMode: 'symbol', symbol: tvS, isTransparent: true, displayMode: 'regular',
        width: '100%', height: 460, colorTheme: 'light', locale: 'en'
      });
    }
    var hlTitle = document.getElementById('headlines-title');
    if (hlTitle) hlTitle.textContent = 'On the wire \u2014 ' + first.name;
  }

  // -----------------------------------------------------------------------
  // Sparkline rendering -- daily closes drawn as a small SVG line. Up/down
  // stroke color comes from the first-vs-last comparison. With
  // opts.showRange = true, also draws subtle dashed high/low reference
  // lines and prints the price values at the right edge of each line --
  // gives the reader an instant range and price anchor.
  // -----------------------------------------------------------------------
  function fmtSparkPrice(n) {
    if (!isFinite(n)) return '';
    if (n >= 1000) return Math.round(n).toLocaleString();
    if (n >= 100)  return n.toFixed(0);
    if (n >= 1)    return n.toFixed(2);
    return n.toFixed(4);
  }

  // "Nice numbers" tick generator -- picks tick values at round multiples
  // (1, 2, 5, 10, 50, 100, 500, ...) close to the requested density.
  // Returns an array of clean round price values inside [min, max].
  function niceTicks(min, max, targetCount) {
    if (!isFinite(min) || !isFinite(max) || max <= min) return [];
    targetCount = Math.max(2, targetCount || 4);
    var rough = (max - min) / targetCount;
    var exp = Math.pow(10, Math.floor(Math.log10(rough)));
    var f = rough / exp;
    var nice;
    if (f < 1.5)      nice = 1;
    else if (f < 3.5) nice = 2;
    else if (f < 7.5) nice = 5;
    else              nice = 10;
    var step = nice * exp;
    var first = Math.ceil(min / step) * step;
    var ticks = [];
    for (var v = first; v <= max + step * 0.0001; v += step) {
      if (v >= min - step * 0.0001) ticks.push(v);
    }
    return ticks;
  }
  function sparklineSvg(values, opts) {
    opts = opts || {};
    var w = opts.width || 280;
    var h = opts.height || 44;
    var pad = opts.padding || 3;
    var showRange = !!opts.showRange;
    var labelPad = showRange ? 38 : 0;  // reserve right-edge space for price labels
    var plotW = w - labelPad;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var range = max - min || 1;
    var stepX = (plotW - 2 * pad) / Math.max(values.length - 1, 1);
    var pts = values.map(function (v, i) {
      var x = pad + i * stepX;
      var y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return { x: +x.toFixed(1), y: +y.toFixed(1) };
    });
    var up = values[values.length - 1] >= values[0];
    var stroke = opts.stroke || (up ? '#1a6e3f' : '#b03a2e');
    var lastPt = pts[pts.length - 1];
    var pointsAttr = pts.map(function (p) { return p.x + ',' + p.y; }).join(' ');

    var rangeMarkup = '';
    if (showRange) {
      // Nice-number y-axis ticks: round prices (multiples of 1/2/5/10...)
      // at evenly-spaced positions inside the data range. Drops interpolated
      // values like "6,139" in favour of clean ones like "6,000 / 6,500".
      var tickValues = niceTicks(min, max, 3);
      for (var ti = 0; ti < tickValues.length; ti++) {
        var tVal = tickValues[ti];
        var tY = pad + ((max - tVal) / range) * (h - 2 * pad);
        rangeMarkup +=
          '<line x1="' + pad + '" x2="' + plotW + '" y1="' + tY.toFixed(1) +
            '" y2="' + tY.toFixed(1) +
            '" stroke="' + stroke + '" stroke-width="0.6" stroke-dasharray="2,3" ' +
            'opacity="0.3"/>' +
          '<text x="' + (plotW + 4) + '" y="' + (tY + 3).toFixed(1) +
            '" font-family="Inter,system-ui,sans-serif" font-size="9" ' +
            'font-weight="500" fill="#8e887d">' +
            fmtSparkPrice(tVal) + '</text>';
      }
    }

    return (
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" ' +
      'aria-hidden="true" style="display:block;width:100%;height:' + h + 'px;overflow:visible">' +
        rangeMarkup +
        '<polyline points="' + pointsAttr + '" fill="none" stroke="' + stroke +
        '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ' +
        'vector-effect="non-scaling-stroke"/>' +
        '<circle cx="' + lastPt.x + '" cy="' + lastPt.y + '" r="2.5" fill="' + stroke + '"/>' +
      '</svg>'
    );
  }

  function loadWatchlistSparklines() {
    var holders = document.querySelectorAll('.watch-spark[data-sym]');
    if (!holders.length) return;
    var unique = [];
    holders.forEach(function (h) {
      var s = h.getAttribute('data-sym');
      if (s && unique.indexOf(s) === -1) unique.push(s);
    });
    if (!unique.length) return;
    fetch(WORKER_URL + '?spark=' + encodeURIComponent(unique.join(',')))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        holders.forEach(function (h) {
          var sym = h.getAttribute('data-sym');
          var values = data[sym];
          if (values && values.length > 1) {
            h.innerHTML = sparklineSvg(values);
          }
        });
      })
      .catch(function () { /* silent: cards still look right without sparkline */ });
  }

  // -----------------------------------------------------------------------
  // Watchlist metrics -- pulls market cap / P/E / 52w range / volume from
  // the Worker's ?metrics= route (which aggregates Yahoo's quoteSummary +
  // chart-meta endpoints) and renders a 4-cell grid at the top of each
  // watchlist card. Quoted fields fall back to "—" individually if a
  // particular data point is missing.
  // -----------------------------------------------------------------------
  function fmtMcap(n) {
    if (!n || !isFinite(n)) return '—';
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6)  return '$' + (n / 1e6).toFixed(0) + 'M';
    return '$' + Math.round(n).toLocaleString();
  }
  function fmtVol(n) {
    if (!n || !isFinite(n)) return '—';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return String(Math.round(n));
  }
  function fmtPe(n) {
    if (!n || !isFinite(n) || n <= 0) return '—';
    return n.toFixed(1);
  }
  function fmtRange(low, high) {
    if (!isFinite(low) || !isFinite(high)) return '—';
    function r(n) {
      if (n >= 1000) return Math.round(n).toLocaleString();
      if (n >= 100)  return Math.round(n).toString();
      return n.toFixed(2).replace(/\.00$/, '');
    }
    return '$' + r(low) + ' – $' + r(high);
  }
  function metricsRowHtml(m) {
    // When Yahoo's quoteSummary endpoint is auth-walled (which is the
    // current default state in 2026), marketCap and trailingPE come back
    // null. Substitute with chart-meta stats that always work so the row
    // never has empty cells.
    var hasMcap = m.marketCap && isFinite(m.marketCap);
    var hasPe   = m.trailingPE && isFinite(m.trailingPE);
    function cell(label, val) {
      return '<div class="wm-cell"><span class="wm-label">' + label + '</span>' +
             '<span class="wm-val">' + val + '</span></div>';
    }
    function fmtPriceShort(n) {
      if (!isFinite(n)) return '—';
      if (n >= 1000) return '$' + Math.round(n).toLocaleString();
      return '$' + n.toFixed(2);
    }
    return (
      (hasMcap
        ? cell('Mkt Cap', fmtMcap(m.marketCap))
        : cell('Day Range', fmtRange(m.dayLow, m.dayHigh))) +
      (hasPe
        ? cell('P/E (TTM)', fmtPe(m.trailingPE))
        : cell('Prev Close', fmtPriceShort(m.previousClose))) +
      cell('52W', fmtRange(m.fiftyTwoWeekLow, m.fiftyTwoWeekHigh)) +
      cell('Vol', fmtVol(m.volume))
    );
  }
  function loadWatchlistMetrics() {
    var holders = document.querySelectorAll('.watch-metrics[data-sym]');
    if (!holders.length) return;
    var unique = [];
    holders.forEach(function (h) {
      var s = h.getAttribute('data-sym');
      if (s && unique.indexOf(s) === -1) unique.push(s);
    });
    if (!unique.length) return;
    fetch(WORKER_URL + '?metrics=' + encodeURIComponent(unique.join(',')))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        holders.forEach(function (h) {
          var sym = h.getAttribute('data-sym');
          var m = data[sym];
          if (!m) return;
          h.innerHTML = metricsRowHtml(m);
        });
      })
      .catch(function () { /* silent: card still has price + sparkline */ });
  }

  // -----------------------------------------------------------------------
  // "Micron Technology" snapshot panel -- the middle column of the
  // watchlist row. Bigger 1y sparkline + 6-cell stats grid + a Yahoo
  // Finance link. Always tracks the FIRST entry in the watchlist.
  // -----------------------------------------------------------------------
  function snapshotStatsHtml(m) {
    function row(label, val) {
      return '<div><dt>' + label + '</dt><dd>' + val + '</dd></div>';
    }
    function fmtPriceShort(n) {
      if (!isFinite(n)) return '—';
      if (n >= 1000) return '$' + Math.round(n).toLocaleString();
      return '$' + n.toFixed(2);
    }
    function fmtPctOff52w(price, high) {
      if (!isFinite(price) || !isFinite(high) || !high) return '—';
      var pct = ((price - high) / high) * 100;
      return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
    }

    var hasMcap   = m.marketCap && isFinite(m.marketCap);
    var hasPe     = m.trailingPE && isFinite(m.trailingPE);
    var hasAvgVol = m.avgVolume && isFinite(m.avgVolume);

    var out = '';
    out += hasMcap
      ? row('Mkt Cap',   fmtMcap(m.marketCap))
      : row('Day Range', fmtRange(m.dayLow, m.dayHigh));
    out += hasPe
      ? row('P/E (TTM)', fmtPe(m.trailingPE))
      : row('Prev Close', fmtPriceShort(m.previousClose));
    out += row('52W Range', fmtRange(m.fiftyTwoWeekLow, m.fiftyTwoWeekHigh));
    out += hasMcap
      ? row('Day Range', fmtRange(m.dayLow, m.dayHigh))
      : row('% from 52W high', fmtPctOff52w(m.price, m.fiftyTwoWeekHigh));
    out += row('Volume', fmtVol(m.volume));
    out += hasAvgVol
      ? row('Avg Volume', fmtVol(m.avgVolume))
      : row('Exchange',   m.exchange || '—');
    return out;
  }
  function loadSnapshotForFirstPick() {
    var leadEl = document.getElementById('lead-pick');
    if (!leadEl) return;
    if (!WATCHLIST.length) return;
    var first = WATCHLIST[0];
    var sym = first.sym;

    var statsEl = document.getElementById('lp-stats');
    var symEl   = document.getElementById('lp-symbol');

    fetch(WORKER_URL + '?metrics=' + encodeURIComponent(sym))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var metrics = data && data[sym];
        if (!metrics) return;
        if (symEl && metrics.exchange) {
          symEl.textContent = metrics.exchange + ': ' + sym;
        }
        if (statsEl) statsEl.innerHTML = snapshotStatsHtml(metrics);
      })
      .catch(function () { /* keep placeholders */ });
  }

  // Lead-pick sparkline -- separate from the metrics fetch so the user can
  // switch ranges (1D / 1W / 1M / 3M / 1Y / 5Y) without re-pulling the
  // stats grid. Default is 1M so the recent action shows up proportionally
  // instead of being compressed by a 1Y view of a stock that 7x'd.
  var currentSparkRange = '1mo';
  // Latest quote captured by the symbols fetch — used to compute today's
  // day-over-day change for the 1D headline. Populated by renderWatchlist().
  var latestLeadPickQuote = null;

  // Refresh #lp-change using the rule: 1D -> price vs previousClose,
  // any other range -> spark first vs last. Idempotent; safe to call
  // from either the symbols-fetch path or the spark-fetch path.
  function refreshLeadPickChange(sparkValues) {
    var changeEl = document.getElementById('lp-change');
    if (!changeEl) return;
    var pct, suffix;
    if (currentSparkRange === '1d' && latestLeadPickQuote &&
        isFinite(latestLeadPickQuote.price) &&
        isFinite(latestLeadPickQuote.previousClose) &&
        latestLeadPickQuote.previousClose !== 0) {
      pct = ((latestLeadPickQuote.price - latestLeadPickQuote.previousClose) /
             latestLeadPickQuote.previousClose) * 100;
      suffix = 'today';
    } else if (sparkValues && sparkValues.length >= 2) {
      var firstV = sparkValues[0], lastV = sparkValues[sparkValues.length - 1];
      if (!(isFinite(firstV) && isFinite(lastV) && firstV !== 0)) return;
      pct = ((lastV - firstV) / firstV) * 100;
      var rangeLabels = {
        '1d': 'today', '5d': '1w', '1mo': '1m',
        '3mo': '3m',   '1y': '1y',  '5y': '5y'
      };
      suffix = rangeLabels[currentSparkRange] || currentSparkRange;
    } else {
      return; // not enough info yet
    }
    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '% ' + suffix;
    changeEl.className = 'lp-change ' + (pct >= 0 ? 'up' : 'down');
  }


  function loadLeadPickSpark(range) {
    if (range) currentSparkRange = range;
    if (!WATCHLIST.length) return;
    var first = WATCHLIST[0];
    var sym = first.sym;
    var sparkEl = document.getElementById('lp-spark');
    if (!sparkEl) return;
    fetch(WORKER_URL + '?spark=' + encodeURIComponent(sym) +
                       '&range=' + encodeURIComponent(currentSparkRange) +
                       '&withDates=1')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var entry = data && data[sym];
        if (!entry) return;
        // Tolerate both shapes: { values, timestamps } (new) or [..closes] (old).
        var values = Array.isArray(entry) ? entry : entry.values;
        var timestamps = Array.isArray(entry) ? null : entry.timestamps;
        if (!values || values.length < 2) return;
        var sparkOpts = { width: 320, height: 140, padding: 6, showRange: true };
        sparkEl.innerHTML = sparklineSvg(values, sparkOpts) + buildSparkOverlay();
        if (timestamps && timestamps.length === values.length) {
          attachSparkHover(sparkEl, values, timestamps, sparkOpts);
        }
        // Hand the spark values to refreshLeadPickChange. For range='1d'
        // it ignores them and uses (price − previousClose) so the headline
        // reads the correct day-over-day move. For 1m/3m/1y/5y it falls
        // back to the period change derived from spark first/last.
        refreshLeadPickChange(values);
      })
      .catch(function () { /* leave placeholder */ });
  }

  // Derive yesterday's close (previousClose) for the lead pick by fetching
  // a 5-day spark. The Cloudflare Worker currently does not pass Yahoo's
  // regularMarketPreviousClose field through, so we walk backward through
  // the timestamped 5-day intraday data to find the last bar that's NOT
  // from today — that's the most recent prior-session close. Sets
  // latestLeadPickQuote.previousClose and triggers a label refresh.
  function loadLeadPickPreviousClose() {
    if (!WATCHLIST.length) return;
    var sym = WATCHLIST[0].sym;
    fetch(WORKER_URL + '?spark=' + encodeURIComponent(sym) + '&range=5d&withDates=1')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var entry = data && data[sym];
        if (!entry || !entry.values || !entry.timestamps) return;
        var values = entry.values;
        var timestamps = entry.timestamps;
        if (values.length !== timestamps.length || values.length < 2) return;
        var todayDate = new Date().toDateString();
        var prevClose = null;
        for (var i = values.length - 1; i >= 0; i--) {
          var v = values[i];
          var ts = timestamps[i];
          if (!isFinite(v) || !ts) continue;
          var d = new Date(ts * 1000);
          if (d.toDateString() !== todayDate) {
            prevClose = v;
            break;
          }
        }
        if (!isFinite(prevClose)) return;
        if (!latestLeadPickQuote) latestLeadPickQuote = { price: NaN, previousClose: prevClose };
        else latestLeadPickQuote.previousClose = prevClose;
        refreshLeadPickChange();
      })
      .catch(function () { /* keep prior state */ });
  }

  // Hover overlay markup: a vertical crosshair line, a dot marker, and a
  // floating tooltip. Positioned in container pixels by attachSparkHover().
  function buildSparkOverlay() {
    return (
      '<div class="lp-spark-overlay" aria-hidden="true">' +
        '<div class="lp-spark-cross"></div>' +
        '<div class="lp-spark-dot"></div>' +
        '<div class="lp-spark-tip"></div>' +
      '</div>'
    );
  }

  // Wire up mousemove / touch handlers that map cursor X to the nearest
  // data index and reveal the crosshair, dot, and price/date tooltip.
  function attachSparkHover(container, values, timestamps, opts) {
    var overlay = container.querySelector('.lp-spark-overlay');
    if (!overlay) return;
    var cross = overlay.querySelector('.lp-spark-cross');
    var dot = overlay.querySelector('.lp-spark-dot');
    var tip = overlay.querySelector('.lp-spark-tip');

    var w = opts.width || 320;
    var h = opts.height || 140;
    var pad = opts.padding || 6;
    // sparklineSvg() reserves 38px of viewBox for the right-edge price labels.
    var labelPad = opts.showRange ? 38 : 0;
    var plotW = w - labelPad;
    var stepX = (plotW - 2 * pad) / Math.max(values.length - 1, 1);

    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var range = max - min || 1;

    function moveTo(clientX) {
      var rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      var px = clientX - rect.left;
      // Container width displays the full viewBox width (0..w).
      var vbX = (px / rect.width) * w;
      // Find nearest data point by viewBox X.
      var bestIdx = 0;
      var bestDist = Infinity;
      for (var i = 0; i < values.length; i++) {
        var ptX = pad + i * stepX;
        var d = Math.abs(ptX - vbX);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      var pickVbX = pad + bestIdx * stepX;
      var pickPxX = (pickVbX / w) * rect.width;
      var pickVbY = h - pad - ((values[bestIdx] - min) / range) * (h - 2 * pad);
      var pickPxY = (pickVbY / h) * rect.height;

      overlay.classList.add('active');
      cross.style.left = pickPxX.toFixed(1) + 'px';
      dot.style.left = pickPxX.toFixed(1) + 'px';
      dot.style.top = pickPxY.toFixed(1) + 'px';

      var ts = timestamps[bestIdx];
      var dateStr = '';
      if (ts) {
        var d2 = new Date(ts * 1000);
        // Show intraday time for 1D / 5D, dates for everything else.
        if (currentSparkRange === '1d' || currentSparkRange === '5d') {
          dateStr = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ' &middot; ' + d2.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else {
          dateStr = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
      tip.innerHTML = '<strong>' + fmtSparkPrice(values[bestIdx]) + '</strong>' +
                      (dateStr ? '<span>' + dateStr + '</span>' : '');

      // Keep the tooltip inside the container.
      var tipW = tip.offsetWidth || 90;
      var halfTip = tipW / 2;
      var tipX = pickPxX;
      if (tipX - halfTip < 4) tipX = halfTip + 4;
      if (tipX + halfTip > rect.width - 4) tipX = rect.width - halfTip - 4;
      tip.style.left = tipX.toFixed(1) + 'px';
      var tipTop = pickPxY - 46;
      if (tipTop < 2) tipTop = pickPxY + 14;
      tip.style.top = tipTop.toFixed(1) + 'px';
    }

    function onMouseMove(e) { moveTo(e.clientX); }
    function onTouchMove(e) {
      if (e.touches && e.touches[0]) moveTo(e.touches[0].clientX);
    }
    function onLeave() { overlay.classList.remove('active'); }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onLeave);
    container.addEventListener('touchstart', onTouchMove, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onLeave);
  }

  function setupLeadPickSparkTabs() {
    var btns = document.querySelectorAll('.lp-spark-periods .period-btn-sm');
    if (!btns.length) return;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.getAttribute('data-range');
        btns.forEach(function (x) { x.classList.toggle('active', x === b); });
        loadLeadPickSpark(r);
      });
    });
  }

  // -----------------------------------------------------------------------
  // Headlines for the first watchlist pick -- pulled from Google News RSS
  // through the Worker. Renders into #headlines-list on the homepage.
  // -----------------------------------------------------------------------
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function relativeTimeShort(d) {
    var diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return '';
    var min = Math.floor(diffMs / 60000);
    if (min < 60) return Math.max(min, 1) + 'm ago';
    var h = Math.floor(min / 60);
    if (h < 24) return h + 'h ago';
    var days = Math.floor(h / 24);
    if (days < 7) return days + 'd ago';
    return d.toLocaleDateString();
  }

  function loadHeadlinesForFirstPick() {
    var listEl = document.getElementById('headlines-list');
    var titleEl = document.getElementById('headlines-title');
    if (!listEl) return;
    if (!WATCHLIST.length) return;
    var first = WATCHLIST[0];
    if (titleEl) titleEl.textContent = 'On the wire — ' + first.name;
    // Pass the ticker symbol so the Worker can try Yahoo Finance's
    // ticker-specific RSS first; falls back to Google News by ticker.
    fetch(WORKER_URL + '?headlines=' + encodeURIComponent(first.sym) + '&n=8')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.items) || !data.items.length) {
          listEl.innerHTML = '<p class="muted small">No recent headlines.</p>';
          return;
        }
        listEl.innerHTML = data.items.map(function (item) {
          var date = '';
          if (item.pubDate) {
            var d = new Date(item.pubDate);
            if (!isNaN(d.getTime())) date = relativeTimeShort(d);
          }
          var meta = [];
          if (item.source) meta.push(escapeHtml(item.source));
          if (date) meta.push(date);
          return (
            '<a class="hl-row" href="' + escapeAttr(item.link) + '" target="_blank" rel="noopener">' +
              '<span class="hl-title">' + escapeHtml(item.title) + '</span>' +
              (meta.length ? '<span class="hl-meta">' + meta.join(' &middot; ') + '</span>' : '') +
            '</a>'
          );
        }).join('');
      })
      .catch(function () {
        listEl.innerHTML = '<p class="muted small">Headlines unavailable.</p>';
      });
  }

  // Subtle skeleton card while waiting for the first Worker response. Replaces
  // the bare "Loading watchlist…" text with a card-shaped pulse so the layout
  // doesn't jump when prices arrive.
  function paintWatchlistSkeleton() {
    var grid = document.getElementById('watchlist-grid');
    if (!grid) return;
    var n = Math.max(WATCHLIST.length, 1);
    var cards = '';
    for (var i = 0; i < n; i++) {
      cards +=
        '<div class="watch-card watch-card-loading" aria-busy="true">' +
          '<div class="watch-card-head">' +
            '<span class="skel" style="width:65%;height:1.05rem"></span>' +
          '</div>' +
          '<div class="watch-price-row">' +
            '<span class="skel skel-line tall" style="width:38%;margin:0"></span>' +
          '</div>' +
          '<span class="skel skel-line" style="width:90%"></span>' +
          '<span class="skel skel-line" style="width:55%"></span>' +
        '</div>';
    }
    grid.innerHTML = cards;
  }

  if (document.getElementById('lead-pick')) {
    loadWatchlist(function () {
      renderWatchlist();  // TradingView widgets refresh themselves
    });
  }

  // =========================================================================
  // World markets open/closed board
  // -------------------------------------------------------------------------
  // Schedule is in each market's local time -- DST is handled automatically by
  // Intl.DateTimeFormat with the IANA timezone name. Lunch breaks ARE modeled
  // for Tokyo and Hong Kong (the two majors that run an explicit midday halt).
  // Holidays not modeled -- treat as approximate near major holidays.
  // =========================================================================
  var MARKETS = [
    { name: 'New York',   code: 'NYSE', tz: 'America/New_York',   open: '09:30', close: '16:00' },
    { name: 'Toronto',    code: 'TSX',  tz: 'America/Toronto',    open: '09:30', close: '16:00' },
    { name: 'London',     code: 'LSE',  tz: 'Europe/London',      open: '08:00', close: '16:30' },
    { name: 'Frankfurt',  code: 'XETR', tz: 'Europe/Berlin',      open: '09:00', close: '17:30' },
    { name: 'Tokyo',      code: 'TSE',  tz: 'Asia/Tokyo',         open: '09:00', close: '15:00', lunch: ['11:30', '12:30'] },
    { name: 'Hong Kong',  code: 'HKEX', tz: 'Asia/Hong_Kong',     open: '09:30', close: '16:00', lunch: ['12:00', '13:00'] },
    { name: 'Shanghai',   code: 'SSE',  tz: 'Asia/Shanghai',      open: '09:30', close: '15:00' },
    { name: 'Sydney',     code: 'ASX',  tz: 'Australia/Sydney',   open: '10:00', close: '16:00' }
  ];
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getZonedParts(date, tz) {
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short'
    });
    var parts = {};
    fmt.formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
    var dowMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    return {
      year: +parts.year, month: +parts.month, day: +parts.day,
      hour: +parts.hour === 24 ? 0 : +parts.hour,  // some engines emit "24" at midnight
      minute: +parts.minute,
      dayOfWeek: dowMap[parts.weekday]
    };
  }

  function toMin(hm) { var p = hm.split(':'); return +p[0] * 60 + +p[1]; }

  function isOpen(market, when) {
    var z = getZonedParts(when, market.tz);
    if (z.dayOfWeek === 0 || z.dayOfWeek === 6) return false;
    var nowMin = z.hour * 60 + z.minute;
    if (nowMin < toMin(market.open) || nowMin >= toMin(market.close)) return false;
    // Skip the midday lunch halt (Tokyo, Hong Kong).
    if (market.lunch) {
      var lStart = toMin(market.lunch[0]);
      var lEnd   = toMin(market.lunch[1]);
      if (nowMin >= lStart && nowMin < lEnd) return false;
    }
    return true;
  }

  // Returns the lunch-end time (e.g. '12:30') when the market is currently
  // halted for lunch on a normal trading day; '' otherwise. Lets the UI
  // distinguish "ON BREAK" from "CLOSED for the day".
  function onLunchBreak(market, when) {
    if (!market.lunch) return '';
    var z = getZonedParts(when, market.tz);
    if (z.dayOfWeek === 0 || z.dayOfWeek === 6) return '';
    var nowMin = z.hour * 60 + z.minute;
    if (nowMin < toMin(market.open) || nowMin >= toMin(market.close)) return '';
    var lStart = toMin(market.lunch[0]);
    var lEnd   = toMin(market.lunch[1]);
    if (nowMin >= lStart && nowMin < lEnd) return market.lunch[1];
    return '';
  }

  function nextOpen(market, from) {
    // Walk forward in 30-min steps up to 8 days, refine to the minute.
    var STEP = 30 * 60 * 1000;
    for (var i = 1; i <= 8 * 48; i++) {
      var coarse = new Date(from.getTime() + i * STEP);
      if (isOpen(market, coarse)) {
        var t = coarse;
        while (t > from && isOpen(market, new Date(t.getTime() - 60 * 1000))) {
          t = new Date(t.getTime() - 60 * 1000);
        }
        return t;
      }
    }
    return null;
  }

  function fmtETClock(date) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  }

  function fmtNextOpenLabel(openDate, now) {
    var z = getZonedParts(openDate, 'America/New_York');
    var n = getZonedParts(now,      'America/New_York');
    var sameDate = (z.year === n.year && z.month === n.month && z.day === n.day);
    var dayLabel = sameDate ? 'Today' : DAY_NAMES[z.dayOfWeek];
    return 'Opens ' + dayLabel + ' ' + fmtETClock(openDate) + ' ET';
  }

  // Just the day+time portion (no "Opens " prefix), for use alongside a
  // countdown like "Opens in 2h 30m · today 9:30 AM ET".
  function fmtOpenWhen(openDate, now) {
    var z = getZonedParts(openDate, 'America/New_York');
    var n = getZonedParts(now,      'America/New_York');
    var sameDate = (z.year === n.year && z.month === n.month && z.day === n.day);
    var dayLabel = sameDate ? 'today' : DAY_NAMES[z.dayOfWeek];
    return dayLabel + ' ' + fmtETClock(openDate) + ' ET';
  }

  // Compact "time remaining" for the world-markets board.
  // < 1 min  -> "now"
  // < 60 min -> "45m"
  // < 24 h   -> "2h 30m"  (m omitted if exactly on the hour)
  // >= 24 h  -> "2d 4h"
  function fmtCountdown(min) {
    if (!isFinite(min) || min < 1) return 'now';
    if (min < 60) return Math.round(min) + 'm';
    var h = Math.floor(min / 60);
    var m = Math.round(min % 60);
    if (h < 24) return m > 0 ? (h + 'h ' + m + 'm') : (h + 'h');
    var d = Math.floor(h / 24);
    var hr = h % 24;
    return hr > 0 ? (d + 'd ' + hr + 'h') : (d + 'd');
  }

  // Minutes from `now` to a target time-of-day (HH:MM) in the market's own
  // timezone. Used for OPEN markets (time-to-close) and ON BREAK markets
  // (time-to-reopen). Both endpoints are same-day events, so a simple
  // (closeMin - nowMin) is correct.
  function minutesUntilLocalTime(market, now, hm) {
    var z = getZonedParts(now, market.tz);
    var nowMin = z.hour * 60 + z.minute;
    return toMin(hm) - nowMin;
  }

  function renderMarketsStatus() {
    var grid = document.getElementById('markets-status-grid');
    if (!grid) return;
    var now = new Date();

    var clock = document.getElementById('markets-now-et');
    if (clock) clock.textContent = fmtETClock(now) + ' ET';

    grid.innerHTML = MARKETS.map(function (m) {
      var open = isOpen(m, now);
      var lunchEndLocal = onLunchBreak(m, now);
      var statusEl, bottomEl, cardClass;
      if (open) {
        var minToClose = minutesUntilLocalTime(m, now, m.close);
        statusEl = '<span class="mkt-dot mkt-dot-open" aria-hidden="true"></span>' +
                   '<span class="mkt-status mkt-status-open">OPEN</span>';
        bottomEl = '<p class="muted small">Closes in ' + fmtCountdown(minToClose) +
                   ' &middot; ' + m.close + ' local</p>';
        cardClass = 'mkt-card-open';
      } else if (lunchEndLocal) {
        // Within trading hours but on the lunch halt -- show as a distinct state.
        var minToReopen = minutesUntilLocalTime(m, now, lunchEndLocal);
        statusEl = '<span class="mkt-dot mkt-dot-lunch" aria-hidden="true"></span>' +
                   '<span class="mkt-status mkt-status-lunch">ON BREAK</span>';
        bottomEl = '<p class="muted small">Reopens in ' + fmtCountdown(minToReopen) +
                   ' &middot; ' + lunchEndLocal + ' local</p>';
        cardClass = 'mkt-card-lunch';
      } else {
        var nextO = nextOpen(m, now);
        statusEl = '<span class="mkt-dot mkt-dot-closed" aria-hidden="true"></span>' +
                   '<span class="mkt-status mkt-status-closed">CLOSED</span>';
        if (nextO) {
          var diffMin = Math.round((nextO.getTime() - now.getTime()) / 60000);
          bottomEl = '<p class="muted small">Opens in ' + fmtCountdown(diffMin) +
                     ' &middot; ' + fmtOpenWhen(nextO, now) + '</p>';
        } else {
          bottomEl = '<p class="muted small">Opens next session</p>';
        }
        cardClass = 'mkt-card-closed';
      }
      return (
        '<div class="mkt-card ' + cardClass + '">' +
          '<div class="mkt-head">' +
            '<span class="mkt-name">' + m.name + '</span>' +
            '<span class="mkt-code">' + m.code + '</span>' +
          '</div>' +
          '<div class="mkt-status-row">' + statusEl + '</div>' +
          bottomEl +
        '</div>'
      );
    }).join('');
  }

  // Same idea for the world-markets board: paint 8 placeholder cards
  // immediately so the section reserves its height before renderMarketsStatus
  // runs (which is fast since it makes no network calls, but it still beats
  // a bare "Loading markets…" line).
  function paintMarketsStatusSkeleton() {
    var grid = document.getElementById('markets-status-grid');
    if (!grid) return;
    var cards = '';
    for (var i = 0; i < MARKETS.length; i++) {
      cards +=
        '<div class="mkt-card mkt-card-loading" aria-busy="true">' +
          '<div class="mkt-head">' +
            '<span class="skel" style="width:55%;height:.95rem"></span>' +
            '<span class="skel" style="width:22%;height:.7rem"></span>' +
          '</div>' +
          '<div class="mkt-status-row">' +
            '<span class="skel" style="width:8px;height:8px;border-radius:50%"></span>' +
            '<span class="skel" style="width:45%;height:.85rem"></span>' +
          '</div>' +
          '<span class="skel skel-line" style="width:75%"></span>' +
        '</div>';
    }
    grid.innerHTML = cards;
  }

  if (document.getElementById('markets-status-grid')) {
    paintMarketsStatusSkeleton();
    renderMarketsStatus();
    setInterval(renderMarketsStatus, 60 * 1000);
  }

  // =========================================================================
  // Hero chart -- live S&P 500 line drawn into the dotted-paper SVG. Supports
  // a range toggle (1M / 6M / YTD / 1Y / 5Y) and a soft terracotta gradient
  // fill below the line. Falls back to the placeholder path if the fetch
  // fails.
  // =========================================================================
  var HERO_RANGE_LABELS = {
    '1d': '1D', '5d': '5D',
    '1mo': '1M', '3mo': '3M', '6mo': '6M', 'ytd': 'YTD',
    '1y':  '1Y', '2y': '2Y', '5y': '5Y', '10y': '10Y', 'max': 'MAX',
  };

  var currentHeroRange = '1y';

  // Last-good cache for the hero chart, keyed by range. Lets the chart paint
  // an instant line on repeat visits and survive a Yahoo/Worker blip with the
  // most recent data instead of a permanent "Loading…".
  function heroCacheSave(range, values, timestamps) {
    try {
      localStorage.setItem('bpleon_hero_' + range,
        JSON.stringify({ v: values, t: timestamps || null }));
    } catch (e) { /* storage full / disabled -- non-fatal */ }
  }
  function heroCacheLoad(range) {
    try {
      var raw = localStorage.getItem('bpleon_hero_' + range);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.v || o.v.length < 2) return null;
      return { values: o.v, timestamps: o.t };
    } catch (e) { return null; }
  }

  function loadHeroChart(range, _attempt) {
    range = range || '1y';
    currentHeroRange = range;
    var line = document.getElementById('hero-chart-line');
    var fill = document.getElementById('hero-chart-fill');
    if (!line) return;
    var label = document.getElementById('hero-chart-label');
    var sym = '^GSPC';  // S&P 500 index

    // Renderer extracted from the fetch handler so the SAME code can paint
    // either live Yahoo data or the last-good copy from localStorage (used
    // when the Worker/Yahoo is throttling). Returns true if it actually drew.
    function paintHero(values, timestamps) {
        if (!values || values.length < 2) return false;
        var w = 320, h = 240, padX = 24, padTop = 36, padBottom = 28;
        var min = Math.min.apply(null, values);
        var max = Math.max.apply(null, values);
        var range_v = max - min || 1;
        var stepX = (w - 2 * padX) / (values.length - 1);
        var pts = values.map(function (v, i) {
          var x = padX + i * stepX;
          var y = (h - padBottom) - ((v - min) / range_v) * (h - padTop - padBottom);
          return { x: +x.toFixed(1), y: +y.toFixed(1) };
        });
        var linePath = 'M ' + pts.map(function (p) { return p.x + ',' + p.y; }).join(' L ');
        var areaPath = linePath +
          ' L ' + pts[pts.length - 1].x + ',' + (h - padBottom) +
          ' L ' + pts[0].x + ',' + (h - padBottom) + ' Z';
        var lastPt = pts[pts.length - 1];
        if (fill) {
          fill.innerHTML = '<path d="' + areaPath + '" fill="url(#hero-fill)" stroke="none"/>';
        }
        // Y-axis: nice-number tick lines (round prices like 6,000 / 6,500 /
        // 7,000), each with the price labeled at the right edge.
        function fmtHeroPrice(n) {
          if (n >= 1000) return Math.round(n).toLocaleString();
          if (n >= 100)  return n.toFixed(0);
          return n.toFixed(2);
        }
        var rightX = w - padX;
        var dashEndX = rightX - 40;  // leave space for the right-edge label
        var tickValues = niceTicks(min, max, 4);
        var ticksHtml = '';
        for (var ti = 0; ti < tickValues.length; ti++) {
          var tVal = tickValues[ti];
          var tY = padTop + ((max - tVal) / range_v) * (h - padTop - padBottom);
          ticksHtml +=
            '<line x1="' + padX + '" x2="' + dashEndX + '" y1="' + tY.toFixed(1) +
              '" y2="' + tY.toFixed(1) +
              '" stroke="#b56a3f" stroke-width="0.7" stroke-dasharray="3,3" ' +
              'opacity="0.3"/>' +
            '<text x="' + rightX + '" y="' + (tY + 3.5).toFixed(1) +
              '" font-family="Inter,system-ui,sans-serif" font-size="10" ' +
              'font-weight="500" fill="#8e887d" text-anchor="end">' +
              fmtHeroPrice(tVal) + '</text>';
        }
        line.innerHTML =
          ticksHtml +
          // Main line + endpoint dots
          '<path d="' + linePath + '" fill="none" stroke="#b56a3f" stroke-width="3" ' +
            'stroke-linecap="round" stroke-linejoin="round"/>' +
          '<circle cx="' + lastPt.x + '" cy="' + lastPt.y + '" r="6" fill="#b56a3f"/>' +
          '<circle cx="' + lastPt.x + '" cy="' + lastPt.y + '" r="12" fill="#b56a3f" fill-opacity="0.18"/>';
        if (label) {
          var pct = ((values[values.length - 1] - values[0]) / values[0]) * 100;
          var rangeLabel = HERO_RANGE_LABELS[range] || range.toUpperCase();
          var current = values[values.length - 1];
          var fmtVal = current >= 1000
            ? Math.round(current).toLocaleString()
            : current.toFixed(2);
          label.textContent = 'S&P 500 · ' + fmtVal +
            ' · ' + rangeLabel + ' ' +
            (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
        }
        // Wire (or re-wire) hover crosshair + tooltip when timestamps are
        // available. Re-attaching is safe because we replace the geometry
        // each load and remove old listeners first.
        if (timestamps && timestamps.length === values.length) {
          attachHeroHover(values, timestamps, {
            w: w, h: h, padX: padX, padTop: padTop, padBottom: padBottom,
            min: min, max: max, range: range_v, range_label: range,
          });
        }
        return true;
    }  // end paintHero

    // Paint the last good copy immediately so there's no "Loading…" flash
    // while the live request is in flight (and so a blip leaves a real line).
    var seeded = heroCacheLoad(range);
    if (seeded) paintHero(seeded.values, seeded.timestamps);

    // Transient Worker/Yahoo failure: retry a few times with linear backoff so
    // the chart heals itself without a page reload. The old code never retried,
    // so one blip on initial load pinned "Loading…" until the next navigation.
    function heroFallback() {
      var attempt = _attempt || 0;
      if (attempt >= 4) return;
      setTimeout(function () {
        if (currentHeroRange === range) loadHeroChart(range, attempt + 1);
      }, 4000 * (attempt + 1));
    }

    // cache:'no-store' so the browser never replays a previously-cached empty
    // body; the Worker already de-dupes upstream Yahoo hits at the CF edge.
    fetch(WORKER_URL + '?spark=' + encodeURIComponent(sym) +
                       '&range=' + encodeURIComponent(range) +
                       '&withDates=1', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var entry = data && data[sym];
        // Tolerate both shapes: { values, timestamps } or [..closes].
        var values = Array.isArray(entry) ? entry : (entry && entry.values);
        var timestamps = Array.isArray(entry) ? null : (entry && entry.timestamps);
        if (paintHero(values, timestamps)) {
          heroCacheSave(range, values, timestamps);
        } else {
          heroFallback();
        }
      })
      .catch(function () { heroFallback(); });
  }

  // Attach (or re-attach) hover handlers to the hero S&P chart. Mouse X is
  // mapped to the nearest data index, then a vertical crosshair line, a
  // dot, and a price/date tooltip are positioned in pixel coords.
  var _heroHoverCleanup = null;
  function attachHeroHover(values, timestamps, geom) {
    var wrap = document.querySelector('.hero-chart-wrap');
    var overlay = wrap && wrap.querySelector('.hero-chart-overlay');
    if (!wrap || !overlay) return;
    var cross = overlay.querySelector('.hero-chart-cross');
    var dot = overlay.querySelector('.hero-chart-dot');
    var tip = overlay.querySelector('.hero-chart-tip');
    var stepX = (geom.w - 2 * geom.padX) / Math.max(values.length - 1, 1);

    function fmtHeroPriceTip(n) {
      if (n >= 1000) return Math.round(n).toLocaleString();
      if (n >= 100)  return n.toFixed(0);
      return n.toFixed(2);
    }
    function fmtHeroDate(ts) {
      if (!ts) return '';
      var d = new Date(ts * 1000);
      if (geom.range_label === '1d' || geom.range_label === '5d') {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
          ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function moveTo(clientX) {
      // The SVG fills the wrap (width:100% height:auto, viewBox 320x240).
      var rect = wrap.getBoundingClientRect();
      if (rect.width <= 0) return;
      var px = clientX - rect.left;
      var vbX = (px / rect.width) * geom.w;
      var bestIdx = 0;
      var bestDist = Infinity;
      for (var i = 0; i < values.length; i++) {
        var ptX = geom.padX + i * stepX;
        var d = Math.abs(ptX - vbX);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      var pickVbX = geom.padX + bestIdx * stepX;
      var pickVbY = (geom.h - geom.padBottom) -
                    ((values[bestIdx] - geom.min) / geom.range) *
                    (geom.h - geom.padTop - geom.padBottom);
      var pickPxX = (pickVbX / geom.w) * rect.width;
      var pickPxY = (pickVbY / geom.h) * rect.height;

      overlay.classList.add('active');
      cross.style.left = pickPxX.toFixed(1) + 'px';
      dot.style.left = pickPxX.toFixed(1) + 'px';
      dot.style.top = pickPxY.toFixed(1) + 'px';

      var dateStr = fmtHeroDate(timestamps[bestIdx]);
      tip.innerHTML = '<strong>' + fmtHeroPriceTip(values[bestIdx]) + '</strong>' +
                      (dateStr ? '<span>' + dateStr + '</span>' : '');

      var tipW = tip.offsetWidth || 110;
      var halfTip = tipW / 2;
      var tipX = pickPxX;
      if (tipX - halfTip < 6) tipX = halfTip + 6;
      if (tipX + halfTip > rect.width - 6) tipX = rect.width - halfTip - 6;
      tip.style.left = tipX.toFixed(1) + 'px';
      var tipTop = pickPxY - 54;
      if (tipTop < 4) tipTop = pickPxY + 18;
      tip.style.top = tipTop.toFixed(1) + 'px';
    }

    function onMouseMove(e) { moveTo(e.clientX); }
    function onTouchMove(e) {
      if (e.touches && e.touches[0]) moveTo(e.touches[0].clientX);
    }
    function onLeave() { overlay.classList.remove('active'); }

    // Tear down previous listeners (range switch re-binds).
    if (_heroHoverCleanup) { _heroHoverCleanup(); _heroHoverCleanup = null; }
    wrap.addEventListener('mousemove', onMouseMove);
    wrap.addEventListener('mouseleave', onLeave);
    wrap.addEventListener('touchstart', onTouchMove, { passive: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: true });
    wrap.addEventListener('touchend', onLeave);
    _heroHoverCleanup = function () {
      wrap.removeEventListener('mousemove', onMouseMove);
      wrap.removeEventListener('mouseleave', onLeave);
      wrap.removeEventListener('touchstart', onTouchMove);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('touchend', onLeave);
    };
  }

  function setupHeroChartTabs() {
    var btns = document.querySelectorAll('.hero-chart-periods .period-btn');
    if (!btns.length) return;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.getAttribute('data-range');
        btns.forEach(function (x) { x.classList.toggle('active', x === b); });
        loadHeroChart(r);
      });
    });
  }

  // Hero chart: TradingView symbol overview (2026-09-30). US 500 is a CFD that
  // tracks the S&P 500; the official index feed is licensed separately.
  var heroWrap = document.querySelector('.hero-chart-wrap');
  if (heroWrap && document.getElementById('hero-chart')) {
    heroWrap.classList.add('tv-hero');
    var oldPeriods = document.querySelector('.hero-chart-periods');  // the widget has its own range buttons
    if (oldPeriods) oldPeriods.style.display = 'none';
    tvEmbed(heroWrap, 'symbol-overview', {
      symbols: [['US 500 (S&P 500 CFD)', 'FOREXCOM:SPXUSD|12M']],
      chartOnly: false, width: '100%', height: 300, locale: 'en', colorTheme: 'light',
      autosize: false, showVolume: false, hideDateRanges: false, hideSymbolLogo: true,
      scalePosition: 'right', scaleMode: 'Normal', chartType: 'area',
      lineColor: 'rgba(181, 106, 63, 1)', topColor: 'rgba(181, 106, 63, 0.22)',
      bottomColor: 'rgba(181, 106, 63, 0.02)', lineWidth: 2,
      dateRanges: ['1d|1', '1m|30', '6m|120', '12m|1D', '60m|1W', 'all|1M']
    });
  }

  // ---------------------------------------------------------------------------
  // Research page -- live rates & FX strip
  // ---------------------------------------------------------------------------
  // Lights up the .rates-strip block on research.html with one TradingView mini
  // chart per card (2026-09-30). Treasury yields are FRED's daily series.
  // ---------------------------------------------------------------------------
  if (document.getElementById('rates-live-strip')) {
    document.querySelectorAll('#rates-live-strip .rates-card').forEach(function (card) {
      var spark = card.querySelector('.rc-spark[data-sym]');
      if (!spark) return;
      spark.classList.remove('loading');
      spark.classList.add('tv-rc');
      tvEmbed(spark, 'mini-symbol-overview', {
        symbol: tvSym(spark.getAttribute('data-sym')), width: '100%', height: 150,
        locale: 'en', dateRange: '12M', colorTheme: 'light', isTransparent: true,
        autosize: false, largeChartUrl: '', noTimeScale: true
      });
      var foot = card.querySelector('.rc-foot');
      if (foot) foot.style.display = 'none';
    });
  }

})();

// =============================================================================
// Footer subscribe injection
// Adds a "Get new posts in your inbox" CTA to every page's footer that links
// to bpleon.substack.com. Centralises the surface so we don't have to edit
// every HTML file when copy or destination changes.
// =============================================================================
(function () {
  var SUBSTACK_URL = 'https://bpleon.substack.com/subscribe';
  var footer = document.querySelector('.site-footer');
  if (!footer) return;
  var inner = footer.querySelector('.footer-inner');
  if (!inner) return;
  // Idempotent: bail if we already injected (e.g., script loaded twice).
  if (footer.querySelector('.footer-subscribe')) return;

  var box = document.createElement('div');
  box.className = 'footer-subscribe';
  box.innerHTML =
    '<p class="footer-subscribe-prompt">Get new posts in your inbox &mdash; free, occasional.</p>' +
    '<a class="btn footer-subscribe-btn" href="' + SUBSTACK_URL + '" target="_blank" rel="noopener">Subscribe &rarr;</a>';
  footer.insertBefore(box, inner);
})();
