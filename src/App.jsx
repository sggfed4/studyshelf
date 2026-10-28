import { useEffect, useMemo, useRef, useState } from 'react'
import { games } from './games'
import './App.css'

const roomServices = [
  { name: 'Desmos', type: 'Graphing tools', note: 'Explore functions, graphs, and mathematical relationships.', url: 'https://www.desmos.com/calculator', icon: '∿' },
  { name: 'GeoGebra', type: 'Math tools', note: 'Work with geometry, algebra, graphing, and interactive math.', url: 'https://www.geogebra.org/', icon: '⌬' },
  { name: 'PhET Simulations', type: 'Science tools', note: 'Explore interactive simulations for physics, chemistry, biology, and math.', url: 'https://phet.colorado.edu/', icon: '⚛' },
  { name: 'itch.io', type: 'Independent library', note: 'Browse independent projects and browser-based experiences.', url: 'https://itch.io/', icon: '◈' },
  { name: 'CrazyGames', type: 'Browser library', note: 'Open the provider’s own catalog in a new tab.', url: 'https://www.crazygames.com/', icon: '✳' },
]

const AD_UNITS = {
  '728x90': {
    key: 'fc1ad9486d646132115aab08842b39f1',
    width: 728,
    height: 90,
    src: 'https://bauval.org/22/fc1ad9486d646132115aab08842b39f1',
  },
  '320x50': {
    key: '78207749b234fdb5b06ac5e8a26d59fa',
    width: 320,
    height: 50,
    src: 'https://bauval.org/22/78207749b234fdb5b06ac5e8a26d59fa',
  },
}

const NATIVE_AD_SCRIPT = 'https://bauval.org/21/805d202094bf0f090893bd2cdb9fb26c'
const NATIVE_AD_CONTAINER_ID = 'container-805d202094bf0f090893bd2cdb9fb26c'
const AD_HOSTNAMES = new Set(['studyshelf.org', 'www.studyshelf.org'])
const canServeAds = () => typeof window !== 'undefined' && AD_HOSTNAMES.has(window.location.hostname)

// Adsterra banner snippets share the global `atOptions` name. Load the
// external scripts one at a time so one banner cannot overwrite another's config.
let bannerQueue = Promise.resolve()
function queueBannerAd(slot, unit) {
  bannerQueue = bannerQueue.catch(() => undefined).then(() => new Promise((resolve) => {
    if (!canServeAds() || !slot?.isConnected) {
      resolve()
      return
    }

    window.atOptions = {
      key: unit.key,
      format: 'iframe',
      height: unit.height,
      width: unit.width,
      params: {},
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = unit.src
    script.async = false

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      resolve()
    }
    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', finish, { once: true })
    const timeoutId = window.setTimeout(finish, 12000)
    slot.appendChild(script)
  }))
  return bannerQueue
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = (event) => setMatches(event.matches)
    setMatches(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

function BannerAd({ size, className = '' }) {
  const unitRef = useRef(null)
  const unit = AD_UNITS[size]

  useEffect(() => {
    const slot = unitRef.current
    if (!slot || !unit) return undefined
    void queueBannerAd(slot, unit)
  }, [unit])

  if (!unit) return null

  return (
    <section className={`ad-slot ad-slot--${size} ${className}`.trim()} aria-label="Advertisement">
      <p className="ad-label">ADVERTISEMENT</p>
      <div className="ad-slot__unit" ref={unitRef} style={{ width: unit.width, height: unit.height }} />
    </section>
  )
}

function ResponsiveHomeBanner() {
  const useCompact = useMediaQuery('(max-width: 959px)')
  return <BannerAd key={useCompact ? '320x50' : '728x90'} size={useCompact ? '320x50' : '728x90'} className="home-banner" />
}

function ResponsiveGameBanner() {
  const useCompact = useMediaQuery('(max-width: 959px)')
  return <BannerAd key={useCompact ? '320x50' : '728x90'} size={useCompact ? '320x50' : '728x90'} className="game-banner-ad" />
}

function NativeBannerAd({ className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !canServeAds()) return undefined

    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = NATIVE_AD_SCRIPT
    host.appendChild(script)

    return () => {
      script.remove()
      const container = host.querySelector(`#${NATIVE_AD_CONTAINER_ID}`)
      if (container) container.replaceChildren()
    }
  }, [])

  return (
    <section className={`ad-slot native-ad ${className}`.trim()} aria-label="Sponsored content">
      <p className="ad-label">SPONSORED</p>
      <div className="native-ad__host" ref={hostRef}>
        <div id={NATIVE_AD_CONTAINER_ID} />
      </div>
    </section>
  )
}

const readSaved = () => {
  try {
    return JSON.parse(localStorage.getItem('studyshelf-saved-sources') || '[]')
  } catch {
    return []
  }
}

const RECENT_KEY = 'studyshelf-recent'
const readRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}
const pushRecent = (slug) => {
  const next = [slug, ...readRecent().filter((item) => item !== slug)].slice(0, 12)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch {}
}

const gamesBySlug = new Map(games.map((game) => [game.slug, game]))
const slugsToGames = (slugs) => slugs.map((slug) => gamesBySlug.get(slug)).filter(Boolean)

const setPageTitle = (title) => { document.title = `${title} — StudyShelf` }

