// Tous les réglages du jeu au même endroit pour faciliter l'ajustement du "feel".
// Physique : Matter.js (gère nativement pentes et terrains complexes).
// Les valeurs de mouvement sont en "unités Matter" (~ pixels par pas de simulation,
// soit environ px/s ÷ 60). Ce sont des valeurs de premier jet, à affiner au ressenti.

export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
  BACKGROUND: '#5fb6e6',
};

export const PHYSICS = {
  GRAVITY_Y: 1.3, // gravité du monde Matter (1 = défaut ; >1 = chute moins flottante)
  CATEGORY_SOLID:  0x0001, // sol, murs, obstacles infranchissables
  CATEGORY_ONEWAY: 0x0002, // plateformes traversables par le bas, bloquantes par le dessus
};

export const PLAYER = {
  WIDTH: 36,
  HEIGHT: 48,
  COLOR: 0x2b6cff, // carré bleu (placeholder, cf. cahier des charges)

  // Déplacement horizontal (vitesse cible + lissage par interpolation)
  RUN_SPEED: 5.0,
  GROUND_ACCEL: 0.25, // lissage vers la vitesse cible au sol (0..1 par frame)
  GROUND_DECEL: 0.35, // lissage vers l'arrêt au sol
  AIR_ACCEL: 0.10, // contrôle en l'air (plus mou)

  // Saut
  JUMP_VELOCITY: 13,
  DOUBLE_JUMP_VELOCITY: 11,
  JUMP_CUT_MULTIPLIER: 0.45, // relâcher tôt = saut plus court
  // Nombre total de sauts (sol + sauts aériens). Stat ÉVOLUTIVE : la progression
  // (boutique / maîtrises) pourra la monter à 3, 4, 5... La mécanique est générique,
  // chaque saut aérien supplémentaire réutilise DOUBLE_JUMP_VELOCITY.
  MAX_JUMPS: 2,

  // Aides au "feel" (en ms)
  COYOTE_TIME: 100,
  JUMP_BUFFER: 120,

  // Chute
  MAX_FALL_SPEED: 24,

  // Pente praticable : on considère "sol" un contact dont la normale "vers le haut"
  // a une composante verticale < -SLOPE_MIN_UP (1 = plat ; ~0.5 ≈ jusqu'à 60°).
  SLOPE_MIN_UP: 0.5,

  // Combat / vie
  MAX_HEALTH: 3,
  INVINCIBLE_TIME: 1100, // ms d'invincibilité après un coup reçu
  KNOCKBACK_X: 6,
  KNOCKBACK_Y: 8,
  ATTACK_DURATION: 160, // ms où la frappe est active
  ATTACK_COOLDOWN: 300, // ms entre deux frappes
  ATTACK_RANGE: 44, // portée de la frappe devant le héros

  // Attaque à distance — stock régénératif (toutes ces valeurs sont ÉVOLUTIVES :
  // la boutique/les maîtrises pourront augmenter le stock, accélérer la recharge,
  // ou réduire la cadence).
  RANGED_COOLDOWN: 480, // ms entre deux lancers (plus lent par défaut)
  RANGED_MAX_AMMO: 5, // stock de shurikens
  RANGED_REGEN: 2600, // ms pour régénérer 1 shuriken (assez lent : le stock est une vraie ressource)
};

export const PROJECTILE = {
  SPEED: 12, // vitesse horizontale (unités Matter)
  LIFETIME: 900, // ms avant disparition
  RADIUS: 9,
  COLOR: 0x33373d,
};

export const SHOP = {
  ITEMS: [
    { id: 'maxHealth',  label: '+1 coeur max',    desc: 'PV max +1',              costs: [5, 10],  maxLevel: 2 },
    { id: 'maxJumps',   label: '+1 saut aerien',  desc: 'Sauts possibles +1',     costs: [8, 14],  maxLevel: 2 },
    { id: 'maxAmmo',    label: '+2 shurikens',    desc: 'Stock max +2',           costs: [6, 12],  maxLevel: 2 },
    { id: 'regenSpeed', label: 'Recharge rapide', desc: 'Recharge x1.7 plus vite', costs: [10],   maxLevel: 1 },
  ],
};

export const ENEMY = {
  WIDTH: 34,
  HEIGHT: 46, // un peu plus fin et haut (silhouette moins "blob")
  COLOR: 0xff5555,
  SPEED: 1.8, // vitesse de patrouille (unités Matter)
  HP: 1, // points de vie par défaut
  JUMP_VELOCITY: 9,
  JUMP_INTERVAL_MIN: 1100, // ms entre deux sauts (aléatoire)
  JUMP_INTERVAL_MAX: 2800,

  // Type "fonceur" : avance doucement, s'arrête (avec un clignotement
  // d'avertissement), puis accélère brutalement, et recommence.
  CHARGER: {
    CREEP_SPEED: 0.7,
    CREEP_TIME: 550, // ms d'avance lente
    PAUSE_TIME: 850, // ms d'arrêt avant la charge
    TELEGRAPH_TIME: 320, // ms de clignotement en fin de pause
    DASH_TIME: 600, // ms de charge
    DASH_START_SPEED: 2,
    DASH_ACCEL: 1.08, // multiplicateur de vitesse par frame (~exponentiel)
    DASH_MAX_SPEED: 9,
  },
};
