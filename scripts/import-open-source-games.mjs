// Imports the MIT-licensed HTML5 games from https://github.com/mashukui/web-games so StudyShelf hosts them itself.
//
//   git clone --depth 1 https://github.com/mashukui/web-games.git <dir>
//   node scripts/import-open-source-games.mjs <dir>
//
// Writes public/play/<game>/index.html (+ shared i18n.js and the MIT license), public/play-thumbs/<game>.svg,
// and src/openSourceGames.js. Re-run it to pick up upstream updates; games not listed in GAMES below are skipped.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const upstream = process.argv[2]
if (!upstream) throw new Error('Usage: node scripts/import-open-source-games.mjs <path-to-web-games-checkout>')

const REPO = 'https://github.com/mashukui/web-games'

// Category, card tag, description, and a short controls hint for each game we import.
const GAMES = {
  '2048': ['Puzzle', 'NUMBER PUZZLE', 'Slide and merge matching tiles to reach 2048, then see how far past it you can go.', 'Arrow keys or swipe to slide the tiles.'],
  'air-hockey': ['Sports', 'TABLE HOCKEY', 'Fast table hockey against the computer with real puck physics. First to seven goals wins.', 'Drag your mallet with the mouse or a finger.'],
  'ant-flap': ['Arcade', 'QUICK REFLEXES', 'Guide a tiny ant through gaps in the branches. One tap, endless tries.', 'Press Space, click, or tap to flap.'],
  'ant-jump': ['Arcade', 'ENDLESS CLIMBER', 'Bounce an ant up an endless tower of moving, crumbling, and springy platforms.', 'Arrow keys or touch to steer.'],
  'balloon-pop': ['Arcade', 'TIMED ARCADE', 'Pop every balloon before it floats away, dodge the bombs, and build combos in 60 seconds.', 'Click or tap balloons; avoid the bombs.'],
  'battleship': ['Board', 'NAVAL STRATEGY', 'Hide your fleet and hunt down the computer’s five ships on a 10×10 grid.', 'Place your fleet, then click enemy squares to fire.'],
  'block-drop': ['Puzzle', 'FALLING BLOCKS', 'Classic falling-block puzzle with seven pieces, a hold slot, and rising speed levels.', 'Arrow keys to move and rotate, Space to drop. Touch controls on mobile.'],
  'bowling': ['Sports', 'TEN-PIN BOWLING', 'Ten frames of ten-pin bowling. Aim, add spin, and chase a perfect 300.', 'Swipe or drag up to bowl.'],
  'breakout': ['Arcade', 'BRICK BREAKER', 'Smash every brick with a bouncing ball and an angle-perfect paddle across endless levels.', 'Move the paddle with the mouse, touch, or arrow keys.'],
  'bubble-shooter': ['Puzzle', 'BUBBLE POP', 'Aim and fire to match three or more bubbles of the same color — anything left hanging drops too.', 'Aim with the mouse or finger and release to shoot.'],
  'checkers': ['Board', 'CLASSIC BOARD GAME', 'Classic checkers with forced captures, multi-jumps, and kings against a three-level computer.', 'Click a piece, then click where to move it.'],
  'connect-four': ['Board', 'FOUR IN A ROW', 'Drop discs and line up four in a row before the computer does.', 'Click a column to drop your disc.'],
  'cross-road': ['Arcade', 'HOPPER', 'Hop across busy roads and rivers one tile at a time without getting squashed or soaked.', 'Arrow keys or swipe to hop.'],
  'dino-run': ['Arcade', 'ENDLESS RUNNER', 'Jump the cacti and duck the birds as the runner speeds up forever.', 'Space or Up to jump, Down to duck. Tap on mobile.'],
  'fruit-slice': ['Arcade', 'SLICING', 'Swipe through flying fruit, chain combos, and stay clear of the bombs.', 'Swipe across the fruit with the mouse or a finger.'],
  'gem-match': ['Puzzle', 'MATCH 3', 'Swap gems to line up three or more and set off chain-reaction cascades.', 'Click or swipe to swap neighboring gems.'],
  'gomoku': ['Board', 'FIVE IN A ROW', 'Get five stones in a row on a 15×15 board before the computer does.', 'Click an intersection to place a stone.'],
  'hanoi': ['Puzzle', 'LOGIC PUZZLE', 'Move the whole tower to the last peg, one disk at a time, never stacking big on small.', 'Click a peg to pick up a disk, then click another peg to drop it.'],
  'helicopter': ['Arcade', 'CAVE FLIGHT', 'Fly through an endless cave that keeps getting narrower. How far can you go?', 'Hold the mouse, Space, or a finger to climb; release to fall.'],
  'helix-drop': ['Arcade', 'TOWER FALL', 'Spin the tower so the ball falls through the gaps — just don’t touch the red.', 'Drag or use arrow keys to spin the tower.'],
  'hoop-shot': ['Sports', 'BASKETBALL', 'Flick the ball into a moving hoop and build a streak before the 60-second clock runs out.', 'Drag back and release to shoot.'],
  'lights-out': ['Puzzle', 'LOGIC PUZZLE', 'Every tap flips a light and its neighbors. Switch them all off in as few moves as you can.', 'Click a light to flip it and its neighbors.'],
  'mahjong-link': ['Puzzle', 'TILE MATCHING', 'Clear the board by linking matching tiles with a path of no more than two turns.', 'Click two matching tiles that can be linked.'],
  'mancala': ['Board', 'SEED SOWING', 'Sow seeds around the board, capture from empty pits, and earn extra turns in this ancient game.', 'Click one of your pits to sow its seeds.'],
  'maze-muncher': ['Arcade', 'MAZE CHASE', 'Eat every dot in the maze while four ghosts hunt you — grab a power pellet to turn the tables.', 'Arrow keys or swipe to move.'],
  'memory-match': ['Puzzle', 'MEMORY CARDS', 'Flip the cards and find every pair in as few moves as possible.', 'Click cards to flip them and find pairs.'],
  'merge-drop': ['Puzzle', 'MERGE PHYSICS', 'Drop fruit into the jar — two of the same merge into something bigger. Don’t overflow.', 'Move and click (or tap) to drop the fruit.'],
  'minesweeper': ['Puzzle', 'CLASSIC LOGIC', 'Clear the board without hitting a mine, using the numbers to find where they hide.', 'Click to reveal, right-click or long-press to flag.'],
  'mini-golf': ['Sports', '9-HOLE PUTTING', 'Nine hand-built holes with sand, water, and walls. Can you finish under par?', 'Drag back from the ball and release to putt.'],
  'nonogram': ['Puzzle', 'PICROSS', 'Use the number clues to fill in the grid and reveal a hidden picture.', 'Click to fill cells; use the clues to solve the picture.'],
  'paddle-duel': ['Sports', 'PADDLE DUEL', 'Pong-style paddle battle against the computer. First to seven wins.', 'Mouse, touch, or arrow keys to move your paddle.'],
  'penalty-kick': ['Sports', 'SHOOTOUT', 'A five-round penalty shootout — pick your shot, then try to guess their dive.', 'Pick a corner to shoot, then pick a corner to dive.'],
  'piano-tap': ['Arcade', 'REACTION TAPS', 'Hit only the black tiles as the board speeds up. Touch white and it’s over.', 'Tap or click the lowest black tile; keys D F J K also work.'],
  'pipe-connect': ['Puzzle', 'ROTATE THE PIPES', 'Rotate the pipes until water flows from the source all the way to the outlet.', 'Click a pipe to rotate it.'],
  'reversi': ['Board', 'OTHELLO', 'Flank your opponent’s discs to flip them to your color. Most discs at the end wins.', 'Click a highlighted square to place a disc.'],
  'rush-hour': ['Puzzle', 'PARKING PUZZLE', 'Slide the cars out of the way so the red car can escape the parking lot.', 'Drag the cars to clear a path for the red car.'],
  'simon-says': ['Puzzle', 'MEMORY SEQUENCE', 'Watch the lights flash, then repeat the pattern. Every round adds one more step.', 'Repeat the pattern by clicking the colors (or keys 1–4).'],
  'slide-puzzle': ['Puzzle', 'SLIDING TILES', 'Slide the numbered tiles back into order in as few moves as you can.', 'Click a tile next to the gap, or use arrow keys.'],
  'slingshot': ['Skill', 'TARGET SHOOTING', 'Pull back, follow the dotted line, and hit the bullseye for 100 points.', 'Pull back, aim along the dotted line, and release.'],
  'snake': ['Arcade', 'CLASSIC ARCADE', 'The classic: eat, grow longer, and don’t run into yourself.', 'Arrow keys or WASD to steer. Swipe on mobile.'],
  'snakes-ladders': ['Board', 'DICE GAME', 'Roll the dice, climb the ladders, and dodge the snakes on the race to 100.', 'Click Roll to throw the dice.'],
  'sokoban': ['Puzzle', 'CRATE PUSHING', 'Push every crate onto its target across 30 levels — but crates can’t be pulled.', 'Arrow keys, swipe, or the on-screen pad to move; Z to undo.'],
  'stack-tower': ['Skill', 'TIMING', 'Time each drop to stack the tallest tower you can. Miss the edge and the block shrinks.', 'Click, tap, or press Space to drop each block.'],
  'star-defender': ['Action', 'SPACE SHOOTER', 'Auto-firing space shooter. Dodge and survive endless waves of enemy ships.', 'Move with the mouse, touch, or arrow keys; firing is automatic.'],
  'sudoku': ['Puzzle', 'NUMBER LOGIC', 'Fill the grid so every row, column, and box has 1–9. Easy, medium, and hard puzzles.', 'Select a cell, then a number. Keyboard works too.'],
  'tic-tac-toe': ['Board', 'X AND O', 'Try to beat an unbeatable computer, or play a friend on the same screen.', 'Click a square to place your mark.'],
  'water-sort': ['Puzzle', 'SORTING PUZZLE', 'Pour colored liquids between tubes until every tube holds a single color.', 'Click a tube, then another tube to pour.'],
  'whack-a-mole': ['Arcade', 'TIMED ARCADE', 'Bonk as many moles as you can in 60 seconds.', 'Click or tap the moles before they hide.'],
}

