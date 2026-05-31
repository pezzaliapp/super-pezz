import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#6ec0ff',
  pixelArt: true, // mantiene i bordi netti della pixel-art
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false,
    },
  },
  scene: [PreloadScene, GameScene],
};

const game = new Phaser.Game(config);

// Handle globale: comodo per debug dalla console del browser.
(window as unknown as { game: Phaser.Game }).game = game;
