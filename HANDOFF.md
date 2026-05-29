# Slab — Handoff

## Current Status

**All 10 phases complete.** The app is built, linted clean, and ready for Netlify deployment.

## Completed Phases

- [x] Phase 1: Pre-code declaration — folder structure, package.json, all config files
- [x] Phase 2: Core HTML/CSS scaffold — two-panel layout, reading mode shell, responsive
- [x] Phase 3: IndexedDB layer — CRUD via idb-keyval, auto-save debounce
- [x] Phase 4: Document management — sidebar CRUD, inline title rename, empty state
- [x] Phase 5: Block editor core — all 8 block types, Enter/Backspace/slash-menu, inline formatting
- [x] Phase 6: Drag-and-drop — HTML5 + touch fallback, keyboard move-up/down
- [x] Phase 7: Reading mode toggle + shareable URL (LZ-string encode/decode)
- [x] Phase 8: Export — Markdown download
- [x] Phase 9: Pre-commit tooling — Husky, lint-staged, ESLint + Stylelint + html-validate all clean
- [x] Phase 10: Final audit — README, HANDOFF.md

## Key Decisions Made

- **IIFE + `window.Slab` namespace** instead of ES modules — required by `sourceType: 'script'` ESLint rule (browser JS, no bundler)
- **DOM as source of truth** — no JS mirror of block content; `Slab.blocks.serialize()` walks the DOM on every auto-save tick
- **`draggable` on `.block__drag-handle` only** — not on the `.block` wrapper, which would hijack contenteditable clicks
- **Code blocks use `innerText`** — paste events intercepted to strip HTML formatting
- **Share toast uses `role="status"` only** — no additional `aria-live` (it's implicit on status role)
- **Checklist uses real `<input type="checkbox">`** inside `<label>` — not a fake toggle
- **`prefer-native-element` disabled** in html-validate — `role="textbox"` and `role="listbox"` are legitimate custom widget patterns; using `<textarea>`/`<select>` would break the UX
- **BEM selector pattern** added to `stylelint.config.js` — `stylelint-config-standard` defaults to kebab-only

## Deployment Checklist

Before deploying to Netlify:
1. `npm run lint` — should be clean (all three linters)
2. Verify `netlify.toml` cache headers are correct (JS/CSS/assets = immutable, HTML = no-cache)
3. Test shared URL in a private/incognito tab
4. Verify reading mode hides all chrome and shows clean typography
5. Test on mobile (touch drag fallback, sidebar toggle)

## Architecture Reference

```
window.Slab
├── .db        — IndexedDB CRUD (db.js)
├── .blocks    — DOM block factory + serializer (blocks.js)
├── .drag      — HTML5/touch reorder (drag.js)
├── .share     — LZ-string URL encode/decode (share.js)
├── .export    — Markdown generation + download (export.js)
├── .editor    — Event delegation, auto-save, mode toggle (editor.js)
└── .state     — { activeDocId, activeDocCreatedAt, lastSaved, mode, saveTimer }
```

Script load order (index.html): `db → blocks → drag → share → export → editor → main`

## Next Session

No further work required unless new features are requested.
Run `npm run lint` to verify clean state before any changes.
