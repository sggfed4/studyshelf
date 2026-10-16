#!/usr/bin/env node
// Safe, idempotent StudyShelf catalog updater. It only appends missing slugs.
// It never replaces src/games.js and never removes existing games.
const fs = require('node:fs');
const path = require('node:path');
const catalogPath = path.join(process.cwd(), 'src', 'games.js');
if (!fs.existsSync(catalogPath)) {
  console.error('Could not find src/games.js. Run this script from the StudyShelf project root.');
  process.exit(1);
}
let source = fs.readFileSync(catalogPath, 'utf8');
const additions = [
  {
    slug: "opensource-ant-flap", name: "Ant Flap", category: "Arcade", icon: "🐜", color: "#75d6c7",
    description: "Flap through tight branches and chase a new high score.", details: "A quick-reaction flier with tight gaps and increasingly demanding timing.", controls: "Press Space or tap to flap.",
    embedUrl: "https://mashukui.github.io/web-games/ant-flap/", providerUrl: "https://mashukui.github.io/web-games/ant-flap/", image: "/studyshelf-open-source/ant-flap.svg", tag: "OPEN SOURCE • QUICK REFLEXES",
  },
  {
    slug: "opensource-ant-jump", name: "Ant Jump", category: "Skill", icon: "🦗", color: "#9be0b4",
    description: "Bounce upward across moving and fragile platforms.", details: "An endless vertical climber that rewards steering and careful timing.", controls: "Use Left/Right or A/D; touch either side to steer.",
    embedUrl: "https://mashukui.github.io/web-games/ant-jump/", providerUrl: "https://mashukui.github.io/web-games/ant-jump/", image: "/studyshelf-open-source/ant-jump.svg", tag: "OPEN SOURCE • ENDLESS CLIMBER",
  },
  {
    slug: "opensource-block-drop", name: "Block Drop", category: "Puzzle", icon: "🧊", color: "#83b8ff",
    description: "Stack falling blocks, clear lines, and survive the speed.", details: "A polished falling-block puzzle with levels, score, and hold mechanics.", controls: "Left/Right to move, Up to rotate, Down to soft drop, Space to hard drop.",
    embedUrl: "https://mashukui.github.io/web-games/block-drop/", providerUrl: "https://mashukui.github.io/web-games/block-drop/", image: "/studyshelf-open-source/block-drop.svg", tag: "OPEN SOURCE • BLOCK PUZZLE",
  },
  {
    slug: "opensource-breakout", name: "Breakout", category: "Arcade", icon: "🧱", color: "#ffb86b",
    description: "Bounce the ball and smash every brick.", details: "Classic brick-breaking with level progression, lives, and responsive paddle controls.", controls: "Move with mouse, touch, or arrow keys; click or Space to launch.",
    embedUrl: "https://mashukui.github.io/web-games/breakout/", providerUrl: "https://mashukui.github.io/web-games/breakout/", image: "/studyshelf-open-source/breakout.svg", tag: "OPEN SOURCE • ARCADE CLASSIC",
  },
  {
    slug: "opensource-paddle-duel", name: "Paddle Duel", category: "Sports", icon: "🏓", color: "#ff9da8",
    description: "Outplay an AI opponent in a fast paddle duel.", details: "A Pong-style match with three AI difficulty levels.", controls: "Move your paddle with mouse, touch, or keyboard controls shown in game.",
    embedUrl: "https://mashukui.github.io/web-games/paddle-duel/", providerUrl: "https://mashukui.github.io/web-games/paddle-duel/", image: "/studyshelf-open-source/paddle-duel.svg", tag: "OPEN SOURCE • VS COMPUTER",
  },
  {
    slug: "opensource-stack-tower", name: "Stack Tower", category: "Skill", icon: "🏗️", color: "#b6a0ff",
    description: "Drop each block perfectly and build a towering stack.", details: "A timing-based stacking game built around accuracy and combo scoring.", controls: "Tap, click, or press Space to drop a block.",
    embedUrl: "https://mashukui.github.io/web-games/stack-tower/", providerUrl: "https://mashukui.github.io/web-games/stack-tower/", image: "/studyshelf-open-source/stack-tower.svg", tag: "OPEN SOURCE • TIMING CHALLENGE",
  },
  {
    slug: "opensource-whack-a-mole", name: "Whack-a-Mole", category: "Arcade", icon: "🔨", color: "#f4cf72",
    description: "Hit the moles, grab bonus points, and avoid the bombs.", details: "A 60-second reflex challenge with targets and hazards.", controls: "Tap or click targets as they appear.",
    embedUrl: "https://mashukui.github.io/web-games/whack-a-mole/", providerUrl: "https://mashukui.github.io/web-games/whack-a-mole/", image: "/studyshelf-open-source/whack-a-mole.svg", tag: "OPEN SOURCE • 60-SECOND CHALLENGE",
  },
  {
    slug: "opensource-snake", name: "Snake", category: "Arcade", icon: "🐍", color: "#78dba1",
    description: "Eat, grow, and avoid crashing into yourself.", details: "A clean modern take on the classic snake game with local best scores.", controls: "Use arrow keys or WASD; swipe on touch screens.",
    embedUrl: "https://mashukui.github.io/web-games/snake/", providerUrl: "https://mashukui.github.io/web-games/snake/", image: "/studyshelf-open-source/snake.svg", tag: "OPEN SOURCE • CLASSIC ARCADE",
  },
  {
    slug: "opensource-tic-tac-toe", name: "Tic Tac Toe", category: "Puzzle", icon: "⭕", color: "#8fc9ff",
    description: "Challenge an AI or play against a friend on one device.", details: "A simple classic with an AI opponent designed to be hard to beat.", controls: "Click or tap a square.",
    embedUrl: "https://mashukui.github.io/web-games/tic-tac-toe/", providerUrl: "https://mashukui.github.io/web-games/tic-tac-toe/", image: "/studyshelf-open-source/tic-tac-toe.svg", tag: "OPEN SOURCE • CLASSIC DUEL",
  },
  {
    slug: "opensource-connect-four", name: "Connect Four", category: "Puzzle", icon: "🔴", color: "#ff9b9b",
    description: "Connect four discs before your opponent does.", details: "A turn-based strategy classic with multiple AI difficulty levels.", controls: "Choose a column with mouse or touch.",
    embedUrl: "https://mashukui.github.io/web-games/connect-four/", providerUrl: "https://mashukui.github.io/web-games/connect-four/", image: "/studyshelf-open-source/connect-four.svg", tag: "OPEN SOURCE • STRATEGY PUZZLE",
  },
  {
    slug: "opensource-2048", name: "2048", category: "Puzzle", icon: "🔢", color: "#e8c37d",
    description: "Merge matching tiles and chase the 2048 tile.", details: "A polished number-merging puzzle with undo and a saved best score.", controls: "Arrow keys or WASD; swipe on mobile.",
    embedUrl: "https://mashukui.github.io/web-games/2048/", providerUrl: "https://mashukui.github.io/web-games/2048/", image: "/studyshelf-open-source/2048.svg", tag: "OPEN SOURCE • NUMBER PUZZLE",
  },
  {
    slug: "opensource-minesweeper", name: "Minesweeper", category: "Puzzle", icon: "💣", color: "#9fb8d9",
    description: "Clear the board without detonating a mine.", details: "Three difficulty levels, a timer, and a flag counter.", controls: "Click to reveal; right-click or use the flag control to mark mines.",
    embedUrl: "https://mashukui.github.io/web-games/minesweeper/", providerUrl: "https://mashukui.github.io/web-games/minesweeper/", image: "/studyshelf-open-source/minesweeper.svg", tag: "OPEN SOURCE • LOGIC PUZZLE",
  },
  {
    slug: "opensource-memory-match", name: "Memory Match", category: "Puzzle", icon: "🃏", color: "#d7a7ff",
    description: "Flip cards and find every matching pair.", details: "A memory game with multiple difficulties and local score tracking.", controls: "Click or tap two cards at a time.",
    embedUrl: "https://mashukui.github.io/web-games/memory-match/", providerUrl: "https://mashukui.github.io/web-games/memory-match/", image: "/studyshelf-open-source/memory-match.svg", tag: "OPEN SOURCE • MEMORY GAME",
  },
  {
    slug: "opensource-star-defender", name: "Star Defender", category: "Action", icon: "🚀", color: "#89bfff",
    description: "Fight through waves of enemies and survive the onslaught.", details: "A compact space shooter built around dodging, shooting, and wave survival.", controls: "Use the controls shown in game; keyboard and touch supported.",
    embedUrl: "https://mashukui.github.io/web-games/star-defender/", providerUrl: "https://mashukui.github.io/web-games/star-defender/", image: "/studyshelf-open-source/star-defender.svg", tag: "OPEN SOURCE • SPACE SHOOTER",
  },
  {
    slug: "opensource-dino-run", name: "Dino Run", category: "Action", icon: "🦖", color: "#d6c58b",
    description: "Jump over cacti and duck beneath obstacles in an endless run.", details: "A fast endless runner with rising speed and quick reaction windows.", controls: "Press Space or Up to jump; Down to duck.",
    embedUrl: "https://mashukui.github.io/web-games/dino-run/", providerUrl: "https://mashukui.github.io/web-games/dino-run/", image: "/studyshelf-open-source/dino-run.svg", tag: "OPEN SOURCE • ENDLESS RUNNER",
  },
  {
    slug: "opensource-piano-tap", name: "Piano Tap", category: "Arcade", icon: "🎹", color: "#a9a6ff",
    description: "Tap the correct tiles before the board rolls past.", details: "A rhythm-and-reaction challenge where a missed tile ends the run.", controls: "Tap or click the dark tiles; use keyboard controls if shown.",
    embedUrl: "https://mashukui.github.io/web-games/piano-tap/", providerUrl: "https://mashukui.github.io/web-games/piano-tap/", image: "/studyshelf-open-source/piano-tap.svg", tag: "OPEN SOURCE • REACTION GAME",
  },
  {
    slug: "opensource-cross-road", name: "Cross Road", category: "Arcade", icon: "🐸", color: "#86d9a5",
    description: "Hop across traffic and rivers without getting hit.", details: "A tile-based crossing game with moving traffic and floating logs.", controls: "Arrow keys or WASD; touch controls are included.",
    embedUrl: "https://mashukui.github.io/web-games/cross-road/", providerUrl: "https://mashukui.github.io/web-games/cross-road/", image: "/studyshelf-open-source/cross-road.svg", tag: "OPEN SOURCE • HOPPER",
  },
  {
    slug: "opensource-slide-puzzle", name: "Slide Puzzle", category: "Puzzle", icon: "🧩", color: "#8fc5e8",
    description: "Slide the tiles back into order in as few moves as possible.", details: "A classic number-sliding puzzle with a move-count challenge.", controls: "Click or tap a tile next to the empty space.",
    embedUrl: "https://mashukui.github.io/web-games/slide-puzzle/", providerUrl: "https://mashukui.github.io/web-games/slide-puzzle/", image: "/studyshelf-open-source/slide-puzzle.svg", tag: "OPEN SOURCE • BRAIN TEASER",
  },
  {
    slug: "opensource-fruit-slice", name: "Fruit Slice", category: "Action", icon: "🍉", color: "#ff9c9c",
    description: "Slice fruit, chain combos, and dodge the bombs.", details: "A fast arcade slicing game designed for mouse and touch input.", controls: "Swipe or drag through fruit; avoid bombs.",
    embedUrl: "https://mashukui.github.io/web-games/fruit-slice/", providerUrl: "https://mashukui.github.io/web-games/fruit-slice/", image: "/studyshelf-open-source/fruit-slice.svg", tag: "OPEN SOURCE • ARCADE ACTION",
  },
  {
    slug: "opensource-bubble-shooter", name: "Bubble Shooter", category: "Puzzle", icon: "🫧", color: "#8bd9f0",
    description: "Aim, shoot, and match three or more bubbles.", details: "A color-matching shooter where clearing clusters drops connected bubbles.", controls: "Aim with mouse or touch and click to fire.",
    embedUrl: "https://mashukui.github.io/web-games/bubble-shooter/", providerUrl: "https://mashukui.github.io/web-games/bubble-shooter/", image: "/studyshelf-open-source/bubble-shooter.svg", tag: "OPEN SOURCE • MATCH & SHOOT",
  },
  {
    slug: "opensource-sudoku", name: "Sudoku", category: "Puzzle", icon: "🔢", color: "#b3c6ff",
    description: "Fill the grid with numbers without repeating in any row, column, or box.", details: "A number-logic puzzle with three difficulties and generated solvable boards.", controls: "Select a cell, then choose a number.",
    embedUrl: "https://mashukui.github.io/web-games/sudoku/", providerUrl: "https://mashukui.github.io/web-games/sudoku/", image: "/studyshelf-open-source/sudoku.svg", tag: "OPEN SOURCE • LOGIC CLASSIC",
  },
  {
    slug: "opensource-merge-drop", name: "Merge Drop", category: "Puzzle", icon: "🍉", color: "#f2a7c6",
    description: "Drop matching fruit to merge them into bigger fruit.", details: "A physics-style merge puzzle with chain reactions and score chasing.", controls: "Aim with mouse or touch, then drop the fruit.",
    embedUrl: "https://mashukui.github.io/web-games/merge-drop/", providerUrl: "https://mashukui.github.io/web-games/merge-drop/", image: "/studyshelf-open-source/merge-drop.svg", tag: "OPEN SOURCE • MERGE PUZZLE",
  },
  {
    slug: "opensource-water-sort", name: "Water Sort", category: "Puzzle", icon: "🧪", color: "#8fd8cb",
    description: "Sort the colored liquid until each tube holds one color.", details: "A relaxing sorting puzzle with solvable level generation.", controls: "Tap one tube, then another to pour.",
    embedUrl: "https://mashukui.github.io/web-games/water-sort/", providerUrl: "https://mashukui.github.io/web-games/water-sort/", image: "/studyshelf-open-source/water-sort.svg", tag: "OPEN SOURCE • RELAXING PUZZLE",
  },
  {
    slug: "opensource-slingshot", name: "Slingshot", category: "Skill", icon: "🏹", color: "#f3c27f",
    description: "Pull back, aim, and launch for a bullseye.", details: "A trajectory-based aim challenge with score bonuses for precision.", controls: "Drag back to aim and release to launch.",
    embedUrl: "https://mashukui.github.io/web-games/slingshot/", providerUrl: "https://mashukui.github.io/web-games/slingshot/", image: "/studyshelf-open-source/slingshot.svg", tag: "OPEN SOURCE • AIM CHALLENGE",
  },
  {
    slug: "opensource-helix-drop", name: "Helix Drop", category: "Action", icon: "🌀", color: "#b6a0ff",
    description: "Rotate a tower and guide the ball through its gaps.", details: "A fast falling-ball challenge with safe platforms and dangerous segments.", controls: "Move left or right to rotate the tower.",
    embedUrl: "https://mashukui.github.io/web-games/helix-drop/", providerUrl: "https://mashukui.github.io/web-games/helix-drop/", image: "/studyshelf-open-source/helix-drop.svg", tag: "OPEN SOURCE • 3D-STYLE ARCADE",
  },
  {
    slug: "opensource-gem-match", name: "Gem Match", category: "Puzzle", icon: "💎", color: "#9bd7ff",
    description: "Swap gems, match three, and trigger cascading combos.", details: "A match-three puzzle with cascades and score-building chains.", controls: "Swap adjacent gems using mouse or touch.",
    embedUrl: "https://mashukui.github.io/web-games/gem-match/", providerUrl: "https://mashukui.github.io/web-games/gem-match/", image: "/studyshelf-open-source/gem-match.svg", tag: "OPEN SOURCE • MATCH THREE",
  },
  {
    slug: "opensource-maze-muncher", name: "Maze Muncher", category: "Arcade", icon: "🟡", color: "#f3db80",
    description: "Clear the maze, dodge hunting ghosts, and grab power pellets.", details: "A maze-chase arcade game with multiple pursuers and temporary power-ups.", controls: "Use arrow keys or WASD to move.",
    embedUrl: "https://mashukui.github.io/web-games/maze-muncher/", providerUrl: "https://mashukui.github.io/web-games/maze-muncher/", image: "/studyshelf-open-source/maze-muncher.svg", tag: "OPEN SOURCE • MAZE CHASE",
  },
  {
    slug: "opensource-air-hockey", name: "Air Hockey", category: "Sports", icon: "🏒", color: "#83d8e6",
    description: "Outmaneuver the AI and score first in an air-hockey duel.", details: "A top-down sports game with responsive mallet movement and puck physics.", controls: "Drag or move to control your mallet.",
    embedUrl: "https://mashukui.github.io/web-games/air-hockey/", providerUrl: "https://mashukui.github.io/web-games/air-hockey/", image: "/studyshelf-open-source/air-hockey.svg", tag: "OPEN SOURCE • SPORTS ARCADE",
  },
  {
    slug: "opensource-reversi", name: "Reversi", category: "Puzzle", icon: "⚪", color: "#b8c4d6",
    description: "Flip your opponent’s discs and control the board.", details: "A classic strategy board game with legal-move hints and three AI levels.", controls: "Tap a highlighted legal move.",
    embedUrl: "https://mashukui.github.io/web-games/reversi/", providerUrl: "https://mashukui.github.io/web-games/reversi/", image: "/studyshelf-open-source/reversi.svg", tag: "OPEN SOURCE • BOARD STRATEGY",
  },
  {
    slug: "opensource-battleship", name: "Battleship", category: "Strategy", icon: "🚢", color: "#83b8ff",
    description: "Place your fleet and hunt down the enemy ships.", details: "A turn-based naval guessing game with AI difficulty options.", controls: "Place ships, then select grid squares to fire.",
    embedUrl: "https://mashukui.github.io/web-games/battleship/", providerUrl: "https://mashukui.github.io/web-games/battleship/", image: "/studyshelf-open-source/battleship.svg", tag: "OPEN SOURCE • TACTICAL PUZZLE",
  },
  {
    slug: "opensource-sokoban", name: "Sokoban", category: "Puzzle", icon: "📦", color: "#e3bb8a",
    description: "Push every crate onto a target without getting stuck.", details: "A thoughtful crate-pushing puzzle with 30 levels and undo support.", controls: "Arrow keys or WASD to move; undo is available in game.",
    embedUrl: "https://mashukui.github.io/web-games/sokoban/", providerUrl: "https://mashukui.github.io/web-games/sokoban/", image: "/studyshelf-open-source/sokoban.svg", tag: "OPEN SOURCE • LEVEL PUZZLE",
  },
  {
    slug: "opensource-lights-out", name: "Lights Out", category: "Puzzle", icon: "💡", color: "#f0d77c",
    description: "Switch off every light by flipping neighboring cells.", details: "A logic puzzle where each move toggles a cell and its neighbors.", controls: "Tap a light to toggle it and its neighbors.",
    embedUrl: "https://mashukui.github.io/web-games/lights-out/", providerUrl: "https://mashukui.github.io/web-games/lights-out/", image: "/studyshelf-open-source/lights-out.svg", tag: "OPEN SOURCE • LOGIC CHALLENGE",
  },
];
const missing = additions.filter(game =>
  !source.includes("slug: '" + game.slug + "'") &&
  !source.includes('slug: "' + game.slug + '"') &&
  !source.includes('"slug": "' + game.slug + '"')
);
if (missing.length === 0) {
  console.log('No new games added: all 32 catalog slugs already exist.');
  process.exit(0);
}
const close = source.lastIndexOf('];');
if (close < 0) { console.error('Could not find the end of the games array in src/games.js. No changes made.'); process.exit(1); }
const insertion = '\n' + missing.map(game => JSON.stringify(game, null, 2) + ',').join('\n') + '\n';
source = source.slice(0, close) + insertion + source.slice(close);
fs.writeFileSync(catalogPath, source, 'utf8');
console.log(`Added ${missing.length} open-source game entries. Existing entries were preserved.`);
console.log('Next: npm.cmd run build, inspect the new entries, then commit only after testing.');
