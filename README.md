<div align="center">
  
# ⚡ ChromaFlash

**L'Enfer du Perfectionniste. Un jeu de rythme, de couleurs et d'obsessions.**

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

[Jouer à ChromaFlash](https://papierfroisse.github.io/chromaflash/)

</div>

---

## 🎮 À Propos du Jeu

ChromaFlash est une collection de mini-jeux web ultrarapides conçus pour tester vos limites de perception visuelle et votre tolérance à la frustration. Inspiré par l'esprit chaotique de *WarioWare* et sublimé par une Direction Artistique "Clinical Arcade" (Neuro-brutalisme), ce jeu ne vous laissera aucun répit.

Des couleurs impossibles à différencier, des cadres légèrement penchés, des horloges décalées d'un millimètre... Saurez-vous obtenir le **Rang S** ?

### 🔥 Modes de Jeu

- **Mega Mode (Le Flash)** : Tous les mini-jeux s'enchaînent de plus en plus vite. Vous avez 3 vies. Survivrez-vous ?
- **Mode Entraînement (Chill)** : Pratiquez chaque mini-jeu individuellement sans la pression du chrono. Idéal pour s'entraîner.
  - *Pixel Perfect*, *Typo Rush*, *Le Cadre*, *L'Horloge*, *Le Volume*, etc.
- **Daily Challenge** : Une couleur, un essai. Défiez le monde entier avec la couleur du jour.

---

## 🛠️ Technologies & Direction Artistique

Ce projet est développé en **pur Vanilla HTML/CSS/JS** sans aucun framework, afin de garantir des performances maximales et un chargement instantané.

**Fonctionnalités avancées utilisées :**
- **View Transitions API** : Navigations cinématiques fluides entre les menus et le jeu, semblables à une application native.
- **CSS Spring Physics** : Animations de rebond ultra-organiques basées sur des courbes `linear()` complexes.
- **Pseudo-3D & Tilt** : Cartes et boutons interactifs réagissant à la position de la souris.
- **Haptic Feedback API** : Vibrations physiques du smartphone lors d'une erreur (carreau mal posé, mauvais volume...).
- **Web Audio API** : Synthétiseurs générés à la volée (pas de fichiers mp3 lourds) pour les effets sonores de dopamine et de frustration.

---

## 🚀 Installation & Lancement Local

Aucun processus de build lourd n'est nécessaire ! 

1. **Cloner le repo** :
   ```bash
   git clone https://github.com/papierfroisse/chromaflash.git
   ```
2. **Lancer un serveur local** (ex: avec Python ou Node) :
   ```bash
   cd chromaflash
   npx serve .
   # ou avec Python : python -m http.server 3000
   ```
3. Ouvrez votre navigateur sur `http://localhost:3000`.

---

## 🤝 Contribuer

Vous avez une idée pour un mini-jeu encore plus frustrant ? Vous voulez améliorer une animation ?
Lisez notre [Guide de Contribution (CONTRIBUTING.md)](CONTRIBUTING.md) pour savoir comment proposer vos modifications !

---

<div align="center">
  <i>"C'est presque parfait... mais presque n'est pas suffisant."</i>
</div>
