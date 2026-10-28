import { games } from './src/games.js';

const KNOWN_SLUGS = new Set(games.map((game) => game.slug));
const SUGGESTION_KINDS = ['game', 'feature', 'bug', 'other'];

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

function isValidSlug(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

function isValidVoterId(value) {
  return typeof value === 'string' && value.length >= 16 && value.length <= 100;
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hashValue(value, salt) {
  const bytes = new TextEncoder().encode(`${salt}|${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readJson(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) return null;
  try { return await request.json(); } catch { return null; }
}

async function requireDatabase(env) {
  if (!env.DB) return json({ error: 'The StudyShelf database is not configured yet.' }, 503);
  return null;
}

function adminAuthorized(request, env) {
  const expected = env.ADMIN_TOKEN;
  const header = request.headers.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  return Boolean(expected && supplied && timingSafeEqual(supplied, expected));
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (path === '/api/health' && method === 'GET') {
    return json({ ok: true, databaseConfigured: Boolean(env.DB) });
  }

  if (path === '/api/votes' && method === 'GET') {
    const dbError = await requireDatabase(env);
    if (dbError) return dbError;
    const slug = url.searchParams.get('slug') || '';
    if (!isValidSlug(slug)) return json({ error: 'A valid game slug is required.' }, 400);
    const result = await env.DB.prepare(
      'SELECT SUM(CASE WHEN direction = 1 THEN 1 ELSE 0 END) AS upvotes, SUM(CASE WHEN direction = -1 THEN 1 ELSE 0 END) AS downvotes FROM votes WHERE game_slug = ?'
    ).bind(slug).first();
    return json({ slug, upvotes: result?.upvotes || 0, downvotes: result?.downvotes || 0 });
  }

  if (path === '/api/votes' && method === 'POST') {
    const dbError = await requireDatabase(env);
    if (dbError) return dbError;
    if (!env.HASH_SALT) return json({ error: 'The vote hashing secret is not configured.' }, 503);
    const body = await readJson(request);
    if (!body || !KNOWN_SLUGS.has(body.slug) || !['up', 'down', 'remove'].includes(body.vote) || !isValidVoterId(body.voterId)) {
      return json({ error: 'Invalid vote details.' }, 400);
    }
    const voterHash = await hashValue(body.voterId, env.HASH_SALT);
    if (body.vote === 'remove') {
      await env.DB.prepare('DELETE FROM votes WHERE game_slug = ? AND voter_hash = ?').bind(body.slug, voterHash).run();
    } else {
      const direction = body.vote === 'up' ? 1 : -1;
      await env.DB.prepare(
        `INSERT INTO votes (game_slug, voter_hash, direction, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(game_slug, voter_hash) DO UPDATE SET direction = excluded.direction, updated_at = datetime('now')`
      ).bind(body.slug, voterHash, direction).run();
    }
    const counts = await env.DB.prepare(
      'SELECT SUM(CASE WHEN direction = 1 THEN 1 ELSE 0 END) AS upvotes, SUM(CASE WHEN direction = -1 THEN 1 ELSE 0 END) AS downvotes FROM votes WHERE game_slug = ?'
    ).bind(body.slug).first();
    return json({ ok: true, slug: body.slug, upvotes: counts?.upvotes || 0, downvotes: counts?.downvotes || 0, myVote: body.vote });
  }

  if (path === '/api/plays' && method === 'POST') {
    const dbError = await requireDatabase(env);
    if (dbError) return dbError;
    if (!env.HASH_SALT) return json({ error: 'The hashing secret is not configured.' }, 503);
    const body = await readJson(request);
    if (!body || !KNOWN_SLUGS.has(body.slug) || !isValidVoterId(body.voterId)) return json({ error: 'Invalid play details.' }, 400);
    const playerHash = await hashValue(body.voterId, env.HASH_SALT);
    await env.DB.prepare(
      "INSERT OR IGNORE INTO plays (game_slug, player_hash, day) VALUES (?, ?, date('now'))"
    ).bind(body.slug, playerHash).run();
    return json({ ok: true });
  }

  if (path === '/api/stats' && method === 'GET') {
    const dbError = await requireDatabase(env);
    if (dbError) return dbError;
    const [voteRows, playRows] = await Promise.all([
      env.DB.prepare(
        'SELECT game_slug AS slug, SUM(CASE WHEN direction = 1 THEN 1 ELSE 0 END) AS up, SUM(CASE WHEN direction = -1 THEN 1 ELSE 0 END) AS down FROM votes GROUP BY game_slug'
      ).all(),
      env.DB.prepare(
        "SELECT game_slug AS slug, COUNT(*) AS plays, SUM(CASE WHEN day >= date('now', '-6 days') THEN 1 ELSE 0 END) AS plays7d FROM plays GROUP BY game_slug"
      ).all(),
    ]);
    const stats = {};
    const entry = (slug) => (stats[slug] ||= { up: 0, down: 0, plays: 0, plays7d: 0 });
    for (const row of voteRows.results || []) Object.assign(entry(row.slug), { up: row.up || 0, down: row.down || 0 });
    for (const row of playRows.results || []) Object.assign(entry(row.slug), { plays: row.plays || 0, plays7d: row.plays7d || 0 });
    return json({ stats }, 200, { 'cache-control': 'public, max-age=60' });
  }

  if (path === '/api/requests' && method === 'POST') {
    const dbError = await requireDatabase(env);
    if (dbError) return dbError;
    if (!env.HASH_SALT) return json({ error: 'The request hashing secret is not configured.' }, 503);
    const body = await readJson(request);
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const details = typeof body?.details === 'string' ? body.details.trim() : '';
    const kind = body?.kind ?? 'game';
    if (!SUGGESTION_KINDS.includes(kind)) return json({ error: 'Choose a suggestion type.' }, 400);
    if (title.length < 2 || title.length > 100 || details.length > 1000 || !isValidVoterId(body?.voterId)) {
      return json({ error: 'Enter a title (2–100 characters) and details up to 1,000 characters.' }, 400);
    }
    const submitterHash = await hashValue(body.voterId, env.HASH_SALT);
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM game_requests WHERE submitter_hash = ? AND created_at >= datetime('now', '-1 day')"
    ).bind(submitterHash).first();
    if ((recent?.total || 0) >= 5) return json({ error: 'Limit reached: each browser can send up to 5 suggestions per day.' }, 429);
    const inserted = await env.DB.prepare(
      "INSERT INTO game_requests (title, details, kind, status, submitter_hash, created_at) VALUES (?, ?, ?, 'pending', ?, datetime('now'))"
    ).bind(title, details, kind, submitterHash).run();
    return json({ ok: true, id: inserted.meta?.last_row_id, message: 'Suggestion sent. Thanks!' }, 201);
  }

  if (path.startsWith('/api/admin/')) {
    if (!adminAuthorized(request, env)) return json({ error: 'Unauthorized. Enter the admin token.' }, 401);
    const dbError = await requireDatabase(env);
    if (dbError) return dbError;

    if (path === '/api/admin/data' && method === 'GET') {
      const [gameTotals, voteRows, requests, playTotals] = await Promise.all([
        env.DB.prepare(
          'SELECT game_slug AS slug, SUM(CASE WHEN direction = 1 THEN 1 ELSE 0 END) AS upvotes, SUM(CASE WHEN direction = -1 THEN 1 ELSE 0 END) AS downvotes, COUNT(*) AS total FROM votes GROUP BY game_slug ORDER BY total DESC, game_slug ASC'
        ).all(),
        env.DB.prepare(
          'SELECT game_slug AS slug, direction, substr(voter_hash, 1, 12) AS voter_ref, created_at, updated_at FROM votes ORDER BY updated_at DESC LIMIT 500'
        ).all(),
        env.DB.prepare(
          'SELECT id, title, details, kind, status, created_at FROM game_requests ORDER BY CASE status WHEN \'pending\' THEN 0 ELSE 1 END, created_at DESC LIMIT 500'
        ).all(),
        env.DB.prepare(
          "SELECT game_slug AS slug, COUNT(*) AS plays, SUM(CASE WHEN day >= date('now', '-6 days') THEN 1 ELSE 0 END) AS plays7d FROM plays GROUP BY game_slug ORDER BY plays7d DESC, plays DESC LIMIT 100"
        ).all(),
      ]);
      return json({ gameTotals: gameTotals.results || [], votes: voteRows.results || [], requests: requests.results || [], playTotals: playTotals.results || [] });
    }

    const requestMatch = path.match(/^\/api\/admin\/requests\/(\d+)$/);
    if (requestMatch && method === 'PATCH') {
      const id = Number(requestMatch[1]);
      const body = await readJson(request);
      if (!['pending', 'approved', 'rejected'].includes(body?.status)) return json({ error: 'Invalid request status.' }, 400);
      const result = await env.DB.prepare('UPDATE game_requests SET status = ? WHERE id = ?').bind(body.status, id).run();
      if (!result.meta?.changes) return json({ error: 'Request not found.' }, 404);
      return json({ ok: true, id, status: body.status });
    }

    if (requestMatch && method === 'DELETE') {
      const result = await env.DB.prepare('DELETE FROM game_requests WHERE id = ?').bind(Number(requestMatch[1])).run();
      if (!result.meta?.changes) return json({ error: 'Request not found.' }, 404);
      return json({ ok: true, id: Number(requestMatch[1]) });
    }
    return json({ error: 'Admin API route not found.' }, 404);
  }

  return json({ error: 'API route not found.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await handleApi(request, env); }
      catch (error) {
        console.error('StudyShelf API error', error);
        return json({ error: 'The request could not be completed. Check the database setup and try again.' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
