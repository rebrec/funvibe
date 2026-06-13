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
};
