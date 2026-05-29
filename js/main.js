window.Slab = window.Slab || {};

(function (Slab) {
  document.addEventListener('DOMContentLoaded', async () => {
    await Slab.db.init();
    Slab.editor.init();

    // If URL carries a shared document, render it read-only (no DB write)
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('doc');
    if (encoded) {
      const doc = Slab.share.decodeDoc(encoded);
      if (doc) {
        await Slab.editor.openSharedDoc(doc);
        return;
      }
    }

    // Otherwise load saved documents and open the most recent one
    const docs = await Slab.db.getAllDocs();
    Slab.editor.renderSidebar(docs);
    if (docs.length) {
      await Slab.editor.openDoc(docs[0].id);
    }
  });
})(window.Slab);
