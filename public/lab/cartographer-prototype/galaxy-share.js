// Shareable URL state.
//
// Encodes { era, view, world } into the URL hash so refreshing — or
// pasting the link to someone else — drops them at the same place on
// the map. The three pieces of state live in different components, so
// each owner reads/writes its slice via this module.
//
// Hash format: #era=<id>&view=<segId|galaxy>&world=<worldId>
//
// Keys missing from the URL fall back to whatever the app would have
// chosen anyway (localStorage era, galaxy view, no selection).

(function () {
  const KEYS = ['era', 'view', 'world'];

  function parse() {
    const out = {};
    const h = (window.location.hash || '').replace(/^#/, '');
    if (!h) return out;
    h.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (!k || !v) return;
      if (KEYS.includes(k)) out[k] = decodeURIComponent(v);
    });
    return out;
  }

  // Merge a partial patch into the current hash. We replaceState (not push)
  // so the back-button isn't flooded by every dive/zoom; the user navigates
  // the map, not the URL history.
  let _writeTimer = null;
  function write(patch) {
    const cur = parse();
    const next = { ...cur, ...patch };
    // Strip nulls / 'galaxy' (default view) / empty values to keep hash short.
    const parts = [];
    KEYS.forEach((k) => {
      const v = next[k];
      if (v == null || v === '' || (k === 'view' && v === 'galaxy')) return;
      parts.push(`${k}=${encodeURIComponent(v)}`);
    });
    const hash = parts.length ? '#' + parts.join('&') : '';
    // Debounce — view/world can change rapidly during navigation animations.
    if (_writeTimer) clearTimeout(_writeTimer);
    _writeTimer = setTimeout(() => {
      const newUrl = window.location.pathname + window.location.search + hash;
      try { window.history.replaceState(null, '', newUrl); } catch (e) { /* file:// */ }
    }, 80);
  }

  // Copy a fully-qualified deep link to clipboard. Used by the share button.
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch (e) {
      return false;
    }
  }

  window.__share = { parse, write, copyLink };
})();
