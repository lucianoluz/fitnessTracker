# Workout Tracker PWA

A simple, installable, offline-first workout tracker for a single user. This is
the **skeleton only** — an installable blank page with a PWA manifest and a
service worker. Features (body diagram, exercise logging, history) come next.

## Run locally

No build step. Serve the folder over HTTP (a service worker won't register from
`file://`):

```bash
cd fitnessTracker
python3 -m http.server 8000
```

Then open http://localhost:8000 in Chrome. The page should say
"Service worker: registered ✓".

## Install on Android (Galaxy)

1. Host these files somewhere reachable over **HTTPS** (e.g. GitHub Pages) — PWAs
   require HTTPS to install (localhost is the only HTTP exception).
2. Open the URL in Chrome on the phone.
3. Menu (⋮) → **Add to Home screen** / **Install app**.
4. Launch from the home screen — it opens standalone (no browser chrome) and
   works offline.

## Files

| Path | Purpose |
|---|---|
| `index.html` | App shell / blank placeholder page |
| `css/styles.css` | Mobile-first styles |
| `js/app.js` | Registers the service worker |
| `manifest.webmanifest` | PWA metadata + icons |
| `sw.js` | Cache-first offline service worker |
| `icons/` | Home-screen icons (192, 512, maskable) |

## Credits

- 3D model: **“Free Pack – Male Base Mesh”** by *DuNguyn* (Sketchfab), licensed
  **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**. Source:
  https://sketchfab.com/3d-models/free-pack-male-base-mesh-44b8e235695442fab39b4439a1588618
- 3D rendering via **[three.js](https://threejs.org/)** (MIT), vendored under
  `vendor/three/` so the app works offline.

## Verify it's installable

Chrome DevTools → **Application** tab:
- **Manifest**: no errors, icons listed.
- **Service Workers**: `sw.js` activated.
- Toggle **Offline** in the Network tab and reload — the page still loads.