const THEME_KEY = 'studyshelf-theme'
const readTheme = () => {
  try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark' } catch { return 'dark' }
}

function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])
  const next = theme === 'light' ? 'dark' : 'light'
  return <button type="button" className="theme-toggle" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>{theme === 'light' ? '☾' : '☀'}</button>
}


function getVoterId() {
  const key = 'studyshelf-anonymous-voter-id'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  }
}

async function readApiResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`)
  return payload
}

// Community stats (votes, unique daily plays, open reports) for every game, fetched once per page load.
const EMPTY_COMMUNITY = { stats: {}, playersToday: 0 }
let communityPromise
const loadCommunity = () => {
  communityPromise ||= fetch('/api/stats').then(readApiResponse).then((data) => ({ stats: data.stats || {}, playersToday: data.playersToday || 0 })).catch(() => EMPTY_COMMUNITY)
  return communityPromise
}

function useCommunity() {
  const [community, setCommunity] = useState(EMPTY_COMMUNITY)
  useEffect(() => {
    let cancelled = false
    loadCommunity().then((next) => { if (!cancelled) setCommunity(next) })
    return () => { cancelled = true }
  }, [])
  return community
}

const useStats = () => useCommunity().stats

// The 5 most-played games this week (with at least a few players) get a "Hot" badge.
const hotSlugsOf = (stats) => new Set(Object.entries(stats).filter(([, stat]) => stat.plays7d >= 3).sort(([, a], [, b]) => b.plays7d - a.plays7d).slice(0, 5).map(([slug]) => slug))

// Same pick for everyone all day (UTC), changes at midnight.
const gameOfTheDay = () => {
  const day = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const char of day) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return games[hash % games.length]
}

const ratingOf = (stat) => {
  const total = (stat?.up || 0) + (stat?.down || 0)
  return total ? Math.round((stat.up / total) * 100) : null
}
// Smoothed approval so one lone upvote doesn't outrank a game with 40 up / 2 down.
const scoreOf = (stat) => ((stat?.up || 0) + 1) / ((stat?.up || 0) + (stat?.down || 0) + 2)

const SORTS = { featured: 'Featured', trending: 'Trending this week', top: 'Top rated', played: 'Most played', az: 'A–Z' }

function sortGames(list, sort, stats) {
  const desc = (key) => (a, b) => key(b) - key(a)
  if (sort === 'az') return [...list].sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'trending') return [...list].sort(desc((game) => stats[game.slug]?.plays7d || 0))
  if (sort === 'played') return [...list].sort(desc((game) => stats[game.slug]?.plays || 0))
  if (sort === 'top') return [...list].sort(desc((game) => scoreOf(stats[game.slug])))
  return list
}

function recordPlay(slug) {
  pushRecent(slug)
  fetch('/api/plays', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, voterId: getVoterId() }),
  }).catch(() => {})
}

function VotePanel({ source }) {
  const [counts, setCounts] = useState({ upvotes: 0, downvotes: 0 })
  const [myVote, setMyVote] = useState(() => {
    try { return localStorage.getItem(`studyshelf-vote:${source.slug}`) || '' } catch { return '' }
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/votes?slug=${encodeURIComponent(source.slug)}`)
      .then(readApiResponse)
      .then((data) => { if (!cancelled) setCounts({ upvotes: data.upvotes || 0, downvotes: data.downvotes || 0 }) })
      .catch(() => { if (!cancelled) setMessage('Community voting will be available once the backend is configured.') })
    return () => { cancelled = true }
  }, [source.slug])

  const castVote = async (vote) => {
    setBusy(true)
    setMessage('')
    const nextVote = myVote === vote ? 'remove' : vote
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: source.slug, vote: nextVote, voterId: getVoterId() }),
      })
      const data = await readApiResponse(response)
      setCounts({ upvotes: data.upvotes || 0, downvotes: data.downvotes || 0 })
      const selected = nextVote === 'remove' ? '' : nextVote
      setMyVote(selected)
      try {
        if (selected) localStorage.setItem(`studyshelf-vote:${source.slug}`, selected)
        else localStorage.removeItem(`studyshelf-vote:${source.slug}`)
      } catch {}
      setMessage(selected ? 'Vote saved.' : 'Vote removed.')
    } catch (error) {
      setMessage(error.message || 'Could not save your vote.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="community-vote-panel" aria-label={`Vote for ${source.name}`}>
    <div className="community-vote-copy"><p className="eyebrow">COMMUNITY RATING</p><h2>Was this game good?</h2><p>One vote per game per browser. You can change or remove your vote.</p></div>
    <div className="community-vote-actions">
      <button type="button" className={`vote-button ${myVote === 'up' ? 'selected' : ''}`} disabled={busy} onClick={() => castVote('up')} aria-pressed={myVote === 'up'}><span aria-hidden="true">▲</span> Upvote <strong>{counts.upvotes}</strong></button>
      <button type="button" className={`vote-button ${myVote === 'down' ? 'selected' : ''}`} disabled={busy} onClick={() => castVote('down')} aria-pressed={myVote === 'down'}><span aria-hidden="true">▼</span> Downvote <strong>{counts.downvotes}</strong></button>
    </div>
    {message && <p className="community-message" role="status">{message}</p>}
  </section>
}

const SUGGESTION_TYPES = {
  game: { label: 'Game request', title: 'Game title', placeholder: 'e.g. Snow Rider 3D', details: 'Official game link or anything we should know' },
  feature: { label: 'Feature idea', title: 'Your idea', placeholder: 'e.g. Leaderboards for each game', details: 'How would it work? Why would it help?' },
  bug: { label: 'Bug report', title: 'What went wrong?', placeholder: 'e.g. A game won’t load on my Chromebook', details: 'Which game or page, which device, and what happened' },
  other: { label: 'Something else', title: 'Subject', placeholder: 'What’s on your mind?', details: 'Anything else we should know' },
}

function SuggestionForm() {
  const [kind, setKind] = useState('game')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError(false)
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, title, details, voterId: getVoterId() }),
      })
      const data = await readApiResponse(response)
      setTitle('')
      setDetails('')
      setMessage(data.message || 'Suggestion sent.')
    } catch (problem) {
      setError(true)
      setMessage(problem.message || 'Could not send the suggestion.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (window.location.hash === '#suggest') document.getElementById('suggest')?.scrollIntoView({ block: 'start' })
  }, [])

  const type = SUGGESTION_TYPES[kind]
  return <section className="game-request-panel" id="suggest">
    <div><p className="eyebrow">COMMUNITY SUGGESTIONS</p><h2>Suggestions & requests</h2><p>Want a game added, have an idea for the site, or found something broken? Suggestions go straight to the site owner for review.</p></div>
    <form className="game-request-form" onSubmit={submit}>
      <div className="kind-picker" role="radiogroup" aria-label="Suggestion type">{Object.entries(SUGGESTION_TYPES).map(([value, option]) => <button type="button" key={value} role="radio" aria-checked={kind === value} className={`chip ${kind === value ? 'active' : ''}`} onClick={() => setKind(value)}>{option.label}</button>)}</div>
      <label>{type.title}<input required minLength={2} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type.placeholder} /></label>
      <label>Details <span>(optional)</span><textarea maxLength={1000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder={type.details} rows={3} /></label>
      <button className="primary-button" type="submit" disabled={busy || title.trim().length < 2}>{busy ? 'Sending…' : 'Send suggestion ↗'}</button>
      {message && <p className={`community-message ${error ? 'is-error' : ''}`} role="status">{message}</p>}
    </form>
  </section>
}

