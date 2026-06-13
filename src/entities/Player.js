import Phaser from 'phaser';
import { PLAYER } from '../core/Constants.js';

const MatterLib = Phaser.Physics.Matter.Matter;

// Interpolation simple vers une cible (lissage accel).
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Joueur sous Matter.js.
// - Corps unique : rectangle chanfreiné (les coins arrondis glissent sur les
//   jonctions de pente). Pas de capteur séparé -> le centre de masse reste
//   géométrique, donc le sprite repose pile sur le dessus des plateformes.
// - Mouvement kinématique : on pilote la vitesse à la main pour garder le "feel"
//   (course, double-saut, coyote time, jump buffering, hauteur variable).
// - Sur une pente, on suit la TANGENTE de la surface (montée plus lente) ; à
//   l'arrêt au sol on stoppe net (pas de glissement le long de la pente).
export default class Player extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y) {
    super(scene.matter.world, x, y, 'player');
    scene.add.existing(this);

    const body = MatterLib.Bodies.rectangle(x, y, PLAYER.WIDTH, PLAYER.HEIGHT, {
      chamfer: { radius: 8 },
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      restitution: 0,
      label: 'player',
    });
    this.setExistingBody(body);
    this.setFixedRotation();
    this.setPosition(x, y);

    // État "feel"
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpsRemaining = PLAYER.MAX_JUMPS;
    this.isJumping = false;

    // État combat
    this.health = PLAYER.MAX_HEALTH;
    this.invincibleTimer = 0;
    this.attackTimer = 0; // > 0 => la frappe est active
    this.attackCooldown = 0;
    this.attackId = 0; // incrémenté à chaque frappe (1 touche max par ennemi/frappe)
    this.rangedCooldown = 0; // ms avant de pouvoir relancer un projectile
    this.maxAmmo = PLAYER.RANGED_MAX_AMMO;
    this.ammo = this.maxAmmo;
    this.regenTimer = PLAYER.RANGED_REGEN; // ms avant +1 shuriken
    this.facing = 1; // 1 = droite, -1 = gauche

    // État sol, renseigné par les événements de collision Matter.
    this.isGrounded = false;
    this.groundNormal = { x: 0, y: -1 };
    this._bestUpY = 0;

