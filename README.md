# eddielou.github.io

Personal site built with [React](https://react.dev/) + [Vite](https://vite.dev/).
Rank Things: create text cards, then pick winners between random pairs
(click or ← / → keys). Ratings start at 1000 and update with the standard
ELO formula (K=32); a leaderboard ranks the cards. Cards persist in
`localStorage`.

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