function AdminDashboard() {
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem('studyshelf-admin-token') || '' } catch { return '' } })
  const [authenticated, setAuthenticated] = useState(false)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Enter your private admin token to load votes and game requests.')
  const [error, setError] = useState(false)
  const [kindFilter, setKindFilter] = useState('all')

  const loadData = async (candidate = token) => {
    setBusy(true)
    setError(false)
    try {
      const response = await fetch('/api/admin/data', { headers: { authorization: `Bearer ${candidate}` } })
      const payload = await readApiResponse(response)
      setData(payload)
      setAuthenticated(true)
      setMessage('Dashboard loaded.')
      try { sessionStorage.setItem('studyshelf-admin-token', candidate) } catch {}
    } catch (problem) {
      setAuthenticated(false)
      setData(null)
      setError(true)
      setMessage(problem.message || 'Could not load admin data.')
      try { sessionStorage.removeItem('studyshelf-admin-token') } catch {}
    } finally { setBusy(false) }
  }

  const updateRequest = async (id, status) => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await readApiResponse(response)
      await loadData(token)
    } catch (problem) { setError(true); setMessage(problem.message || 'Could not update request.') }
    finally { setBusy(false) }
  }

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this request permanently?')) return
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/requests/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
      await readApiResponse(response)
      await loadData(token)
    } catch (problem) { setError(true); setMessage(problem.message || 'Could not delete request.') }
    finally { setBusy(false) }
  }

  const reportAction = async (url, init, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
      await readApiResponse(response)
      await loadData(token)
    } catch (problem) { setError(true); setMessage(problem.message || 'Could not update the report.') }
    finally { setBusy(false) }
  }
  const fixGame = (slug) => reportAction('/api/admin/reports/fix-game', { method: 'POST', body: JSON.stringify({ slug }) })
  const reopenReport = (id) => reportAction(`/api/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'open' }) })
  const deleteReport = (id) => reportAction(`/api/admin/reports/${id}`, { method: 'DELETE' }, 'Delete this report permanently?')

  const logout = () => {
    setAuthenticated(false); setData(null); setToken('')
    try { sessionStorage.removeItem('studyshelf-admin-token') } catch {}
    setMessage('Signed out.'); setError(false)
  }

  const requests = data?.requests || []
  const playTotals = data?.playTotals || []
  const visibleRequests = kindFilter === 'all' ? requests : requests.filter((request) => (request.kind || 'game') === kindFilter)
  const pendingCount = (kind) => requests.filter((request) => request.status === 'pending' && (kind === 'all' || (request.kind || 'game') === kind)).length
  const reports = data?.reports || []
  const openReports = reports.filter((report) => report.status === 'open')
  const fixedReports = reports.filter((report) => report.status === 'fixed').slice(0, 20)
  // Group open reports by game, most-reported first.
  const brokenGames = Object.values(openReports.reduce((groups, report) => {
    const group = (groups[report.slug] ||= { slug: report.slug, reports: [], reasons: {} })
    group.reports.push(report)
    group.reasons[report.reason] = (group.reasons[report.reason] || 0) + 1
    return groups
  }, {})).sort((a, b) => b.reports.length - a.reports.length)

  setPageTitle('Admin Dashboard')
  return <Shell><section className="admin-page">
    <div className="page-heading"><div><p className="eyebrow">PRIVATE TOOLS</p><h1>StudyShelf Admin</h1></div>{authenticated && <button className="secondary-button" type="button" onClick={logout}>Sign out</button>}</div>
    {!authenticated && <form className="admin-login" onSubmit={(event) => { event.preventDefault(); void loadData(token) }}><label>Admin token<input type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste the ADMIN_TOKEN secret" required /></label><button className="primary-button" disabled={busy || !token.trim()}>{busy ? 'Checking…' : 'Open dashboard'}</button></form>}
    {message && <p className={`community-message ${error ? 'is-error' : ''}`} role="status">{message}</p>}
    {authenticated && data && <>
      <div className="admin-metrics"><article><span>Games with votes</span><strong>{data.gameTotals.length}</strong></article><article><span>Total upvotes</span><strong>{data.gameTotals.reduce((sum, row) => sum + (row.upvotes || 0), 0)}</strong></article><article><span>Total downvotes</span><strong>{data.gameTotals.reduce((sum, row) => sum + (row.downvotes || 0), 0)}</strong></article><article><span>Unique plays (7 days)</span><strong>{playTotals.reduce((sum, row) => sum + (row.plays7d || 0), 0)}</strong></article><article><span>Pending suggestions</span><strong>{pendingCount('all')}</strong></article><article><span>Open game reports</span><strong>{openReports.length}</strong></article></div>
      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">NEEDS ATTENTION</p><h2>Broken game reports</h2></div><span className="result-count">{brokenGames.length} {brokenGames.length === 1 ? 'game' : 'games'} affected</span></div>
        <div className="request-list">{brokenGames.map((group) => {
          const game = gamesBySlug.get(group.slug)
          return <article className="admin-request" key={group.slug}>
            <div className="admin-request-top"><div><h3>{game?.name || group.slug}</h3><p>{Object.entries(group.reasons).map(([reason, count]) => `${REPORT_REASONS[reason] || reason} ×${count}`).join(' · ')}</p></div><div className="admin-request-badges"><span className="request-status status-rejected">{group.reports.length} open</span></div></div>
            <ul className="report-entries">{group.reports.map((report) => <li key={report.id}><span>{REPORT_REASONS[report.reason] || report.reason}</span>{report.details && <q>{report.details}</q>}<small>{report.updated_at} UTC</small><button type="button" className="text-button" disabled={busy} onClick={() => void deleteReport(report.id)}>Delete</button></li>)}</ul>
            <div className="admin-request-actions"><button className="secondary-button" disabled={busy} onClick={() => void fixGame(group.slug)}>✓ Mark fixed</button>{game && <a className="secondary-button" href={`/sources/${game.slug}`} target="_blank" rel="noopener noreferrer">Test game ↗</a>}{game && <a className="secondary-button" href={game.embedUrl} target="_blank" rel="noopener noreferrer">Open embed URL ↗</a>}</div>
          </article>
        })}{!brokenGames.length && <p className="admin-empty">No open reports. Every game is working, as far as players know.</p>}</div>
        {fixedReports.length > 0 && <details className="admin-fixed-reports"><summary>Recently fixed ({fixedReports.length})</summary><ul className="report-entries">{fixedReports.map((report) => <li key={report.id}><span>{gamesBySlug.get(report.slug)?.name || report.slug}</span><q>{REPORT_REASONS[report.reason] || report.reason}</q><small>{report.updated_at} UTC</small><button type="button" className="text-button" disabled={busy} onClick={() => void reopenReport(report.id)}>Reopen</button></li>)}</ul></details>}
      </section>
      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">RANKING</p><h2>Votes by game</h2></div><button className="secondary-button" disabled={busy} onClick={() => void loadData(token)}>Refresh</button></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Game slug</th><th>Upvotes</th><th>Downvotes</th><th>Total</th></tr></thead><tbody>{data.gameTotals.map((row) => <tr key={row.slug}><td>{row.slug}</td><td>{row.upvotes || 0}</td><td>{row.downvotes || 0}</td><td>{row.total || 0}</td></tr>)}</tbody></table>{!data.gameTotals.length && <p className="admin-empty">No votes have been submitted yet.</p>}</div>
      </section>
      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">ANONYMOUS VOTE LOG</p><h2>Recent voters</h2></div><span className="result-count">Latest {data.votes.length}</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Game</th><th>Vote</th><th>Anonymous voter ref</th><th>Last updated (UTC)</th></tr></thead><tbody>{data.votes.map((vote, index) => <tr key={`${vote.slug}-${vote.voter_ref}-${index}`}><td>{vote.slug}</td><td><span className={`vote-kind ${vote.direction === 1 ? 'up' : 'down'}`}>{vote.direction === 1 ? '▲ Upvote' : '▼ Downvote'}</span></td><td><code>{vote.voter_ref}</code></td><td>{vote.updated_at} UTC</td></tr>)}</tbody></table>{!data.votes.length && <p className="admin-empty">No votes have been submitted yet.</p>}</div>
        <p className="fine-print">Voter references are salted hashes, not names, email addresses, or IP addresses. Votes are anonymous and can be changed by the same browser.</p>
      </section>
      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">POPULARITY</p><h2>Most played</h2></div><span className="result-count">Unique browsers per day</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Game</th><th>Last 7 days</th><th>All time</th></tr></thead><tbody>{playTotals.map((row) => <tr key={row.slug}><td>{gamesBySlug.get(row.slug)?.name || row.slug}</td><td>{row.plays7d || 0}</td><td>{row.plays || 0}</td></tr>)}</tbody></table>{!playTotals.length && <p className="admin-empty">No plays recorded yet.</p>}</div>
      </section>
      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">INBOX</p><h2>Suggestions</h2></div><span className="result-count">{pendingCount('all')} pending</span></div>
        <div className="kind-picker admin-kind-filter" role="group" aria-label="Filter suggestions">{[['all', 'All'], ...Object.entries(SUGGESTION_TYPES).map(([value, option]) => [value, option.label])].map(([value, label]) => <button type="button" key={value} aria-pressed={kindFilter === value} className={`chip ${kindFilter === value ? 'active' : ''}`} onClick={() => setKindFilter(value)}>{label} <span>{pendingCount(value)}</span></button>)}</div>
        <div className="request-list">{visibleRequests.map((request) => <article className="admin-request" key={request.id}><div className="admin-request-top"><div><h3>{request.title}</h3><p>{request.created_at} UTC · #{request.id}</p></div><div className="admin-request-badges"><span className={`request-kind kind-${request.kind || 'game'}`}>{SUGGESTION_TYPES[request.kind || 'game']?.label}</span><span className={`request-status status-${request.status}`}>{request.status}</span></div></div>{request.details && <p className="admin-request-details">{request.details}</p>}<div className="admin-request-actions"><button className="secondary-button" disabled={busy} onClick={() => void updateRequest(request.id, 'pending')}>Pending</button><button className="secondary-button" disabled={busy} onClick={() => void updateRequest(request.id, 'approved')}>Approve</button><button className="secondary-button" disabled={busy} onClick={() => void updateRequest(request.id, 'rejected')}>Reject</button><button className="danger-button" disabled={busy} onClick={() => void deleteRequest(request.id)}>Delete spam</button></div></article>)}{!visibleRequests.length && <p className="admin-empty">No suggestions here yet.</p>}</div>
      </section>
    </>}
  </section></Shell>
}

function Logo() {
  return <a className="brand" href="/" aria-label="StudyShelf home"><img src="/bookshelf.svg" alt="" /><span>StudyShelf</span></a>
}

function Header({ active = 'sources' }) {
  return <header className="topbar"><Logo /><nav aria-label="Main navigation"><a className={active === 'sources' ? 'active' : ''} href="/">Games</a><a className={active === 'rooms' ? 'active' : ''} href="/rooms">Rooms</a><ThemeToggle /></nav></header>
}

function Footer() {
  return <footer className="footer"><Logo /><div className="footer-links"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div><span>© {new Date().getFullYear()} StudyShelf</span></footer>
}

function Shell({ children, active }) {
  return <div className="app-shell"><Header active={active} /><main className="main-content">{children}</main><Footer /></div>
}

function SourceCard({ source, stat, hot = false }) {
  const rating = ratingOf(stat)
  return <a
    className="source-card"
    href={`/sources/${source.slug}`}
    style={{ '--tile-color': source.color }}
    aria-label={`Open ${source.name}.${rating === null ? '' : ` ${rating}% liked.`} ${source.description}`}
  >
    {rating !== null && <span className="source-card__badge" aria-hidden="true">▲ {rating}%</span>}
    {hot && <span className="source-card__badge source-card__badge--hot" aria-hidden="true">🔥 Hot</span>}
    <img
      className="source-card__image"
      src={source.image}
      alt=""
      loading="lazy"
      decoding="async"
      onError={(event) => {
        event.currentTarget.style.display = 'none'
        const fallback = event.currentTarget.parentElement?.querySelector('.source-card__fallback')
        if (fallback) fallback.hidden = false
      }}
    />
    <span className="source-card__fallback" hidden aria-hidden="true">{source.icon}</span>
    <div className="source-card__overlay" aria-hidden="true">
      <h2 className="source-card__title">{source.name}</h2>
      <p className="source-card__description">{source.description}</p>
    </div>
  </a>
}

function Shelf({ eyebrow, title, items, stats, action }) {
  const hot = useMemo(() => hotSlugsOf(stats), [stats])
  if (!items.length) return null
  return <section className="shelf">
    <div className="shelf-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>
    <div className="shelf-row">{items.map((source) => <SourceCard key={source.slug} source={source} stat={stats[source.slug]} hot={hot.has(source.slug)} />)}</div>
  </section>
}

const categoryCounts = games.reduce((counts, game) => ({ ...counts, [game.category]: (counts[game.category] || 0) + 1 }), {})
const categories = ['All', ...Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a])]
categoryCounts.All = games.length

const readCatalogParams = () => {
  const params = new URLSearchParams(window.location.search)
  const category = params.get('cat')
  const sort = params.get('sort')
  return { query: params.get('q') || '', category: categories.includes(category) ? category : 'All', sort: SORTS[sort] ? sort : 'featured' }
}

function SourcesPage() {
  const [initial] = useState(readCatalogParams)
  const [query, setQuery] = useState(initial.query)
  const [category, setCategory] = useState(initial.category)
  const [sort, setSort] = useState(initial.sort)
  const [recent, setRecent] = useState(() => slugsToGames(readRecent()))
  const [saved] = useState(() => slugsToGames(readSaved()))
  const [dailyPick] = useState(gameOfTheDay)
  const searchRef = useRef(null)
  const { stats, playersToday } = useCommunity()
  const hot = useMemo(() => hotSlugsOf(stats), [stats])
  const filtered = useMemo(() => sortGames(games.filter((source) => (category === 'All' || source.category === category) && `${source.name} ${source.category} ${source.description} ${source.tag || ''}`.toLowerCase().includes(query.trim().toLowerCase())), sort, stats), [category, query, sort, stats])
  const trending = useMemo(() => sortGames(games.filter((game) => stats[game.slug]?.plays7d), 'trending', stats).slice(0, 12), [stats])
  const browsing = !query.trim() && category === 'All'
  setPageTitle('StudyShelf')

  // Keep the URL in sync so searches and filters can be shared or bookmarked.
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category !== 'All') params.set('cat', category)
    if (sort !== 'featured') params.set('sort', sort)
    const search = params.toString()
    window.history.replaceState(null, '', `${search ? `/?${search}` : '/'}${window.location.hash}`)
  }, [query, category, sort])

  useEffect(() => {
    const onKeyDown = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (event.key === '/' && !typing) {
        event.preventDefault()
        searchRef.current?.focus()
      } else if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('')
        searchRef.current.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const playRandom = () => {
    const pool = filtered.length ? filtered : games
    window.location.href = `/sources/${pool[Math.floor(Math.random() * pool.length)].slug}`
  }
  const clearRecent = () => {
    try { localStorage.removeItem(RECENT_KEY) } catch {}
    setRecent([])
  }

  return <Shell active="sources">
    <section className="home-hero">
      {playersToday > 0 && <p className="live-pill"><i aria-hidden="true" />{playersToday.toLocaleString()} {playersToday === 1 ? 'player' : 'players'} today</p>}
      <h1>StudyShelf<span className="accent-dot">.</span></h1>
      <p className="home-hero__copy">Find a game, jump in, and make the most of your break.</p>
      <nav className="quick-nav" aria-label="Quick links">
        <a href="#library"><span aria-hidden="true">▦</span> Game library</a>
        <button type="button" onClick={playRandom}><span aria-hidden="true">🎲</span> Random game</button>
        <a href="/rooms"><span aria-hidden="true">◈</span> Rooms</a>
        <a href="#suggest"><span aria-hidden="true">✎</span> Suggest</a>
      </nav>
    </section>
    <ResponsiveHomeBanner />
    {browsing && <>
      <a className="daily-pick" href={`/sources/${dailyPick.slug}`} style={{ '--tile-color': dailyPick.color }}>
        <img src={dailyPick.image} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
        <div className="daily-pick__copy">
          <p className="eyebrow">★ GAME OF THE DAY</p>
          <h2>{dailyPick.name}</h2>
          <p>{dailyPick.description}</p>
          <span className="primary-button">Play now <span>↘</span></span>
        </div>
      </a>
      <Shelf eyebrow="PICK UP WHERE YOU LEFT OFF" title="Continue playing" items={recent} stats={stats} action={<button type="button" className="text-button" onClick={clearRecent}>Clear</button>} />
      <Shelf eyebrow="YOUR SHELF" title="Saved games" items={saved} stats={stats} />
      <Shelf eyebrow="WHAT EVERYONE’S PLAYING" title="Trending this week" items={trending} stats={stats} action={<button type="button" className="text-button" onClick={() => setSort('trending')}>See all</button>} />
    </>}
    <div className="page-heading page-heading--catalog" id="library">
      <div><p className="eyebrow">BROWSE & PLAY</p><h2>Game Library</h2></div>
      <span className="result-count">{filtered.length} games</span>
    </div>
    <div className="toolbar">
      <label className="search-box"><span>⌕</span><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games..." aria-label="Search games" aria-keyshortcuts="/" /><kbd title="Press / to search">/</kbd></label>
      <label className="filter-select"><span className="sr-only">Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}>{Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button type="button" className="secondary-button random-button" onClick={playRandom} title="Open a random game from this list">🎲 <span>Random</span></button>
    </div>
    <div className="category-chips" role="group" aria-label="Categories">{categories.map((item) => <button type="button" key={item} aria-pressed={category === item} className={`chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item} <span>{categoryCounts[item]}</span></button>)}</div>
    <div className="source-grid">{filtered.map((source) => <SourceCard key={source.slug} source={source} stat={stats[source.slug]} hot={hot.has(source.slug)} />)}</div>
    {filtered.length === 0 && <div className="empty-state"><h2>No matching games</h2><p>Try a different search or category — or suggest the game below.</p><button onClick={() => { setQuery(''); setCategory('All') }}>Clear filters</button></div>}
    <NativeBannerAd className="home-native-ad" />
    <SuggestionForm />
  </Shell>
}