const THEMES = {
  Puzzle: '#8fc7ff', Arcade: '#78dba1', Board: '#f3d39b', Sports: '#ffb48a', Skill: '#d2bfff', Action: '#ff9fae',
}

const escapeXml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char])
const escapeJs = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

function thumbnail({ name, icon, tag, accent }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1730"/><stop offset="1" stop-color="#132d4a"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="${accent}" stop-opacity=".34"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
<rect width="640" height="360" rx="24" fill="url(#bg)"/><circle cx="490" cy="120" r="190" fill="url(#glow)"/><path d="M0 282 Q150 235 280 286 T640 270 V360 H0Z" fill="#071124" opacity=".72"/><circle cx="520" cy="92" r="62" fill="none" stroke="${accent}" stroke-opacity=".28" stroke-width="2"/><circle cx="520" cy="92" r="86" fill="none" stroke="${accent}" stroke-opacity=".16" stroke-width="2"/><text x="52" y="78" fill="${accent}" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="4">STUDYSHELF • HTML5</text><text x="50%" y="194" text-anchor="middle" dominant-baseline="middle" font-size="94">${icon}</text><text x="44" y="276" fill="#f4f8ff" font-family="Arial,sans-serif" font-size="35" font-weight="700">${escapeXml(name)}</text><text x="46" y="316" fill="${accent}" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="3">${escapeXml(tag)}</text><rect x="530" y="286" width="64" height="5" rx="2.5" fill="${accent}"/></svg>
`
}

// Keep the author credit and source link (MIT attribution); point "More games" back to StudyShelf; drop the
// author's unrelated video-downloader promo.
function adaptGameHtml(html, game) {
  const out = html
    .replace(/\s*·\s*<a href="https:\/\/saveone\.pro"[^>]*>SaveOne<\/a>\s*<span data-i18n="common\.freeVideo">[^<]*<\/span>/, '')
    .replace(/<a href="\.\.\/" data-i18n="common\.moreGames">/, '<a href="/" target="_top" data-i18n="common.moreGames">')
  if (/saveone\.pro/.test(out)) throw new Error(`${game}: SaveOne link not removed — upstream markup changed`)
  return out
}

const playDir = 'public/play'
const thumbDir = 'public/play-thumbs'
rmSync(playDir, { recursive: true, force: true })
rmSync(thumbDir, { recursive: true, force: true })
mkdirSync(playDir, { recursive: true })
mkdirSync(thumbDir, { recursive: true })
cpSync(join(upstream, 'i18n.js'), join(playDir, 'i18n.js'))
cpSync(join(upstream, 'LICENSE'), join(playDir, 'LICENSE.txt'))

const available = new Set(readdirSync(upstream, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name))
const entries = []
for (const [game, [category, tag, description, controls]] of Object.entries(GAMES)) {
  if (!available.has(game)) { console.warn(`skipped ${game}: not in upstream`); continue }
  const html = readFileSync(join(upstream, game, 'index.html'), 'utf8')
  const name = html.match(/<title>([^<]*)<\/title>/)[1].split(/\s+[—-]\s+/)[0].trim()
  const icon = html.match(/font-size='90'>([^<]+)<\/text>/)?.[1] || '🎮'
  mkdirSync(join(playDir, game))
  writeFileSync(join(playDir, game, 'index.html'), adaptGameHtml(html, game))
  writeFileSync(join(thumbDir, `${game}.svg`), thumbnail({ name, icon, tag, accent: THEMES[category] }))
  entries.push({ slug: game, name, category, icon, color: THEMES[category], description, controls, tag })
}

const lines = entries.map((game) => `  {
    slug: '${game.slug}', name: '${escapeJs(game.name)}', category: '${game.category}', icon: '${game.icon}', color: '${game.color}',
    description: '${escapeJs(game.description)}',
    controls: '${escapeJs(game.controls)}',
    embedUrl: '/play/${game.slug}/', providerUrl: '${REPO}/tree/main/${game.slug}',
    image: '/play-thumbs/${game.slug}.svg', tag: '${escapeJs(game.tag)}', hosted: true,
  },`)
writeFileSync('src/openSourceGames.js', `// Generated by scripts/import-open-source-games.mjs — edit GAMES there, not this file.
// HTML5 games by mashukui (https://github.com/mashukui/web-games), MIT License (public/play/LICENSE.txt),
// hosted by StudyShelf under /play/.
export const openSourceGames = [
${lines.join('\n')}
]
`)
console.log(`imported ${entries.length} games`)
