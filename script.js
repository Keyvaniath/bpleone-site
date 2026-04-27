// =============================================================================
// bpleon.com -- progressive enhancements
// The site works fine without this file. This just polishes it:
//   - Auto-updates the year in the footer.
//   - Mounts a TradingView ticker tape into #ticker-tape, themed to match
//     the user's light/dark preference. Re-renders on theme change.
// =============================================================================

(function () {
  // ----- Footer year ---------------------------------------------------------
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ----- TradingView ticker tape --------------------------------------------
  var mount = document.getElementById('ticker-tape');
  if (!mount) return;

  function isDark() {
    return window.matchMedia &&
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function renderTicker() {
    // Clear any prior render (e.g. when theme switches).
    mount.innerHTML =
      '<div class="tradingview-widget-container">' +
        '<div class="tradingview-widget-container__widget"></div>' +
      '</div>';

    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src   = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    s.text  = JSON.stringify({
      "symbols": [
        { "description": "S&P 500",   "proName": "FOREXCOM:SPXUSD" },
        { "description": "Nasdaq",    "proName": "NASDAQ:IXIC" },
        { "description": "Dow",       "proName": "DJ:DJI" },
        { "description": "10Y",       "proName": "TVC:US10Y" },
        { "description": "2Y",        "proName": "TVC:US02Y" },
        { "description": "Gold",      "proName": "TVC:GOLD" },
        { "description": "WTI",       "proName": "TVC:USOIL" },
        { "description": "DXY",       "proName": "TVC:DXY" },
        { "description": "EUR/USD",   "proName": "FX:EURUSD" },
        { "description": "BTC",       "proName": "BITSTAMP:BTCUSD" },
        { "description": "ETH",       "proName": "BITSTAMP:ETHUSD" }
      ],
      "showSymbolLogo": false,
      "isTransparent":  true,
      "displayMode":    "adaptive",
      "colorTheme":     isDark() ? "dark" : "light",
      "locale":         "en"
    });
    mount.querySelector('.tradingview-widget-container').appendChild(s);
  }

  renderTicker();

  // Re-render when the OS theme flips, so colors stay in sync.
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', renderTicker);
    } else if (mq.addListener) {
      // Older Safari / Edge
      mq.addListener(renderTicker);
    }
  }
})();