const REPORT_REASONS = {
  'wont-load': 'Won’t load',
  'black-screen': 'Black or blank screen',
  controls: 'Controls don’t work',
  slow: 'Too slow / laggy',
  other: 'Something else',
}

function ReportGamePanel({ source, onClose }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError(false)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: source.slug, reason, details, voterId: getVoterId() }),
      })
      const data = await readApiResponse(response)
      setSent(true)
      setMessage(data.message || 'Report sent.')
    } catch (problem) {
      setError(true)
      setMessage(problem.message || 'Could not send the report.')
    } finally {
      setBusy(false)
    }
  }

  return <form className="report-panel" id="report-panel" onSubmit={submit}>
    <div className="report-panel__heading"><div><p className="eyebrow">REPORT A PROBLEM</p><h3>What’s wrong with {source.name}?</h3></div><button type="button" className="text-button" onClick={onClose}>Close</button></div>
    {!sent && <>
      <div className="kind-picker" role="radiogroup" aria-label="What went wrong">{Object.entries(REPORT_REASONS).map(([value, label]) => <button type="button" key={value} role="radio" aria-checked={reason === value} className={`chip ${reason === value ? 'active' : ''}`} onClick={() => setReason(value)}>{label}</button>)}</div>
      <label>Details <span>(optional)</span><textarea maxLength={500} rows={2} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Browser or device, what you saw, when it happens…" /></label>
      <button className="primary-button" type="submit" disabled={busy || !reason}>{busy ? 'Sending…' : 'Send report'}</button>
    </>}
    {message && <p className={`community-message ${error ? 'is-error' : ''}`} role="status">{message}</p>}
  </form>
}

