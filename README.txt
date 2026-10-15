STUDYSHELF FRONTEND REFRESH

Files in this patch:
- src/App.jsx       New StudyShelf educational research homepage and Crossref search
- src/App.css       Complete navy/black responsive styling
- index.html        Updated page title, metadata, and favicon reference
- public/bookshelf.svg  Matching detailed bookshelf favicon

Apply to your existing clean project at C:\Users\logan\StudyShelf3:
1. Back up src/App.jsx, src/App.css, and index.html.
2. Copy these files into the matching paths in StudyShelf3, replacing those files.
3. Copy bookshelf.svg into public\bookshelf.svg.
4. From PowerShell in StudyShelf3, run:
   npm.cmd run lint
   npm.cmd run build
   npm.cmd run dev
5. Open http://localhost:5173/

The search uses Crossref's public works API and needs an internet connection. Search results are publication metadata and link to the publisher/DOI/source page; the full text may not always be freely available. This is a frontend-only first version and does not store accounts or saved sources.