    const world = scene.matter.world;
    world.on('beforeupdate', this.resetGround, this);
    world.on('collisionstart', this.onCollide, this);
    world.on('collisionactive', this.onCollide, this);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      world.off('beforeupdate', this.resetGround, this);
      world.off('collisionstart', this.onCollide, this);
      world.off('collisionactive', this.onCollide, this);
    });
  }

  resetGround() {
    this.isGrounded = false;
    this._bestUpY = 0; // normale la plus "vers le haut" rencontrée cette frame
  }

  onCollide(event) {
    for (const pair of event.pairs) {
      let other = null;
      if (pair.bodyA === this.body) other = pair.bodyB;
      else if (pair.bodyB === this.body) other = pair.bodyA;
      else continue;

      // Capteurs (pièces, cristaux...) et ennemis ne sont jamais du sol.
      if (other.isSensor || other.label === 'enemy') continue;

      // Normale orientée du sol vers le joueur ("vers le haut" => y < 0).
      let nx = pair.collision.normal.x;
      let ny = pair.collision.normal.y;
      const dirx = this.body.position.x - other.position.x;
      const diry = this.body.position.y - other.position.y;
      if (nx * dirx + ny * diry < 0) {
        nx = -nx;
        ny = -ny;
      }

      // Contact suffisamment "vers le haut" => c'est du sol (pas un mur/plafond).
      if (ny < -PLAYER.SLOPE_MIN_UP && ny < this._bestUpY) {
        this.isGrounded = true;
        this._bestUpY = ny;
        this.groundNormal = { x: nx, y: ny };
      }
    }
  }

  update(delta, input) {
    const body = this.body;
    const grounded = this.isGrounded;

    const axis = input.getMoveAxis();
    const jumpJustPressed = input.isJumpJustPressed();
    const jumpHeld = input.isJumpHeld();

    // --- Timers d'aide ---
    if (grounded) {
      this.coyoteTimer = PLAYER.COYOTE_TIME;
      this.jumpsRemaining = PLAYER.MAX_JUMPS;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }
    if (jumpJustPressed) this.jumpBufferTimer = PLAYER.JUMP_BUFFER;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    // Timers de combat
    this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.rangedCooldown = Math.max(0, this.rangedCooldown - delta);
    if (this.invincibleTimer === 0) this.setAlpha(1);
    if (input.isAttackJustPressed() && this.attackCooldown === 0) this.startAttack();

    // Régénération des shurikens
    if (this.ammo < this.maxAmmo) {
      this.regenTimer -= delta;
      if (this.regenTimer <= 0) {
        this.ammo += 1;
        this.regenTimer = PLAYER.RANGED_REGEN;
        this.scene.registry.set('ammo', this.ammo);
      }
    }

    const vx = body.velocity.x;
    const vy = body.velocity.y;

    // Par défaut la gravité s'applique ; on la coupe seulement à l'arrêt au sol.
    this.setIgnoreGravity(false);

    // --- Déplacement ---
    if (grounded) {
      if (axis !== 0) {
        // Tangente de la surface (perpendiculaire à la normale), vers la droite.
        const n = this.groundNormal;
        const tx = -n.y;
        const ty = n.x;
        const desiredVx = axis * PLAYER.RUN_SPEED * tx;
        const desiredVy = axis * PLAYER.RUN_SPEED * ty;
        this.setVelocity(lerp(vx, desiredVx, PLAYER.GROUND_ACCEL), lerp(vy, desiredVy, PLAYER.GROUND_ACCEL));
      } else {
        // Arrêt net au sol + gravité coupée : aucun glissement le long des pentes.
        this.setVelocity(0, 0);
        this.setIgnoreGravity(true);
      }
    } else {
      // En l'air : contrôle horizontal, la gravité gère le vertical.
      const target = axis * PLAYER.RUN_SPEED;
      this.setVelocityX(lerp(vx, target, PLAYER.AIR_ACCEL));
      if (body.velocity.y > PLAYER.MAX_FALL_SPEED) this.setVelocityY(PLAYER.MAX_FALL_SPEED);
    }

    if (axis !== 0) {
      this.setFlipX(axis < 0);
      this.facing = axis < 0 ? -1 : 1;
    }

    // --- Saut (coyote time + jump buffering + double-saut) ---
    if (this.jumpBufferTimer > 0) {
      if (grounded || this.coyoteTimer > 0) {
        this.setIgnoreGravity(false); // au cas où on sautait depuis l'arrêt
        this.setVelocityY(-PLAYER.JUMP_VELOCITY);
        this.jumpsRemaining = PLAYER.MAX_JUMPS - 1;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.isJumping = true;
        this.isGrounded = false;
      } else if (this.jumpsRemaining > 0) {
        this.setVelocityY(-PLAYER.DOUBLE_JUMP_VELOCITY);
        this.jumpsRemaining -= 1;
        this.jumpBufferTimer = 0;
        this.isJumping = true;
      }
    }

    // --- Hauteur de saut variable : relâcher tôt coupe la montée ---
    if (this.isJumping && !jumpHeld && body.velocity.y < 0) {
      this.setVelocityY(body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
      this.isJumping = false;
    }
    if (body.velocity.y >= 0) this.isJumping = false;
  }

  get isAttacking() {
    return this.attackTimer > 0;
  }

  get invincible() {
    return this.invincibleTimer > 0;
  }

  // Zone de frappe devant le héros (coordonnées monde, centre + taille).
  getAttackHitbox() {
    const w = PLAYER.ATTACK_RANGE;
    const h = PLAYER.HEIGHT;
    const x = this.x + this.facing * (PLAYER.WIDTH / 2 + w / 2);
    return { x, y: this.y, w, h };
  }

  // L'attaque à distance est-elle disponible ? (cadence respectée + stock dispo)
  canThrow() {
    return this.rangedCooldown <= 0 && this.ammo > 0;
  }

  consumeAmmo() {
    this.rangedCooldown = PLAYER.RANGED_COOLDOWN;
    this.ammo -= 1;
    // Si on était au max, relancer le compteur de régénération.
    if (this.ammo === this.maxAmmo - 1) this.regenTimer = PLAYER.RANGED_REGEN;
    this.scene.registry.set('ammo', this.ammo);
  }

  startAttack() {
    this.attackTimer = PLAYER.ATTACK_DURATION;
    this.attackCooldown = PLAYER.ATTACK_COOLDOWN;
    this.attackId += 1;

    // Éclair de frappe (visuel placeholder).
    const hb = this.getAttackHitbox();
    const slash = this.scene.add
      .rectangle(hb.x, hb.y, hb.w, hb.h, 0xffffff, 0.55)
      .setStrokeStyle(2, 0xffe08a)
      .setDepth(5);
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      duration: PLAYER.ATTACK_DURATION,
      onComplete: () => slash.destroy(),
    });
  }

  // Reçoit un coup venant de fromX. Renvoie true si le coup a porté.
  takeDamage(fromX) {
    if (this.invincibleTimer > 0 || this.health <= 0) return false;
    this.health -= 1;
    this.invincibleTimer = PLAYER.INVINCIBLE_TIME;
    const dir = this.x < fromX ? -1 : 1;
    this.setIgnoreGravity(false);
    this.setVelocity(dir * PLAYER.KNOCKBACK_X, -PLAYER.KNOCKBACK_Y);
    this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 90, yoyo: true, repeat: 5 });
    return true;
  }

  respawn(x, y) {
    this.health = PLAYER.MAX_HEALTH;
    this.invincibleTimer = 700;
    this.setIgnoreGravity(false);
    this.setVelocity(0, 0);
    this.setAlpha(1);
    this.isGrounded = false;
    this.setPosition(x, y);
  }
}
