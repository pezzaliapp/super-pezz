import Phaser from 'phaser';
import { buildTextures } from '../gfx/sprites';

/** Genera tutte le texture pixel-art, poi avvia il gioco. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    buildTextures(this);
    this.scene.start('Game');
  }
}
