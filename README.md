# Slab

A block-based document editor built with vanilla HTML, CSS, and JavaScript — no framework, no build step.

## What it does

- Create multiple documents and switch between them in the sidebar
- Eight block types: paragraph, heading 1–3, callout, code, checklist, divider
- Press `/` on an empty line to open the block-type picker
- Drag blocks to reorder (HTML5 drag-and-drop with a touch fallback)
- Keyboard move-up/move-down buttons visible on focus
- Inline formatting: **Ctrl/Cmd+B** bold, *Ctrl/Cmd+I* italic, ``Ctrl/Cmd+` `` inline code
- Reading mode toggle (**Ctrl/Cmd+Shift+R**) hides all editor chrome
- Share button encodes the document into a compressed URL — anyone opening it sees it in read-only mode
- Export to Markdown downloads a `.md` file
- Auto-saves to IndexedDB 500 ms after the last keystroke

## Running locally

Open `index.html` directly in a browser, or serve with any static server:

```bash
npx serve .
# or
npx netlify dev
```

No build step required.

## Linting

```bash
npm install
npm run lint          # ESLint + Stylelint + html-validate
npm run format        # Prettier
```

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Language | Vanilla JS (`sourceType: script`) | The state management complexity is the portfolio signal, not component architecture |
| Persistence | IndexedDB via [idb-keyval](https://github.com/jakearchibald/idb-keyval) | Minimal wrapper, no back-end required |
| URL sharing | [LZ-string](https://pieroxy.net/blog/pages/lz-string/index.html) | Keeps shared URLs short enough for clipboard use |
| Icons | [Heroicons](https://heroicons.com/) | Self-hosted SVG sprite; outline weight suits the editorial aesthetic |
| Drag-and-drop | Native HTML5 + touch fallback | Building it from scratch is the point |
| Fonts | Lora · DM Sans · JetBrains Mono | Lora for body copy (intentional for a writing tool), DM Sans for UI chrome, JetBrains Mono for code blocks |

## Deployment

Deployed on Netlify. `netlify.toml` sets long-lived cache headers for `/js/*`, `/css/*`, and `/assets/*`, and security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) on all routes.

## Accessibility

- Skip link → `#main` (visible on focus)
- All interactive elements have a visible clay-red (#B45309) focus ring
- `role="textbox"` + `aria-label` on document title and all block content areas
- Drag handles have a keyboard alternative: move-up/move-down buttons appear on focus
- Checklist items use `<input type="checkbox">` with `<label>`, not a fake toggle
- Share toast uses `role="status"` (implicit `aria-live="polite"`) — no redundant `aria-live` attribute
- `--color-muted` (#78716C) verified at ≥ 4.5:1 on all three background surfaces (#FFFFFF, #F7F4EF, #EFECE6)

## Known limitations

- No syntax highlighting in code blocks (plain-text editing only)
- Very large documents produce long share URLs; LZ-string compression keeps them manageable for typical use
- iOS Safari's HTML5 drag-and-drop support is limited — the touch event fallback covers this
