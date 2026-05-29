window.Slab = window.Slab || {};

(function (Slab) {
  let dragSrcEl = null;
  let touchClone = null;
  let touchSrc = null;

  // ── Init: wire both HTML5 drag and touch fallback ────────────────────
  function init() {
    const list = document.getElementById('block-list');
    if (!list) return;

    // HTML5 drag-and-drop (desktop)
    list.addEventListener('dragstart', onDragStart);
    list.addEventListener('dragover', onDragOver);
    list.addEventListener('dragleave', onDragLeave);
    list.addEventListener('drop', onDrop);
    list.addEventListener('dragend', onDragEnd);

    // Touch fallback (mobile)
    list.addEventListener('touchstart', onTouchStart, { passive: false });
    list.addEventListener('touchmove', onTouchMove, { passive: false });
    list.addEventListener('touchend', onTouchEnd);
    list.addEventListener('touchcancel', onTouchCancel);
  }

  // ── HTML5 drag ───────────────────────────────────────────────────────
  function onDragStart(e) {
    const handle = e.target.closest('.block__drag-handle');
    if (!handle) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    dragSrcEl = handle.closest('.block');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcEl.dataset.blockId);
    // Delay so the drag image is captured before the ghost class applies
    setTimeout(() => {
      if (dragSrcEl) dragSrcEl.style.opacity = '0.4';
    }, 0);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.block');
    if (!target || target === dragSrcEl) return;
    clearDragIndicators();
    const mid = target.getBoundingClientRect().top + target.offsetHeight / 2;
    target.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
  }

  function onDragLeave(e) {
    const target = e.target.closest('.block');
    if (target) {
      target.classList.remove('drag-over-top', 'drag-over-bottom');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const target = e.target.closest('.block');
    if (!target || !dragSrcEl || target === dragSrcEl) return;

    const list = document.getElementById('block-list');
    const dropTop = target.classList.contains('drag-over-top');
    clearDragIndicators();
    list.removeChild(dragSrcEl);
    if (dropTop) {
      list.insertBefore(dragSrcEl, target);
    } else {
      target.insertAdjacentElement('afterend', dragSrcEl);
    }
    fireReorder();
  }

  function onDragEnd() {
    if (dragSrcEl) dragSrcEl.style.opacity = '';
    clearDragIndicators();
    dragSrcEl = null;
  }

  function clearDragIndicators() {
    document.querySelectorAll('.block.drag-over-top, .block.drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  // ── Touch fallback ───────────────────────────────────────────────────
  function onTouchStart(e) {
    const handle = e.target.closest('.block__drag-handle');
    if (!handle) return;
    e.preventDefault();
    touchSrc = handle.closest('.block');

    // Clone for visual feedback
    touchClone = touchSrc.cloneNode(true);
    touchClone.style.cssText =
      'position:fixed;pointer-events:none;opacity:0.85;z-index:9999;' +
      `width:${touchSrc.offsetWidth}px;left:${touchSrc.getBoundingClientRect().left}px;`;
    document.body.appendChild(touchClone);
    positionClone(e.touches[0].clientY);
    touchSrc.style.opacity = '0.4';
  }

  function onTouchMove(e) {
    if (!touchSrc) return;
    e.preventDefault();
    const touch = e.touches[0];
    positionClone(touch.clientY);

    const list = document.getElementById('block-list');
    const blocks = list.querySelectorAll('.block');
    clearDragIndicators();
    blocks.forEach((block) => {
      if (block === touchSrc) return;
      const rect = block.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY < rect.bottom) {
        const mid = rect.top + rect.height / 2;
        block.classList.add(touch.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
      }
    });
  }

  function onTouchEnd(e) {
    if (!touchSrc) return;
    const touch = e.changedTouches[0];
    if (!touch) {
      cleanupTouch();
      return;
    }
    const list = document.getElementById('block-list');
    const blocks = list.querySelectorAll('.block');
    let inserted = false;

    blocks.forEach((block) => {
      if (block === touchSrc || inserted) return;
      if (block.classList.contains('drag-over-top')) {
        list.insertBefore(touchSrc, block);
        inserted = true;
      } else if (block.classList.contains('drag-over-bottom')) {
        block.insertAdjacentElement('afterend', touchSrc);
        inserted = true;
      }
    });

    // If the touch ended outside any block, try to find the closest one
    if (!inserted) {
      const closest = elementAtY(list, touch.clientY);
      if (closest && closest !== touchSrc) {
        closest.insertAdjacentElement('afterend', touchSrc);
      }
    }

    cleanupTouch();
    fireReorder();
  }

  function onTouchCancel() {
    cleanupTouch();
  }

  function positionClone(clientY) {
    if (!touchClone || !touchSrc) return;
    const offset = touchSrc.offsetHeight / 2;
    touchClone.style.top = `${clientY - offset + window.scrollY}px`;
  }

  function elementAtY(list, clientY) {
    const blocks = [...list.querySelectorAll('.block')];
    return blocks.reduce((closest, block) => {
      const rect = block.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (!closest) return block;
      const prevMid =
        closest.getBoundingClientRect().top + closest.getBoundingClientRect().height / 2;
      return Math.abs(clientY - mid) < Math.abs(clientY - prevMid) ? block : closest;
    }, null);
  }

  function cleanupTouch() {
    clearDragIndicators();
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    if (touchSrc) {
      touchSrc.style.opacity = '';
      touchSrc = null;
    }
  }

  // ── Notify editor of reorder so auto-save fires ───────────────────────
  function fireReorder() {
    const list = document.getElementById('block-list');
    list.dispatchEvent(new CustomEvent('slab:reorder', { bubbles: true }));
  }

  Slab.drag = { init };
})(window.Slab);
