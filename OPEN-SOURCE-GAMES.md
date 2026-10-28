# Open-source HTML5 games

StudyShelf hosts 48 HTML5 games from [mashukui/web-games](https://github.com/mashukui/web-games) by
[mashukui](https://github.com/mashukui), used under the MIT License. The license text ships with the games at
`/play/LICENSE.txt` (`public/play/LICENSE.txt`), and each game page on StudyShelf credits the author and links
to its source.

## What StudyShelf changed

`scripts/import-open-source-games.mjs` copies each game's `index.html` and the shared `i18n.js` into
`public/play/` with two edits to the in-game footer:

- **More games** points back to StudyShelf (`/`) instead of the upstream collection page.
- The author's link to an unrelated video-downloader site (saveone.pro) is removed.

The shared `i18n.js` also loads the author's GoatCounter visitor tracker. The importer turns it off with its
documented switch (`GC_SITE = ''`), so StudyShelf visitors aren't counted on the author's dashboard, and the
tracker script (`analytics.js`) isn't copied.

The author credit and GitHub link in each footer are kept. Thumbnails in `public/play-thumbs/` are generated
StudyShelf artwork, not upstream screenshots. Catalog text (descriptions, categories, controls) lives in the
script's `GAMES` table.

## Updating

```powershell
git clone --depth 1 https://github.com/mashukui/web-games.git ..\web-games
node scripts/import-open-source-games.mjs ..\web-games
```

The script regenerates `public/play/`, `public/play-thumbs/`, and `src/openSourceGames.js`. New upstream games
are ignored until they're added to `GAMES`. Review the upstream diff before deploying; the script refuses to
finish if it can't remove the SaveOne link.
