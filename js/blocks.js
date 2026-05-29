window.Slab = window.Slab || {};

(function (Slab) {
  const BLOCK_TYPES = [
    { type: 'paragraph', label: 'Paragraph', desc: 'Plain text', icon: 'icon-document-text' },
    {
      type: 'heading1',
      label: 'Heading 1',
      desc: 'Large section title',
      icon: 'icon-document-text',
    },
    {
      type: 'heading2',
      label: 'Heading 2',
      desc: 'Medium section title',
      icon: 'icon-document-text',
    },
    {
      type: 'heading3',
      label: 'Heading 3',
      desc: 'Small section title',
      icon: 'icon-document-text',
    },
    {
      type: 'callout',
      label: 'Callout',
      desc: 'Highlighted note',
      icon: 'icon-information-circle',
    },
    { type: 'code', label: 'Code', desc: 'Code with syntax label', icon: 'icon-code-bracket' },
    { type: 'checklist', label: 'Checklist', desc: 'Task list item', icon: 'icon-list-bullet' },
    { type: 'divider', label: 'Divider', desc: 'Horizontal rule', icon: 'icon-minus' },
  ];

  // Placeholder for content of the block list
  const $list = () => document.getElementById('block-list');

  // ── Render a full block array into the DOM ───────────────────────────
  function render(blocks) {
    const list = $list();
    list.innerHTML = '';
    if (!blocks.length) {
      list.appendChild(
        create({
          id: crypto.randomUUID(),
          type: 'paragraph',
          content: '',
          checked: false,
          lang: '',
        })
      );
      return;
    }
    blocks.forEach((block) => {
      list.appendChild(create(block));
    });
  }

  // ── Create a single block element ────────────────────────────────────
  function create(block) {
    const el = document.createElement('div');
    el.className = 'block';
    el.dataset.blockId = block.id;
    el.dataset.blockType = block.type;
    if (block.type === 'checklist' && block.checked) el.dataset.checked = 'true';

    el.appendChild(buildDragHandle());
    el.appendChild(buildActions());
    el.appendChild(buildBody(block));

    return el;
  }

  function buildDragHandle() {
    const handle = document.createElement('div');
    handle.className = 'block__drag-handle';
    handle.setAttribute('draggable', 'true');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', 'Drag to reorder block');
    handle.setAttribute('title', 'Drag to reorder');
    handle.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false" width="20" height="20">' +
      '<use href="assets/icons.svg#icon-ellipsis-vertical" /></svg>';
    return handle;
  }

  function buildActions() {
    const actions = document.createElement('div');
    actions.className = 'block__actions';

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'block__move-up';
    up.setAttribute('aria-label', 'Move block up');
    up.setAttribute('title', 'Move up');
    up.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false">' +
      '<use href="assets/icons.svg#icon-arrow-up" /></svg>';

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'block__move-down';
    down.setAttribute('aria-label', 'Move block down');
    down.setAttribute('title', 'Move down');
    down.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false">' +
      '<use href="assets/icons.svg#icon-arrow-down" /></svg>';

    const typeTrigger = document.createElement('button');
    typeTrigger.type = 'button';
    typeTrigger.className = 'block__type-trigger';
    typeTrigger.setAttribute('aria-label', 'Change block type');
    typeTrigger.setAttribute('title', 'Change block type');
    typeTrigger.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false">' +
      '<use href="assets/icons.svg#icon-squares-2x2" /></svg>';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'block__delete';
    deleteBtn.setAttribute('aria-label', 'Delete block');
    deleteBtn.setAttribute('title', 'Delete block');
    deleteBtn.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false">' +
      '<use href="assets/icons.svg#icon-trash" /></svg>';

    actions.append(up, down, typeTrigger, deleteBtn);
    return actions;
  }

  function buildBody(block) {
    const body = document.createElement('div');
    body.className = 'block__body';

    if (block.type === 'divider') {
      const hr = document.createElement('hr');
      body.appendChild(hr);
      return body;
    }

    if (block.type === 'callout') {
      const icon = document.createElement('span');
      icon.className = 'block__callout-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML =
        '<svg class="icon" aria-hidden="true" focusable="false" width="20" height="20">' +
        '<use href="assets/icons.svg#icon-information-circle" /></svg>';
      body.appendChild(icon);
      body.appendChild(buildContent(block));
      return body;
    }

    if (block.type === 'code') {
      const langLabel = document.createElement('span');
      langLabel.className = 'block__code-lang';
      langLabel.textContent = block.lang || '';
      langLabel.setAttribute('aria-hidden', 'true');

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'block__copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
      copyBtn.innerHTML =
        '<svg class="icon block__copy-icon" aria-hidden="true" focusable="false">' +
        '<use href="assets/icons.svg#icon-clipboard" /></svg>' +
        '<span class="block__copy-label">Copy</span>';

      body.appendChild(langLabel);
      body.appendChild(buildContent(block));
      body.appendChild(copyBtn);
      return body;
    }

    if (block.type === 'checklist') {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(block.checked);
      checkbox.setAttribute('aria-label', 'Toggle completion');

      label.appendChild(checkbox);
      label.appendChild(buildContent(block));
      body.appendChild(label);
      return body;
    }

    body.appendChild(buildContent(block));
    return body;
  }

  function buildContent(block) {
    const content = document.createElement('div');
    content.className = 'block__content';
    content.setAttribute('role', 'textbox');
    content.setAttribute('aria-multiline', 'true');
    content.setAttribute('data-placeholder', placeholderFor(block.type));
    content.setAttribute('spellcheck', 'true');

    if (block.type === 'code') {
      content.setAttribute('contenteditable', 'true');
      content.textContent = block.content || '';
    } else {
      content.setAttribute('contenteditable', 'true');
      content.innerHTML = block.content || '';
    }

    return content;
  }

  function placeholderFor(type) {
    const map = {
      paragraph: 'Start typing or press / …',
      heading1: 'Heading 1',
      heading2: 'Heading 2',
      heading3: 'Heading 3',
      callout: 'Note…',
      code: 'Write code here…',
      checklist: 'To-do…',
    };
    return map[type] || '';
  }

  // ── Serialize DOM → Block[] ──────────────────────────────────────────
  function serialize() {
    const blocks = [];
    const items = $list().querySelectorAll('.block');
    items.forEach((el) => {
      const type = el.dataset.blockType;
      const id = el.dataset.blockId || crypto.randomUUID();
      const checked = el.dataset.checked === 'true';

      let content = '';
      let lang = '';

      if (type === 'divider') {
        blocks.push({ id, type, content: '', checked: false, lang: '' });
        return;
      }

      const contentEl = el.querySelector('.block__content');
      if (contentEl) {
        content = type === 'code' ? contentEl.textContent : normalizeHtml(contentEl.innerHTML);
      }

      const langEl = el.querySelector('.block__code-lang');
      if (langEl) lang = langEl.textContent.trim();

      blocks.push({ id, type, content, checked, lang });
    });
    return blocks;
  }

  function normalizeHtml(html) {
    // Strip trailing <br> and normalize Chrome's <div>-based line breaks
    return html
      .replace(/<div>/gi, '<br>')
      .replace(/<\/div>/gi, '')
      .replace(/(<br\s*\/?>)+$/i, '')
      .trim();
  }

  // ── Convert a block's type in-place ──────────────────────────────────
  function convertType(blockEl, newType) {
    const id = blockEl.dataset.blockId;
    const contentEl = blockEl.querySelector('.block__content');
    const content = contentEl ? normalizeHtml(contentEl.innerHTML) : '';

    const newBlock = { id, type: newType, content, checked: false, lang: '' };
    const newEl = create(newBlock);
    blockEl.replaceWith(newEl);
    focusEnd(newEl.querySelector('.block__content'));
  }

  // ── Focus helpers ────────────────────────────────────────────────────
  function focusEnd(el) {
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function focusStart(el) {
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.setStart(el, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ── Slash menu ───────────────────────────────────────────────────────
  function showSlashMenu(anchorEl, onSelect) {
    const menu = document.getElementById('slash-menu');
    menu.innerHTML = '';

    BLOCK_TYPES.forEach((bt) => {
      const item = document.createElement('div');
      item.className = 'slash-menu__item';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.id = `slash-opt-${bt.type}`;
      item.dataset.type = bt.type;

      const iconWrap = document.createElement('div');
      iconWrap.className = 'slash-menu__item-icon';
      iconWrap.innerHTML =
        `<svg class="icon" aria-hidden="true" focusable="false" width="20" height="20">` +
        `<use href="assets/icons.svg#${bt.icon}" /></svg>`;

      const text = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'slash-menu__item-label';
      label.textContent = bt.label;
      const desc = document.createElement('div');
      desc.className = 'slash-menu__item-desc';
      desc.textContent = bt.desc;
      text.append(label, desc);

      item.append(iconWrap, text);
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        hideSlashMenu();
        onSelect(bt.type);
      });

      menu.appendChild(item);
    });

    // Position below anchor
    const rect = anchorEl.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4 + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.hidden = false;
    menu.dataset.selectedIdx = '-1';
  }

  function hideSlashMenu() {
    const menu = document.getElementById('slash-menu');
    menu.hidden = true;
    menu.innerHTML = '';
  }

  function navigateSlashMenu(direction) {
    const menu = document.getElementById('slash-menu');
    if (menu.hidden) return false;
    const items = menu.querySelectorAll('.slash-menu__item');
    let idx = parseInt(menu.dataset.selectedIdx || '-1', 10);
    items[idx]?.setAttribute('aria-selected', 'false');
    idx = (idx + direction + items.length) % items.length;
    items[idx].setAttribute('aria-selected', 'true');
    items[idx].scrollIntoView({ block: 'nearest' });
    menu.dataset.selectedIdx = String(idx);
    menu.setAttribute('aria-activedescendant', items[idx].id || '');
    return true;
  }

  function confirmSlashMenu() {
    const menu = document.getElementById('slash-menu');
    if (menu.hidden) return false;
    const idx = parseInt(menu.dataset.selectedIdx || '-1', 10);
    const items = menu.querySelectorAll('.slash-menu__item');
    if (idx >= 0 && items[idx]) {
      items[idx].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      return true;
    }
    return false;
  }

  Slab.blocks = {
    BLOCK_TYPES,
    render,
    create,
    serialize,
    convertType,
    focusEnd,
    focusStart,
    showSlashMenu,
    hideSlashMenu,
    navigateSlashMenu,
    confirmSlashMenu,
  };
})(window.Slab);
