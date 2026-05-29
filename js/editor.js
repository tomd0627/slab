window.Slab = window.Slab || {};

(function (Slab) {
  const TOAST_DURATION = 2500;

  Slab.state = {
    activeDocId: null,
    activeDocCreatedAt: null,
    lastSaved: null,
    mode: 'edit',
    saveTimer: null,
  };

  // ── DOM refs ────────────────────────────────────────────────────────
  let $sidebar,
    $docList,
    $sidebarEmpty,
    $newDocBtn,
    $toggleSidebarBtn,
    $editorWelcome,
    $editorPanel,
    $docTitle,
    $lastSaved,
    $modeToggleBtn,
    $shareBtn,
    $exportBtn,
    $deleteDocBtn,
    $shareToast,
    $shareBanner;

  // ── Init ─────────────────────────────────────────────────────────────
  function init() {
    $sidebar = document.getElementById('sidebar');
    $docList = document.getElementById('doc-list');
    $sidebarEmpty = document.getElementById('sidebar-empty');
    $newDocBtn = document.getElementById('new-doc-btn');
    $toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    $editorWelcome = document.getElementById('editor-welcome');
    $editorPanel = document.getElementById('editor-panel');
    $docTitle = document.getElementById('doc-title');
    $lastSaved = document.getElementById('last-saved');
    $modeToggleBtn = document.getElementById('mode-toggle-btn');
    $shareBtn = document.getElementById('share-btn');
    $exportBtn = document.getElementById('export-btn');
    $deleteDocBtn = document.getElementById('delete-doc-btn');
    $shareToast = document.getElementById('share-toast');
    $shareBanner = document.getElementById('share-banner');

    $newDocBtn.addEventListener('click', newDoc);
    $docList.addEventListener('click', handleSidebarClick);
    $toggleSidebarBtn.addEventListener('click', toggleSidebar);
    $docTitle.addEventListener('input', scheduleSave);
    $modeToggleBtn.addEventListener('click', toggleMode);
    $shareBtn.addEventListener('click', handleShare);
    $exportBtn.addEventListener('click', handleExport);
    $deleteDocBtn.addEventListener('click', handleDeleteActive);
    document.addEventListener('keydown', handleGlobalKeydown);
    document.addEventListener('click', handleDocumentClick);

    Slab.drag.init();

    const blockList = document.getElementById('block-list');
    blockList.addEventListener('slab:reorder', scheduleSave);
    blockList.addEventListener('keydown', handleBlockKeydown);
    blockList.addEventListener('input', handleBlockInput);
    blockList.addEventListener('click', handleBlockClick);
    blockList.addEventListener('change', handleCheckboxChange);
    blockList.addEventListener('paste', handleBlockPaste);
  }

  // ── Block event handlers ─────────────────────────────────────────────
  function handleBlockKeydown(e) {
    const content = e.target.closest('.block__content');
    if (!content) return;
    const block = content.closest('.block');
    if (!block) return;
    const mod = e.metaKey || e.ctrlKey;
    const menu = document.getElementById('slash-menu');

    // Slash menu navigation
    if (!menu.hidden) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        Slab.blocks.navigateSlashMenu(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        Slab.blocks.navigateSlashMenu(-1);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        Slab.blocks.confirmSlashMenu();
        return;
      }
      if (e.key === 'Escape') {
        Slab.blocks.hideSlashMenu();
        content.focus();
        return;
      }
    }

    // Inline formatting
    if (mod && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold');
      return;
    }
    if (mod && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic');
      return;
    }
    if (mod && e.key === '`') {
      e.preventDefault();
      wrapInlineCode();
      return;
    }

    // Mode toggle shortcut
    if (mod && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      toggleMode();
      return;
    }

    // Enter: create new block or split
    if (e.key === 'Enter' && !e.shiftKey) {
      const type = block.dataset.blockType;
      if (type === 'code') return; // natural line break in code blocks
      e.preventDefault();
      handleEnterKey(block, content);
      return;
    }

    // Backspace: delete block when empty
    if (e.key === 'Backspace') {
      const type = block.dataset.blockType;
      if (type === 'divider' || !content.textContent.trim()) {
        e.preventDefault();
        deleteBlock(block);
        return;
      }
    }
  }

  function handleBlockInput(e) {
    const content = e.target.closest('.block__content');
    if (!content) return;
    const block = content.closest('.block');

    // Open slash menu when '/' is typed into an otherwise empty paragraph
    if (content.textContent === '/' && block.dataset.blockType === 'paragraph') {
      content.textContent = '';
      Slab.blocks.showSlashMenu(content, (newType) => {
        Slab.blocks.convertType(block, newType);
        scheduleSave();
      });
      return;
    }

    scheduleSave();
  }

  function handleBlockClick(e) {
    const moveUp = e.target.closest('.block__move-up');
    if (moveUp) {
      const block = moveUp.closest('.block');
      const prev = block.previousElementSibling;
      if (prev) prev.insertAdjacentElement('beforebegin', block);
      block.querySelector('.block__content')?.focus();
      scheduleSave();
      return;
    }

    const moveDown = e.target.closest('.block__move-down');
    if (moveDown) {
      const block = moveDown.closest('.block');
      const next = block.nextElementSibling;
      if (next) next.insertAdjacentElement('afterend', block);
      block.querySelector('.block__content')?.focus();
      scheduleSave();
      return;
    }

    const typeTrigger = e.target.closest('.block__type-trigger');
    if (typeTrigger) {
      const block = typeTrigger.closest('.block');
      const anchor = block.querySelector('.block__content') || block;
      Slab.blocks.showSlashMenu(anchor, (newType) => {
        Slab.blocks.convertType(block, newType);
        scheduleSave();
      });
      return;
    }

    const copyBtn = e.target.closest('.block__copy-btn');
    if (copyBtn) {
      const block = copyBtn.closest('.block');
      const contentEl = block.querySelector('.block__content');
      const text = contentEl ? contentEl.textContent : '';
      navigator.clipboard
        .writeText(text)
        .then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 1500);
        })
        .catch(() => {
          copyBtn.textContent = 'Failed';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 1500);
        });
      return;
    }
  }

  function handleCheckboxChange(e) {
    if (e.target.type !== 'checkbox') return;
    const block = e.target.closest('.block');
    if (block) block.dataset.checked = String(e.target.checked);
    scheduleSave();
  }

  function handleBlockPaste(e) {
    const content = e.target.closest('.block__content');
    if (!content) return;
    const block = content.closest('.block');
    if (!block || block.dataset.blockType !== 'code') return;
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  function handleDocumentClick(e) {
    const menu = document.getElementById('slash-menu');
    if (!menu.hidden && !menu.contains(e.target)) {
      Slab.blocks.hideSlashMenu();
    }
  }

  // ── Enter key: new block or split ────────────────────────────────────
  function handleEnterKey(block, content) {
    const sel = window.getSelection();
    const atEnd = isAtEnd(content);
    const isEmpty = !content.textContent.trim();

    if (atEnd || isEmpty) {
      // Append a fresh paragraph after this block
      const newBlock = Slab.blocks.create({
        id: crypto.randomUUID(),
        type: 'paragraph',
        content: '',
        checked: false,
        lang: '',
      });
      block.insertAdjacentElement('afterend', newBlock);
      Slab.blocks.focusStart(newBlock.querySelector('.block__content'));
    } else if (sel.rangeCount) {
      // Split content at cursor
      const range = sel.getRangeAt(0);
      const afterRange = range.cloneRange();
      afterRange.setEndAfter(content.lastChild || content);
      const fragment = afterRange.extractContents();
      const tmp = document.createElement('div');
      tmp.appendChild(fragment);
      const afterHtml = tmp.innerHTML.replace(/^<br\s*\/?>/, '').trim();

      // Headings split into paragraph
      const newType = ['heading1', 'heading2', 'heading3'].includes(block.dataset.blockType)
        ? 'paragraph'
        : block.dataset.blockType;

      const newBlock = Slab.blocks.create({
        id: crypto.randomUUID(),
        type: newType,
        content: afterHtml,
        checked: false,
        lang: '',
      });
      block.insertAdjacentElement('afterend', newBlock);
      Slab.blocks.focusStart(newBlock.querySelector('.block__content'));
    }
    scheduleSave();
  }

  // ── Delete a block, focus previous or next ───────────────────────────
  function deleteBlock(block) {
    const prev = block.previousElementSibling;
    const next = block.nextElementSibling;
    block.remove();
    const target = prev || next;
    if (target) {
      Slab.blocks.focusEnd(target.querySelector('.block__content'));
    } else {
      // All blocks gone — insert a fresh paragraph
      const newBlock = Slab.blocks.create({
        id: crypto.randomUUID(),
        type: 'paragraph',
        content: '',
        checked: false,
        lang: '',
      });
      document.getElementById('block-list').appendChild(newBlock);
      Slab.blocks.focusStart(newBlock.querySelector('.block__content'));
    }
    scheduleSave();
  }

  // ── Is selection caret at the end of el? ─────────────────────────────
  function isAtEnd(el) {
    const sel = window.getSelection();
    if (!sel.rangeCount || !sel.getRangeAt(0).collapsed) return false;
    const range = sel.getRangeAt(0);
    const endRange = document.createRange();
    endRange.selectNodeContents(el);
    endRange.collapse(false);
    return range.compareBoundaryPoints(Range.END_TO_END, endRange) === 0;
  }

  // ── Wrap selection in <code> ─────────────────────────────────────────
  function wrapInlineCode() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const code = document.createElement('code');
    code.textContent = range.toString();
    range.deleteContents();
    range.insertNode(code);
    const after = document.createRange();
    after.setStartAfter(code);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }

  // ── Sidebar rendering ────────────────────────────────────────────────
  function renderSidebar(docs) {
    $docList.innerHTML = '';
    if (!docs.length) {
      $sidebarEmpty.hidden = false;
      return;
    }
    $sidebarEmpty.hidden = true;
    docs.forEach((doc) => {
      $docList.appendChild(renderDocItem(doc));
    });
  }

  function renderDocItem(doc) {
    const li = document.createElement('li');
    li.className = 'doc-list__item';
    li.dataset.docId = doc.id;
    if (doc.id === Slab.state.activeDocId) li.dataset.active = 'true';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'doc-list__item-btn';
    openBtn.setAttribute('aria-label', `Open: ${doc.title || 'Untitled Document'}`);

    const title = document.createElement('span');
    title.className = 'doc-list__item-title';
    title.textContent = doc.title || 'Untitled Document';

    const time = document.createElement('span');
    time.className = 'doc-list__item-time';
    time.textContent = formatTime(doc.updatedAt);

    openBtn.append(title, time);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'doc-list__item-delete';
    deleteBtn.setAttribute('aria-label', `Delete: ${doc.title || 'Untitled Document'}`);
    deleteBtn.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false" width="20" height="20">' +
      '<use href="assets/icons.svg#icon-trash" /></svg>';

    li.append(openBtn, deleteBtn);
    return li;
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  // ── Document lifecycle ───────────────────────────────────────────────
  async function newDoc() {
    const doc = {
      id: crypto.randomUUID(),
      title: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blocks: [],
    };
    const saved = await Slab.db.saveDoc(doc);
    await refreshSidebar();
    await openDoc(saved.id);
    $docTitle.focus();
  }

  async function openDoc(id) {
    const doc = await Slab.db.getDoc(id);
    if (!doc) return;

    Slab.state.activeDocId = id;
    Slab.state.activeDocCreatedAt = doc.createdAt;

    document.querySelectorAll('.doc-list__item').forEach((el) => {
      el.dataset.active = el.dataset.docId === id ? 'true' : 'false';
    });

    $editorWelcome.hidden = true;
    $editorPanel.hidden = false;

    $docTitle.textContent = doc.title || '';
    Slab.blocks.render(doc.blocks || []);
    updateLastSaved(doc.updatedAt);
  }

  // ── Auto-save ────────────────────────────────────────────────────────
  function scheduleSave() {
    clearTimeout(Slab.state.saveTimer);
    Slab.state.saveTimer = setTimeout(saveNow, 500);
  }

  async function saveNow() {
    Slab.state.saveTimer = null;
    if (!Slab.state.activeDocId) return;

    const doc = {
      id: Slab.state.activeDocId,
      title: $docTitle.textContent.trim(),
      createdAt: Slab.state.activeDocCreatedAt || Date.now(),
      blocks: Slab.blocks.serialize(),
    };

    const saved = await Slab.db.saveDoc(doc);
    Slab.state.lastSaved = new Date(saved.updatedAt);
    updateLastSaved(saved.updatedAt);

    const item = $docList.querySelector(`[data-doc-id="${saved.id}"]`);
    if (item) {
      const titleEl = item.querySelector('.doc-list__item-title');
      if (titleEl) titleEl.textContent = saved.title || 'Untitled Document';
      const timeEl = item.querySelector('.doc-list__item-time');
      if (timeEl) timeEl.textContent = formatTime(saved.updatedAt);
      const openBtn = item.querySelector('.doc-list__item-btn');
      if (openBtn)
        openBtn.setAttribute('aria-label', `Open: ${saved.title || 'Untitled Document'}`);
    }
  }

  function updateLastSaved(timestamp) {
    if (!timestamp) {
      $lastSaved.textContent = '';
      return;
    }
    const t = new Date(timestamp);
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    $lastSaved.textContent = `Saved ${hh}:${mm}`;
  }

  // ── Delete ───────────────────────────────────────────────────────────
  async function handleDeleteActive() {
    if (!Slab.state.activeDocId) return;
    const title = $docTitle.textContent.trim() || 'Untitled Document';
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteDocById(Slab.state.activeDocId);
  }

  async function handleSidebarClick(e) {
    const deleteBtn = e.target.closest('.doc-list__item-delete');
    if (deleteBtn) {
      const item = deleteBtn.closest('.doc-list__item');
      const docId = item.dataset.docId;
      const titleEl = item.querySelector('.doc-list__item-title');
      const title = titleEl ? titleEl.textContent : 'Untitled Document';
      if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
      await deleteDocById(docId);
      return;
    }

    const openBtn = e.target.closest('.doc-list__item-btn');
    if (openBtn) {
      const item = openBtn.closest('.doc-list__item');
      await openDoc(item.dataset.docId);
    }
  }

  async function deleteDocById(id) {
    await Slab.db.deleteDoc(id);
    if (Slab.state.activeDocId === id) {
      Slab.state.activeDocId = null;
      Slab.state.activeDocCreatedAt = null;
      $editorPanel.hidden = true;
      $editorWelcome.hidden = false;
    }
    await refreshSidebar();
  }

  async function refreshSidebar() {
    const docs = await Slab.db.getAllDocs();
    renderSidebar(docs);
  }

  // ── Mode toggle ──────────────────────────────────────────────────────
  function toggleMode() {
    const isRead = document.body.dataset.mode === 'read';
    const next = isRead ? 'edit' : 'read';
    document.body.dataset.mode = next;
    Slab.state.mode = next;

    // Actually disable/enable editing so read mode is not just cosmetic
    const editable = isRead; // switching to edit → true, switching to read → false
    $docTitle.contentEditable = String(editable);
    document.querySelectorAll('.block__content').forEach((el) => {
      el.contentEditable = String(editable);
    });

    $modeToggleBtn.setAttribute('aria-pressed', String(!isRead));
    $modeToggleBtn.setAttribute(
      'aria-label',
      isRead ? 'Switch to reading mode' : 'Switch to editing mode'
    );
  }

  // ── Sidebar visibility (mobile) ───────────────────────────────────────
  function toggleSidebar() {
    const isOpen = $sidebar.classList.toggle('is-open');
    $toggleSidebarBtn.setAttribute('aria-expanded', String(isOpen));
  }

  // ── Share ────────────────────────────────────────────────────────────
  function handleShare() {
    if (!Slab.state.activeDocId) return;
    const doc = {
      id: Slab.state.activeDocId,
      title: $docTitle.textContent.trim(),
      createdAt: Slab.state.activeDocCreatedAt || Date.now(),
      blocks: Slab.blocks.serialize(),
    };
    const url = Slab.share.buildUrl(doc);
    navigator.clipboard
      .writeText(url)
      .then(showToast)
      .catch(() => {
        prompt('Copy this link:', url);
      });
  }

  function showToast() {
    $shareToast.hidden = false;
    setTimeout(() => {
      $shareToast.hidden = true;
    }, TOAST_DURATION);
  }

  // ── Export ───────────────────────────────────────────────────────────
  async function handleExport() {
    if (!Slab.state.activeDocId) return;
    const title = $docTitle.textContent.trim() || 'Untitled Document';
    const blocks = Slab.blocks.serialize();
    Slab.export.download(title, blocks);
  }

  // ── Global keyboard ──────────────────────────────────────────────────
  function handleGlobalKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      toggleMode();
    }
  }

  // ── Read-only mode (shared URL) ───────────────────────────────────────
  async function openSharedDoc(doc) {
    Slab.state.activeDocId = null;
    $editorWelcome.hidden = true;
    $editorPanel.hidden = false;
    $shareBanner.hidden = false;
    $docTitle.textContent = doc.title || '';
    Slab.blocks.render(doc.blocks || []);
    document.body.dataset.mode = 'read';
    Slab.state.mode = 'read';
    $modeToggleBtn.setAttribute('aria-pressed', 'true');
    $modeToggleBtn.setAttribute('aria-label', 'Switch to editing mode');
  }

  Slab.editor = {
    init,
    openDoc,
    newDoc,
    saveNow,
    scheduleSave,
    refreshSidebar,
    renderSidebar,
    toggleMode,
    formatTime,
    openSharedDoc,
  };
})(window.Slab);
