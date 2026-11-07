# Klangspuren – Kartenatelier

Austrian German (de-AT) editor for composer learning cards. The supplied teaching PDF is converted into the default project: 37 composers and two supplementary cards. Original text and images are retained in `public/default-project.json` and `public/portraits/`; the editor uses a new, consistent card template rather than reproducing PDF typography pixel for pixel.

## Development

Node.js 22 or newer:

```sh
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
```

Production: `npm run build`, then `npm run preview -- --port 5173`.

Browser smoke test (requires Chromium at `/usr/bin/chromium` and the development server): `node tests/smoke.mjs`. The test verifies default cards, search, persisted edits, and a real PDF download. Output: `/tmp/klangspuren-test.pdf`.

## Use

The default project opens on first use. Project and editor state are saved immediately in localStorage; large images are stored in IndexedDB to avoid localStorage quota limits. The project, selected card, front/back view, editor tab and search filter are restored after closing and reopening the browser. Existing IndexedDB projects migrate automatically. Storage errors are shown in the interface; use **Projekt speichern** to download a portable JSON project including all images, and **Öffnen** to restore it. Browser storage may be cleared or unavailable: downloaded project files are the backup. No backend or account is required. Uploaded images stay in the browser.

**PDF exportieren** creates paired A4 pages, four cards per page, with horizontally mirrored backs. Print duplex, flip on the long edge, actual size / 100%. Try one sheet first to check your printer's alignment. Overlong text blocks export until shortened. The last sheet includes an empty slot. Layout selection is intentionally not implemented.

Images and historical caveats come from the supplied PDF. Their inclusion does not grant new reuse rights; retain the original source PDF and its image credits when redistributing teaching materials.

## Deployment

Pushes to `main` build and deploy using `.github/workflows/pages.yml`.
In GitHub repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The workflow uses `/Komponisten/` as Vite's base path. The expected address is `https://rudolphreti.github.io/Komponisten/` once Pages is enabled and deployment succeeds.

### Mouse cropping

Drag the portrait directly on the front of the card to move it freely, including outside the frame. Use the mouse wheel to zoom around the pointer; empty areas are white. Numeric controls allow precise positioning and zoom from 1% to 10,000%. Arrow keys move the focused image (Shift for larger steps), and + / - zoom. Reset restores the original centred fit. Cropping is included in saved projects and PDF export. `node tests/cropping.mjs` verifies these interactions.

### Card overview

The editor displays a responsive grid with a selected-card editing panel, search and a shared front/back switch. Only the selected card accepts crop gestures. A mouse-wheel notch changes zoom by exactly five percentage points (100% → 105%); small touchpad deltas accumulate before a step. On narrow screens the grid scrolls above the editing panel. The PDF layout remains four cards per A4 page. `node tests/grid.mjs` checks the grid and zoom behaviour.

`node tests/persistence.mjs` checks a full browser restart, immediate last-edit persistence, large images, editor restoration, storage quota errors, corrupt local state and migration from the previous IndexedDB project format.
