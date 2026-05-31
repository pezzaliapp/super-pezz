import Phaser from 'phaser';
import { Player, type InputState } from '../objects/Player';
import { TouchControls } from '../ui/TouchControls';
import { TEX } from '../gfx/sprites';
import { BG } from '../gfx/background';
import { GameAudio } from '../audio/GameAudio';

const WORLD_W = 3200;
const WORLD_H = 540;
const FALL_DEATH_Y = 720;

// Difficoltà graduale. Salto reale di Pezz: ~134px orizzontali, ~79px verticali.
// Fossi: 60 → 80 → 96 px (tutti ben sotto i 134). Ledge: ≤60px (sotto i 79).
const GROUND_Y = 480;
const PLATFORMS: [number, number, number, number][] = [
  // terra (y=480): zona sicura iniziale lunga, poi fossi crescenti
  [0, GROUND_Y, 760, 60], // ZONA SICURA: 0..760 (start a 120, niente fossi/nemici)
  [820, GROUND_Y, 500, 60], // fosso 1 = 60px (didattico)
  [1400, GROUND_Y, 580, 60], // fosso 2 = 80px
  [2076, GROUND_Y, 1124, 60], // fosso 3 = 96px → tratto finale
  // ledge raggiungibili (dislivelli ≤60px) per monete opzionali
  [1120, 430, 110, 20],
  [1680, 430, 110, 20],
  [2300, 420, 120, 20],
  [2480, 360, 110, 20], // raggiungibile dalla ledge a 420 (60px)
];

const COINS: [number, number][] = [
  [320, 440], [480, 440], [640, 440], // zona sicura: invitano a muoversi
  [790, 420], // sopra il fosso 1: insegna il salto
  [980, 440], [1175, 400], [1250, 440],
  [1360, 420], // sopra il fosso 2
  [1520, 440], [1680, 400], [1850, 440],
  [2028, 420], // sopra il fosso 3
  [2180, 440], [2480, 330], [2700, 440], [2900, 440],
];

// Nemici: nessuno nella zona sicura; bounds entro i segmenti di terra.
const ENEMIES: [number, number, number, number][] = [
  [1050, 470, 860, 1290],
  [1700, 470, 1420, 1960],
  [2600, 470, 2110, 3060],
];

// Blocchi "?" (centro), colpibili da sotto: y=360 → raggiungibili.
const QBLOCKS: [number, number][] = [
  [980, 360], [1750, 360], [2200, 360],
];

