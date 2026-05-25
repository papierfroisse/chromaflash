// ─── FRUSTRATION & WARIOWARE ENGINE ────────────────────────────────────────

export class WarioEngine {
  constructor(onRoundStart, onRoundEnd, onGameOver) {
    this.round = 0;
    this.lives = 3;
    this.score = 0;
    this.baseTimeMs = 5000;
    
    this.onRoundStart = onRoundStart; // function(round, timeMs)
    this.onRoundEnd = onRoundEnd;     // function()
    this.onGameOver = onGameOver;     // function(score)
    
    this.timerId = null;
    this.startTime = 0;
    this.currentTimeMs = 0;
  }

  // Affiche un texte géant qui flashe à l'écran
  flashText(text, duration = 800) {
    return new Promise(resolve => {
      let overlay = document.getElementById('wario-flash-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'wario-flash-overlay';
        overlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(17,17,17,0.95); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 15vw; font-weight: 900; text-transform: uppercase;
          z-index: 9999; font-family: 'Inter', sans-serif;
          letter-spacing: -0.05em; text-align: center;
          opacity: 0; pointer-events: none; transition: opacity 0.1s;
        `;
        document.body.appendChild(overlay);
      }
      
      overlay.textContent = text;
      // Force reflow
      void overlay.offsetWidth;
      overlay.style.opacity = '1';
      
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(resolve, 150); // wait for fade out
      }, duration);
    });
  }

  startNextRound() {
    this.round++;
    // Temps diminue au fil des rounds. Min 1.5s
    this.currentTimeMs = Math.max(1500, this.baseTimeMs - (this.round * 250));
    
    this.flashText(this.round === 1 ? "PRÊT ?" : "PLUS VITE !").then(() => {
      this.startTime = Date.now();
      this.onRoundStart(this.round, this.currentTimeMs);
      
      this.timerId = setTimeout(() => {
        this.failRound(true); // timeout
      }, this.currentTimeMs);
    });
  }

  winRound() {
    clearTimeout(this.timerId);
    this.score += 100 * this.round;
    this.onRoundEnd();
    
    // Feedback vert très rapide
    this.flashText("OUI !", 400).then(() => {
      this.startNextRound();
    });
  }

  failRound(isTimeout = false) {
    clearTimeout(this.timerId);
    this.lives--;
    this.onRoundEnd();

    const msg = isTimeout ? "TROP LENT" : "NON !";
    
    if (this.lives <= 0) {
      this.flashText("GAME OVER", 1500).then(() => {
        this.onGameOver(this.score, this.round);
      });
    } else {
      // Effet rouge agressif
      document.body.style.backgroundColor = '#F87171';
      setTimeout(() => document.body.style.backgroundColor = '', 200);
      
      this.flashText(msg, 600).then(() => {
        this.startNextRound();
      });
    }
  }
}
