// =============================================================================
// bpleon.com -- progressive enhancements
// Self-hosted ticker tape using free, CORS-friendly APIs:
//   - CoinGecko        (crypto + gold-backed token PAXG)
//   - currency-api     (FX rates, no key, CORS via jsDelivr CDN)
//                      https://github.com/fawazahmed0/exchange-api
//   - bpleon-quotes    (Cloudflare Worker proxying Yahoo Finance for the
//                      10Y Treasury yield + US ETFs + global indexes)
//                      Worker source lives in Cloudflare dashboard.
// No third-party widgets, no API keys, no public dependency we don't control.
// Falls back gracefully if any API call fails.
// =============================================================================

(function () {

  // Auto-update the year in any element with id="year".
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var mount = document.getElementById('ticker-tape');
  if (!mount) return;

  // --- Symbols ------------------------------------------------------------
  // Edit these arrays to change what scrolls in the ticker.
  var CRYPTO = [
    { id: 'bitcoin',  label: 'BTC' },
    { id: 'ethereum', label: 'ETH' },
    { id: 'solana',   label: 'SOL' },
    { id: 'pax-gold', label: 'GOLD' }   // PAXG -- 1 token = 1 oz gold
  ];
  var FX = ['EUR', 'GBP', 'JPY'];

  // Yahoo Finance symbols routed through the Cloudflare Worker proxy.
  // 'fmt' controls how the price renders:
  //   'yield' -> 4.35% with basis-point change (e.g. +5bp)
  //   'price' -> $512.34 with percent change
  //   'index' -> 8,456.78 with percent change (no $ -- index points)
  var INDEXES = [
    { sym: '^TNX',   label: '10Y',    fmt: 'yield' },   // 10-Year Treasury
    { sym: '^VIX',   label: 'VIX',    fmt: 'index' },   // CBOE Volatility Index
    { sym: 'SPY',    label: 'SPY',    fmt: 'price' },   // S&P 500 ETF
    { sym: 'QQQ',    label: 'QQQ',    fmt: 'price' },   // Nasdaq-100 ETF
    { sym: 'IWV',    label: 'IWV',    fmt: 'price' },   // Russell 3000 ETF
    { sym: '^FTSE',  label: 'FTSE',   fmt: 'index' },   // FTSE 100 (UK)
    { sym: '^GDAXI', label: 'DAX',    fmt: 'index' },   // DAX (Germany)
    { sym: '^N225',  label: 'NIKKEI', fmt: 'index' },   // Nikkei 225 (Japan)
    { sym: '^HSI',   label: 'HANG',   fmt: 'index' }    // Hang Seng (HK)
  ];
  var WORKER_URL = 'https://bpleon-quotes.brandonpleone.workers.dev/';

  // --- Formatting ---------------------------------------------------------
  function fmtPrice(p) {
    if (!isFinite(p)) return '—';
    if (p >= 1000) return '$' + Math.round(p).toLocaleString();
    if (p >= 1)    return '$' + p.toFixed(2);
    return '$' + p.toFixed(4);
  }
  function fmtPct(c) {
    if (!isFinite(c)) return '';
    var sign = c >= 0 ? '+' : '';
    return sign + c.toFixed(2) + '%';
  }
  function fmtFx(p, ccy) {
    if (!isFinite(p)) return '—';
    return p.toFixed(ccy === 'JPY' || ccy === 'CNY' ? 2 : 4);
  }

  // --- Source links -------------------------------------------------------
  // Each ticker item links to the canonical "read more" page for that symbol.
  function coingeckoLink(id) {
    return 'https://www.coingecko.com/en/coins/' + id;
  }
  function yahooLink(sym) {
    return 'https://finance.yahoo.com/quote/' + encodeURIComponent(sym) + '/';
  }
  // Yahoo Finance forex pair convention: stronger currency goes first.
  // EUR & GBP trade as ccyUSD=X; JPY/CNY/etc. trade as USDccy=X.
  var FX_YAHOO = {
    EUR: 'EURUSD=X',
    GBP: 'GBPUSD=X',
    JPY: 'USDJPY=X',
    CHF: 'USDCHF=X',
    CAD: 'USDCAD=X',
    AUD: 'AUDUSD=X',
    CNY: 'USDCNY=X'
  };
  function fxLink(ccy) {
    var sym = FX_YAHOO[ccy] || ('USD' + ccy + '=X');
    return yahooLink(sym);
  }

  // --- Render -------------------------------------------------------------
  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
  function item(label, price, change, link) {
    var dirClass = '';
    if (change && change.length) {
      dirClass = (change.charAt(0) === '-') ? ' down' : ' up';
    }
    var openTag, closeTag;
    if (link) {
      openTag = '<a class="ticker-item" href="' + escapeAttr(link) +
                '" target="_blank" rel="noopener noreferrer">';
      closeTag = '</a>';
    } else {
      openTag = '<span class="ticker-item">';
      closeTag = '</span>';
    }
    return (
      openTag +
        '<span class="ticker-label">' + label + '</span>' +
        '<span class="ticker-price">' + price + '</span>' +
        (change ? '<span class="ticker-change' + dirClass + '">' + change + '</span>' : '') +
      closeTag
    );
  }

  // Show a status line in the ticker bar (loading / error / fallback).
  function showStatus(msg) {
    mount.style.display = '';
    mount.innerHTML =
      '<div class="ticker-track" style="animation:none;padding-left:24px;">' +
        '<span class="ticker-item"><span class="ticker-label">' + msg + '</span></span>' +
      '</div>';
  }

  function render(items) {
    if (!items.length) {
      console.log('[ticker] no items returned -- showing fallback message');
      showStatus('Markets data temporarily unavailable');
      return;
    }
    console.log('[ticker] rendering ' + items.length + ' items');
    // Duplicate items so the marquee can loop seamlessly.
    var html = items.join('') + items.join('');
    mount.innerHTML = '<div class="ticker-track">' + html + '</div>';
  }

  // Show immediate loading state so the bar is never blank on first paint.
  showStatus('Loading market data…');

  // --- Fetch + render -----------------------------------------------------
  function fetchAll() {
    console.log('[ticker] fetchAll() starting at ' + new Date().toISOString());
    var items = [];

    var cryptoIds = CRYPTO.map(function (c) { return c.id; }).join(',');
    var cgUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=' +
                cryptoIds + '&vs_currencies=usd&include_24hr_change=true';
    // currency-api -- USD as the base; lowercase ISO codes in the response.
    var fxUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
    // Cloudflare Worker proxy -- one round-trip for 10Y + ETFs + global indexes.
    var ixSymbols = INDEXES.map(function (x) { return x.sym; }).join(',');
    var ixUrl = WORKER_URL + '?symbols=' + encodeURIComponent(ixSymbols);

    var cgPromise = fetch(cgUrl)
      .then(function (r) {
        console.log('[ticker] CoinGecko response: HTTP ' + r.status);
        return r.ok ? r.json() : null;
      })
      .catch(function (e) {
        console.warn('[ticker] CoinGecko fetch failed:', e && e.message);
        return null;
      });

    var fxPromise = fetch(fxUrl)
      .then(function (r) {
        console.log('[ticker] currency-api response: HTTP ' + r.status);
        return r.ok ? r.json() : null;
      })
      .catch(function (e) {
        console.warn('[ticker] currency-api fetch failed:', e && e.message);
        return null;
      });

    var ixPromise = fetch(ixUrl)
      .then(function (r) {
        console.log('[ticker] Worker response: HTTP ' + r.status);
        return r.ok ? r.json() : null;
      })
      .catch(function (e) {
        console.warn('[ticker] Worker fetch failed:', e && e.message);
        return null;
      });

    Promise.all([cgPromise, fxPromise, ixPromise]).then(function (results) {
      var cg = results[0], fx = results[1], ix = results[2];
      console.log('[ticker] CoinGecko data:', cg);
      console.log('[ticker] currency-api data:', fx);
      console.log('[ticker] Worker (Yahoo) data:', ix);

      if (cg) {
        CRYPTO.forEach(function (c) {
          var d = cg[c.id];
          if (d && isFinite(d.usd)) {
            items.push(item(
              c.label,
              fmtPrice(d.usd),
              fmtPct(d.usd_24h_change),
              coingeckoLink(c.id)
            ));
          } else {
            console.warn('[ticker] missing CoinGecko data for ' + c.id);
          }
        });
      } else {
        console.warn('[ticker] no CoinGecko payload');
      }

      // Indexes (10Y -> US ETFs -> global) render between crypto and FX.
      if (ix && ix.quoteResponse && ix.quoteResponse.result) {
        var bySym = {};
        ix.quoteResponse.result.forEach(function (q) { bySym[q.symbol] = q; });

        INDEXES.forEach(function (x) {
          var q = bySym[x.sym];
          if (!q || !isFinite(q.regularMarketPrice)) {
            console.warn('[ticker] missing Yahoo data for ' + x.sym);
            return;
          }
          var price = q.regularMarketPrice;
          var changePct = q.regularMarketChangePercent;
          var changeAbs = q.regularMarketChange;
          var priceStr, changeStr;

          if (x.fmt === 'yield') {
            // 10Y: show yield with basis-point change (1bp = 0.01%).
            priceStr = price.toFixed(2) + '%';
            if (isFinite(changeAbs)) {
              var bp = Math.round(changeAbs * 100);
              changeStr = (bp >= 0 ? '+' : '') + bp + 'bp';
            } else {
              changeStr = '';
            }
          } else if (x.fmt === 'index') {
            // Global indexes: thousands-separated, no $.
            priceStr = price.toLocaleString(undefined, { maximumFractionDigits: 2 });
            changeStr = isFinite(changePct) ? fmtPct(changePct) : '';
          } else {
            // Default: $-prefixed price (US ETFs).
            priceStr = fmtPrice(price);
            changeStr = isFinite(changePct) ? fmtPct(changePct) : '';
          }

          items.push(item(x.label, priceStr, changeStr, yahooLink(x.sym)));
        });
      } else {
        console.warn('[ticker] no Worker payload');
      }

      if (fx && fx.usd) {
        FX.forEach(function (ccy) {
          var rate = fx.usd[ccy.toLowerCase()];
          if (rate) {
            items.push(item('USD/' + ccy, fmtFx(rate, ccy), '', fxLink(ccy)));
          } else {
            console.warn('[ticker] missing currency-api rate for ' + ccy);
          }
        });
      } else {
        console.warn('[ticker] no currency-api payload');
      }

      render(items);
    }).catch(function (e) {
      console.error('[ticker] unexpected error:', e);
      showStatus('Markets data temporarily unavailable');
    });
  }

  fetchAll();
  setInterval(fetchAll, 60 * 1000);   // refresh every 60 seconds

  // --- Drag-to-scrub ------------------------------------------------------
  // Lets the reader pause/scroll the marquee with mouse or finger, and click
  // an item to follow its source link. Clicks are suppressed if the pointer
  // moved more than CLICK_THRESHOLD pixels (so a drag doesn't accidentally
  // open a tab).
  (function setupDrag() {
    var CLICK_THRESHOLD = 5;  // pixels
    var drag = {
      active: false, startX: 0, startOffset: 0, moved: 0, track: null
    };

    function getTransformX(el) {
      var t = window.getComputedStyle(el).transform;
      if (!t || t === 'none') return 0;
      var m = t.match(/matrix.*\(([^)]+)\)/);
      if (!m) return 0;
      var p = m[1].split(',').map(parseFloat);
      return p.length === 6 ? p[4] : (p.length === 16 ? p[12] : 0);
    }
    function pointerX(e) {
      if (e.touches && e.touches[0]) return e.touches[0].clientX;
      return e.clientX;
    }

    function onDown(e) {
      // Don't start a drag if the user clicked something else (e.g. nav).
      var track = mount.querySelector('.ticker-track');
      if (!track) return;
      drag.active = true;
      drag.startX = pointerX(e);
      drag.startOffset = getTransformX(track);
      drag.moved = 0;
      drag.track = track;
      track.style.animationPlayState = 'paused';
      mount.classList.add('dragging');
    }
    function onMove(e) {
      if (!drag.active || !drag.track) return;
      var dx = pointerX(e) - drag.startX;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      drag.track.style.transform = 'translateX(' + (drag.startOffset + dx) + 'px)';
      if (drag.moved > CLICK_THRESHOLD && e.cancelable) e.preventDefault();
    }
    function onUp() {
      if (!drag.active) return;
      drag.active = false;
      // Track stays paused at dragged position. Animation resumes only when
      // the cursor leaves the ticker entirely (see onLeave below) -- gives
      // the reader time to see/click the symbol they dragged to.
    }
    function onLeave() {
      if (drag.active) return;
      if (drag.track) {
        drag.track.style.transform = '';
        drag.track.style.animationPlayState = '';
        drag.track = null;
      }
      mount.classList.remove('dragging');
    }

    // Suppress an immediate click if the user actually dragged.
    function onClickCapture(e) {
      if (drag.moved > CLICK_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
        drag.moved = 0;  // reset so the next real click works
      }
    }

    mount.addEventListener('mousedown', onDown);
    mount.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    mount.addEventListener('mouseleave', onLeave);
    mount.addEventListener('click', onClickCapture, true);
  })();

  // Expose for /markets to reuse the same fetched data.
  window.__bpleon_ticker = { CRYPTO: CRYPTO, FX: FX, INDEXES: INDEXES };

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
