# Slab — CLAUDE.md

## Project Overview

Slab is a Notion-lite block-based document editor built with vanilla HTML/CSS/JS (no framework, no build tools). Documents persist to IndexedDB; a shareable read-only URL is generated via LZ-string compression.

## Tech Stack

- Vanilla HTML/CSS/JS — no bundler, no framework
- idb-keyval 6.2.1 (UMD via jsDelivr CDN) — IndexedDB persistence
- LZ-string 1.5.0 (via jsDelivr CDN) — URL compression for share feature
- Heroicons — self-hosted SVG sprite at `assets/icons.svg`
- Google Fonts — Lora (body), DM Sans (UI chrome), JetBrains Mono (code blocks)

## Module Architecture

All JS files use the IIFE + `window.Slab` namespace pattern (`sourceType: 'script'` required — no `import`/`export`). Scripts load in strict dependency order at bottom of `<body>`:

```
db.js → blocks.js → drag.js → share.js → export.js → editor.js → main.js
```

- **db.js** — IndexedDB CRUD via `window.idbKeyval`
- **blocks.js** — Pure DOM: create/convert/serialize/deserialize blocks. No DB knowledge.
- **drag.js** — HTML5 drag-and-drop + touch fallback. Fires `slab:reorder` custom event.
- **share.js** — LZ-string encode/decode + URL manipulation
- **export.js** — Markdown string generation + file download
- **editor.js** — State, event delegation, auto-save, mode toggle. Orchestrates all modules.
- **main.js** — Bootstrap: DB init, URL check, initial render

## Data Model

```js
// Document (IndexedDB key: slab_doc_{uuid})
{ id, title, createdAt, updatedAt, blocks: Block[] }

// Block
{ id, type, content, checked, lang }
// type: 'paragraph'|'heading1'|'heading2'|'heading3'|'callout'|'code'|'checklist'|'divider'
```

The live DOM is the canonical source of truth for block content — no JS mirror. `Slab.blocks.serialize()` walks the DOM on every auto-save tick.

## Design Tokens

```
--color-bg: #F7F4EF       --font-body: 'Lora', georgia, serif
--color-surface: #FFFFFF  --font-ui: 'DM Sans', system-ui, sans-serif
--color-sidebar: #EFECE6  --font-mono: 'JetBrains Mono', monospace
--color-text: #1C1917
--color-muted: #78716C    (≥4.5:1 on #FFFFFF, #F7F4EF, #EFECE6)
--color-accent: #B45309   (interactive states only)
--color-code-bg: #F2EDE4
--color-callout-bg: #FEF3C7
```

## CSS Conventions

- 5 CSS files: `main.css` → `sidebar.css` → `editor.css` → `blocks.css` → `reading.css`
- All CSS properties within a rule block must be **alphabetically ordered**
- Use **logical properties** (`inline-size`, `block-size`, `inset-*`, `margin-inline`, `padding-block`)
- Reading mode driven entirely by `body[data-mode="read"]` attribute selector

## Key Implementation Rules

1. `draggable="true"` on `.block__drag-handle` ONLY — not on `.block` wrapper (prevents accidental drag on contenteditable click)
2. Code block content: use `innerText`, not `innerHTML`. Intercept paste to strip formatting.
3. Share toast: use `role="status"` only — do NOT also add `aria-live` (redundant)
4. Checklist: real `<input type="checkbox">` inside `<label>`, not a fake toggle
5. Auto-save debounce: 500ms, triggered by `input` event (not `keyup`)
6. `crypto.randomUUID()` for all UUIDs — no polyfill needed

## Linting

```bash
npm run lint          # all linters
npm run lint:js       # ESLint only
npm run lint:css      # Stylelint only
npm run lint:html     # html-validate only
npm run format        # Prettier
```

## Deployment

Netlify. `netlify.toml` configures security headers and long-lived cache for `/js/*`, `/css/*`, `/assets/*`. HTML is set to `no-cache`.

## Session Continuity

See `HANDOFF.md` for current phase, next task, and decisions made.
