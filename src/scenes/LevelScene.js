import Phaser from 'phaser';
import { GAME, PLAYER, ENEMY, PHYSICS } from '../core/Constants.js';
import { getTheme, buildLevelDecor } from '../core/Skins.js';
import InputManager from '../core/InputManager.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Projectile from '../entities/Projectile.js';
import SaveManager from '../core/SaveManager.js';
import WorldLoader from '../world/WorldLoader.js';
import { smoothCurve, smoothClosedCurve } from '../world/curve.js';
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

    // Zoom caméra : défaut + valeur "large" pour les niveaux hauts.
    const camCfg = levelData.camera ?? {};
    this._camZoomDefault = camCfg.zoom ?? 1;
    this._camZoomWide    = camCfg.wide ?? 0.7;
    this._camZoomMin     = camCfg.min ?? 0.45;
    this._camZoomMax     = camCfg.max ?? 1.3;
    this._camManualZoom  = null;   // override molette (null = auto)
    this._camManualTimer = 0;
    this._lastGroundY    = this._start.y;

    this.matter.world.setBounds(0, 0, W, H, 128, true, true, true, false);
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor(this.theme.background);

    this.input_ = new InputManager(this);

    // Contrôles tactiles : monter dans cette scène et connecter l'InputManager.
    this._touch = this.registry.get('touchControls');
    if (this._touch) {
      this._touch.mount(this);
      this._touch.setInputManager(this.input_);
    }

    this.collectibles = new Map(); // body Matter -> { vis, type }
    this.enemies = [];
    this.projectiles = new Map(); // body Matter -> Projectile

    buildLevelDecor(this, this.theme, W, H, levelData.horizon ?? 1800);
    WorldLoader.build(this, levelData, this.theme);

    this.player = new Player(this, this._start.x, this._start.y);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(160, 180);
    this.cameras.main.setZoom(this._camZoomDefault);
    this.camLookaheadX = 0;
    this.camLookaheadY = 0;

    // Molette = survol manuel temporaire du zoom (revient en auto après inactivité).
    this.input.on('wheel', (pointer, over, dx, dy) => {
      const base = this._camManualZoom ?? this.cameras.main.zoom;
      const z = Phaser.Math.Clamp(base - dy * 0.001, this._camZoomMin, this._camZoomMax);
      this._camManualZoom = z;
      this._camManualTimer = 2500;
    });

    // Synchronise vie + munitions initiales dans le registry (le joueur lit déjà
    // maxHealth / maxAmmo depuis le registry via les upgrades — on ne les réécrit pas).
    this.registry.set('health', this.player.health);
    this.registry.set('maxAmmo', this.player.maxAmmo);
    this.registry.set('ammo', this.player.ammo);

    const portal = levelData.hubPortal ?? { x: 100, y: 1750, radius: 140 };
    this._buildHubPortal(portal);
    if (levelData.finish) this._buildFinish(levelData.finish);

    // État pour l'UI : le HUD/les indications vivent dans UIScene (caméra non zoomée)
    // pour ne pas être déformés par le zoom de la caméra de jeu.
    this.registry.set('inLevel', true);
    this.registry.set('isCustom', this._customLevelIdx >= 0);
    this.registry.set('nearHub', false);
    this.registry.set('levelComplete', false);

    // HUD (scène parallèle) + ramassage des collectibles + impacts de projectiles.
    this.scene.launch('UIScene');
    this.matter.world.on('collisionstart', this.onCollect, this);
    this.matter.world.on('collisionstart', this.onProjectileHit, this);
    this.events.once('shutdown', () => {
      // matter.world peut déjà être détruit au shutdown → garde-fou contre le null.
      if (this.matter && this.matter.world) {
        this.matter.world.off('collisionstart', this.onCollect, this);
        this.matter.world.off('collisionstart', this.onProjectileHit, this);
      }
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

  // Colline/relief arrondi type Sonic : crête lissée par spline à partir de
  // points de contrôle. Visuel plein jusqu'au bas du monde + bande d'herbe ;
  // physique = chaîne de petits segments inclinés (suivi de tangente déjà géré).
  addCurve(points) {
    if (!points || points.length < 2) return;
    const surface = smoothCurve(points, 8); // crête lissée (Catmull-Rom)

    const worldH = this._worldH ?? WORLD_HEIGHT;

    // ── Visuel plein (terre) jusqu'en bas ──
    const g = this.add.graphics().setDepth(-3);
    g.fillStyle(this.theme.groundBody, 1);
    g.beginPath();
    g.moveTo(surface[0].x, surface[0].y);
    for (let i = 1; i < surface.length; i++) g.lineTo(surface[i].x, surface[i].y);
    g.lineTo(surface[surface.length - 1].x, worldH);
    g.lineTo(surface[0].x, worldH);
    g.closePath();
    g.fillPath();

    // ── Bande d'herbe le long de la crête + segments physiques ──
    const grass = this.add.graphics().setDepth(-2);
    grass.lineStyle(10, this.theme.groundTop, 1);
    grass.beginPath();
    grass.moveTo(surface[0].x, surface[0].y);
    for (let i = 1; i < surface.length; i++) grass.lineTo(surface[i].x, surface[i].y);
    grass.strokePath();

    for (let i = 0; i < surface.length - 1; i++) {
      const a = surface[i];
      const b = surface[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) continue;
      const angle = Math.atan2(dy, dx);
      const ndx = -Math.sin(angle);
      const ndy = Math.cos(angle);
      const cx = (a.x + b.x) / 2 + (SLOPE_THICKNESS / 2) * ndx;
      const cy = (a.y + b.y) / 2 + (SLOPE_THICKNESS / 2) * ndy;
      // PAS de débord (len exact) : un +overlap faisait dépasser le coin haut du
      // segment de bout au-dessus de la surface voisine → "mur invisible" aux jonctions.
      this.matter.add.rectangle(cx, cy, len, SLOPE_THICKNESS, {
        isStatic: true, friction: 0, angle, label: 'slope',
      });
    }
  }

  // Île suspendue : forme arrondie FERMÉE, remplie à l'intérieur, solide tout autour.
  // Le contour lissé sert au visuel (remplissage intérieur + liseré d'herbe) et à
  // la physique (chaîne de segments décalés vers l'intérieur → coque solide).
  addIsland(points) {
    if (!points || points.length < 3) return;
    const outline = smoothClosedCurve(points, 8);

    // Centroïde (pour orienter les normales vers l'intérieur).
    let cxs = 0, cys = 0;
    for (const p of outline) { cxs += p.x; cys += p.y; }
    cxs /= outline.length; cys /= outline.length;

    // Visuel : remplissage intérieur + liseré d'herbe sur tout le contour.
    const g = this.add.graphics().setDepth(-3);
    g.fillStyle(this.theme.groundBody, 1);
    g.beginPath();
    g.moveTo(outline[0].x, outline[0].y);
    for (let i = 1; i < outline.length; i++) g.lineTo(outline[i].x, outline[i].y);
    g.closePath(); g.fillPath();
    g.lineStyle(8, this.theme.groundTop, 1);
    g.beginPath();
    g.moveTo(outline[0].x, outline[0].y);
    for (let i = 1; i < outline.length; i++) g.lineTo(outline[i].x, outline[i].y);
    g.closePath(); g.strokePath();

    // Physique : coque de segments décalés vers l'intérieur.
    const TH = SLOPE_THICKNESS;
    for (let i = 0; i < outline.length - 1; i++) {
      const a = outline[i], b = outline[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) continue;
      const angle = Math.atan2(dy, dx);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      let nx = -dy / len, ny = dx / len;             // normale au segment
      if ((cxs - mx) * nx + (cys - my) * ny < 0) { nx = -nx; ny = -ny; } // vers l'intérieur
      this.matter.add.rectangle(mx + (TH / 2) * nx, my + (TH / 2) * ny, len, TH, {
        isStatic: true, friction: 0, angle, label: 'platform',
      });
    }
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
        // 1 shuriken = 1 cible : on consomme le projectile dès qu'il touche un
        // ennemi VIVANT (kill() le passe en capteur, d'où le test AVANT takeHit).
        if (enemy) {
          enemy.takeHit(1);
          this.destroyProjectile(pBody);
        }
        continue; // ennemi mort (capteur) => le shuriken passe au travers
      }

      // Disparaît en touchant tout corps solide (plateforme, pente).
      // Traverse les capteurs (pièces, autres projectiles).
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
  }

  // Drapeau d'arrivée (zone de fin de niveau).
  _buildFinish({ x, y }) {
    const poleTop = y - 90;
    this.add.rectangle(x, (y + poleTop) / 2, 5, y - poleTop, 0xeeeeee).setDepth(4);
    // Drapeau à damier
    const flag = this.add.graphics().setDepth(4);
    const cell = 9, cols = 4, rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        flag.fillStyle((r + c) % 2 === 0 ? 0x222222 : 0xffffff, 1);
        flag.fillRect(x + 3 + c * cell, poleTop + r * cell, cell, cell);
      }
    }
    this.add.text(x, poleTop - 8, 'ARRIVÉE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setDepth(4);
    this.finishZone = { x, y };
    this._finished = false;
  }

  _completeLevel() {
    if (this._finished) return;
    this._finished = true;
    this.registry.set('levelComplete', true); // bannière affichée par UIScene
    this.time.delayedCall(1800, () => this.goToHub());
  }

  _resetUIFlags() {
    this.registry.set('inLevel', false);
    this.registry.set('nearHub', false);
    this.registry.set('levelComplete', false);
  }

  goToHub() {
    this._resetUIFlags();
    this.scene.stop('UIScene');
    // Différer l'arrêt/reprise des scènes pour éviter un freeze (le stop() immédiat dans une méthode de scène est problématique).
    this.time.delayedCall(0, () => {
      if (this.scene.isPaused('HubScene')) {
        // Venue normale depuis le hub (mis en pause) → on le réveille.
        this.scene.stop();
        this.scene.resume('HubScene');
        this.scene.launch('UIScene');
      } else {
        // Venue d'un niveau custom (hub stoppé) → on le redémarre (relance l'UIScene).
        this.scene.start('HubScene');
      }
    });
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

    // --- Zoom caméra (doux, basé sur l'altitude au-dessus du dernier sol) ---
    const cam = this.cameras.main;
    if (this.player.isGrounded) this._lastGroundY = this.player.y;
    let targetZoom;
    if (this._camManualTimer > 0) {
      this._camManualTimer -= delta;       // survol manuel à la molette
      targetZoom = this._camManualZoom;
    } else {
      this._camManualZoom = null;
      const aboveGround = Math.max(0, this._lastGroundY - this.player.y);
      // Dézoom progressif avec l'altitude : plus on enchaîne les sauts (haut), plus
      // la vue s'élargit. Petite zone morte pour ne pas réagir aux micro-sauts.
      const t = Phaser.Math.Clamp((aboveGround - 120) / 1600, 0, 1);
      targetZoom = Phaser.Math.Linear(this._camZoomDefault, this._camZoomWide, t);
    }
    // Lissage doux (pas d'à-coups), mais assez réactif pour suivre l'ascension.
    cam.setZoom(Phaser.Math.Linear(cam.zoom, targetZoom, 0.045));

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
    this.registry.set('nearHub', nearHub);
    this._touch?.setInteractVisible(nearHub);
    if (nearHub && this.input_.isInteractJustPressed()) this.goToHub();

    // Arrivée : franchir la zone termine le niveau.
    if (this.finishZone && !this._finished) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.finishZone.x, this.finishZone.y);
      if (d < 70) this._completeLevel();
    }

    // Chute dans le vide : on réapparaît au départ (sans perdre de vie).
    if (this.player.y > this._deathY) {
      this.player.setVelocity(0, 0);
      this.player.isGrounded = false;
      this.player.setPosition(this._start.x, this._start.y);
    }
  }
}
