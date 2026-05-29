window.Slab = window.Slab || {};

(function (Slab) {
  // Encode a full document object into a URL-safe compressed string
  function buildUrl(doc) {
    const json = JSON.stringify(doc);
    const compressed = window.LZString.compressToEncodedURIComponent(json);
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('doc', compressed);
    return url.toString();
  }

  // Decode a compressed doc string from the URL parameter
  function decodeDoc(encoded) {
    try {
      const json = window.LZString.decompressFromEncodedURIComponent(encoded);
      if (!json) return null;
      const doc = JSON.parse(json);
      // Minimal validation
      if (!doc || typeof doc !== 'object' || !Array.isArray(doc.blocks)) return null;
      return doc;
    } catch {
      return null;
    }
  }

  Slab.share = { buildUrl, decodeDoc };
})(window.Slab);
