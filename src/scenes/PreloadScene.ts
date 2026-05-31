import Phaser from 'phaser';
import { buildTextures } from '../gfx/sprites';
import { buildBackgroundTextures } from '../gfx/background';
import { buildPezzTexture, createPezzAnims } from '../gfx/character';

/** Genera tutte le texture pixel-art e le animazioni, poi avvia il gioco. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    buildTextures(this);
    buildBackgroundTextures(this, 540);
    buildPezzTexture(this);
    createPezzAnims(this);
    this.scene.start('Game');
  }
}
