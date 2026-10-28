StudyShelf Big Titles — thumbnail update

Contents:
- src/games.js (same 76-game catalog as the Big Titles patch, with thumbnails added for the 21 new entries)

Install:
1. Back up C:\Users\logan\StudyShelf3\src\games.js.
2. Extract this ZIP into C:\Users\logan\StudyShelf3 and replace src\games.js.
3. In PowerShell from the project folder run: npm.cmd run build
4. If the build passes, run: git add src/games.js; git commit -m "Add thumbnails for Big Titles games"; git push origin main

Thumbnail notes:
- Uses externally hosted image URLs from game pages, a game-cover CDN, and Google Play artwork. The Duck Life spin-offs share a related-series image where a distinct browser thumbnail could not be verified.
- Some Riddle School sequel thumbnail URLs follow the site's slug-based thumbnail pattern but were not individually fetched/verified in this environment. Check the local site; if any image is broken, the fallback image behavior should be used or the URL corrected.
- The build and live iframe loading should be tested locally before pushing.
