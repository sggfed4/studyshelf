#!/usr/bin/env node
// Remove only StudyShelf entries added by the GitHub open-source games batch.
// Keeps the existing catalog (including other recent additions) and backs it up first.
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const catalog = path.join(root, 'src', 'games.js');
if (!fs.existsSync(catalog)) {
  console.error('ERROR: src/games.js not found. Run this script from the StudyShelf3 project root.');
  process.exit(1);
}
const source = fs.readFileSync(catalog, 'utf8');
const arrayStart = source.indexOf('export const games = [');
if (arrayStart < 0) {
  console.error('ERROR: Could not find "export const games = [". No files changed.');
  process.exit(1);
}
const open = source.indexOf('[', arrayStart);
let quote = null, escaped = false, lineComment = false, blockComment = false;
let curly = 0, arrayClose = -1, objectStart = -1;
const objects = [];
for (let i = open + 1; i < source.length; i++) {
  const c = source[i], n = source[i + 1];
  if (lineComment) { if (c === '\n') lineComment = false; continue; }
  if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
  if (quote) {
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === quote) quote = null;
    continue;
  }
  if (c === '/' && n === '/') { lineComment = true; i++; continue; }
  if (c === '/' && n === '*') { blockComment = true; i++; continue; }
  if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
  if (c === '{') {
    if (curly === 0) objectStart = i;
    curly++;
    continue;
  }
  if (c === '}') {
    curly--;
    if (curly < 0) { console.error('ERROR: Unbalanced object braces. No files changed.'); process.exit(1); }
    if (curly === 0 && objectStart >= 0) {
      objects.push({ start: objectStart, end: i + 1, text: source.slice(objectStart, i + 1) });
      objectStart = -1;
    }
    continue;
  }
  if (c === ']' && curly === 0) { arrayClose = i; break; }
}
if (arrayClose < 0 || curly !== 0 || objects.length === 0) {
  console.error('ERROR: Could not safely identify the game array. No files changed.');
  process.exit(1);
}
const isGithubBatch = obj => /(?:\bslug\s*:\s*['"]opensource-[^'"]+['"]|['"]slug['"]\s*:\s*['"]opensource-[^'"]+['"])/.test(obj.text);
const removed = objects.filter(isGithubBatch);
if (removed.length === 0) {
  console.log('No GitHub-batch entries with slug prefix "opensource-" were found. No files changed.');
  console.log(`Found ${objects.length} catalog objects.`);
  process.exit(0);
}
const kept = objects.filter(o => !isGithubBatch(o));
const backup = path.join(root, 'src', `games.js.before-github-games-removal-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`);
fs.copyFileSync(catalog, backup);
const rebuilt = source.slice(0, open + 1) + '\n' + kept.map(o => o.text.trim()).join(',\n') + '\n' + source.slice(arrayClose);
fs.writeFileSync(catalog, rebuilt, 'utf8');
// Remove only files/folder introduced by the GitHub batch, if present.
const extraFiles = ['add-open-source-games.cjs', 'OPEN_SOURCE_GAME_CREDITS.md'];
for (const rel of extraFiles) {
  const p = path.join(root, rel);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) fs.unlinkSync(p);
}
const assets = path.join(root, 'public', 'studyshelf-open-source');
if (fs.existsSync(assets) && fs.statSync(assets).isDirectory()) fs.rmSync(assets, { recursive: true, force: true });
console.log(`SUCCESS: Removed ${removed.length} GitHub-batch game entries only.`);
console.log(`Kept ${kept.length} other catalog entries unchanged in content.`);
console.log(`Backup created: ${path.relative(root, backup)}`);
console.log('Removed the GitHub-batch helper, credits file, and its dedicated thumbnail folder if they existed.');
console.log('Next run: npm.cmd run build');