function SourceDetail({ source }) {
  const [saved, setSaved] = useState(() => readSaved().includes(source.slug))
  const [showFrame, setShowFrame] = useState(false)
  const [frameVersion, setFrameVersion] = useState(0)
  const iframeRef = useRef(null)
  const [showReport, setShowReport] = useState(false)
  const stats = useStats()
  const openReports = stats[source.slug]?.reports || 0
  const similar = useMemo(() => sortGames(games.filter((game) => game.category === source.category && game.slug !== source.slug), 'top', stats).slice(0, 6), [source, stats])
  const startGame = () => {
    if (!showFrame) recordPlay(source.slug)
    setShowFrame(true)
  }
  const toggleSave = () => setSaved((current) => {
    const next = current ? readSaved().filter((item) => item !== source.slug) : [...readSaved(), source.slug]
    try { localStorage.setItem('studyshelf-saved-sources', JSON.stringify(next)) } catch {}
    return !current
  })
  const openFullscreen = async () => {
    try {
      if (iframeRef.current?.requestFullscreen) await iframeRef.current.requestFullscreen()
    } catch {
      // Fullscreen can be blocked by browser settings or the embedded provider.
    }
  }
  setPageTitle(source.name)

  return <Shell active="sources">
    <a className="back-link" href="/">← All games</a>
    <div className="source-detail-layout">
      <div className="source-detail-main">
        <section className="detail-header">
          <div className="detail-art" style={{ '--tile-color': source.color }}>
            <img src={source.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; const fallback = event.currentTarget.parentElement?.querySelector('span'); if (fallback) fallback.hidden = false }} />
            <span hidden>{source.icon}</span>
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{source.category} / GAME</p>
            <h1>{source.name}</h1>
            <p>{source.details || source.description}</p>
            <div className="detail-actions">
              <button className="primary-button" onClick={() => { startGame(); document.getElementById('source-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{showFrame ? 'Game loaded' : 'Play here'} <span>↘</span></button>
              <button className={`secondary-button ${saved ? 'saved' : ''}`} onClick={toggleSave}>{saved ? '★ Saved' : '☆ Save'}</button>
              {source.hosted
                ? <a className="secondary-button" href={source.embedUrl} target="_blank" rel="noopener">Open in new tab ↗</a>
                : <a className="secondary-button" href={source.providerUrl} target="_blank" rel="noopener noreferrer">Open provider ↗</a>}
            </div>
            {source.hosted
              ? <p className="fine-print">Open-source HTML5 game by <a href="https://github.com/mashukui" target="_blank" rel="noopener noreferrer">mashukui</a>, hosted on StudyShelf under the <a href="/play/LICENSE.txt" target="_blank" rel="noopener">MIT License</a>. <a href={source.providerUrl} target="_blank" rel="noopener noreferrer">Source code ↗</a></p>
              : <p className="fine-print">Game provided by an independent third party. Some games include controls or overlays managed by the provider.</p>}
          </div>
        </section>
        <VotePanel source={source} />
        <section className="player-panel" id="source-player">
          <div className="player-panel-heading">
            <div><p className="eyebrow">GAME PLAYER</p><h2>{showFrame ? source.name : 'Ready when you are'}</h2></div>
            <div className="player-panel-actions">
              {showFrame && <button className="secondary-button" type="button" onClick={() => setFrameVersion((value) => value + 1)}>Reload</button>}
              {showFrame && <button className="secondary-button" type="button" onClick={openFullscreen}>Fullscreen ⛶</button>}
              {showFrame && <a href={source.providerUrl} target="_blank" rel="noopener noreferrer">{source.hosted ? 'Source code ↗' : 'Provider page ↗'}</a>}
              <button className={`secondary-button report-toggle ${showReport ? 'saved' : ''}`} type="button" onClick={() => setShowReport((open) => !open)} aria-expanded={showReport} aria-controls="report-panel">⚑ Not working?</button>
            </div>
          </div>
          {openReports >= 2 && <p className="report-warning" role="note">⚠ {openReports} players reported problems with this game recently. If it won’t start, try <strong>Reload</strong> or <strong>Open provider</strong>.</p>}
          {showReport && <ReportGamePanel source={source} onClose={() => setShowReport(false)} />}
          {showFrame
            ? <div className="source-frame-wrap"><iframe key={frameVersion} ref={iframeRef} className="source-frame" src={source.embedUrl} title={source.name} allow="fullscreen; autoplay; gamepad" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin" /></div>
            : <div className="player-placeholder"><span>{source.icon}</span><p>Launch the game in the player, or open the provider directly.</p><button className="primary-button" onClick={startGame}>Load game ↘</button></div>}
        </section>
        <ResponsiveGameBanner />
        {source.controls && <section className="controls-note"><p className="eyebrow">CONTROLS</p><p>{source.controls}</p></section>}
        <Shelf eyebrow="MORE LIKE THIS" title={`More ${source.category} games`} items={similar} stats={stats} action={<a className="text-button" href={`/?cat=${encodeURIComponent(source.category)}`}>See all</a>} />
        <div className="detail-bottom"><a href="/#suggest">Suggest a game or feature ↗</a><a href="/rooms">Explore Rooms ↗</a></div>
      </div>
    </div>
    <NativeBannerAd className="game-native-ad" />
  </Shell>
}

function RoomsPage() {
  const [query, setQuery] = useState('')
  const filtered = roomServices.filter((room) => `${room.name} ${room.type} ${room.note}`.toLowerCase().includes(query.toLowerCase().trim()))
  setPageTitle('Rooms')
  return <Shell active="rooms"><div className="page-heading"><div><p className="eyebrow">TOOLS & DESTINATIONS</p><h1>Rooms</h1></div><span className="result-count">{filtered.length} rooms</span></div><p className="page-lede">A collection of useful web tools and destinations. Some providers restrict embedded viewing, so external links open directly.</p><label className="search-box room-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rooms..." aria-label="Search rooms" /></label><div className="rooms-grid">{filtered.map((room) => <article className="room-card" key={room.name}><div className="room-icon">{room.icon}</div><p className="eyebrow">{room.type}</p><h2>{room.name}</h2><p>{room.note}</p><a className="primary-button" href={room.url} target="_blank" rel="noopener noreferrer">Open room <span>↗</span></a><small>{new URL(room.url).hostname}</small></article>)}</div>{filtered.length === 0 && <div className="empty-state"><h2>No matching rooms</h2><p>Try another search.</p></div>}</Shell>
}

function InfoPage({ kind }) {
  const content = {
    about: { title: 'About StudyShelf', intro: 'StudyShelf organizes a browsable collection of browser games and useful web tools.', body: 'Game pages link to independently operated providers. StudyShelf does not claim ownership of third-party content, and provider availability may change.' },
    privacy: { title: 'Privacy', intro: 'Last updated October 15, 2026.', body: 'StudyShelf stores saved-game preferences in your browser. Hosting providers may process technical information required to deliver and protect the site. When you open an external game or room, that provider may receive connection data and handle it under its own privacy policy. StudyShelf also loads third-party advertising scripts for banner, native, and floating advertisements. Advertising providers may process technical data and use cookies or similar technologies under their own privacy policies. If you vote or send a suggestion, StudyShelf stores the game slug, vote direction or suggestion text, timestamps, and a salted hash of a random browser identifier to limit repeat submissions. When you load a game, StudyShelf records the game slug, the date, and that same salted hash so it can count unique players per day for the Trending and Most played lists. Your recently played games are kept only in your browser. It does not ask for your name or email address for these features and does not store raw IP addresses in this voting system. Avoid sharing personal or sensitive information in request details.' },
    terms: { title: 'Terms', intro: 'Use StudyShelf responsibly and follow the rules that apply to you.', body: 'StudyShelf is a directory and viewer for third-party games and content. We do not own or guarantee external sources, their availability, or their content. Use of external providers and advertisements is subject to their own terms. Do not use the site to violate applicable laws, access controls, or network policies.' },
    contact: { title: 'Contact', intro: 'Need help with StudyShelf?', body: 'For support or to report a game issue, email support@studyshelf.org. This address must be configured to receive messages before the site is promoted.' },
  }
  const page = content[kind] || content.about
  setPageTitle(page.title)
  return <Shell><a className="back-link" href="/">← Back to StudyShelf</a><section className="info-page"><p className="eyebrow">STUDYSHELF</p><h1>{page.title}</h1><p className="page-lede">{page.intro}</p><p>{page.body}</p>{kind === 'contact' && <a className="primary-button" href="mailto:support@studyshelf.org">Email support ↗</a>}</section></Shell>
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/admin') return <AdminDashboard />
  if (path === '/rooms') return <RoomsPage />
  if (['/about', '/privacy', '/terms', '/contact'].includes(path)) return <InfoPage kind={path.slice(1)} />
  const match = path.match(/^\/sources\/([a-z0-9-]+)$/)
  if (match) {
    const source = games.find((item) => item.slug === match[1])
    return source ? <SourceDetail source={source} /> : <InfoPage kind="about" />
  }
  return <SourcesPage />
}
