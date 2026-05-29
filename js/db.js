window.Slab = window.Slab || {};

(function (Slab) {
  const KEY_INDEX = 'slab_index';
  const { get, set, del } = window.idbKeyval;

  const docKey = (id) => `slab_doc_${id}`;

  async function init() {
    const index = await get(KEY_INDEX);
    if (!index) {
      await set(KEY_INDEX, []);
    }
  }

  async function getIndex() {
    return (await get(KEY_INDEX)) || [];
  }

  async function saveDoc(doc) {
    const index = await getIndex();
    const updatedDoc = { ...doc, updatedAt: Date.now() };
    const idx = index.indexOf(doc.id);
    if (idx !== -1) index.splice(idx, 1);
    index.unshift(doc.id);
    await Promise.all([set(docKey(doc.id), updatedDoc), set(KEY_INDEX, index)]);
    return updatedDoc;
  }

  async function getDoc(id) {
    return get(docKey(id));
  }

  async function getAllDocs() {
    const index = await getIndex();
    if (!index.length) return [];
    const docs = await Promise.all(index.map(getDoc));
    return docs.filter(Boolean);
  }

  async function deleteDoc(id) {
    const index = await getIndex();
    const filtered = index.filter((docId) => docId !== id);
    await Promise.all([del(docKey(id)), set(KEY_INDEX, filtered)]);
  }

  Slab.db = { init, saveDoc, getDoc, getAllDocs, deleteDoc };
})(window.Slab);
