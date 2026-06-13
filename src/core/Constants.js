// Tous les réglages du jeu au même endroit pour faciliter l'ajustement du "feel".
// Les valeurs de mouvement sont pensées pour des sensations de plateforme agréables :
// accélération/freinage rapides, saut à hauteur variable, double-saut, coyote time
// et jump buffering (voir Player.js).

export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
  BACKGROUND: '#5fb6e6',
};

export const PHYSICS = {
  GRAVITY_Y: 1800, // gravité en montée/chute "normale"
};

export const PLAYER = {
  WIDTH: 36,
  HEIGHT: 48,
  COLOR: 0x2b6cff, // carré bleu (placeholder, cf. cahier des charges)

  // Déplacement horizontal
  MAX_SPEED: 320,
  ACCELERATION: 2600, // m/s² au sol — atteint la vitesse max très vite
  DECELERATION: 3200, // freinage au sol quand on relâche
  AIR_ACCELERATION: 1800,
  AIR_DECELERATION: 1200,

  // Saut
  JUMP_VELOCITY: 720, // impulsion verticale du saut
  JUMP_CUT_MULTIPLIER: 0.45, // si on relâche tôt, on coupe la vitesse de montée -> saut plus court
  MAX_JUMPS: 2, // saut + double-saut
  DOUBLE_JUMP_VELOCITY: 640, // un peu plus faible que le premier saut

  // Aides au "feel" (en ms)
  COYOTE_TIME: 100, // on peut encore sauter peu après avoir quitté le bord
  JUMP_BUFFER: 120, // un appui juste avant l'atterrissage est mémorisé

  // Tombée plus rapide pour un ressenti moins "flottant"
  FALL_GRAVITY_MULTIPLIER: 1.35,
  MAX_FALL_SPEED: 1400,
};
