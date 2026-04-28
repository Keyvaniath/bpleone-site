// =============================================================================
// bpleon.com -- progressive enhancements
// Self-hosted ticker tape using free, CORS-friendly APIs:
//   - CoinGecko   (crypto + gold-backed token PAXG)
//   - Frankfurter (FX rates, free, no key, CORS-enabled)
// No third-party widgets, no domain restrictions, no API keys.
// Falls back gracefully if any API call fails.
// =============================================================================

(function () {

  // Auto-update the year in any element with id="year".
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var mount = document.getElementById('ticker-tape');
  if (!mount) return;

  // --- Symbols ------------------------------------------------------------
  var CRYPTO = [
    { id: 'bitcoin',  label: 'BTC' },
    { id: 'ethereum', label: 'ETH' },
    { id: 'solana',   label: 'SOL' },
    { id: 'pax-gold', label: 'GOLD' }   // PAXG -- 1 token = 1 oz gold
  ];
  var FX = ['EUR', 'GBP', 'JPY', 'CNY'];

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

  // --- Render -------------------------------------------------------------
  function item(label, price, change) {
    var dirClass = '';
    if (change && change.length) {
      dirClass = (change.charAt(0) === '-') ? ' down' : ' up';
    }
    return (
      '<span class="ticker-item">' +
        '<span class="ticker-label">' + label + '</span>' +
        '<span class="ticker-price">' + price + '</span>' +
        (change ? '<span class="ticker-change' + dirClass + '">' + change + '</span>' : '') +
      '</span>'
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
    var fxUrl = 'https://api.frankfurter.app/latest?from=USD&to=' + FX.join(',');

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
        console.log('[ticker] Frankfurter response: HTTP ' + r.status);
        return r.ok ? r.json() : null;
      })
      .catch(function (e) {
        console.warn('[ticker] Frankfurter fetch failed:', e && e.message);
        return null;
      });

    Promise.all([cgPromise, fxPromise]).then(function (results) {
      var cg = results[0], fx = results[1];
      console.log('[ticker] CoinGecko data:', cg);
      console.log('[ticker] Frankfurter data:', fx);

      if (cg) {
        CRYPTO.forEach(function (c) {
          var d = cg[c.id];
          if (d && isFinite(d.usd)) {
            items.push(item(c.label, fmtPrice(d.usd), fmtPct(d.usd_24h_change)));
          } else {
            console.warn('[ticker] missing CoinGecko data for ' + c.id);
          }
        });
      } else {
        console.warn('[ticker] no CoinGecko payload');
      }

      if (fx && fx.rates) {
        FX.forEach(function (ccy) {
          var rate = fx.rates[ccy];
          if (rate) {
            items.push(item('USD/' + ccy, fmtFx(rate, ccy), ''));
          } else {
            console.warn('[ticker] missing Frankfurter rate for ' + ccy);
          }
        });
      } else {
        console.warn('[ticker] no Frankfurter payload');
      }

      render(items);
    }).catch(function (e) {
      console.error('[ticker] unexpected error:', e);
      showStatus('Markets data temporarily unavailable');
    });
  }

  fetchAll();
  setInterval(fetchAll, 60 * 1000);   // refresh every 60 seconds

  // Expose for /markets to reuse the same fetched data.
  window.__bpleon_ticker = { CRYPTO: CRYPTO, FX: FX };

})();