const START = { x: 120, y: 470 };
const FLAG = { x: 3120, y: 480 };

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.GameObjects.Group;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private qblocks!: Phaser.Physics.Arcade.StaticGroup;
  private touch!: TouchControls;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyJump!: Phaser.Input.Keyboard.Key;

  private clouds!: Phaser.GameObjects.TileSprite;
  private hillsFar!: Phaser.GameObjects.TileSprite;
  private hillsNear!: Phaser.GameObjects.TileSprite;

  private score = 0;
  private totalCoins = 0;
  private lives = 3;
  private prevJumpHeld = false;
  private state: 'play' | 'won' | 'over' = 'play';

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private audio?: GameAudio;

  constructor() {
    super('Game');
  }

  create(): void {
    this.score = 0;
    this.lives = 3;
    this.prevJumpHeld = false;
    this.state = 'play';

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H + 400);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.buildBackground();
    this.buildPlatforms();
    this.buildQBlocks();
    this.buildCoins();
    this.buildEnemies();

    this.player = new Player(this, START.x, START.y);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(180, 120);

    this.buildFlag();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.qblocks, this.hitBlock, undefined, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyJump = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.touch = new TouchControls(this);

    this.buildHud();
    this.setupAudio();
    this.buildHint();
  }

  /** Aiuto iniziale ai comandi, sparisce dopo pochi secondi. */
  private buildHint(): void {
    const touch = this.sys.game.device.input.touch && !this.sys.game.device.os.desktop;
    const msg = touch
      ? '◀ ▶ muovi   ·   tocca SALTA per saltare'
      : '←  →  muovi   ·   ↑ / SPAZIO per saltare';
    const hint = this.add
      .text(this.cameras.main.width / 2, 96, msg, {
        fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
        stroke: '#1a1c2c', strokeThickness: 4, align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(900);
    this.tweens.add({ targets: hint, alpha: 0, delay: 4500, duration: 1200, onComplete: () => hint.destroy() });
  }

  // --- Audio ----------------------------------------------------------------

  private setupAudio(): void {
    const ctx = (this.sound as Phaser.Sound.WebAudioSoundManager).context;
    if (!ctx) return; // fallback HTML5 audio: niente sintesi
    const audio = new GameAudio(ctx);
    this.audio = audio;

    // suoni di gioco
    this.player.on('jump', () => audio.jump());

    // musica: parte dopo lo sblocco (iOS richiede un primo tocco)
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, () => audio.startMusic());
    else audio.startMusic();

    // mute: tasto M + bottone tappabile (utile su iPhone)
    const btn = this.add
      .text(this.cameras.main.width - 16, 14, '🔊', { fontSize: '28px' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(900)
      .setInteractive({ useHandCursor: true });
    const toggle = () => btn.setText(audio.toggleMute() ? '🔇' : '🔊');
    btn.on('pointerdown', toggle);
    this.input.keyboard!.addKey('M').on('down', toggle);

    // alla chiusura/restart della scena: ferma la musica (il timer è globale)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => audio.stopMusic());
  }

  // --- Costruzione mondo ----------------------------------------------------

  private buildBackground(): void {
    const cam = this.cameras.main;
    this.add
      .image(0, 0, BG.sky)
      .setOrigin(0, 0)
      .setDisplaySize(cam.width, cam.height)
      .setScrollFactor(0)
      .setDepth(-20);

    this.clouds = this.add
      .tileSprite(0, 0, cam.width, 160, BG.clouds)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-15);

    this.hillsFar = this.add
      .tileSprite(0, cam.height, cam.width, 220, BG.hillsFar)
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(-12);

    this.hillsNear = this.add
      .tileSprite(0, cam.height, cam.width, 220, BG.hillsNear)
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(-11);
  }

  private buildPlatforms(): void {
    this.platforms = this.add.group();
    for (const [x, y, w, h] of PLATFORMS) {
      const ts = this.add.tileSprite(x + w / 2, y + h / 2, w, h, TEX.ground);
      this.physics.add.existing(ts, true);
      this.platforms.add(ts);
    }
  }

  private buildQBlocks(): void {
    this.qblocks = this.physics.add.staticGroup();
    for (const [x, y] of QBLOCKS) {
      const b = this.qblocks.create(x, y, TEX.qblock) as Phaser.Physics.Arcade.Sprite;
      b.setScale(2).refreshBody();
      b.setData('used', false);
    }
  }

  private buildCoins(): void {
    this.coins = this.physics.add.staticGroup();
    for (const [x, y] of COINS) {
      const coin = this.coins.create(x, y, TEX.coin) as Phaser.Physics.Arcade.Sprite;
      coin.setScale(3).refreshBody().setDepth(1);
      this.tweens.add({
        targets: coin, scaleX: 0.4 * 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut',
      });
    }
    this.totalCoins = COINS.length + QBLOCKS.length;
  }

  private buildEnemies(): void {
    this.enemies = this.physics.add.group();
    for (const [x, y, minX, maxX] of ENEMIES) {
      const e = this.enemies.create(x, y, TEX.bug) as Phaser.Physics.Arcade.Sprite;
      e.setScale(2.5).setOrigin(0.5, 1);
      const body = e.body as Phaser.Physics.Arcade.Body;
      body.setSize(12, 9).setOffset(0, 1);
      e.setVelocityX(-70);
      e.setData('minX', minX);
      e.setData('maxX', maxX);
    }
  }

  private buildFlag(): void {
    const flag = this.add.sprite(FLAG.x, FLAG.y, TEX.flag).setScale(3).setOrigin(0.5, 1);
    this.physics.add.existing(flag, true);
    this.physics.add.overlap(this.player, flag, () => this.win(), undefined, this);
  }

  private buildHud(): void {
    const style = { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', stroke: '#1a1c2c', strokeThickness: 4 };
    this.scoreText = this.add.text(16, 14, '', style).setScrollFactor(0).setDepth(900);
    this.livesText = this.add.text(16, 44, '', style).setScrollFactor(0).setDepth(900);
    this.refreshHud();
  }

  private refreshHud(): void {
    this.scoreText.setText(`Pezzi: ${this.score}/${this.totalCoins}`);
    this.livesText.setText(`Vite: ${'♥'.repeat(Math.max(0, this.lives))}`);
  }

  // --- Logica gameplay ------------------------------------------------------

  private collectCoin: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, c) => {
    const coin = c as Phaser.Physics.Arcade.Sprite;
    coin.disableBody(true, true);
    this.audio?.coin();
    this.score += 1;
    this.refreshHud();
  };

  private hitBlock: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, b) => {
    const block = b as Phaser.Physics.Arcade.Sprite;
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    const fromBelow = (pBody.blocked.up || pBody.touching.up) && block.y < this.player.y - 20;
    if (!fromBelow || block.getData('used')) return;
    block.setData('used', true);
    block.setTexture(TEX.qblockUsed);
    this.audio?.coin();
    // sobbalzo del blocco
    this.tweens.add({ targets: block, y: block.y - 8, duration: 90, yoyo: true, ease: 'Quad.out' });
    // pezzo che salta fuori
    const coin = this.add.sprite(block.x, block.y - 20, TEX.coin).setScale(3).setDepth(5);
    this.tweens.add({
      targets: coin, y: coin.y - 40, alpha: 0, duration: 500, ease: 'Quad.out',
      onComplete: () => coin.destroy(),
    });
    this.score += 1;
    this.refreshHud();
  };

  private hitEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, e) => {
    if (this.state !== 'play') return;
    const enemy = e as Phaser.Physics.Arcade.Sprite;
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    const stomping = pBody.velocity.y > 60 && this.player.y < enemy.y - 10;
    if (stomping) {
      enemy.disableBody(true, true);
      this.player.bounce();
    } else {
      this.killPlayer();
    }
  };

  private killPlayer(): void {
    if (this.state !== 'play') return;
    this.lives -= 1;
    this.refreshHud();
    if (this.lives <= 0) { this.gameOver(); return; }
    this.cameras.main.flash(200, 255, 80, 80);
    this.player.setVelocity(0, 0);
    this.player.setPosition(START.x, START.y);
  }

  private win(): void {
    if (this.state !== 'play') return;
    this.state = 'won';
    this.player.setVelocity(0, 0);
    const bonus = this.score === this.totalCoins ? '  PERFETTO!' : '';
    this.showOverlay(`HAI VINTO!${bonus}`, '#ffe14d');
  }

  private gameOver(): void {
    this.state = 'over';
    this.player.setTint(0x888888);
    this.player.setVelocity(0, 0);
    this.showOverlay('GAME OVER', '#ff5d5d');
  }

  private showOverlay(title: string, color: string): void {
    const cam = this.cameras.main;
    this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(2000);
    this.add.text(cam.width / 2, cam.height / 2 - 30, title, {
      fontFamily: 'monospace', fontSize: '52px', color, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
    this.add.text(cam.width / 2, cam.height / 2 + 40, 'Tocca o premi INVIO per rigiocare', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

    const restart = () => this.scene.restart();
    this.input.once('pointerdown', restart);
    this.input.keyboard!.once('keydown-ENTER', restart);
  }

  // --- Loop principale ------------------------------------------------------

  update(_time: number, delta: number): void {
    this.updateParallax();
    if (this.state === 'play') {
      this.player.update(this.readInput(), delta);
      this.patrolEnemies();
      if (this.player.y > FALL_DEATH_Y) this.killPlayer();
    }
  }

  private updateParallax(): void {
    const sx = this.cameras.main.scrollX;
    this.clouds.tilePositionX = sx * 0.1;
    this.hillsFar.tilePositionX = sx * 0.25;
    this.hillsNear.tilePositionX = sx * 0.5;
  }

  private readInput(): InputState {
    const left = this.cursors.left.isDown || this.touch.left;
    const right = this.cursors.right.isDown || this.touch.right;
    const jumpHeld = this.cursors.up.isDown || this.keyJump.isDown || this.touch.jump;
    const jumpPressed = jumpHeld && !this.prevJumpHeld;
    this.prevJumpHeld = jumpHeld;
    return { left, right, jumpHeld, jumpPressed };
  }

  private patrolEnemies(): void {
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (!e.active) continue;
      const body = e.body as Phaser.Physics.Arcade.Body;
      const minX = e.getData('minX') as number;
      const maxX = e.getData('maxX') as number;
      if (e.x <= minX && body.velocity.x < 0) { e.setVelocityX(70); e.setFlipX(true); }
      else if (e.x >= maxX && body.velocity.x > 0) { e.setVelocityX(-70); e.setFlipX(false); }
    }
  }
}
