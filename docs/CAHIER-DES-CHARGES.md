# Cahier des charges — jeuleo (aventure-plateforme 2D)

> Document vivant. Mis à jour au fil des décisions. Voir aussi [`BACKLOG.md`](BACKLOG.md)
> pour les idées/chantiers, et [`../CLAUDE.md`](../CLAUDE.md) pour le guide technique court.

## Contexte
Jeu né de croquis sur carnet : un petit héros affronte des créatures géantes, des boss à
barre de vie, dans des décors variés. On construit d'abord une **maquette jouable** (Phaser 3 +
Vite, physique Matter.js) pour valider gameplay, ressenti et mécaniques, avant l'art réel.
Document pensé pour pouvoir **déléguer des tranches** à des modèles plus légers : chaque jalon
est autonome et testable.

## Décisions actées
- **Genre** : aventure-plateforme 2D, vue de côté ; exploration + combat + collecte + progression.
- **Public** : 8 ans et +, doit plaire jusqu'aux ados/adultes. Univers façon *Ninja Legends*.
- **Techno** : Phaser 3 + Vite ; **physique Matter.js** (gère nativement pentes et terrains
  non-linéaires, contrairement à Arcade). Web d'abord (PC Linux) puis mobile ; gameplay pensé
  mobile-compatible (entrées centralisées dans `InputManager`).
- **Art** : placeholders (formes colorées) pour la maquette ; **pixel art rétro écarté**. Style
  final (dessiné-main vs vectoriel cartoon) à trancher après validation du gameplay.
- **Héros** : plusieurs personnages distincts QUI gagnent aussi des maîtrises/niveaux
  (« maître ninja », « maître dragon »…).
- **Combat** : corps-à-corps ET distance, **selon le perso/maîtrise**. Le système d'attaque est
  modulaire (melee + projectile déjà prototypés).
- **Hub** : un **village jouable** (le héros marche, va à la boutique, entre dans des portes).
- **Histoire** : vraie quête principale avec boss final.

## Piliers de design
1. **Sensations de plateforme excellentes** — le saut prime sur tout le reste.
2. **Le pouvoir ouvre le monde** — chaque capacité rend accessible ce qui était bloqué.
3. **Découverte récompensée** — explorer rapporte (pièces, cristaux, portes cachées, skins).
4. **Accessible à 8 ans, profond pour les grands**.

## Systèmes (vision cible)
### Personnages & maîtrises
Plusieurs héros jouables (ninja agile/corps-à-corps, maître dragon vol+souffle…), qui gagnent
des **maîtrises** (épreuves + expérience + objets) débloquant des **pouvoirs** de combat et de
franchissement (double/triple saut, planer, voler, souffle…).

### Combat
Corps-à-corps et distance selon le perso/maîtrise. Héros à barre de vie ; ennemis simples +
**boss** à grande barre de vie. Battre un boss difficile donne une **récompense** (ex. skin).

### Monde & navigation
Hub-village jouable central (boutique + portes). **Portes** de trois types : téléport local,
changement de monde (re-accessible depuis le hub), et **porte à épreuve** (exige une maîtrise ;
infaisable sans le bon niveau). Certaines zones ne sont atteignables qu'avec un pouvoir donné
(plateforme très haute → saut amélioré/vol). **C'est le cœur du gating.**
Mondes voulus **très grands en largeur ET hauteur** (esprit Sonic / Donkey Kong + grandes
zones d'escalade).

### Économie & boutique
Deux monnaies : **pièces** (communes) et **cristaux** (rares). Boutique au hub : surtout des
**améliorations permanentes** (saut plus haut, vie max, dégâts, **nombre de sauts** double→triple→…,
**stock/recharge/cadence des shurikens**…). Plus tard : consommables, objets de quête.

### Histoire
Quête principale simple (compréhensible à 8 ans), jalonnée par les maîtrises, boss final.

## Direction artistique
Maquette = placeholders lisibles. Cible : rendu coloré/chaleureux (dessiné-main ou vectoriel),
personnages **fins et agiles** façon *Ninja Legends*, vraies animations (attaque, mort…).
**À valider dans une passe artistique dédiée** (rien n'est figé côté visuel pour l'instant).

## Technique
Voir [`../CLAUDE.md`](../CLAUDE.md) (lancement, architecture, conventions). Points clés :
Matter.js, mouvement kinématique, pentes par la tangente, entrées abstraites (tactile mobile
plus tard), persistance `localStorage`, réglages centralisés dans `core/Constants.js`.

## Jalons
- **M0 — Sensations de plateforme** ✅ : course, saut, **double-saut**, coyote time, jump buffering,
  hauteur de saut variable, pentes (deux sens), verticalité, **grand niveau non-linéaire**,
  caméra qui anticipe (X et Y).
- **M1 — Collecte & HUD** ✅ : pièces + cristaux (mix sol/air), HUD, persistance localStorage.
- **M2 — Combat de base** ✅ : ennemis (walker + charger télégraphié, PV, se traversent),
  attaque melee (J/X) + shuriken (K/L, **stock régénératif**), vie en cœurs, dégâts +
  invincibilité + recul, réapparition.
- **M3 — Hub-village + boutique** ⏳ : hub jouable, boutique d'améliorations (en pièces),
  portes vers des niveaux.
- **M4 — Portes & gating** : 3 types de portes ; porte à épreuve verrouillée par compétence ;
  transitions de scène.
- **M5 — Premier boss** : grande barre de vie, pattern simple, récompense (skin).
- **M6 — Personnages & maîtrises** : 2e héros, changement de perso, pouvoir débloquant une zone.
- **Plus tard** : multi-mondes & carte, énigmes, segments de vol (nuage/dragon), contrôles
  tactiles mobile, vrai art, son, équilibrage, narration. (Détails dans `BACKLOG.md`.)

## Vérification
Pas de tests auto au stade maquette : validation manuelle au navigateur (`npm run dev`) +
`npm run build` qui doit passer. Le ressenti est validé par l'utilisateur.
