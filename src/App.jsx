import { useMemo, useState } from 'react'
import { games } from './games'
import './App.css'

const roomServices = [
  { name: 'Desmos', type: 'Graphing tools', note: 'Explore functions, graphs, and mathematical relationships.', url: 'https://www.desmos.com/calculator', icon: '∿' },
  { name: 'GeoGebra', type: 'Math tools', note: 'Work with geometry, algebra, graphing, and interactive math.', url: 'https://www.geogebra.org/', icon: '⌬' },
  { name: 'PhET Simulations', type: 'Science tools', note: 'Explore interactive simulations for physics, chemistry, biology, and math.', url: 'https://phet.colorado.edu/', icon: '⚛' },
  { name: 'itch.io', type: 'Independent library', note: 'Browse independent projects and browser-based experiences.', url: 'https://itch.io/', icon: '◈' },
  { name: 'CrazyGames', type: 'Browser library', note: 'Open the provider’s own catalog in a new tab.', url: 'https://www.crazygames.com/', icon: '✳' },
]

const readSaved = () => { try { return JSON.parse(localStorage.getItem('studyshelf-saved-sources') || '[]') } catch { return [] } }
const setPageTitle = (title) => { document.title = `${title} — StudyShelf` }

function Logo() {
  return <a className="brand" href="/" aria-label="StudyShelf home"><img src="/bookshelf.svg" alt="" /><span>StudyShelf</span></a>
}

function Header({ active = 'sources' }) {
  return <header className="topbar"><Logo /><nav aria-label="Main navigation"><a className={active === 'sources' ? 'active' : ''} href="/">Sources</a><a className={active === 'rooms' ? 'active' : ''} href="/rooms">Rooms</a></nav></header>
}

function Footer() {
  return <footer className="footer"><Logo /><div className="footer-links"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div><span>© {new Date().getFullYear()} StudyShelf</span></footer>
}

function Shell({ children, active }) {
  return <div className="app-shell"><Header active={active} /><main className="main-content">{children}</main><Footer /></div>
}

function SourceCard({ source }) {
  return <a
    className="source-card"
    href={`/sources/${source.slug}`}
    style={{ '--tile-color': source.color }}
    aria-label={`Open ${source.name}. ${source.description}`}
  >
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

function SourcesPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const categories = useMemo(() => ['All', ...new Set(games.map((source) => source.category))], [])
  const filtered = useMemo(() => games.filter((source) => (category === 'All' || source.category === category) && `${source.name} ${source.category} ${source.description} ${source.tag || ''}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query])
  setPageTitle('Sources')
  return <Shell active="sources"><div className="page-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h1>Sources</h1></div><span className="result-count">{filtered.length} items</span></div>
    <div className="toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources..." aria-label="Search sources" /><kbd>⌕</kbd></label><label className="filter-select"><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="source-grid">{filtered.map((source) => <SourceCard key={source.slug} source={source} />)}</div>
    {filtered.length === 0 && <div className="empty-state"><h2>No matching sources</h2><p>Try a different search or category.</p><button onClick={() => { setQuery(''); setCategory('All') }}>Clear filters</button></div>}
  </Shell>
}

function SourceDetail({ source }) {
  const [saved, setSaved] = useState(() => readSaved().includes(source.slug))
  const [showFrame, setShowFrame] = useState(false)
  const toggleSave = () => setSaved((current) => { const next = current ? readSaved().filter((item) => item !== source.slug) : [...readSaved(), source.slug]; try { localStorage.setItem('studyshelf-saved-sources', JSON.stringify(next)) } catch {} return !current })
  setPageTitle(source.name)
  return <Shell active="sources"><a className="back-link" href="/">← All sources</a><section className="detail-header"><div className="detail-art" style={{ '--tile-color': source.color }}><img src={source.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement.querySelector('span').hidden = false }} /><span hidden>{source.icon}</span></div><div className="detail-copy"><p className="eyebrow">{source.category} / SOURCE</p><h1>{source.name}</h1><p>{source.details || source.description}</p><div className="detail-actions"><button className="primary-button" onClick={() => { setShowFrame(true); document.getElementById('source-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{showFrame ? 'Reload source' : 'Open here'} <span>↘</span></button><button className={`secondary-button ${saved ? 'saved' : ''}`} onClick={toggleSave}>{saved ? '★ Saved' : '☆ Save'}</button><a className="secondary-button" href={source.providerUrl} target="_blank" rel="noopener noreferrer">Provider page ↗</a></div><p className="fine-print">This source is supplied by an independent third party. Availability and embedding support may vary.</p></div></section>
    <section className="player-panel" id="source-player"><div className="player-panel-heading"><div><p className="eyebrow">SOURCE VIEWER</p><h2>{showFrame ? source.name : 'Ready when you are'}</h2></div>{showFrame && <a href={source.providerUrl} target="_blank" rel="noopener noreferrer">Open provider ↗</a>}</div>{showFrame ? <iframe className="source-frame" src={source.embedUrl} title={source.name} allow="fullscreen; autoplay; gamepad" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : <div className="player-placeholder"><span>{source.icon}</span><p>Open this source in the viewer, or visit its provider directly.</p><button className="primary-button" onClick={() => setShowFrame(true)}>Load source ↘</button></div>}</section>
    <div className="detail-bottom"><a href="mailto:support@studyshelf.org?subject=StudyShelf%20source%20report">Report an issue ↗</a><a href="/rooms">Explore Rooms ↗</a></div>
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
    about: { title: 'About StudyShelf', intro: 'StudyShelf organizes a browsable collection of third-party sources and a small directory of web tools.', body: 'Source pages link to independently operated providers. StudyShelf does not claim ownership of third-party content, and provider availability may change.' },
    privacy: { title: 'Privacy', intro: 'Last updated October 15, 2026.', body: 'StudyShelf stores saved-source preferences in your browser. Hosting providers may process technical information required to deliver and protect the site. When you open an external source or room, that provider may receive connection data and handle it under its own privacy policy. Advertising is not currently enabled in this build. Avoid sharing personal or sensitive information with third-party providers.' },
    terms: { title: 'Terms', intro: 'Use StudyShelf responsibly and follow the rules that apply to you.', body: 'StudyShelf is a directory and viewer for third-party content. We do not own or guarantee external sources, their availability, or their content. Use of external providers is subject to their own terms. Do not use the site to violate applicable laws, access controls, or network policies.' },
    contact: { title: 'Contact', intro: 'Need help with StudyShelf?', body: 'For support or to report an issue, email support@studyshelf.org. This address must be configured to receive messages before the site is promoted.' },
  }
  const page = content[kind] || content.about
  setPageTitle(page.title)
  return <Shell><a className="back-link" href="/">← Back to StudyShelf</a><section className="info-page"><p className="eyebrow">STUDYSHELF</p><h1>{page.title}</h1><p className="page-lede">{page.intro}</p><p>{page.body}</p>{kind === 'contact' && <a className="primary-button" href="mailto:support@studyshelf.org">Email support ↗</a>}</section></Shell>
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/rooms') return <RoomsPage />
  if (['/about', '/privacy', '/terms', '/contact'].includes(path)) return <InfoPage kind={path.slice(1)} />
  const match = path.match(/^\/sources\/([a-z0-9-]+)$/)
  if (match) {
    const source = games.find((item) => item.slug === match[1])
    return source ? <SourceDetail source={source} /> : <InfoPage kind="about" />
  }
  return <SourcesPage />
}
