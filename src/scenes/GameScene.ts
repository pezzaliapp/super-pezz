import Phaser from 'phaser';
import { Player, type InputState } from '../objects/Player';
import { TouchControls } from '../ui/TouchControls';
import { TEX } from '../gfx/sprites';
import { BG } from '../gfx/background';

const WORLD_W = 3200;
const WORLD_H = 540;
const FALL_DEATH_Y = 720;

const PLATFORMS: [number, number, number, number][] = [
  [0, 480, 900, 60],
  [1100, 480, 1000, 60],
  [2250, 480, 950, 60],
  [520, 380, 160, 24],
  [760, 300, 140, 24],
  [1250, 380, 160, 24],
  [1500, 300, 140, 24],
  [1760, 230, 150, 24],
  [2400, 360, 170, 24],
  [2680, 280, 160, 24],
];

const COINS: [number, number][] = [
  [300, 430], [600, 340], [820, 260], [1000, 430],
  [1330, 340], [1570, 260], [1835, 190], [2150, 430],
  [2485, 320], [2760, 240],
];

const ENEMIES: [number, number, number, number][] = [
  [560, 470, 360, 820],
  [1500, 470, 1150, 1980],
  [2600, 470, 2300, 3050],
];

// Blocchi "?" (centro): colpiti da sotto danno un pezzo.
const QBLOCKS: [number, number][] = [
  [700, 360], [1450, 360], [2520, 330],
];

const START = { x: 120, y: 470 };
const FLAG = { x: 3060, y: 480 };

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

  update(): void {
    this.updateParallax();
    if (this.state === 'play') {
      this.player.update(this.readInput());
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
    const jump = jumpHeld && !this.prevJumpHeld;
    this.prevJumpHeld = jumpHeld;
    return { left, right, jump };
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
