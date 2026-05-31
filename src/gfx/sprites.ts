import Phaser from 'phaser';
import { makePixelTexture, type Palette } from './pixels';

// Chiavi texture usate ovunque nel gioco.
export const TEX = {
  pezz: 'pezz',
  bug: 'bug',
  coin: 'coin',
  ground: 'ground',
  flag: 'flag',
} as const;

// --- Palette condivisa -----------------------------------------------------
const PAL: Palette = {
  '.': null, // trasparente
  O: '#1a1c2c', // outline scuro
  H: '#7a4a2b', // capelli
  S: '#ffcd9c', // pelle
  E: '#ffffff', // bianco occhio
  P: '#1a1c2c', // pupilla
  m: '#b13e53', // bocca
  B: '#38b764', // maglietta (verde Pezz)
  L: '#3b5dc9', // pantaloni
  F: '#41a6f6', // scarpe / bandiera
  R: '#ef7d57', // corpo nemico
  C: '#ffcd29', // moneta / "pezzo"
  W: '#fff7d6', // riflesso
};

// --- PEZZ (14x16) ----------------------------------------------------------
const PEZZ = [
  '....OOOOOO....',
  '..OOHHHHHHOO..',
  '.OHHHHHHHHHHO.',
  '.OHSSSSSSSSHO.',
  '.OSEPSSSSEPSO.',
  '.OSSSSSSSSSSO.',
  '.OSSSmmmmSSSO.',
  '..OSSSSSSSSO..',
  '..OBBBBBBBBO..',
  '.OBBBBBBBBBBO.',
  '.OSBBBBBBBBSO.',
  '.OSBBBBBBBBSO.',
  '.OBBBBBBBBBBO.',
  '...OLLO.OLLO..',
  '...OLLO.OLLO..',
  '...FFF..FFF...',
];

// --- BUG / nemico (12x10) --------------------------------------------------
const BUG = [
  '...RRRRRR...',
  '..RRRRRRRR..',
  '.RRRRRRRRRR.',
  '.RREERREERR.',
  '.RREPRREPRR.',
  '.RRRRRRRRRR.',
  '.RRRmmmmRRR.',
  '..RRRRRRRR..',
  '.O.O.O.O.O.O',
  'O.O.O.O.O.O.',
];

// --- COIN / "pezzo" (8x8) --------------------------------------------------
const COIN = [
  '..CCCC..',
  '.CCCCCC.',
  'CCCCCCCC',
  'CCWCCCCC',
  'CCWCCCCC',
  'CCCCCCCC',
  '.CCCCCC.',
  '..CCCC..',
];

// --- FLAG / traguardo (12x16) ----------------------------------------------
const FLAG = [
  '..O.........',
  '..OFFFFFFF..',
  '..OFFFFFFF..',
  '..OFFFFFF...',
  '..OFFFF.....',
  '..OFF.......',
  '..O.........',
  '..O.........',
  '..O.........',
  '..O.........',
  '..O.........',
  '..O.........',
  '..O.........',
  '..O.........',
  '..O.........',
  '.OOOO.......',
];

/** Tile di terreno 16x16 generata a mano (erba sopra, terra sotto). */
function makeGroundTexture(scene: Phaser.Scene): void {
  const key = TEX.ground;
  if (scene.textures.exists(key)) return;
  const size = 16;
  const canvas = scene.textures.createCanvas(key, size, size);
  if (!canvas) return;
  const ctx = canvas.getContext();

  const dirt = '#6e3b2a';
  const dirtDark = '#5a2f22';
  const grass = '#38b764';
  const grassEdge = '#257c4a';

  // terra di base
  ctx.fillStyle = dirt;
  ctx.fillRect(0, 0, size, size);
  // qualche pixel di terra più scura per dare texture
  ctx.fillStyle = dirtDark;
  for (const [x, y] of [
    [2, 7], [5, 10], [9, 6], [12, 11], [7, 13], [13, 8], [3, 12],
  ]) {
    ctx.fillRect(x, y, 1, 1);
  }
  // erba in cima
  ctx.fillStyle = grass;
  ctx.fillRect(0, 0, size, 4);
  ctx.fillStyle = grassEdge;
  ctx.fillRect(0, 3, size, 1);

  canvas.refresh();
}

/** Crea tutte le texture pixel-art. Chiamata una volta in fase di preload. */
export function buildTextures(scene: Phaser.Scene): void {
  makePixelTexture(scene, TEX.pezz, PEZZ, PAL);
  makePixelTexture(scene, TEX.bug, BUG, PAL);
  makePixelTexture(scene, TEX.coin, COIN, PAL);
  makePixelTexture(scene, TEX.flag, FLAG, PAL);
  makeGroundTexture(scene);
}
