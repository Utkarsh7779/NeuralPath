# NeuralPath — deploy to Vercel

A zero-to-mastery AI/ML learning platform. This folder is a complete, ready-to-deploy
Vite + React project. The app is one big component (`src/NeuralPath.jsx`); everything
else here is the scaffolding to build and host it.

---

## What's in here

```
neuralpath-app/
├── src/
│   ├── NeuralPath.jsx     ← the entire application (do not need to edit)
│   └── main.jsx           ← mounts the component into the page
├── api/
│   └── messages.js        ← serverless proxy — holds your API key, calls Anthropic
├── public/
│   └── favicon.svg
├── index.html             ← page shell + fonts
├── vite.config.js         ← build config
├── vercel.json            ← SPA routing + build settings for Vercel
├── package.json           ← dependencies (pinned)
├── .env.production        ← tells the frontend to use the proxy (no secrets)
└── .env.example           ← template for a local dev key
```

**How the AI stays secure:** the browser never sees your API key. The frontend calls
`/api/messages` (same origin), and the serverless function in `api/messages.js` adds
the secret key server-side before forwarding to Anthropic. Everything non-AI (all 13
playgrounds, the curriculum map, in-browser Python, auto-graded labs, spaced repetition,
theming) runs fully client-side. Progress saves to `localStorage`.

---

## Deploy in ~5 minutes

### 1. Get an Anthropic API key
Sign in at <https://console.anthropic.com>, create a key (starts with `sk-ant-`), and
add a little credit. (Costs are small — the app uses Claude Sonnet only for on-demand
lesson generation, the tutor, and paper explainers.)

### 2. Push this folder to GitHub
```bash
cd neuralpath-app
git init
git add .
git commit -m "NeuralPath"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neuralpath.git
git push -u origin main
```
> `node_modules` and any `.env.local` are gitignored — good. Never commit your key.

### 3. Import into Vercel
1. Go to <https://vercel.com/new> and import your GitHub repo.
2. Vercel auto-detects **Vite** — leave Build Command (`vite build`) and Output
   Directory (`dist`) as detected.
3. **Before clicking Deploy**, open **Environment Variables** and add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your `sk-ant-...` key
   - Apply to Production, Preview, and Development.
4. Click **Deploy.**

That's it. Your site is live at `https://your-project.vercel.app`. The `api/messages.js`
function is deployed automatically — no separate setup.

### 4. Confirm the AI works
Open your live site → open any lesson node that isn't a "flagship" (e.g. **AdaGrad**) →
click **generate this lesson**. If content appears, the proxy + key are wired correctly.
The **Tutor** button and the **Papers** explainers use the same path.

---

## Run it locally (optional)

Static + client-side features only (no key needed):
```bash
npm install
npm run dev          # http://localhost:5173
```
The AI buttons will error locally in this mode — that's expected, since there's no proxy.

To test AI features locally too, use the Vercel CLI so the serverless function runs:
```bash
npm i -g vercel
cp .env.example .env.local     # then paste your real key into .env.local
vercel dev                     # serves the app AND /api/messages together
```

---

## Notes & troubleshooting

- **"AI service unavailable (500)"** on the live site → `ANTHROPIC_API_KEY` isn't set in
  Vercel, or has no credit. Add/fix it in Project → Settings → Environment Variables, then
  redeploy.
- **AI buttons fail but everything else works** → that's the intended fallback when the
  proxy/key isn't reachable. The retrieval ranking in the RAG playground and all other
  playgrounds still work without AI.
- **Bundle size warning during build** → harmless. It's three.js + recharts; the site is
  static and served from Vercel's CDN. Already silenced via `chunkSizeWarningLimit`.
- **In-browser Python** downloads a ~7 MB runtime (Pyodide) from a CDN on first "Run" —
  first execution is slow, then cached. Heavy training belongs in Google Colab (buttons
  provided in the app).
- **Custom domain** → add it in Vercel → Project → Settings → Domains.
- **Changing the model** → both `api/messages.js` (allowlist) and the model string in
  `src/NeuralPath.jsx` reference `claude-sonnet-4-6`. Keep them in sync if you change it.
