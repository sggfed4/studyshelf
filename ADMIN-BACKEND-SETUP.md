# StudyShelf community backend: votes, plays + suggestions

A Cloudflare Worker API (`worker.js`) backed by the D1 database `studyshelf-db`: anonymous up/downvotes, unique daily play counts, a suggestions inbox (game requests, feature ideas, bug reports), and a private `/admin` dashboard.

## What it stores

- Current vote per game per random browser ID. Each ID is salted and hashed server-side.
- One play row per game, per hashed browser ID, per UTC day (powers Trending / Most played).
- Suggestion type, title, optional details, status, timestamp, and salted/hashed browser ID used for a limit of 5 suggestions per browser per 24 hours.
- It does not store raw IP addresses, names, or emails. The admin sees short pseudonymous voter references, not real identities.

## Install

The database (`studyshelf-db`) already exists and its ID is set in `wrangler.jsonc`.

1. Apply the schema from PowerShell in the project root:

   ```powershell
   npx wrangler d1 migrations apply studyshelf-db --remote
   ```

   This runs any migrations in `migrations/` that haven't been applied yet, without replacing existing tables.

2. Create two different long secrets. Generate a random value with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Run that command twice and keep the two values private. Use the first for the admin token and the second for the hash salt:

   ```powershell
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put HASH_SALT
   ```

   Paste the corresponding random value when each command prompts. Do not put either value in React files or Git.

3. Build and deploy only after the migrations and secrets are configured:

   ```powershell
   npm.cmd run build
   npx wrangler deploy
   ```

4. Open `https://studyshelf.org/admin` and enter the `ADMIN_TOKEN` you created. The token is held in session storage for that browser tab/session and sent only in the Authorization header.

## Test

- Open any game page, click upvote, and check the displayed count.
- Change the vote to downvote and confirm the up/down counts change.
- Send a test suggestion from the homepage.
- Open `/admin`, refresh, approve/reject the suggestion, and verify its status changes.
- Try `/api/health`; it should return `{"ok":true,"databaseConfigured":true}` after deployment.

## Important

- The dashboard can show pseudonymous vote records and current vote direction, but cannot identify real people because StudyShelf has no user accounts.
- One browser can change its vote; clearing browser storage or using another browser can create another anonymous ID. This is abuse friction, not strong identity verification.
- Keep `ADMIN_TOKEN` private. If you think it leaked, replace it with `npx wrangler secret put ADMIN_TOKEN`.
- Cloudflare Workers static assets must invoke the Worker for `/api/*`; `wrangler.jsonc` configures `run_worker_first` for those routes while other paths continue to serve the Vite `dist` assets.

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
