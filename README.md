# jeuleo — maquette

Maquette d'un jeu d'aventure-plateforme 2D (Phaser 3). Voir le cahier des charges
pour la vision complète et les jalons.

## Prérequis

Node **18+** (testé sur Node 22). Le dépôt fournit un `.nvmrc` :

```bash
nvm use      # bascule sur Node 22 (sinon : nvm install 22)
npm install
```

> ⚠️ Le Node par défaut du système est ici en v14, trop ancien pour Vite. Pense à
> faire `nvm use` dans ce dossier avant de lancer les commandes.

## Lancer

```bash
npm run dev      # serveur de dev (http://localhost:5173)
npm run build    # build de production dans dist/
npm run preview  # prévisualise le build
```

## État actuel — Jalon M0 (sensations de plateforme)

Une scène jouable pour valider le « feel » du déplacement :

- course avec accélération/freinage,
- saut + **double-saut**,
- **coyote time** (on peut sauter juste après avoir quitté un bord),
- **jump buffering** (un appui juste avant l'atterrissage est mémorisé),
- **hauteur de saut variable** (relâcher tôt = saut plus court),
- caméra qui suit (horizontale **et verticale**),
- **grand niveau non-linéaire** (droite → tour d'escalade → gauche en hauteur → descente → repère),
- **pentes** (douces et escarpées, dans les deux sens) sur lesquelles le héros marche
  plus lentement en montée, plus un trou à franchir.

> Physique : **Matter.js** (gère nativement pentes et terrains complexes). Le
> mouvement est piloté à la main (vitesse) pour garder un "feel" précis : sur une
> pente le héros suit la tangente de la surface. Réglages dans `src/core/Constants.js`
> (valeurs de premier jet, à affiner au ressenti). Mettre `debug: true` dans
> `src/main.js` pour visualiser les corps physiques.

**Commandes** : Flèches / `A`-`D` pour se déplacer, `Espace` / `↑` / `W` pour sauter.

Tous les réglages du mouvement sont dans `src/core/Constants.js` (à ajuster pour le feel).

## Structure

```
src/
  main.js               config Phaser + scènes
  core/
    Constants.js        réglages (gravité, vitesses, saut...)
    InputManager.js      abstraction clavier/tactile -> actions
  entities/
    Player.js           déplacement, saut, double-saut
  scenes/
    BootScene.js        génère les textures placeholder
    LevelScene.js       le niveau de test M0
```

Prochains jalons : collecte & HUD (M1), combat (M2), hub-village + boutique (M3),
portes & gating (M4), boss (M5), personnages & maîtrises (M6).
