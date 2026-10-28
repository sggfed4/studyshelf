# StudyShelf community backend: votes + game requests

This patch adds a Cloudflare Worker API backed by D1, anonymous up/downvotes, a game-request form, and a private `/admin` dashboard. It does not edit `src/games.js`.

## What it stores

- Current vote per game per random browser ID. Each ID is salted and hashed server-side.
- Game-request title, optional details, status, timestamp, and salted/hashed browser ID used for a simple limit of 3 requests per browser per 24 hours.
- It does not store raw IP addresses, names, or emails for voting. The admin sees short pseudonymous voter references, not real identities.

## Install

1. Back up `src/App.jsx`, `src/App.css`, and `wrangler.jsonc`.
2. Extract the patch into the root of `C:\Users\logan\StudyShelf3`, allowing it to replace matching files.
3. In Cloudflare Dashboard, open **Storage & databases → D1 SQL database** (wording may vary), create a D1 database named `studyshelf-db` if you do not already have one, and copy its database ID.
4. Open `wrangler.jsonc` and replace `REPLACE_WITH_D1_DATABASE_ID` with that real ID. Do not deploy while the placeholder remains.
5. Apply the schema from PowerShell in the project root:

   ```powershell
   npx wrangler d1 migrations apply studyshelf-db --remote
   ```

   If the database already has an earlier migration, this adds `0002_votes_requests.sql` without replacing existing tables.

6. Create two different long secrets. Generate a random value with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Run that command twice and keep the two values private. Use the first for the admin token and the second for the hash salt:

   ```powershell
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put HASH_SALT
   ```

   Paste the corresponding random value when each command prompts. Do not put either value in React files, Git, or this ZIP.

7. Build and deploy only after the database ID, migration, and secrets are configured:

   ```powershell
   npm.cmd run build
   npx wrangler deploy
   ```

8. Open `https://studyshelf.org/admin` and enter the `ADMIN_TOKEN` you created. The token is held in session storage for that browser tab/session and sent only in the Authorization header.

## Test

- Open any game page, click upvote, and check the displayed count.
- Change the vote to downvote and confirm the up/down counts change.
- Submit a test request from the homepage.
- Open `/admin`, refresh, approve/reject the request, and verify its status changes.
- Try `/api/health`; it should return `{"ok":true,"databaseConfigured":true}` after deployment.

## Important

- The dashboard can show pseudonymous vote records and current vote direction, but cannot identify real people because StudyShelf has no user accounts.
- One browser can change its vote; clearing browser storage or using another browser can create another anonymous ID. This is abuse friction, not strong identity verification.
- Keep `ADMIN_TOKEN` private. If you think it leaked, replace it with `npx wrangler secret put ADMIN_TOKEN`.
- Cloudflare Workers static assets must invoke the Worker for `/api/*`; this patch configures `run_worker_first` for those routes while other paths continue to serve the Vite `dist` assets.

## Automatic deploys from GitHub

`.github/workflows/ci.yml` lints and builds every push and pull request. Pushes to `main` also run
`wrangler d1 migrations apply studyshelf-db --remote` and `wrangler deploy`.

One-time setup, in the GitHub repo under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: create one at dash.cloudflare.com → My Profile → API Tokens using the
  **Edit Cloudflare Workers** template, then add **Account → D1 → Edit** permission.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the right side of the Cloudflare dashboard's Workers overview.

`ADMIN_TOKEN` and `HASH_SALT` stay as Worker secrets (`npx wrangler secret put …`). They are not GitHub secrets.

## Local testing

Create a `.dev.vars` file (git-ignored) with `HASH_SALT=…` and `ADMIN_TOKEN=…`, then:

```powershell
npx wrangler d1 migrations apply studyshelf-db --local
npm.cmd run build
npx wrangler dev
```
