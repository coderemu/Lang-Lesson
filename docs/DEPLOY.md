# Deploy: put Lang Lessons online

Lang Lessons is a static web app. After the build, it is only files (HTML, JavaScript, CSS, fonts, JSON). Any HTTPS static host can serve it. There is no server, database or account.

The default host is **Cloudflare Pages**: free, HTTPS, fast in India and everywhere else, and it builds the app each time you push to GitHub.

## 1. What Claude Code prepares (step 1F)

- `vite-plugin-pwa` with the manifest and icons, so you can install the app on your phone and use it offline.
- `public/_redirects` with `/* /index.html 200`, so links such as `/lesson/1.2` work when you open them directly.
- `npm run deploy` (optional): builds and uploads with Wrangler, for a deploy without GitHub.
- A version number in Settings → About, so you can see which version is live.

## 2. One-time setup (you do this)

1. **GitHub.** Make a private repository, for example `lang-lessons`. In the project folder:
   ```
   git remote add origin https://github.com/<your-user>/lang-lessons.git
   git push -u origin main --tags
   ```
   `docs/source/` (the book) is in `.gitignore`. Check on GitHub that the PDF is not there.
2. **Cloudflare.** Make a free account at dash.cloudflare.com. Go to Workers & Pages → Create → Pages → Connect to Git. Select the repository.
3. **Build settings.**
   - Framework preset: Vite (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `20`
4. Select **Save and Deploy**. After about two minutes, the app is live at `https://lang-lessons.pages.dev` (the name can differ).
5. Optional: add your own domain in the Pages project → Custom domains.

## 3. Each new chapter

At the end of each phase, Claude Code tags the release. You push:
```
git push && git push --tags
```
Cloudflare builds and publishes the new version. The next time you open the app, it shows "New version ready. Reload." Your progress stays.

## 4. Install on your phone

- **Android (Chrome):** open the URL → menu ⋮ → Install app.
- **iPhone (Safari):** open the URL → Share → Add to Home Screen.

The installed app works offline after the first full load.

## 5. Use more than one device

Each browser keeps its own progress. To move it:

1. On the first device: Progress → Settings and backup → **Back up progress**. A file `lang-lessons-backup-<date>.json` downloads.
2. Send the file to yourself (email, Drive, AirDrop).
3. On the second device: Settings → **Restore from backup** → select the file → confirm.

Make a backup now and then. If a browser clears its data, the backup is the only copy.

## 6. Other hosts

The same `dist/` folder works on:

| Host | Notes |
| --- | --- |
| Netlify | Same build settings; `_redirects` works as is. |
| Vercel | Framework: Vite; add a rewrite of `/(.*)` to `/index.html` in `vercel.json`. |
| GitHub Pages | Set `base: '/lang-lessons/'` in `vite.config.ts` and copy `index.html` to `404.html` after the build. |
