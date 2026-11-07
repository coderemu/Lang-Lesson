# Phase 1 · Chapter 1 · Step 1F: PWA and first deploy

Paste into Claude Code. Use plan mode first.

---

Phase 1, step 1F. Make the app installable and offline, and prepare it for hosting. Requirements: SRD NFR-07, NFR-10, NFR-11, FR-85 to FR-87, §11. Guide: `docs/DEPLOY.md`.

Do this:

1. Add `vite-plugin-pwa`:
   - manifest: name "Lang Lessons", short name "Lang", theme colour from `--color-primary`, background white, display `standalone`, start URL and scope from `base`;
   - icons 192, 512 and maskable 512 in `public/icons/` (a simple mark: white "L" with a minus sign, Bricolage Grotesque, on the primary blue);
   - Workbox precache of the shell, fonts and every lesson and bank chunk; `registerType: 'prompt'`;
   - an update toast "New version ready. Reload." in the shell (NFR-11).
2. Add `public/_redirects` with `/* /index.html 200`.
3. Add `npm run deploy` with Wrangler (`wrangler pages deploy dist --project-name lang-lessons`) as an option. Do not put any token in the repository.
4. Show the app version (`package.json` version + short git hash at build time) in Settings → About.
5. Playwright, against `npm run preview`:
   - every route opens directly by URL (no 404);
   - after one full load, go offline: Home, lesson 1.2 and bank 1.2 still work;
   - progress made before a new build is still there after the update.
   - a backup made in one browser context restores in a fresh context with the same state.
6. Lighthouse (mobile) on Home: PWA installable, performance, accessibility and best practices 90 or more.
7. Check that `docs/source/` and any PDF are not tracked by git (`git ls-files | grep -i pdf` must be empty).

Check before you finish:

- `build`, `test`, `e2e`, `lint`, `validate:content` pass.
- Update `qa/phase-1/ACCEPTANCE.md`: the hosting criteria of SRD §9.2.
- Commit: `phase-1F: pwa and deploy`. Tag `v0.1-chapter-1`.

Then stop and tell me, in short steps, what I must do in GitHub and Cloudflare (from `docs/DEPLOY.md` §2). After I give you the live URL, open it with Playwright at 390 × 844 and confirm that Home loads.
