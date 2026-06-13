import Phaser from 'phaser';
import { GAME } from '../core/Constants.js';
import InputManager from '../core/InputManager.js';
import Player from '../entities/Player.js';
import SaveManager from '../core/SaveManager.js';

// M0 — Sensations de plateforme sous Matter.js : niveau LONG (type Sonic/Donkey
// Kong), avec verticalité, sections en hauteur et pentes (dans les deux sens).
// Le tracé avance toujours vers la droite et ne se recoupe jamais (pas de pentes
// qui se croisent par accident).

const WORLD_WIDTH = 12000;
const WORLD_HEIGHT = 2200;

const START = { x: 120, y: 1720 };
const DEATH_Y = WORLD_HEIGHT - 20;

const COL = {
  ground: 0x6b4f2a,
  plat: 0x8a8f98,
  slope: 0x7a5a30,
  landmark: 0xc06be0,
};

const PLATFORM_THICKNESS = 28;
const SLOPE_THICKNESS = 44;

// Décalage de la caméra dans le sens du déplacement (anticipation).
// Horizontal : voir plus loin devant. Vertical : voir plus haut en montant /
// plus bas en descendant (transition plus douce pour ne pas suivre chaque saut).
const CAM_LOOKAHEAD_X = 220;
const CAM_LOOKAHEAD_X_LERP = 0.04;
const CAM_LOOKAHEAD_Y = 160;
const CAM_LOOKAHEAD_Y_LERP = 0.03;

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  create() {
    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 128, true, true, true, false);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND);

    this.input_ = new InputManager(this);
    this.collectibles = new Map(); // body Matter -> { vis, type }

    this.buildLevel();
    this.buildCollectibles();

    this.player = new Player(this, START.x, START.y);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(160, 180);
    this.camLookaheadX = 0;
    this.camLookaheadY = 0;

    this.createHelpOverlay();

    // HUD (scène parallèle) + ramassage des collectibles.
    this.scene.launch('UIScene');
    this.matter.world.on('collisionstart', this.onCollect, this);
    this.events.once('shutdown', () => {
      this.matter.world.off('collisionstart', this.onCollect, this);
    });
  }

  buildLevel() {
    // --- A. Départ + petite montée par plateformes ---
    this.addPlatform(0, 1800, 700, COL.ground);
    this.addSlope(700, 1800, 1000, 1650); // pente douce
    this.addPlatform(1000, 1650, 200, COL.plat);
    this.addPlatform(1300, 1650, 180, COL.plat);
    this.addPlatform(1560, 1560, 160, COL.plat);
    this.addPlatform(1800, 1470, 160, COL.plat);
    this.addPlatform(2040, 1470, 200, COL.plat);
    this.addSlope(2240, 1470, 2520, 1650); // redescente
    this.addPlatform(2520, 1650, 260, COL.plat);

    // --- B. Trou, puis pente raide et tour d'escalade ---
    this.addPlatform(2960, 1700, 240, COL.plat); // après le trou
    this.addSlope(3200, 1700, 3380, 1450); // pente raide
    this.addPlatform(3380, 1450, 200, COL.plat);
    // tour en quinconce (sauts / double-sauts), écarts réguliers ~110 px
    this.addPlatform(3640, 1340, 150, COL.plat);
    this.addPlatform(3880, 1230, 150, COL.plat);
    this.addPlatform(3640, 1120, 150, COL.plat);
    this.addPlatform(3880, 1010, 150, COL.plat);
    this.addPlatform(3640, 900, 150, COL.plat);
    this.addPlatform(3860, 790, 320, COL.plat); // palier sommet

    // --- C. Longue section EN HAUTEUR, puis descente par pentes ---
    this.addPlatform(4260, 790, 200, COL.plat);
    this.addPlatform(4560, 850, 180, COL.plat);
    this.addPlatform(4840, 790, 180, COL.plat);
    this.addSlope(5100, 790, 5400, 1050); // descente
    this.addPlatform(5400, 1050, 300, COL.plat);
    this.addPlatform(5760, 1150, 220, COL.plat);
    this.addSlope(5980, 1150, 6300, 1400); // descente
    this.addPlatform(6300, 1400, 360, COL.plat);
    this.addPlatform(6720, 1500, 260, COL.plat);

    // --- D. Longue ligne au sol (section "vitesse") avec collines ---
    this.addPlatform(7040, 1600, 900, COL.ground);
    this.addSlope(7940, 1600, 8300, 1450); // colline (montée douce)
    this.addPlatform(8300, 1450, 200, COL.plat);
    this.addSlope(8540, 1450, 8900, 1650); // redescente
    this.addPlatform(8900, 1650, 400, COL.ground);

    // --- E. Trou, dernière tour, et repère final ---
    this.addPlatform(9420, 1650, 260, COL.plat);
    this.addPlatform(9700, 1540, 150, COL.plat);
    this.addPlatform(9940, 1430, 150, COL.plat);
    this.addPlatform(9700, 1320, 150, COL.plat);
    this.addPlatform(9940, 1210, 150, COL.plat);
    this.addPlatform(9720, 1100, 300, COL.plat);
    this.addPlatform(10120, 1100, 200, COL.plat);
    this.addPlatform(10420, 1040, 180, COL.plat);
    this.addPlatform(10700, 980, 180, COL.plat);
    this.addPlatform(10980, 900, 240, COL.landmark); // repère final (arrivée du parcours de test)
    this.addPlatform(11260, 1100, 500, COL.ground);

    this.add
      .text(11100, 850, 'ARRIVÉE', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#3a1050',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1);
  }

  // Plateforme horizontale (corps statique Matter + visuel en un objet).
  addPlatform(x, topY, width, color) {
    const rect = this.add.rectangle(
      x + width / 2,
      topY + PLATFORM_THICKNESS / 2,
      width,
      PLATFORM_THICKNESS,
      color
    );
    this.matter.add.gameObject(rect, { isStatic: true, friction: 0, label: 'platform' });
    return rect;
  }

  // Pente définie par sa ligne de surface (x1,y1)->(x2,y2), x1 < x2.
  // Corps statique = rectangle pivoté dont le bord supérieur suit la surface.
  addSlope(x1, y1, x2, y2, color = COL.slope) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // Normale "vers le bas" (x1<x2 => cos(angle)>0) pour décaler la dalle sous la surface.
    const ndx = -Math.sin(angle);
    const ndy = Math.cos(angle);
    const cx = (x1 + x2) / 2 + (SLOPE_THICKNESS / 2) * ndx;
    const cy = (y1 + y2) / 2 + (SLOPE_THICKNESS / 2) * ndy;

    this.matter.add.rectangle(cx, cy, len, SLOPE_THICKNESS, {
      isStatic: true,
      friction: 0,
      angle,
      label: 'slope',
    });

    const vis = this.add.rectangle(cx, cy, len, SLOPE_THICKNESS, color);
    vis.setRotation(angle);
  }

  // --- Collectibles : pièces (jaunes) et cristaux (cyan) ---
  // Disposés au-dessus du parcours. Corps capteur Matter (détection) + visuel
  // séparé (animé librement, sans interférer avec la physique).
  buildCollectibles() {
    // --- Pièces POSÉES sur le sol (sur le chemin, faciles à ramasser) ---
    this.groundCoinRow(220, 1800, 5, 60); // sol de départ
    this.groundCoinRow(1020, 1650, 3, 60); // palier
    this.groundCoinRow(2080, 1470, 2, 80);
    this.groundCoinRow(2560, 1650, 3, 70);
    this.groundCoin(3700, 1340); // paliers de la tour B
    this.groundCoin(3940, 1230);
    this.groundCoin(3700, 1120);
    this.groundCoin(3940, 1010);
    this.groundCoin(3700, 900);
    this.groundCoinRow(3880, 790, 3, 80); // sommet de tour
    this.groundCoin(4320, 790); // section haute C
    this.groundCoin(4620, 850);
    this.groundCoin(4920, 790);
    this.groundCoinRow(5460, 1050, 2, 90);
    this.groundCoin(6400, 1400);
    this.groundCoinRow(7120, 1600, 9, 90); // longue ligne "vitesse"
    this.groundCoinRow(8920, 1650, 4, 80);
    this.groundCoin(9760, 1540); // tour E
    this.groundCoin(10000, 1430);
    this.groundCoin(9760, 1320);
    this.groundCoin(10000, 1210);
    this.groundCoinRow(11280, 1100, 4, 70); // après l'arrivée

    // --- Pièces EN L'AIR (sur l'arc de saut, hauteurs conservatrices) ---
    this.addCoin(2820, 1605); // arc au-dessus du 1er trou (le cristal occupe l'apex)
    this.addCoin(2920, 1605);
    this.addCoin(3760, 1255); // apex entre paliers de la tour B (~85 px au-dessus)
    this.addCoin(3760, 1035);
    this.addCoin(7500, 1515); // saut au-dessus de la ligne de vitesse (~85 px)
    this.addCoin(7600, 1515);
    this.addCoin(9340, 1605); // arc au-dessus du 2e trou
    this.addCoin(9380, 1605);
    this.addCoin(10300, 1015); // apex vers l'arrivée (~85 px au-dessus du palier)
    this.addCoin(10580, 970);

    // --- Cristaux : un mélange posé / en l'air ---
    this.groundCrystal(4040, 790); // posé au sommet de la tour
    this.addCrystal(4920, 720); // en l'air au-dessus de la section haute (~70 px, saut)
    this.addCrystal(2870, 1560); // en l'air, sur l'arc du saut au-dessus du trou
    this.groundCrystal(9870, 1100); // posé au sommet de la dernière tour
    this.groundCrystal(11100, 900); // posé près de l'ARRIVÉE
  }

  // Pose un objet sur le dessus d'une plateforme (platformTop = Y de la surface).
  groundCoin(x, platformTop) {
    this.addCoin(x, platformTop - 12);
  }

  groundCoinRow(x, platformTop, count, step) {
    for (let i = 0; i < count; i++) this.groundCoin(x + i * step, platformTop);
  }

  groundCrystal(x, platformTop) {
    this.addCrystal(x, platformTop - 13);
  }

  addCoin(x, y) {
    const body = this.matter.add.circle(x, y, 12, { isStatic: true, isSensor: true, label: 'coin' });
    const vis = this.add.circle(x, y, 11, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.collectibles.set(body, { vis, type: 'coin' });
    this.tweens.add({ targets: vis, scale: 1.18, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  addCrystal(x, y) {
    const body = this.matter.add.rectangle(x, y, 22, 22, { isStatic: true, isSensor: true, label: 'crystal' });
    const vis = this.add.rectangle(x, y, 18, 18, 0x49e0e0).setStrokeStyle(2, 0x1f8a8a).setRotation(Math.PI / 4);
    this.collectibles.set(body, { vis, type: 'crystal' });
    this.tweens.add({ targets: vis, angle: '+=360', duration: 3200, repeat: -1 });
  }

  onCollect(event) {
    for (const pair of event.pairs) {
      let other = null;
      if (pair.bodyA === this.player.body) other = pair.bodyB;
      else if (pair.bodyB === this.player.body) other = pair.bodyA;
      else continue;

      const entry = this.collectibles.get(other);
      if (!entry) continue;

      this.collectibles.delete(other);
      this.matter.world.remove(other);
      this.tweens.killTweensOf(entry.vis);
      entry.vis.destroy();

      const key = entry.type === 'crystal' ? 'crystals' : 'coins';
      this.registry.inc(key, 1);
      SaveManager.save({
        coins: this.registry.get('coins'),
        crystals: this.registry.get('crystals'),
      });
    }
  }

  createHelpOverlay() {
    const lines = [
      'M1 — Niveau long + collecte (pièces & cristaux)',
      'Flèches / A-D : se déplacer   ·   Espace / ↑ / W : sauter (double-saut)',
      'Ramasse les pièces (jaunes) et cristaux (cyan) ; compteurs en haut à droite.',
    ];
    const text = this.add
      .text(16, 14, lines, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#0a2233',
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(1000);
    text.setShadow(0, 1, '#ffffff', 0);
  }

  update(time, delta) {
    this.player.update(delta, this.input_);

    // Caméra qui anticipe : on se décale dans le sens du déplacement pour voir
    // davantage devant le joueur (relief, obstacles, adversaires), horizontalement
    // ET verticalement.
    const vx = this.player.body.velocity.x;
    const vy = this.player.body.velocity.y;
    const dirX = vx > 0.4 ? 1 : vx < -0.4 ? -1 : 0;
    const dirY = vy > 3 ? 1 : vy < -3 ? -1 : 0;
    if (dirX !== 0) {
      this.camLookaheadX = Phaser.Math.Linear(this.camLookaheadX, -dirX * CAM_LOOKAHEAD_X, CAM_LOOKAHEAD_X_LERP);
    }
    if (dirY !== 0) {
      this.camLookaheadY = Phaser.Math.Linear(this.camLookaheadY, -dirY * CAM_LOOKAHEAD_Y, CAM_LOOKAHEAD_Y_LERP);
    }
    this.cameras.main.setFollowOffset(this.camLookaheadX, this.camLookaheadY);

    if (this.player.y > DEATH_Y) {
      this.player.setVelocity(0, 0);
      this.player.isGrounded = false;
      this.player.setPosition(START.x, START.y);
    }
  }
}
