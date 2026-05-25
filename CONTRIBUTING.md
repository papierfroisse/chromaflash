# Guide de Contribution 🛠️

Bienvenue dans le projet **ChromaFlash** ! Nous sommes ravis que vous souhaitiez contribuer à rendre ce jeu encore plus frustrant et parfait.

## Workflow de Contribution

1. **Forkez** le projet.
2. **Créez une branche** pour votre fonctionnalité (`git checkout -b feature/nouveau-minijeu`).
3. **Développez** votre fonctionnalité en respectant la Direction Artistique (DA) "Clinical Arcade".
4. **Testez** vos modifications en local (le projet est du pur Vanilla JS/HTML/CSS, aucun build requis).
5. **Commitez** vos changements en respectant les [Conventional Commits](https://www.conventionalcommits.org/).
   - `feat:` pour une nouvelle fonctionnalité.
   - `fix:` pour une correction de bug.
   - `style:` pour des modifications visuelles.
   - `refactor:` pour du nettoyage de code.
6. **Poussez** vers la branche (`git push origin feature/nouveau-minijeu`).
7. Ouvrez une **Pull Request** (PR).

## Règles de la Direction Artistique (Clinical Arcade)

- **UI & Animations** : Utilisez les utilitaires de `design.css` et `animations.css`. Tous les nouveaux boutons doivent inclure la classe `.tilt-card` pour l'effet 3D.
- **Haptique** : N'oubliez pas d'utiliser `Sound.wrong()` et `triggerScreenShake()` lorsque le joueur fait une erreur pour déclencher la vibration mobile.
- ** Vanilla Focus** : Nous n'utilisons aucun framework (React, Vue) ni bundler complexe. Le code doit rester lisible par les navigateurs modernes nativement (ES Modules).

Merci de nous aider à construire l'enfer du perfectionniste ! 😈
