import Phaser from 'phaser';
import { makePixelTexture, type Palette } from './pixels';

// Chiavi texture per tile ed elementi di gioco.
export const TEX = {
  bug: 'bug',
  coin: 'coin',
  ground: 'ground',
  flag: 'flag',
  qblock: 'qblock',
  qblockUsed: 'qblock-used',
  dust: 'dust',
} as const;

// --- Palette condivisa -----------------------------------------------------
const PAL: Palette = {
  '.': null,
  O: '#1a1c2c',
  m: '#5a1f2c',
  R: '#ef7d57', // corpo nemico
  r: '#c85a3c',
  E: '#ffffff',
  P: '#1a1c2c',
  C: '#ffcd29', // moneta
  c: '#e0a91a',
  W: '#fff7d6',
};

// --- BUG / nemico (12x10) --------------------------------------------------
const BUG = [
  '...RRRRRR...',
  '..RRRRRRRR..',
  '.RRRRRRRRRR.',
  '.RREERREERR.',
  '.RREPRREPRR.',
  '.rRRRRRRRRr.',
  '.RRRmmmmRRR.',
  '..rRRRRRRr..',
  '.O.O.O.O.O.O',
  'O.O.O.O.O.O.',
];

// --- COIN / "pezzo" (8x8) --------------------------------------------------
const COIN = [
  '..cCCc..',
  '.cCCCCc.',
  'cCCWWCCc',
  'cCWWCCCc',
  'cCCCCCCc',
  'cCCCCCCc',
  '.cCCCCc.',
  '..cCCc..',
];

// --- FLAG / traguardo (12x16) ----------------------------------------------
const FLAGPAL: Palette = { '.': null, O: '#6e3b2a', F: '#ff4d6d', f: '#d62246', T: '#ffd23f' };
const FLAG = [
  '..OT........',
  '..OFFFFFFf..',
  '..OFFFFFFf..',
  '..OFFFFFf...',
  '..OFFFFf....',
  '..OFFf......',
  '..OFf.......',
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

/** Tile di terreno 16x16: erba verde brillante con ciuffi + terra marrone. */
function makeGroundTexture(scene: Phaser.Scene): void {
  const key = TEX.ground;
  if (scene.textures.exists(key)) return;
  const size = 16;
  const canvas = scene.textures.createCanvas(key, size, size);
  if (!canvas) return;
  const ctx = canvas.getContext();

  const dirt = '#a6703c';
  const dirtDark = '#7d5128';
  const dirtLight = '#bd8a52';
  const grass = '#5fcf52';
  const grassLight = '#7ee06a';
  const grassEdge = '#2f9a3a';

  // terra
  ctx.fillStyle = dirt;
  ctx.fillRect(0, 4, size, size - 4);
  for (const [x, y] of [[2, 8], [6, 11], [11, 7], [13, 13], [8, 14], [4, 12]]) {
    ctx.fillStyle = dirtDark; ctx.fillRect(x, y, 2, 2);
  }
  for (const [x, y] of [[3, 6], [10, 10], [14, 9]]) {
    ctx.fillStyle = dirtLight; ctx.fillRect(x, y, 1, 1);
  }
  // erba
  ctx.fillStyle = grass;
  ctx.fillRect(0, 0, size, 5);
  ctx.fillStyle = grassLight;
  ctx.fillRect(0, 0, size, 1);
  ctx.fillStyle = grassEdge;
  ctx.fillRect(0, 4, size, 1);
  // ciuffi che spuntano in cima
  ctx.fillStyle = grass;
  for (const x of [2, 7, 12]) { ctx.fillRect(x, -1, 1, 2); ctx.fillRect(x + 1, 0, 1, 1); }
  canvas.refresh();
}

/** Blocco "?" dorato classico (16x16). `used` = già colpito (spento). */
function makeQBlock(scene: Phaser.Scene, key: string, used: boolean): void {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, 16, 16);
  if (!canvas) return;
  const ctx = canvas.getContext();

  const base = used ? '#9a7b4f' : '#f3b53a';
  const light = used ? '#b39468' : '#ffd66e';
  const dark = used ? '#6f5836' : '#b5781a';
  const mark = used ? '#6f5836' : '#7a4e10';

  ctx.fillStyle = dark; ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = base; ctx.fillRect(1, 1, 14, 14);
  ctx.fillStyle = light; ctx.fillRect(1, 1, 14, 1); ctx.fillRect(1, 1, 1, 14);
  // bulloni agli angoli
  ctx.fillStyle = dark;
  for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) ctx.fillRect(x, y, 2, 2);

  if (!used) {
    // punto interrogativo
    ctx.fillStyle = mark;
    const q = ['.XXX.', 'X...X', '..XX.', '..X..', '.....', '..X..'];
    const ox = 5, oy = 4;
    for (let r = 0; r < q.length; r++)
      for (let c = 0; c < q[r].length; c++)
        if (q[r][c] === 'X') ctx.fillRect(ox + c, oy + r, 1, 1);
  }
  canvas.refresh();
}

/** Particella di polvere (4x4 morbida). */
function makeDust(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.dust)) return;
  const canvas = scene.textures.createCanvas(TEX.dust, 4, 4);
  if (!canvas) return;
  const ctx = canvas.getContext();
  ctx.fillStyle = '#efe2c2';
  ctx.fillRect(1, 0, 2, 4);
  ctx.fillRect(0, 1, 4, 2);
  canvas.refresh();
}

/** Crea tutte le texture di tile/elementi. */
export function buildTextures(scene: Phaser.Scene): void {
  makePixelTexture(scene, TEX.bug, BUG, PAL);
  makePixelTexture(scene, TEX.coin, COIN, PAL);
  makePixelTexture(scene, TEX.flag, FLAG, FLAGPAL);
  makeGroundTexture(scene);
  makeQBlock(scene, TEX.qblock, false);
  makeQBlock(scene, TEX.qblockUsed, true);
  makeDust(scene);
}
