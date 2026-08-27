# eddielou.github.io

Personal site built with [React](https://react.dev/) + [Vite](https://vite.dev/).
Displays "Eddie Lou" centered on the page; the name glows on hover/focus.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Deploy

Pushes to `main` are built and published to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

One-time setup: in the repo's **Settings → Pages**, set **Source** to
**GitHub Actions**.
