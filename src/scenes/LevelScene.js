import Phaser from 'phaser';
import { GAME, PLAYER, ENEMY, PHYSICS } from '../core/Constants.js';
import { getTheme, buildLevelDecor } from '../core/Skins.js';
import InputManager from '../core/InputManager.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Projectile from '../entities/Projectile.js';
import SaveManager from '../core/SaveManager.js';
import WorldLoader from '../world/WorldLoader.js';
import level1Data from '../data/levels/level1.json';

const CUSTOM_LEVELS_KEY = 'customLevels';

const WORLD_WIDTH  = level1Data.world.width;
const WORLD_HEIGHT = level1Data.world.height;

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

  init(data) {
    // Si un index customLevel est passé, on charge ce niveau depuis localStorage.
    this._customLevelIdx = data?.customLevelIdx ?? -1;
  }

  _getLevelData() {
    if (this._customLevelIdx >= 0) {
      try {
        const arr = JSON.parse(localStorage.getItem(CUSTOM_LEVELS_KEY) ?? '[]');
        const entry = arr[this._customLevelIdx];
        if (entry?.data) return entry.data;
      } catch { /* ignore */ }
    }
    return level1Data;
  }

  create() {
    const levelData = this._getLevelData();

    this.theme = getTheme(this.registry.get('theme') ?? 'forest');
    this.keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    const W = levelData.world?.width  ?? WORLD_WIDTH;
    const H = levelData.world?.height ?? WORLD_HEIGHT;
    this._worldW = W;
    this._worldH = H;
    this._start  = levelData.start ?? START;
    this._deathY = H - 20;
    this.matter.world.setBounds(0, 0, W, H, 128, true, true, true, false);
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(this.theme.background);

    this.input_ = new InputManager(this);
    this.collectibles = new Map(); // body Matter -> { vis, type }
    this.enemies = [];
    this.projectiles = new Map(); // body Matter -> Projectile

    buildLevelDecor(this, this.theme, W, H, 1800);
    WorldLoader.build(this, levelData, this.theme);

    this.player = new Player(this, this._start.x, this._start.y);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(160, 180);
    this.camLookaheadX = 0;
    this.camLookaheadY = 0;

    // Synchronise vie + munitions initiales dans le registry (le joueur lit déjà
    // maxHealth / maxAmmo depuis le registry via les upgrades — on ne les réécrit pas).
    this.registry.set('health', this.player.health);
    this.registry.set('maxAmmo', this.player.maxAmmo);
    this.registry.set('ammo', this.player.ammo);

    this.createHelpOverlay();
    const portal = levelData.hubPortal ?? { x: 100, y: 1750, radius: 140 };
    this._buildHubPortal(portal);

    // Informe si niveau custom chargé
    if (this._customLevelIdx >= 0) {
      this.add.text(W / 2, 30, '⚡ Niveau custom', {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffcc00',
        backgroundColor: '#00000088', padding: { x: 8, y: 4 },
      }).setScrollFactor(0).setDepth(200).setOrigin(0.5);
    }

    // HUD (scène parallèle) + ramassage des collectibles + impacts de projectiles.
    this.scene.launch('UIScene');
    this.matter.world.on('collisionstart', this.onCollect, this);
    this.matter.world.on('collisionstart', this.onProjectileHit, this);
    this.events.once('shutdown', () => {
      this.matter.world.off('collisionstart', this.onCollect, this);
      this.matter.world.off('collisionstart', this.onProjectileHit, this);
    });
  }

  // Sol avec remplissage terreux (terrain "plein" visuellement).
  addGroundSection(x, topY, width) {
    // Remplissage terre (jusqu'au bas du monde)
    const fillH = (this._worldH ?? WORLD_HEIGHT) - topY;
    this.add.rectangle(
      x + width / 2, topY + fillH / 2, width, fillH, this.theme.groundBody
    ).setDepth(-3);
    // Bande de surface (herbe / neige / sable)
    this.add.rectangle(
      x + width / 2, topY + 5, width, 10, this.theme.groundTop
    ).setDepth(-2);
    // Corps physique (transparent, couvre la surface)
    const rect = this.add.rectangle(
      x + width / 2, topY + PLATFORM_THICKNESS / 2, width, PLATFORM_THICKNESS,
      this.theme.groundBody
    );
    this.matter.add.gameObject(rect, { isStatic: true, friction: 0, label: 'platform' });
    return rect;
  }

  // Plateforme horizontale (corps statique Matter + visuel en un objet).
  // oneWay=true → traversable par le bas (saut), bloquante par le dessus (atterrissage).
  addPlatform(x, topY, width, color, oneWay = false) {
    const rect = this.add.rectangle(
      x + width / 2, topY + PLATFORM_THICKNESS / 2, width, PLATFORM_THICKNESS, color
    );
    // Filet de lumière sur le dessus de la plateforme
    this.add.rectangle(
      x + width / 2, topY + 3, width - 6, 4, this.theme.platHighlight, 0.45
    );
    // Ombre légère en-dessous
    this.add.rectangle(
      x + width / 2 + 3, topY + PLATFORM_THICKNESS + 4, width, 6, 0x000000, 0.22
    ).setDepth(-1);
    const cfg = oneWay
      ? { isStatic: true, friction: 0, label: 'oneway',
          collisionFilter: { category: PHYSICS.CATEGORY_ONEWAY, mask: 0xFFFFFFFF } }
      : { isStatic: true, friction: 0, label: 'platform' };
    this.matter.add.gameObject(rect, cfg);
    return rect;
  }

  // Pente définie par sa ligne de surface (x1,y1)->(x2,y2), x1 < x2.
  addSlope(x1, y1, x2, y2, color) {
    color = color ?? this.theme.slopeColor;
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

  addCoin(x, y) {
    const body = this.matter.add.circle(x, y, 12, { isStatic: true, isSensor: true, label: 'coin' });
    const vis = this.add.circle(x, y, 11, this.theme.coinColor)
      .setStrokeStyle(2, this.theme.coinStroke);
    this.collectibles.set(body, { vis, type: 'coin' });
    this.tweens.add({ targets: vis, scale: 1.18, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  addCrystal(x, y) {
    const body = this.matter.add.rectangle(x, y, 22, 22, { isStatic: true, isSensor: true, label: 'crystal' });
    // Losange (carré à 45°) aux couleurs du thème
    const vis = this.add.rectangle(x, y, 16, 16, this.theme.crystalColor)
      .setStrokeStyle(2, this.theme.crystalStroke)
      .setRotation(Math.PI / 4);
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

  addEnemy(x, platformTop, minX, maxX, opts = {}) {
    const e = new Enemy(this, x, platformTop - ENEMY.HEIGHT / 2, { minX, maxX, ...opts });
    this.enemies.push(e);
    return e;
  }

  // Recouvrement de deux rectangles définis par leur centre + taille.
  static overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return (
      Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2
    );
  }

  respawnPlayer() {
    this.player.respawn(this._start.x, this._start.y);
    this.registry.set('health', this.player.health);
  }

  // --- Projectiles (attaque à distance) ---
  spawnProjectile() {
    const dir = this.player.facing;
    const x = this.player.x + dir * (PLAYER.WIDTH / 2 + 10);
    const y = this.player.y - 4;
    const p = new Projectile(this, x, y, dir);
    this.projectiles.set(p.body, p);
  }

  destroyProjectile(body) {
    const p = this.projectiles.get(body);
    if (!p) return;
    this.projectiles.delete(body);
    p.destroy();
  }

  onProjectileHit(event) {
    for (const pair of event.pairs) {
      let pBody = null;
      let other = null;
      if (this.projectiles.has(pair.bodyA)) {
        pBody = pair.bodyA;
        other = pair.bodyB;
      } else if (this.projectiles.has(pair.bodyB)) {
        pBody = pair.bodyB;
        other = pair.bodyA;
      } else {
        continue;
      }

      if (other === this.player.body) continue; // ne se déclenche pas sur le lanceur

      if (other.label === 'enemy') {
        const enemy = this.enemies.find((e) => e.body === other && e.alive);
        if (enemy) enemy.takeHit(1);
      }

      // Disparaît en touchant tout corps solide (ennemi vivant, plateforme, pente).
      // Traverse les capteurs (pièces, ennemis morts, autres projectiles).
      if (!other.isSensor) this.destroyProjectile(pBody);
    }
  }

  _buildHubPortal({ x, y, radius }) {
    const halo = this.add.circle(x, y, 44, 0x6633cc, 0.8);
    const core = this.add.circle(x, y, 32, 0x9966ff, 0.65);
    this.tweens.add({
      targets: [halo, core], scale: { from: 0.92, to: 1.08 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.add.text(x, y - 54, 'VILLAGE', {
      fontFamily: 'monospace', fontSize: '15px', color: '#cc99ff', fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    this.hubPortal = { x, y, radius };
    this.hubHint = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT - 100, 'E : retourner au village', {
        fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 10, y: 5 },
      })
      .setScrollFactor(0).setDepth(100).setOrigin(0.5).setVisible(false);
  }

  goToHub() {
    this.scene.stop('UIScene');
    this.scene.stop();
    this.scene.resume('HubScene');
    this.scene.launch('UIScene');
  }

  createHelpOverlay() {
    const lines = [
      'Flèches / A-D : se déplacer   ·   Espace / ↑ / W : sauter (double-saut)',
      'J / X : frapper   ·   K / L : lancer un shuriken   ·   ramasse pièces & cristaux',
    ];
    const text = this.add
      .text(16, GAME.HEIGHT - 52, lines, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#0a2233',
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(1000);
    text.setShadow(0, 1, '#ffffff', 0);
  }

  update(time, delta) {
    // Menu debug skins (F2)
    if (Phaser.Input.Keyboard.JustDown(this.keyF2)) {
      this.scene.pause();
      this.scene.launch('SkinDebugScene', { from: 'LevelScene' });
      return;
    }

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

    // --- Ennemis & combat ---
    for (const e of this.enemies) e.update(delta);

    if (this.player.isAttacking) {
      const hb = this.player.getAttackHitbox();
      for (const e of this.enemies) {
        if (
          e.alive &&
          e.lastHitAttackId !== this.player.attackId &&
          LevelScene.overlap(hb.x, hb.y, hb.w, hb.h, e.x, e.y, ENEMY.WIDTH, ENEMY.HEIGHT)
        ) {
          e.lastHitAttackId = this.player.attackId;
          e.takeHit(1);
        }
      }
    }

    if (!this.player.invincible) {
      for (const e of this.enemies) {
        if (
          e.alive &&
          LevelScene.overlap(this.player.x, this.player.y, PLAYER.WIDTH, PLAYER.HEIGHT, e.x, e.y, ENEMY.WIDTH, ENEMY.HEIGHT)
        ) {
          if (this.player.takeDamage(e.x)) {
            this.registry.set('health', this.player.health);
            if (this.player.health <= 0) this.respawnPlayer();
          }
          break;
        }
      }
    }

    this.enemies = this.enemies.filter((e) => e.active);

    // --- Projectiles (lancer + durée de vie) ---
    if (this.input_.isRangedJustPressed() && this.player.canThrow()) {
      this.player.consumeAmmo();
      this.spawnProjectile();
    }
    for (const [body, p] of this.projectiles) {
      p.life -= delta;
      if (p.life <= 0) this.destroyProjectile(body);
    }

    // Portail retour au hub
    const nearHub = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.hubPortal.x, this.hubPortal.y
    ) < this.hubPortal.radius;
    this.hubHint.setVisible(nearHub);
    if (nearHub && this.input_.isInteractJustPressed()) this.goToHub();

    // Chute dans le vide : on réapparaît au départ (sans perdre de vie).
    if (this.player.y > this._deathY) {
      this.player.setVelocity(0, 0);
      this.player.isGrounded = false;
      this.player.setPosition(this._start.x, this._start.y);
    }
  }
}
