
  import {
    randomColor, rgbToHex, hexToRgb, rgbToLab, deltaE00, hslToRgb, rgbToHsl,
    findClosestColorName, getColorCandidates, computeScore
  } from '../assets/js/color.js';
  import { TYPO_FONTS, getRandomFonts } from '../assets/js/typo.js';
  import { getDistance, computePixelScore } from '../assets/js/composition.js';
  import {
    getSettings, getSwatchBgColor, Sound, animateCounter,
    showToast, launchConfetti, playSoundForScore, copyScore,
    triggerScreenShake, triggerScreenFlash
  } from '../assets/js/ui.js';
  import { getGlobalStats, saveProfileStats } from '../assets/js/score.js';

  const settings = getSettings();

  // ─── MINI GAME DEFINITIONS ────────────────────────────────────
  const MINI_GAMES = [
    { id:'spot',       name:'SPOT IT',       icon:'👁️',  maxPts: 1000, time: 8,  axis: 'color', verb: 'TROUVE !' },
    { id:'name',       name:'NAME RUSH',     icon:'🏷️',  maxPts: 1000, time: 8,  axis: 'color', verb: 'NOMME !' },
    { id:'hex',        name:'HEX BLITZ',     icon:'💻',  maxPts: 1000, time: 10, axis: 'color', verb: 'CODE !' },
    { id:'snap',       name:'RGB SNAP',      icon:'🎚️',  maxPts: 1000, time: 12, axis: 'color', verb: 'AJUSTE !' },
    { id:'warmcool',   name:'CHAUD OU FROID',icon:'🌡️',  maxPts: 1000, time: 5,  axis: 'color', verb: 'TÂTE !' },
    { id:'complement', name:'COMPLÉMENT',    icon:'🔵',  maxPts: 1000, time: 8,  axis: 'color', verb: 'INVERSE !' },
    { id:'dark',       name:'+ SOMBRE',      icon:'🌑',  maxPts: 1000, time: 6,  axis: 'color', verb: 'SOMBRE !' },
    { id:'match',      name:'PERFECT MATCH', icon:'🎯',  maxPts: 1000, time: 12, axis: 'color', verb: 'ÉGALE !' },
    { id:'typo',       name:'TYPO RUSH',     icon:'🔤',  maxPts: 1000, time: 8,  axis: 'typo', verb: 'LIS !' },
    { id:'boss',       name:'LE NETTOYAGE',  icon:'🧹',  maxPts: 2000, time: 12, axis: 'perception', verb: 'PURGE !' },
    { id:'pixel',      name:'PIXEL PERFECT', icon:'📐',  maxPts: 1000, time: 8,  axis: 'precision', verb: 'MESURE !' },
    { id:'carreau',    name:'LE CARREAU',    icon:'😤',  maxPts: 1000, time: 5,  axis: 'perception', verb: 'NETTOIE !' },
    { id:'horloge',    name:'L\'HORLOGE',    icon:'⏱️',  maxPts: 1000, time: 6,  axis: 'perception', verb: 'ATTENDS !' },
    { id:'volume',     name:'LE VOLUME',     icon:'📺',  maxPts: 1000, time: 5,  axis: 'rhythm', verb: 'RÈGLE !' },
    { id:'cadre',      name:'LE CADRE',      icon:'🖼️',  maxPts: 1000, time: 6,  axis: 'precision', verb: 'REDRESSE !' },
    { id:'crenage',    name:'LE CRÉNAGE',    icon:'🆎',  maxPts: 1000, time: 8,  axis: 'typo', verb: 'ESPACE !' },
    { id:'padding',    name:'LA MARGE',      icon:'📦',  maxPts: 1000, time: 8,  axis: 'precision', verb: 'CENTRE !' },
    { id:'contraste',  name:'LE CONTRASTE',  icon:'👁️',  maxPts: 1000, time: 8,  axis: 'color', verb: 'ÉCLAIRE !' },
    { id:'gratte',     name:'LE GRATTE-GRATTE',icon:'🪙',maxPts: 1000, time: 8,  axis: 'perception', verb: 'EFFACE !' },
    { id:'focus',      name:'LA MISE AU POINT',icon:'📸',maxPts: 1000, time: 8,  axis: 'perception', verb: 'FOCALISE !' },
    { id:'glitch',     name:'LE GLITCH',     icon:'📺',  maxPts: 1000, time: 10, axis: 'perception', verb: 'RÉPARE !' },
    { id:'ratio',      name:'LE RATIO',      icon:'📐',  maxPts: 1000, time: 8,  axis: 'perception', verb: 'DEVINE !' },
    { id:'boss',       name:'LA SÉCURITÉ',   icon:'🛡️',  maxPts: 2000, time: 12, axis: 'perception', verb: 'PURGE !' },
    { id:'saut',       name:'LE GRAND SAUT', icon:'🍄',  maxPts: 1000, time: 15, axis: 'rhythm', verb: 'ESQUIVE !' },
    { id:'plaque',     name:'LA PLAQUE',     icon:'🏎️',  maxPts: 1000, time: 8,  axis: 'perception', verb: 'MÉMORISE !' },
    { id:'alignement', name:'L\'ALIGNEMENT', icon:'📏',  maxPts: 1000, time: 6,  axis: 'precision', verb: 'STOPPE !' },
  ];

  // Pre-load Typo Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?' + TYPO_FONTS.map(f => `family=${f.import}`).join('&') + '&display=swap';
  document.head.appendChild(fontLink);

  // Speed scaling: each game is faster
  let mgIndex = 0;
  let totalPts = 0;
  let gameScores = [];
  let timerInterval = null;
  let secondsLeft = 0;
  let canAnswer = true;
  let lives = 3;

  const gameArea = document.getElementById('game-area');
  const timerFill = document.getElementById('timer-fill');
  const timerText = document.getElementById('timer-text');
  const timerWrapper = document.getElementById('timer-wrapper');
  const totalPtsEl = document.getElementById('total-pts');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');
  const livesUI = document.getElementById('lives-ui');

  function updateLives() {
    livesUI.innerHTML = '';
    for(let i=0; i<3; i++) {
      livesUI.innerHTML += i < lives ? '❤️' : '🖤';
    }
  }

  // ─── GAME FLOW ────────────────────────────────────────────────
  function startGame() {
    mgIndex = 0; totalPts = 0; gameScores = [];
    lives = 3;
    updateLives();
    document.getElementById('final-screen').classList.remove('show');
    gameArea.style.display = 'flex';
    showTransition(0, () => playMiniGame(0));
  }

  function showTransition(idx, cb) {
    const overlay = document.getElementById('flash-overlay');
    const numEl = document.getElementById('overlay-num');
    const nameEl = document.getElementById('overlay-name');
    const verbEl = document.getElementById('overlay-verb');
    const scoreEl = document.getElementById('overlay-score');

    scoreEl.style.display = 'none';
    numEl.textContent = idx + 1;
    nameEl.textContent = MINI_GAMES[idx].icon + ' ' + MINI_GAMES[idx].name;
    verbEl.textContent = MINI_GAMES[idx].verb || 'GO !';

    // If previous score
    if (idx > 0 && gameScores[idx-1] !== undefined) {
      scoreEl.style.display = 'block';
      scoreEl.textContent = '+' + gameScores[idx-1];
    }

    overlay.classList.add('show');
    Sound.swoosh();
    Sound.speakVerb(MINI_GAMES[idx].verb || 'GO');
    
    setTimeout(() => {
      overlay.classList.remove('show');
      cb();
    }, 700);
  }

  function playMiniGame(idx) {
    if (idx >= MINI_GAMES.length) { showFinal(); return; }
    const mg = MINI_GAMES[idx];
    progressFill.style.width = `${((idx) / MINI_GAMES.length) * 100}%`;
    progressLabel.textContent = `${idx+1}/${MINI_GAMES.length}`;
    canAnswer = true;

    // Speed scales with index
    const timeScale = Math.max(0.6, 1 - idx * 0.05);
    const time = Math.round(mg.time * timeScale);

    // Build mini game
    gameArea.innerHTML = '';
    const builders = {
      spot:       buildSpot,
      name:       buildName,
      hex:        buildHex,
      snap:       buildSnap,
      warmcool:   buildWarmCool,
      complement: buildComplement,
      dark:       buildDark,
      match:      buildMatch,
      typo:       buildTypo,
      pixel:      buildPixel,
      carreau:    buildCarreau,
      horloge:    buildHorloge,
      volume:     buildVolume,
      cadre:      buildCadre,
      crenage:    buildCrenage,
      padding:    buildPadding,
      contraste:  buildContraste,
      ratio:      buildRatio,
      saut:       buildSaut,
      plaque:     buildPlaque,
      alignement: buildAlignement,
      boss:       buildBoss,
      gratte:     buildGratte,
      focus:      buildFocus,
      glitch:     buildGlitch,
    };
    builders[mg.id](mg, time);

    Sound.playBGM(timeScale);
    startTimer(time);
  }

  function startTimer(seconds) {
    clearInterval(timerInterval);
    secondsLeft = seconds;
    const CIRC = 138.23;
    timerFill.style.strokeDashoffset = 0;
    timerText.textContent = seconds;
    timerWrapper.classList.remove('timer-urgent');

    timerInterval = setInterval(() => {
      secondsLeft--;
      const progress = secondsLeft / seconds;
      timerFill.style.strokeDashoffset = CIRC * (1 - progress);
      timerText.textContent = secondsLeft;

      if (progress < 0.4) timerFill.style.stroke = '#F87171';
      else if (progress < 0.6) timerFill.style.stroke = '#FBBF24';
      else timerFill.style.stroke = 'var(--accent)';

      if (secondsLeft <= 3) timerWrapper.classList.add('timer-urgent');
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        if (canAnswer) { canAnswer = false; onMiniGameEnd(0); }
      }
    }, 1000);
  }

  function onMiniGameEnd(score) {
    clearInterval(timerInterval);
    const mg = MINI_GAMES[mgIndex];
    gameScores.push(score);
    totalPts += score;
    animateCounter(totalPtsEl, totalPts - score, totalPts, 400);
    playSoundForScore(score, mg.maxPts);
    saveProfileStats(mg.axis, score, mg.maxPts);
    
    if (score === 0) {
      lives--;
      updateLives();
      if (lives > 0) Sound.loseLife();
      triggerScreenShake();
    } else if (mg.id === 'boss') {
      if (lives < 3) {
        lives++;
        updateLives();
        setTimeout(() => Sound.levelUp(), 500);
      }
    }

    if (lives <= 0) {
      Sound.stopBGM();
      Sound.gameOver();
      showFinal();
      return;
    }

    mgIndex++;

    setTimeout(() => {
      if (mgIndex < MINI_GAMES.length) {
        showTransition(mgIndex, () => playMiniGame(mgIndex));
      } else {
        Sound.stopBGM();
        showFinal();
      }
    }, 500);
  }

  // ─── MINI-GAME 1: SPOT IT ─────────────────────────────────────
  function buildSpot(mg, time) {
    const base = randomColor(settings.difficulty);
    // Generate odd one out: slightly shifted
    const deltaTarget = settings.difficulty === 'easy' ? 15 : settings.difficulty === 'hard' ? 4 : 8;
    const oddIdx = Math.floor(Math.random() * 9);

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-lg">Clique sur le carré qui est <strong>légèrement différent</strong> des autres.</p>
      <div class="spot-grid" id="spot-grid"></div>
    `;
    gameArea.appendChild(card);

    const grid = document.getElementById('spot-grid');
    for (let i = 0; i < 9; i++) {
      const isOdd = i === oddIdx;
      let r, g, b;
      if (isOdd) {
        // Generate a color close but slightly different
        const hsl = rgbToHsl(base);
        const shift = deltaTarget * (Math.random() > 0.5 ? 1 : -1);
        r = Math.max(0, Math.min(255, base.r + Math.round(shift)));
        g = Math.max(0, Math.min(255, base.g + Math.round(shift * 0.7)));
        b = Math.max(0, Math.min(255, base.b + Math.round(shift * 0.5)));
      } else {
        // Small jitter for "same" cells
        const j = 2;
        r = Math.max(0, Math.min(255, base.r + Math.round((Math.random()-0.5)*j)));
        g = Math.max(0, Math.min(255, base.g + Math.round((Math.random()-0.5)*j)));
        b = Math.max(0, Math.min(255, base.b + Math.round((Math.random()-0.5)*j)));
      }
      const cell = document.createElement('div');
      cell.className = 'spot-cell';
      cell.style.backgroundColor = `rgb(${r},${g},${b})`;
      cell.dataset.idx = i;
      cell.addEventListener('click', () => {
        if (!canAnswer) return;
        canAnswer = false;
        if (isOdd) {
          cell.classList.add('correct');
          Sound.good();
          onMiniGameEnd(mg.maxPts);
        } else {
          cell.classList.add('wrong');
          document.querySelectorAll('.spot-cell')[oddIdx].classList.add('correct');
          Sound.wrong();
          onMiniGameEnd(0);
        }
      });
      grid.appendChild(cell);
    }
  }

  // ─── MINI-GAME 2: NAME RUSH ────────────────────────────────────
  function buildName(mg, time) {
    const target = randomColor(settings.difficulty);
    const { choices, correct } = getColorCandidates(target, 4);
    const swatchBg = getSwatchBgColor();

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary">Quel est le nom de cette couleur ?</p>
      <div style="display:flex;justify-content:center;margin:16px 0">
        <div style="background:${swatchBg};padding:16px;border-radius:12px">
          <div style="width:120px;height:80px;background:rgb(${target.r},${target.g},${target.b});border-radius:8px"></div>
        </div>
      </div>
      <div class="name-choices" id="name-choices"></div>
    `;
    gameArea.appendChild(card);

    const container = document.getElementById('name-choices');
    choices.forEach(name => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = name;
      btn.style.fontFamily = 'Space Mono, monospace';
      btn.addEventListener('click', () => {
        if (!canAnswer) return;
        canAnswer = false;
        const isCorrect = name === correct;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          container.querySelectorAll('.choice-btn').forEach(b => {
            if (b.textContent === correct) b.classList.add('correct');
          });
        }
        if (isCorrect) { Sound.good(); onMiniGameEnd(mg.maxPts); }
        else { Sound.wrong(); onMiniGameEnd(0); }
      });
      container.appendChild(btn);
    });
  }

  // ─── MINI-GAME 3: HEX BLITZ ────────────────────────────────────
  function buildHex(mg, time) {
    const target = randomColor(settings.difficulty);
    const hex = rgbToHex(target).toUpperCase();
    let phase = 'show'; // show → hidden → input

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary" id="hex-instruction">Mémorise ce code HEX !</p>
      <div id="hex-show-phase">
        <div style="display:flex;justify-content:center;margin:12px 0">
          <div style="background:${getSwatchBgColor()};padding:12px;border-radius:10px">
            <div style="width:100px;height:60px;background:rgb(${target.r},${target.g},${target.b});border-radius:8px"></div>
          </div>
        </div>
        <div class="hex-show" style="color:rgb(${target.r},${target.g},${target.b})">${hex}</div>
        <div class="text-center text-secondary text-sm" id="show-countdown">Mémorise dans <strong id="sc">3</strong>s…</div>
      </div>
      <div id="hex-input-phase" style="display:none">
        <input type="text" class="input input-mono mt-lg" id="hex-recall" placeholder="#??????" maxlength="7" autocomplete="off">
        <button class="btn btn-primary w-full mt-md" id="hex-submit">VALIDER</button>
      </div>
    `;
    gameArea.appendChild(card);

    // Countdown before hiding
    let countdown = 3;
    clearInterval(timerInterval);
    timerText.textContent = '…';
    const showTimer = setInterval(() => {
      countdown--;
      const scEl = document.getElementById('sc');
      if (scEl) scEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(showTimer);
        document.getElementById('hex-show-phase').style.display = 'none';
        document.getElementById('hex-input-phase').style.display = 'block';
        document.getElementById('hex-instruction').textContent = 'Retape le code HEX de mémoire !';
        document.getElementById('hex-recall').focus();
        startTimer(time);
      }
    }, 1000);

    document.getElementById('hex-submit').addEventListener('click', () => {
      if (!canAnswer) return;
      let val = document.getElementById('hex-recall').value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      const userRgb = hexToRgb(val);
      if (!userRgb) { showToast('HEX invalide', 'error'); return; }
      canAnswer = false;
      const { score } = computeScore(target, userRgb, mg.maxPts);
      if (score >= mg.maxPts * 0.8) Sound.good(); else Sound.wrong();
      onMiniGameEnd(score);
    });
  }

  // ─── MINI-GAME 4: RGB SNAP ────────────────────────────────────
  function buildSnap(mg, time) {
    const target = randomColor(settings.difficulty);

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Ajuste les curseurs pour approcher la couleur cible.</p>
      <div style="display:flex;justify-content:center;margin-bottom:12px">
        <div style="background:${getSwatchBgColor()};padding:12px;border-radius:10px">
          <div style="width:120px;height:60px;background:rgb(${target.r},${target.g},${target.b});border-radius:8px"></div>
        </div>
      </div>
      <div class="snap-sliders">
        <div class="slider-track">
          <div class="slider-label-row"><span class="slider-label" style="color:#F87171">R</span><span id="sv-r" class="slider-value">128</span></div>
          <input type="range" id="sn-r" min="0" max="255" value="128" style="--track-bg:linear-gradient(to right,#111,#F87171)">
        </div>
        <div class="slider-track">
          <div class="slider-label-row"><span class="slider-label" style="color:#6BCB77">G</span><span id="sv-g" class="slider-value">128</span></div>
          <input type="range" id="sn-g" min="0" max="255" value="128" style="--track-bg:linear-gradient(to right,#111,#6BCB77)">
        </div>
        <div class="slider-track">
          <div class="slider-label-row"><span class="slider-label" style="color:#4D96FF">B</span><span id="sv-b" class="slider-value">128</span></div>
          <input type="range" id="sn-b" min="0" max="255" value="128" style="--track-bg:linear-gradient(to right,#111,#4D96FF)">
        </div>
      </div>
      <div class="snap-preview" id="sn-preview" style="background:rgb(128,128,128)"></div>
      <button class="btn btn-primary w-full mt-md" id="sn-submit">VALIDER</button>
    `;
    gameArea.appendChild(card);

    ['r','g','b'].forEach(ch => {
      const sl = document.getElementById(`sn-${ch}`);
      sl.addEventListener('input', () => {
        document.getElementById(`sv-${ch}`).textContent = sl.value;
        const r = +document.getElementById('sn-r').value;
        const g = +document.getElementById('sn-g').value;
        const b = +document.getElementById('sn-b').value;
        document.getElementById('sn-preview').style.backgroundColor = `rgb(${r},${g},${b})`;
      });
    });

    document.getElementById('sn-submit').addEventListener('click', () => {
      if (!canAnswer) return;
      canAnswer = false;
      const userRgb = {
        r: +document.getElementById('sn-r').value,
        g: +document.getElementById('sn-g').value,
        b: +document.getElementById('sn-b').value,
      };
      const { score } = computeScore(target, userRgb, mg.maxPts);
      if (score >= mg.maxPts * 0.7) Sound.good(); else Sound.wrong();
      onMiniGameEnd(score);
    });
  }

  // ─── MINI-GAME 5: WARM OR COOL ────────────────────────────────
  function buildWarmCool(mg, time) {
    // Generate a color with clear warm/neutral/cool tendency
    const types = ['warm','neutral','cool'];
    const type = types[Math.floor(Math.random() * 3)];
    let target;
    if (type === 'warm') {
      // High R, lower B
      target = { r: 160+Math.floor(Math.random()*80), g: 80+Math.floor(Math.random()*80), b: 20+Math.floor(Math.random()*60) };
    } else if (type === 'cool') {
      target = { r: 20+Math.floor(Math.random()*60), g: 80+Math.floor(Math.random()*80), b: 160+Math.floor(Math.random()*80) };
    } else {
      const v = 100+Math.floor(Math.random()*100);
      target = { r:v+Math.floor(Math.random()*20), g:v+Math.floor(Math.random()*20), b:v+Math.floor(Math.random()*20) };
    }

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary">Cette couleur est-elle <strong>chaude, neutre ou froide</strong> ?</p>
      <div style="display:flex;justify-content:center;margin:16px 0">
        <div style="background:${getSwatchBgColor()};padding:16px;border-radius:12px">
          <div style="width:140px;height:90px;background:rgb(${target.r},${target.g},${target.b});border-radius:10px"></div>
        </div>
      </div>
      <div class="wc-choices">
        <button class="choice-btn" data-type="warm" style="border-color:rgba(255,107,107,0.3)">🔴 Chaud</button>
        <button class="choice-btn" data-type="neutral">⚪ Neutre</button>
        <button class="choice-btn" data-type="cool" style="border-color:rgba(77,150,255,0.3)">🔵 Froid</button>
      </div>
    `;
    gameArea.appendChild(card);

    document.querySelectorAll('.wc-choices .choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!canAnswer) return;
        canAnswer = false;
        const isCorrect = btn.dataset.type === type;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          document.querySelector(`.wc-choices [data-type="${type}"]`).classList.add('correct');
        }
        if (isCorrect) { Sound.good(); onMiniGameEnd(mg.maxPts); }
        else { Sound.wrong(); onMiniGameEnd(0); }
      });
    });
  }

  // ─── MINI-GAME 6: COMPLEMENT ──────────────────────────────────
  function buildComplement(mg, time) {
    const target = randomColor(settings.difficulty);
    const hsl = rgbToHsl(target);
    const compHsl = { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l };
    const compRgb = hslToRgb(compHsl);

    // Generate wrong options
    const wrong1 = hslToRgb({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l });
    const wrong2 = hslToRgb({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l });
    const wrong3 = hslToRgb({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l });

    const options = [
      { rgb: compRgb, correct: true },
      { rgb: wrong1, correct: false },
      { rgb: wrong2, correct: false },
      { rgb: wrong3, correct: false },
    ].sort(() => Math.random() - 0.5);

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Quelle est la couleur <strong>complémentaire</strong> ?</p>
      <div style="display:flex;justify-content:center;margin-bottom:16px">
        <div style="background:${getSwatchBgColor()};padding:12px;border-radius:10px">
          <div style="width:100px;height:60px;background:rgb(${target.r},${target.g},${target.b});border-radius:8px"></div>
        </div>
      </div>
      <div class="complement-choices" id="comp-choices"></div>
    `;
    gameArea.appendChild(card);

    const container = document.getElementById('comp-choices');
    options.forEach(opt => {
      const cell = document.createElement('div');
      cell.className = 'complement-cell';
      cell.style.backgroundColor = `rgb(${opt.rgb.r},${opt.rgb.g},${opt.rgb.b})`;
      cell.addEventListener('click', () => {
        if (!canAnswer) return;
        canAnswer = false;
        cell.classList.add(opt.correct ? 'correct' : 'wrong');
        if (!opt.correct) {
          container.querySelectorAll('.complement-cell').forEach(c => {
            if (options.find(o => o.correct && `rgb(${o.rgb.r},${o.rgb.g},${o.rgb.b})` === c.style.backgroundColor)) {
              c.classList.add('correct');
            }
          });
        }
        if (opt.correct) { Sound.good(); onMiniGameEnd(mg.maxPts); }
        else { Sound.wrong(); onMiniGameEnd(0); }
      });
      container.appendChild(cell);
    });
  }

  // ─── MINI-GAME 7: DARKER OR LIGHTER ───────────────────────────
  function buildDark(mg, time) {
    const base = randomColor(settings.difficulty);
    const hsl = rgbToHsl(base);
    const diff = settings.difficulty === 'easy' ? 20 : settings.difficulty === 'hard' ? 5 : 10;
    const darkerL = Math.max(5, hsl.l - diff);
    const lighterL = Math.min(95, hsl.l + diff);
    const darkRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: darkerL });
    const lightRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: lighterL });
    const swapped = Math.random() > 0.5;
    const leftRgb = swapped ? lightRgb : darkRgb;
    const rightRgb = swapped ? darkRgb : lightRgb;
    const correctSide = swapped ? 'right' : 'left'; // which side is darker

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Clique sur la couleur la plus <strong>sombre</strong>.</p>
      <div class="dl-pair">
        <div class="dl-cell" id="dl-left" style="background:rgb(${leftRgb.r},${leftRgb.g},${leftRgb.b})"></div>
        <div class="dl-cell" id="dl-right" style="background:rgb(${rightRgb.r},${rightRgb.g},${rightRgb.b})"></div>
      </div>
    `;
    gameArea.appendChild(card);

    ['left','right'].forEach(side => {
      document.getElementById(`dl-${side}`).addEventListener('click', () => {
        if (!canAnswer) return;
        canAnswer = false;
        const isCorrect = side === correctSide;
        document.getElementById(`dl-${side}`).classList.add(isCorrect ? 'correct' : 'wrong');
        document.getElementById(`dl-${correctSide}`).classList.add('correct');
        if (isCorrect) { Sound.good(); onMiniGameEnd(mg.maxPts); }
        else { Sound.wrong(); onMiniGameEnd(0); }
      });
    });
  }

  // ─── MINI-GAME 8: PERFECT MATCH ──────────────────────────────
  function buildMatch(mg, time) {
    const target = randomColor(settings.difficulty);

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Reproduis cette couleur le plus précisément possible !</p>
      <div style="display:flex;justify-content:center;margin-bottom:12px">
        <div style="background:${getSwatchBgColor()};padding:12px;border-radius:10px">
          <div style="width:120px;height:70px;background:rgb(${target.r},${target.g},${target.b});border-radius:8px"></div>
        </div>
      </div>
      <div class="pm-input-wrap">
        <input type="text" class="input input-mono" id="pm-hex" placeholder="#HEX (ex: #FF5733)" maxlength="7" autocomplete="off">
      </div>
      <button class="btn btn-primary w-full mt-md" id="pm-submit">VALIDER</button>
    `;
    gameArea.appendChild(card);

    document.getElementById('pm-submit').addEventListener('click', () => {
      if (!canAnswer) return;
      let val = document.getElementById('pm-hex').value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      const userRgb = hexToRgb(val);
      if (!userRgb) { showToast('HEX invalide !', 'error'); return; }
      canAnswer = false;
      const { score } = computeScore(target, userRgb, mg.maxPts);
      if (score >= mg.maxPts * 0.8) Sound.good(); else Sound.wrong();
      onMiniGameEnd(score);
    });
  }

  // ─── MINI-GAME 9: TYPO RUSH ───────────────────────────────────
  function buildTypo(mg, time) {
    const PANGRAMS = [
      "Portez ce vieux whisky au juge blond qui fume.",
      "Voyez le brick géant que j'examine près du wharf.",
      "The quick brown fox jumps over the lazy dog.",
      "Pack my box with five dozen liquor jugs."
    ];
    
    const choices = getRandomFonts(4);
    const target = choices[Math.floor(Math.random() * 4)];
    const pangram = PANGRAMS[Math.floor(Math.random() * PANGRAMS.length)];

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Quelle est la police de ce texte ?</p>
      
      <div style="background:var(--bg-void); border-radius:12px; padding:30px 20px; text-align:center; margin-bottom:20px; box-shadow:var(--shadow-inner);">
        <div style="font-family:'${target.name}', ${target.category}; font-size:1.8rem; line-height:1.2;">
          ${pangram}
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px" id="typo-choices"></div>
    `;
    gameArea.appendChild(card);

    const container = document.getElementById('typo-choices');
    choices.forEach(font => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = font.name;
      btn.style.fontSize = '1.1rem';
      btn.style.padding = '15px 10px';
      
      btn.addEventListener('click', () => {
        if (!canAnswer) return;
        canAnswer = false;
        const isCorrect = font.name === target.name;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        
        if (!isCorrect) {
          Array.from(container.children).forEach(b => {
            if (b.textContent === target.name) b.classList.add('correct');
          });
        }
        
        if (isCorrect) { Sound.good(); onMiniGameEnd(mg.maxPts); }
        else { Sound.wrong(); onMiniGameEnd(0); }
      });
      container.appendChild(btn);
    });
  }

  // ─── MINI-GAME 10: PIXEL PERFECT ──────────────────────────────
  function buildPixel(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Glisse le carré EXACTEMENT dans la cible pointillée !</p>
      
      <div style="position:relative; width:100%; height:150px; background:var(--bg-void); border-radius:12px; overflow:hidden;" id="pp-canvas">
        <div id="pp-target" style="position:absolute; width:40px; height:40px; border:2px dashed rgba(255,255,255,0.4); pointer-events:none;"></div>
        <div id="pp-box" style="position:absolute; width:40px; height:40px; background:var(--accent); cursor:grab; display:flex; align-items:center; justify-content:center; border-radius:8px; z-index:10;">🎯</div>
      </div>
      <button class="btn btn-primary w-full mt-md" id="pp-submit">VALIDER</button>
    `;
    gameArea.appendChild(card);

    const canvas = document.getElementById('pp-canvas');
    const target = document.getElementById('pp-target');
    const box = document.getElementById('pp-box');
    
    requestAnimationFrame(() => {
      const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
      const bw = 40, bh = 40;
      
      const tx = Math.random() * (cw - bw);
      const ty = Math.random() * (ch - bh);
      target.style.left = tx + 'px';
      target.style.top = ty + 'px';
      
      let bx, by;
      do {
        bx = Math.random() * (cw - bw);
        by = Math.random() * (ch - bh);
      } while(getDistance(bx, by, tx, ty) < 50);
      
      box.style.left = bx + 'px';
      box.style.top = by + 'px';

      let isDragging = false;
      let sx, sy, startBx, startBy;

      function onMove(e) {
        if(!isDragging) return;
        e.preventDefault();
        const mx = e.clientX || (e.touches && e.touches[0].clientX);
        const my = e.clientY || (e.touches && e.touches[0].clientY);
        let nx = startBx + (mx - sx);
        let ny = startBy + (my - sy);
        nx = Math.max(0, Math.min(nx, cw - bw));
        ny = Math.max(0, Math.min(ny, ch - bh));
        box.style.left = nx + 'px';
        box.style.top = ny + 'px';
      }

      box.onmousedown = box.ontouchstart = (e) => {
        isDragging = true;
        target.style.opacity = '0';
        sx = e.clientX || (e.touches && e.touches[0].clientX);
        sy = e.clientY || (e.touches && e.touches[0].clientY);
        startBx = parseFloat(box.style.left);
        startBy = parseFloat(box.style.top);
      };
      
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove, {passive:false});
      const endDrag = () => isDragging = false;
      document.addEventListener('mouseup', endDrag);
      document.addEventListener('touchend', endDrag);
      
      document.getElementById('pp-submit').onclick = () => {
        if(!canAnswer) return;
        canAnswer = false;
        const finalX = parseFloat(box.style.left);
        const finalY = parseFloat(box.style.top);
        const dist = getDistance(finalX, finalY, tx, ty);
        const { score } = computePixelScore(dist, mg.maxPts, Math.min(cw, ch)*0.4);
        
        target.style.opacity = '1';
        if(score >= mg.maxPts * 0.7) Sound.good(); else Sound.wrong();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        onMiniGameEnd(score);
      };
    });
  }

  // ─── MINI-GAME 11: LE CARREAU ─────────────────────────────────
  function buildCarreau(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Trouve le carreau mal aligné !</p>
      <div style="background:#2A2A2A; padding:8px; border-radius:8px; width:100%; aspect-ratio:1; max-height:300px; margin:0 auto;">
        <div id="c-grid" style="display:grid; gap:4px; width:100%; height:100%;"></div>
      </div>
    `;
    gameArea.appendChild(card);
    
    const grid = document.getElementById('c-grid');
    const size = 5 + Math.floor(Math.random() * 3); // 5 to 7
    grid.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
    grid.style.gridTemplateRows = 'repeat(' + size + ', 1fr)';
    
    const anomaly = Math.floor(Math.random() * (size*size));
    const rot = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random()*4);
    
    for(let i=0; i<size*size; i++) {
      const tile = document.createElement('div');
      tile.style.background = '#F3F4F6';
      tile.style.borderRadius = '2px';
      tile.style.cursor = 'pointer';
      
      if(i === anomaly) {
        tile.style.transform = 'rotate(' + rot + 'deg)';
        tile.onclick = () => {
          if(!canAnswer) return;
          canAnswer = false;
          Sound.good();
          tile.style.background = '#34D399';
          onMiniGameEnd(mg.maxPts);
        };
      } else {
        tile.onclick = () => {
          if(!canAnswer) return;
          canAnswer = false;
          Sound.wrong();
          tile.style.background = '#F87171';
          onMiniGameEnd(0);
        };
      }
      grid.appendChild(tile);
    }
  }

  // ─── MINI-GAME 12: L'HORLOGE ──────────────────────────────────
  function buildHorloge(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Ajuste l'aiguille pour qu'elle soit droite !</p>
      
      <div style="display:flex; justify-content:center; align-items:center; gap:20px; margin:20px 0;">
        <button class="btn btn-outline" id="h-left" style="font-size:2rem; padding:10px 20px;">↺</button>
        
        <div style="position:relative; width:120px; height:120px; border:2px solid var(--bg-border); border-radius:50%; background:var(--bg-card);">
          <div style="position:absolute; top:4px; left:calc(50% - 2px); width:4px; height:10px; background:var(--text-muted);"></div>
          <div style="position:absolute; bottom:4px; left:calc(50% - 2px); width:4px; height:10px; background:var(--text-muted);"></div>
          <div style="position:absolute; left:4px; top:calc(50% - 2px); width:10px; height:4px; background:var(--text-muted);"></div>
          <div style="position:absolute; right:4px; top:calc(50% - 2px); width:10px; height:4px; background:var(--text-muted);"></div>
          
          <div id="h-target" style="position:absolute; bottom:50%; left:calc(50% - 1px); width:2px; height:50px; background:#34D399; transform-origin:bottom center; opacity:0;"></div>
          
          <div id="h-hand-wrap" style="position:absolute; inset:0; transition:transform 0.05s linear;">
            <div style="position:absolute; bottom:50%; left:calc(50% - 2px); width:4px; height:45px; background:#F87171; border-radius:4px; transform-origin:bottom center;"></div>
          </div>
          <div style="position:absolute; top:calc(50% - 4px); left:calc(50% - 4px); width:8px; height:8px; background:#fff; border-radius:50%; border:2px solid #F87171;"></div>
        </div>
        
        <button class="btn btn-outline" id="h-right" style="font-size:2rem; padding:10px 20px;">↻</button>
      </div>
      <button class="btn btn-primary w-full" id="h-submit">VALIDER</button>
    `;
    gameArea.appendChild(card);
    
    const bases = [0, 90, 180, 270];
    const target = bases[Math.floor(Math.random()*4)];
    let current = target + (Math.random()>0.5?1:-1) * (5 + Math.random()*15);
    
    const wrap = document.getElementById('h-hand-wrap');
    const targetEl = document.getElementById('h-target');
    targetEl.style.transform = 'rotate(' + target + 'deg)';
    wrap.style.transform = 'rotate(' + current + 'deg)';
    
    const step = 2;
    function rotateLeft() { current -= step; wrap.style.transform = 'rotate(' + current + 'deg)'; }
    function rotateRight() { current += step; wrap.style.transform = 'rotate(' + current + 'deg)'; }
    
    document.getElementById('h-left').onclick = rotateLeft;
    document.getElementById('h-right').onclick = rotateRight;
    
    function onKey(e) {
      if(!canAnswer) return;
      if(e.key === 'ArrowLeft') rotateLeft();
      if(e.key === 'ArrowRight') rotateRight();
    }
    document.addEventListener('keydown', onKey);
    
    document.getElementById('h-submit').onclick = () => {
      if(!canAnswer) return;
      canAnswer = false;
      document.removeEventListener('keydown', onKey);
      
      targetEl.style.opacity = '1';
      let diff = Math.abs((current%360) - (target%360));
      if(diff > 180) diff = 360 - diff;
      
      if(diff <= 4) { Sound.good(); onMiniGameEnd(mg.maxPts); }
      else { Sound.wrong(); onMiniGameEnd(0); }
    };
  }

  // ─── FINAL SCREEN ─────────────────────────────────────────────
  function showFinal() {
    gameArea.style.display = 'none';
    const finalScreen = document.getElementById('final-screen');
    finalScreen.classList.add('show');

    const max = MINI_GAMES.reduce((s, m) => s + m.maxPts, 0);
    const pct = totalPts / max;
    document.getElementById('final-max').textContent = `/ ${max.toLocaleString()}`;

    let rank, rankColor;
    if (pct >= 0.95) { rank = 'S'; rankColor = '#FFD700'; }
    else if (pct >= 0.80) { rank = 'A'; rankColor = '#A78BFA'; }
    else if (pct >= 0.65) { rank = 'B'; rankColor = '#34D399'; }
    else if (pct >= 0.50) { rank = 'C'; rankColor = '#60A5FA'; }
    else if (pct >= 0.35) { rank = 'D'; rankColor = '#FBBF24'; }
    else { rank = 'F'; rankColor = '#F87171'; }

    const rankEl = document.getElementById('final-rank-letter');
    rankEl.textContent = rank;
    rankEl.className = `rank-letter ${rank}`;
    document.getElementById('final-rank-text').textContent = `RANG ${rank}`;

    animateCounter(document.getElementById('final-total'), 0, totalPts, 1200);

    if (pct >= 0.8) launchConfetti(60);

    // Scores list
    const list = document.getElementById('mg-scores-list');
    MINI_GAMES.forEach((mg, i) => {
      const row = document.createElement('div');
      row.className = 'mg-score-row';
      const score = gameScores[i] ?? 0;
      const perfect = score >= mg.maxPts * 0.8;
      row.innerHTML = `
        <span class="mg-score-icon">${mg.icon}</span>
        <span class="mg-score-name">${mg.name}</span>
        <span class="mg-score-pts">${score}</span>
        <span class="mg-score-check">${perfect ? '✅' : score > 0 ? '🟡' : '❌'}</span>
      `;
      list.appendChild(row);
    });

    // Save record
    try {
      const data = JSON.parse(localStorage.getItem('chromaflash_data') || '{}');
      if (!data.records) data.records = {};
      if (!data.records.flash || totalPts > data.records.flash.best) {
        data.records.flash = { best: totalPts, rank, date: new Date().toISOString() };
      }
      localStorage.setItem('chromaflash_data', JSON.stringify(data));
    } catch {}

    Sound.levelUp();
  }

  document.getElementById('replay-btn').addEventListener('click', () => {
    document.getElementById('final-screen').classList.remove('show');
    document.getElementById('mg-scores-list').innerHTML = '';
    startGame();
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    const max = MINI_GAMES.reduce((s,m) => s+m.maxPts,0);
    const pct = totalPts / max;
    const rank = pct>=0.95?'S':pct>=0.8?'A':pct>=0.65?'B':pct>=0.5?'C':pct>=0.35?'D':'F';
    const text = `⚡ ChromaFlash — Mode Flash\nRANG ${rank} — ${totalPts} / ${max} pts\n\nTeste ta perception colorimétrique !`;
    copyScore(text);
  });

  // ─── MINI-GAME: LE VOLUME ────────────────────────────────────
  function buildVolume(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card w-full';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.innerHTML = `
      <div class="mini-game-header w-full">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-sm">Arrête sur un <strong>nombre pair</strong> ou <strong>multiple de 5</strong> !</p>
      
      <div style="background:#111; border:8px solid #333; border-radius:12px; padding:20px; text-align:center; margin:20px 0; width:100%; max-width:300px;">
        <div id="flash-vol-num" style="font-family:'Space Mono',monospace; font-size:4rem; font-weight:700; color:#34D399; text-shadow:0 0 10px rgba(52,211,153,0.5); line-height:1; margin-bottom:10px">0</div>
        <div id="flash-vol-bar" style="display:flex; gap:4px; justify-content:center;"></div>
      </div>
      
      <button class="btn btn-primary btn-lg w-full mt-md" id="flash-vol-btn">STOP !</button>
    `;
    gameArea.appendChild(card);

    const volNum = document.getElementById('flash-vol-num');
    const volBar = document.getElementById('flash-vol-bar');
    const btnStop = document.getElementById('flash-vol-btn');

    for(let i=0; i<20; i++) {
      const d = document.createElement('div');
      d.style.width = '6px'; d.style.height = '16px'; d.style.background = '#333';
      volBar.appendChild(d);
    }

    let currentVolume = Math.floor(Math.random() * 50);
    const speed = Math.max(30, 150 - (mgIndex * 8));

    function updateDisplay() {
      volNum.textContent = currentVolume;
      const segments = volBar.children;
      const activeCount = Math.ceil(currentVolume / 5);
      for(let i=0; i<segments.length; i++) {
        segments[i].style.background = (i < activeCount) ? '#34D399' : '#333';
        segments[i].style.boxShadow = (i < activeCount) ? '0 0 5px rgba(52,211,153,0.5)' : 'none';
      }
    }

    const volInterval = setInterval(() => {
      currentVolume++;
      if(currentVolume > 100) currentVolume = 0;
      updateDisplay();
      Sound.tick();
    }, speed);

    function handleStop() {
      if (!canAnswer) return;
      canAnswer = false;
      clearInterval(volInterval);
      
      const isPair = currentVolume % 2 === 0;
      const isMult5 = currentVolume % 5 === 0;
      
      if (isPair || isMult5) {
        triggerScreenFlash();
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        triggerScreenShake();
        Sound.wrong();
        onMiniGameEnd(0);
      }
    }

    btnStop.addEventListener('click', handleStop);

    // Temp event listener for spacebar
    const keyHandler = (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && canAnswer) {
        e.preventDefault();
        handleStop();
      }
    };
    document.addEventListener('keydown', keyHandler);
    
    // We need to clean up the event listener when minigame ends.
    // The easiest way is to wrap onMiniGameEnd.
    const originalEnd = onMiniGameEnd;
    // Actually we can't override local function easily, we just rely on canAnswer flag.
    // However, the listener will stack up if we don't remove it.
    setTimeout(() => { document.removeEventListener('keydown', keyHandler); }, time * 1000 + 1000);
  }

  // ─── MINI-GAME: LE CADRE ──────────────────────────────────────
  function buildCadre(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card w-full';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.innerHTML = `
      <div class="mini-game-header w-full">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-sm">Redresse ce cadre parfaitement à 0° !</p>
      
      <div style="width:100%; height:250px; background:repeating-linear-gradient(0deg,#1E1E28,#1E1E28 10px,#2A2A35 10px,#2A2A35 12px); border-radius:12px; position:relative; display:flex; justify-content:center; align-items:center; overflow:hidden; margin:20px 0;">
        <div id="flash-level-guide" style="position:absolute; width:100%; height:2px; background:#34D399; opacity:0; z-index:10; pointer-events:none;"></div>
        
        <div id="flash-cadre" style="width:140px; height:180px; background:#E5E7EB; border:8px solid #8B5A2B; display:flex; justify-content:center; align-items:center; transition:transform 0.05s linear; position:relative;">
          <div style="width:80%; height:80%; background:linear-gradient(135deg,#60A5FA,#A78BFA); display:flex; justify-content:center; align-items:center; font-size:2rem;">🏔️</div>
        </div>
        
        <div id="flash-cadre-left" style="position:absolute; top:0; left:0; width:50%; height:100%; z-index:10; cursor:pointer;"></div>
        <div id="flash-cadre-right" style="position:absolute; top:0; right:0; width:50%; height:100%; z-index:10; cursor:pointer;"></div>
      </div>
      
      <button class="btn btn-primary btn-lg w-full mt-md" id="flash-cadre-btn">C'EST DROIT !</button>
    `;
    gameArea.appendChild(card);

    const frame = document.getElementById('flash-cadre');
    const guide = document.getElementById('flash-level-guide');
    const btnVal = document.getElementById('flash-cadre-btn');
    const leftZone = document.getElementById('flash-cadre-left');
    const rightZone = document.getElementById('flash-cadre-right');

    const tolerance = Math.max(0.5, 2 - (mgIndex * 0.1));
    const step = Math.max(0.2, 1.5 - (mgIndex * 0.05));
    
    let angle = 0;
    while(Math.abs(angle) < 5) { angle = (Math.random() - 0.5) * 40; }

    function updateFrame() {
      frame.style.transform = `rotate(${angle}deg)`;
    }
    updateFrame();

    function rotateL() { if(canAnswer) { angle -= step; updateFrame(); } }
    function rotateR() { if(canAnswer) { angle += step; updateFrame(); } }

    leftZone.addEventListener('mousedown', (e) => { e.preventDefault(); rotateL(); });
    leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); rotateL(); });
    rightZone.addEventListener('mousedown', (e) => { e.preventDefault(); rotateR(); });
    rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); rotateR(); });

    const keyHandler = (e) => {
      if (!canAnswer) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); rotateL(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); rotateR(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); validate(); }
    };
    document.addEventListener('keydown', keyHandler);

    function validate() {
      if (!canAnswer) return;
      canAnswer = false;
      guide.style.opacity = '1';
      
      if (Math.abs(angle) <= tolerance) {
        triggerScreenFlash();
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        triggerScreenShake();
        Sound.wrong();
        onMiniGameEnd(0);
      }
    }

    btnVal.addEventListener('click', validate);

    setTimeout(() => { document.removeEventListener('keydown', keyHandler); }, time * 1000 + 1000);
  }

  // ─── MINI-GAME 15: LE CRÉNAGE ──────────────────────────────────
  function buildCrenage(mg, time) {
    const pairs = ['AV', 'WA', 'To', 'Te', 'LY', 'TA', 'VA'];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const optimalSpacing = -2; // let's say -2px is visually good
    // Start way off
    let currentSpacing = Math.random() > 0.5 ? Math.floor(Math.random() * 5 + 10) : Math.floor(Math.random() * -10 - 5);
    const font = TYPO_FONTS[Math.floor(Math.random() * TYPO_FONTS.length)].family;

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Ajuste l'espacement pour que ce soit <strong>parfait</strong>.</p>
      
      <div style="font-family:'${font}', sans-serif; font-size:6rem; line-height:1; display:flex; justify-content:center; align-items:center; height:120px; border:1px dashed var(--bg-border); margin-bottom:var(--space-md); position:relative; overflow:hidden">
        <span id="crenage-l1">${pair[0]}</span>
        <span id="crenage-l2" style="margin-left:${currentSpacing}px">${pair[1]}</span>
      </div>

      <div class="flex gap-sm w-full">
        <button class="btn btn-ghost flex-1" id="crenage-minus">← Raprocher</button>
        <button class="btn btn-ghost flex-1" id="crenage-plus">Écarter →</button>
      </div>
      <button class="btn btn-primary w-full mt-sm" id="crenage-val">C'est parfait</button>
    `;
    gameArea.appendChild(card);

    const l2 = document.getElementById('crenage-l2');
    
    function update() {
      l2.style.marginLeft = currentSpacing + 'px';
    }

    document.getElementById('crenage-minus').addEventListener('click', () => { currentSpacing -= 1; update(); });
    document.getElementById('crenage-plus').addEventListener('click', () => { currentSpacing += 1; update(); });

    const keyHandler = (e) => {
      if (!canAnswer) return;
      if (e.key === 'ArrowLeft') { currentSpacing -= 1; update(); }
      if (e.key === 'ArrowRight') { currentSpacing += 1; update(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); validate(); }
    };
    document.addEventListener('keydown', keyHandler);

    function validate() {
      if (!canAnswer) return;
      canAnswer = false;
      const diff = Math.abs(currentSpacing - optimalSpacing);
      if (diff <= 2) {
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        Sound.wrong();
        onMiniGameEnd(Math.max(0, mg.maxPts - diff * 100));
      }
    }
    document.getElementById('crenage-val').addEventListener('click', validate);
    setTimeout(() => { document.removeEventListener('keydown', keyHandler); }, time * 1000 + 1000);
  }

  // ─── MINI-GAME 16: LA MARGE (Padding) ─────────────────────────
  function buildPadding(mg, time) {
    const targetPadding = Math.floor(Math.random() * 10 + 20); // 20 to 30
    let userPadding = Math.random() > 0.5 ? targetPadding + 15 : Math.max(0, targetPadding - 15);

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Équilibre la marge <strong>basse</strong> pour qu'elle soit identique à la haute.</p>
      
      <div style="display:flex; justify-content:center; align-items:center; height:180px; border:1px dashed var(--bg-border); margin-bottom:var(--space-md); position:relative; overflow:hidden">
        <div id="padding-btn" style="background:var(--accent); color:#000; font-weight:700; border-radius:8px; padding-left:30px; padding-right:30px; padding-top:${targetPadding}px; padding-bottom:${userPadding}px; transition: padding 0.1s;">
          CLIQUE MOI
        </div>
      </div>

      <input type="range" class="input w-full" id="padding-slider" min="0" max="60" value="${userPadding}">
      <button class="btn btn-primary w-full mt-sm" id="padding-val">Valider</button>
    `;
    gameArea.appendChild(card);

    const btn = document.getElementById('padding-btn');
    const slider = document.getElementById('padding-slider');

    slider.addEventListener('input', (e) => {
      userPadding = parseInt(e.target.value);
      btn.style.paddingBottom = userPadding + 'px';
    });

    document.getElementById('padding-val').addEventListener('click', () => {
      if (!canAnswer) return;
      canAnswer = false;
      const diff = Math.abs(userPadding - targetPadding);
      if (diff <= 2) {
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        Sound.wrong();
        onMiniGameEnd(0);
      }
    });
  }

  // ─── MINI-GAME 17: LE CONTRASTE (WCAG) ────────────────────────
  function buildContraste(mg, time) {
    // Generate a background, let's say mid-gray
    const bgL = Math.floor(Math.random() * 20 + 40); // 40-60% lightness
    let userL = bgL; // Start invisible!

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Ajuste la clarté du texte pour qu'il soit <strong>lisible</strong> mais sans abuser !</p>
      
      <div style="display:flex; justify-content:center; align-items:center; height:120px; background:hsl(0,0%,${bgL}%); border-radius:var(--radius-md); margin-bottom:var(--space-md);">
        <span id="contraste-text" style="color:hsl(0,0%,${userL}%); font-weight:700; font-size:1.5rem;">Accessibilité</span>
      </div>

      <input type="range" class="input w-full" id="contraste-slider" min="0" max="100" value="${userL}">
      <button class="btn btn-primary w-full mt-sm" id="contraste-val">Lisible !</button>
    `;
    gameArea.appendChild(card);

    const textEl = document.getElementById('contraste-text');
    const slider = document.getElementById('contraste-slider');

    slider.addEventListener('input', (e) => {
      userL = parseInt(e.target.value);
      textEl.style.color = `hsl(0,0%,${userL}%)`;
    });

    document.getElementById('contraste-val').addEventListener('click', () => {
      if (!canAnswer) return;
      canAnswer = false;
      // Ideal contrast distance: WCAG AA is ~ 4.5 ratio. In lightness it's about 40-50% difference.
      const diffL = Math.abs(userL - bgL);
      if (diffL >= 40 && diffL <= 60) {
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        Sound.wrong();
        onMiniGameEnd(0);
      }
    });
  }

  // ─── MINI-GAME 18: LE RATIO ───────────────────────────────────
  function buildRatio(mg, time) {
    const ratios = [
      { name: '16:9', w: 160, h: 90 },
      { name: '4:3',  w: 120, h: 90 },
      { name: '1:1',  w: 100, h: 100 },
      { name: '3:2',  w: 150, h: 100 },
      { name: '21:9', w: 210, h: 90 }
    ];
    
    // Pick 3 options to display
    const shuffled = [...ratios].sort(() => 0.5 - Math.random());
    const options = shuffled.slice(0, 3);
    const correct = options[Math.floor(Math.random() * options.length)];

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Quel est le ratio de ce rectangle ?</p>
      
      <div style="display:flex; justify-content:center; align-items:center; height:180px; margin-bottom:var(--space-md);">
        <div style="width:${correct.w}px; height:${correct.h}px; background:var(--accent); border-radius:4px;"></div>
      </div>

      <div class="spot-grid" id="ratio-choices" style="grid-template-columns: repeat(3, 1fr);"></div>
    `;
    gameArea.appendChild(card);

    const container = document.getElementById('ratio-choices');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt.name;
      btn.style.fontFamily = 'Space Mono, monospace';
      btn.addEventListener('click', () => {
        if (!canAnswer) return;
        canAnswer = false;
        if (opt.name === correct.name) {
          btn.classList.add('correct');
          Sound.good();
          onMiniGameEnd(mg.maxPts);
        } else {
          btn.classList.add('wrong');
          Sound.wrong();
          onMiniGameEnd(0);
        }
      });
      container.appendChild(btn);
    });
  }

  // ─── MINI-GAME 19: LE GRAND SAUT (NIVEAU LONG) ───────────────────
  function buildSaut(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Niveau Bonus ! Souffle un peu, esquive les obstacles et rejoins le drapeau.</p>
      
      <div style="position:relative; width:100%; height:200px; overflow:hidden; background:#87CEEB; border-radius:8px; border:2px solid var(--bg-border); margin-bottom:var(--space-md);">
        <div id="saut-world" style="position:absolute; top:0; left:0; width:4000px; height:100%;">
          <!-- Floor 1 -->
          <div style="position:absolute; bottom:0; left:0; width:800px; height:40px; background:#8B4513; border-top:4px solid #228B22;"></div>
          <!-- Pipe 1 -->
          <div class="obstacle" data-type="pipe" data-x="400" data-w="40" style="position:absolute; bottom:40px; left:400px; width:40px; height:60px; background:#228B22; border:2px solid #000; border-radius:4px 4px 0 0;"></div>
          
          <!-- Floor 2 (After Gap 1) -->
          <div style="position:absolute; bottom:0; left:950px; width:800px; height:40px; background:#8B4513; border-top:4px solid #228B22;"></div>
          
          <!-- Pipe 2 -->
          <div class="obstacle" data-type="pipe" data-x="1300" data-w="40" style="position:absolute; bottom:40px; left:1300px; width:40px; height:80px; background:#228B22; border:2px solid #000; border-radius:4px 4px 0 0;"></div>

          <!-- Floor 3 (After Gap 2) -->
          <div style="position:absolute; bottom:0; left:1900px; width:1000px; height:40px; background:#8B4513; border-top:4px solid #228B22;"></div>
          
          <!-- Flag -->
          <div style="position:absolute; bottom:40px; left:2500px; width:4px; height:100px; background:#E5E7EB;">
            <div style="position:absolute; top:0; right:0; width:30px; height:20px; background:#F87171;"></div>
          </div>
        </div>
        <!-- Player -->
        <div id="saut-player" style="position:absolute; bottom:40px; left:50px; width:30px; height:30px; background:#E52521; border-radius:4px; border:2px solid #000; z-index:10;">
          <div style="position:absolute; top:4px; right:4px; width:6px; height:6px; background:#fff; border-radius:50%;"></div>
        </div>
      </div>
      
      <button class="btn btn-primary w-full mt-sm" id="saut-btn">SAUTER (Espace)</button>
    `;
    gameArea.appendChild(card);

    let playerY = 40;
    let playerVy = 0;
    const gravity = 0.9;
    const jumpStrength = 15;
    let isJumping = false;
    let scrollX = 0;
    const speed = 5; // Un peu plus lent pour apprécier
    let rafId;
    let gameState = 'playing';

    const player = document.getElementById('saut-player');
    const world = document.getElementById('saut-world');

    // Définition des trous (gaps)
    const gaps = [
      { start: 800, end: 950 },
      { start: 1750, end: 1900 }
    ];

    // Définition des obstacles (tuyaux)
    const obstacles = [
      { x: 400, w: 40, h: 60 },
      { x: 1300, w: 40, h: 80 }
    ];

    function jump() {
      if (!isJumping && gameState === 'playing' && canAnswer) {
        isJumping = true;
        playerVy = jumpStrength;
        Sound.swoosh();
      }
    }

    document.getElementById('saut-btn').addEventListener('click', jump);
    const keyHandler = (e) => {
      if (!canAnswer) return;
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    document.addEventListener('keydown', keyHandler);

    function loop() {
      if (!canAnswer) return;

      if (gameState === 'playing') {
        scrollX += speed;
        world.style.transform = `translateX(${-scrollX}px)`;

        const pStart = 50 + scrollX;
        const pEnd = 80 + scrollX;

        // Collision Obstacles (Pipes)
        for (let obs of obstacles) {
          if (pEnd > obs.x && pStart < obs.x + obs.w) {
            if (playerY < 40 + obs.h) {
              gameState = 'lose'; // Hit the pipe
            } else if (playerVy < 0 && playerY <= 40 + obs.h) {
              // Landed ON the pipe
              playerY = 40 + obs.h;
              playerVy = 0;
              isJumping = false;
            }
          }
        }

        // Physique Gravité
        if (isJumping) {
          playerY += playerVy;
          playerVy -= gravity;
          
          // Vérifier si atterrissage sur le sol normal
          let onFloor = true;
          for (let g of gaps) {
            if (pStart > g.start && pEnd < g.end) onFloor = false;
          }
          
          // Si on descend en dessous du niveau du sol (40)
          if (playerY <= 40) {
            if (onFloor) {
              // Vérifier si on n'atterrit pas dans un mur de tuyau
              let hitWall = false;
              for (let obs of obstacles) {
                if (pEnd > obs.x && pStart < obs.x + obs.w) hitWall = true;
              }
              if (hitWall) {
                gameState = 'lose';
              } else {
                playerY = 40;
                playerVy = 0;
                isJumping = false;
              }
            } else {
              gameState = 'lose'; // Tombé dans un trou
            }
          }
        } else {
          // Si on court sur le sol, vérifier si on tombe dans un trou
          let onFloor = true;
          let onPipe = false;
          for (let g of gaps) {
            if (pStart > g.start && pEnd < g.end) onFloor = false;
          }
          for (let obs of obstacles) {
            if (pEnd > obs.x && pStart < obs.x + obs.w && playerY >= 40 + obs.h) onPipe = true;
          }
          
          if (!onFloor && !onPipe && playerY === 40) {
            gameState = 'lose';
            playerVy = -5; // commence à tomber
            isJumping = true;
          } else if (!onPipe && playerY > 40) {
             // est tombé du tuyau
             isJumping = true;
          }
        }

        player.style.bottom = playerY + 'px';

        // Check Flag Collision
        if (pEnd >= 2500 && playerY >= 40) {
          gameState = 'win';
        }

      } else if (gameState === 'lose') {
        playerY += playerVy;
        playerVy -= gravity;
        player.style.bottom = playerY + 'px';
        if (playerY < -50) {
          canAnswer = false;
          cancelAnimationFrame(rafId);
          Sound.wrong();
          onMiniGameEnd(0);
          return;
        }
      } else if (gameState === 'win') {
        canAnswer = false;
        cancelAnimationFrame(rafId);
        triggerScreenFlash();
        Sound.good();
        onMiniGameEnd(mg.maxPts);
        return;
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    setTimeout(() => {
      document.removeEventListener('keydown', keyHandler);
      cancelAnimationFrame(rafId);
    }, time * 1000 + 1000);
  }

  // ─── MINI-GAME 20: LA PLAQUE ──────────────────────────────────
  function buildPlaque(mg, time) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let plaque = '';
    for(let i=0; i<6; i++) plaque += chars[Math.floor(Math.random()*chars.length)];
    // Format XX-XX-XX
    plaque = plaque.slice(0,2) + '-' + plaque.slice(2,4) + '-' + plaque.slice(4,6);

    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Lis la plaque de la voiture qui passe !</p>
      
      <div id="plaque-scene" style="position:relative; width:100%; height:120px; overflow:hidden; background:#111; border-radius:8px; border:2px solid var(--bg-border); margin-bottom:var(--space-md);">
        <!-- Voiture -->
        <div id="plaque-car" style="position:absolute; top:20px; left:-300px; width:200px; height:80px; background:#FF2A55; border-radius:10px 40px 10px 10px; display:flex; align-items:center; justify-content:center;">
          <div style="background:#FFF; color:#000; font-family:'Space Mono', monospace; font-weight:900; font-size:1.2rem; padding:4px 8px; border:2px solid #000; border-radius:4px;">
            ${plaque}
          </div>
        </div>
      </div>

      <div id="plaque-input-wrap" style="display:none;">
        <p class="text-sm text-secondary mb-sm">Quelle était la plaque ?</p>
        <input type="text" id="plaque-input" class="input input-mono text-center uppercase" placeholder="XX-XX-XX" style="text-transform:uppercase; font-size:1.5rem;" autocomplete="off" spellcheck="false">
        <button class="btn btn-primary w-full mt-sm" id="plaque-btn">VALIDER</button>
      </div>
    `;
    gameArea.appendChild(card);

    const car = document.getElementById('plaque-car');
    const inputWrap = document.getElementById('plaque-input-wrap');
    const inputEl = document.getElementById('plaque-input');
    const btn = document.getElementById('plaque-btn');

    // Animation de la voiture qui traverse en 0.8s, attend 1 seconde avant de partir
    setTimeout(() => {
      if(!canAnswer) return;
      car.style.transition = 'left 0.6s linear';
      car.style.left = '100%';
      Sound.swoosh();
      
      // Afficher le champ input juste après le passage
      setTimeout(() => {
        if(!canAnswer) return;
        document.getElementById('plaque-scene').style.display = 'none';
        inputWrap.style.display = 'block';
        inputEl.focus();
      }, 700);
    }, 1000);

    const submitPlaque = () => {
      if(!canAnswer) return;
      canAnswer = false;
      const val = inputEl.value.toUpperCase().replace(/\s/g, '');
      const cleanTarget = plaque.replace(/-/g, '');
      const cleanVal = val.replace(/-/g, '');
      if (cleanVal === cleanTarget) {
        Sound.good();
        inputEl.style.borderColor = '#34D399';
        onMiniGameEnd(mg.maxPts);
      } else {
        Sound.wrong();
        inputEl.style.borderColor = '#F87171';
        inputEl.value = plaque;
        onMiniGameEnd(0);
      }
    };

    btn.addEventListener('click', submitPlaque);
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitPlaque();
    });
  }

  // ─── MINI-GAME 21: L'ALIGNEMENT ──────────────────────────────
  function buildAlignement(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Clique au moment précis où le bloc passe au centre !</p>
      
      <div style="position:relative; width:100%; height:100px; background:var(--bg-input); border-radius:8px; border:1px solid var(--bg-border); margin-bottom:var(--space-md); overflow:hidden;">
        <!-- Ligne centrale -->
        <div style="position:absolute; top:0; bottom:0; left:50%; width:4px; background:#FFD700; transform:translateX(-50%); z-index:1;"></div>
        <!-- Target safe zone visually -->
        <div style="position:absolute; top:0; bottom:0; left:calc(50% - 15px); width:30px; background:rgba(255,215,0,0.2); z-index:0;"></div>
        
        <!-- Bloc mobile -->
        <div id="align-block" style="position:absolute; top:10px; bottom:10px; left:0; width:20px; background:#4D96FF; border-radius:4px; z-index:2; border:2px solid #000;"></div>
      </div>
      
      <button class="btn btn-primary w-full" id="align-btn">STOP ! (Espace)</button>
    `;
    gameArea.appendChild(card);

    const block = document.getElementById('align-block');
    const containerWidth = card.querySelector('div[style*="height:100px"]').clientWidth;
    const blockWidth = 20;
    const maxLeft = containerWidth - blockWidth;
    
    let pos = 0;
    let speed = maxLeft / 30; // approx 30 frames (0.5s) to cross
    let direction = 1;
    let rafId;

    function loop() {
      if (!canAnswer) return;
      pos += speed * direction;
      if (pos >= maxLeft) {
        pos = maxLeft;
        direction = -1;
      } else if (pos <= 0) {
        pos = 0;
        direction = 1;
      }
      block.style.transform = `translateX(${pos}px)`;
      rafId = requestAnimationFrame(loop);
    }
    
    rafId = requestAnimationFrame(loop);

    const stopBlock = () => {
      if (!canAnswer) return;
      canAnswer = false;
      cancelAnimationFrame(rafId);
      
      const centerOfContainer = containerWidth / 2;
      const centerOfBlock = pos + (blockWidth / 2);
      const diff = Math.abs(centerOfContainer - centerOfBlock);
      
      // Tolerance = 15px
      if (diff <= 15) {
        block.style.background = '#34D399';
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        block.style.background = '#F87171';
        Sound.wrong();
        onMiniGameEnd(0);
      }
    };

    document.getElementById('align-btn').addEventListener('click', stopBlock);
    const keyHandler = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        stopBlock();
      }
    };
    document.addEventListener('keydown', keyHandler);
    
    setTimeout(() => {
      document.removeEventListener('keydown', keyHandler);
      cancelAnimationFrame(rafId);
    }, time * 1000 + 1000);
  }

  // ─── MINI-GAME BOSS: LE NETTOYAGE ─────────────────────────────
  function buildBoss(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header" style="background:#FF2A55; color:#FFF; padding:8px 12px; border-radius:4px; margin-bottom:16px;">
        <div style="font-weight:900; font-size:1.2rem; letter-spacing:2px; display:flex; align-items:center; gap:8px;">
          <span>⚠️</span> BOSS STAGE <span>⚠️</span>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Éradique tous les virus (rouges) ! Ne touche pas les verts !</p>
      
      <div id="boss-grid" style="display:grid; grid-template-columns:repeat(6, 1fr); gap:6px; width:100%; max-width:280px; margin:0 auto; padding:12px; background:var(--bg-input); border-radius:12px; border:3px solid #111;">
      </div>
    `;
    gameArea.appendChild(card);

    const grid = document.getElementById('boss-grid');
    let viruses = 16; // 16 red, 20 green
    let cells = [];

    for(let i=0; i<36; i++) {
      cells.push(i < viruses ? 'red' : 'green');
    }
    cells.sort(() => Math.random() - 0.5);

    let activeViruses = viruses;

    cells.forEach((type, i) => {
      const cell = document.createElement('div');
      cell.style.aspectRatio = '1';
      cell.style.borderRadius = '4px';
      cell.style.background = type === 'red' ? '#FF2A55' : '#34D399';
      cell.style.cursor = 'pointer';
      cell.style.transition = 'transform 0.1s';
      cell.style.border = '2px solid rgba(0,0,0,0.2)';
      
      cell.addEventListener('mousedown', () => {
        if(!canAnswer) return;
        cell.style.transform = 'scale(0.85)';
        if(cell.dataset.type === 'red') {
          cell.dataset.type = 'green';
          cell.style.background = '#34D399';
          Sound.click();
          activeViruses--;
          
          if(activeViruses <= 0) {
            canAnswer = false;
            Sound.good();
            onMiniGameEnd(mg.maxPts);
          }
        } else if (cell.dataset.type === 'green') {
          Sound.wrong();
          canAnswer = false;
          onMiniGameEnd(0);
        }
      });
      cell.addEventListener('mouseup', () => { cell.style.transform = 'none'; });
      cell.dataset.type = type;
      grid.appendChild(cell);
    });
  }

  // ─── MINI-GAME: LE GRATTE-GRATTE ──────────────────────────────
  function buildGratte(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Gratte la zone avec ta souris pour découvrir l'image !</p>
      
      <div style="position:relative; width:280px; height:280px; margin:0 auto; border-radius:12px; overflow:hidden;">
        <img src="../assets/img/mg_character.png" style="position:absolute; width:100%; height:100%; object-fit:cover; z-index:1;">
        <canvas id="gratte-canvas" width="280" height="280" style="position:absolute; top:0; left:0; z-index:2; cursor:crosshair; touch-action:none;"></canvas>
      </div>
    `;
    gameArea.appendChild(card);
    
    const canvas = document.getElementById('gratte-canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, 280, 280);
    ctx.font = '20px "Space Mono"';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText('GRATTE-MOI', 140, 140);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isDrawing = false;
    let checkInterval;

    function getMousePos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDraw(e) {
      if(!canAnswer) return;
      isDrawing = true;
      const pos = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    function draw(e) {
      if(!isDrawing || !canAnswer) return;
      e.preventDefault();
      const pos = getMousePos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    
    function endDraw() { isDrawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, {passive:false});
    canvas.addEventListener('touchmove', draw, {passive:false});
    canvas.addEventListener('touchend', endDraw);

    checkInterval = setInterval(() => {
      if(!canAnswer) return clearInterval(checkInterval);
      const data = ctx.getImageData(0,0,280,280).data;
      let empty = 0;
      for(let i=3; i<data.length; i+=4) if(data[i] === 0) empty++;
      
      if (empty / (280*280) > 0.6) {
        clearInterval(checkInterval);
        Sound.good();
        canAnswer = false;
        ctx.fillRect(0,0,280,280); // clear completely visually
        onMiniGameEnd(mg.maxPts);
      }
    }, 250);
  }

  // ─── MINI-GAME: LA MISE AU POINT ─────────────────────────────
  function buildFocus(mg, time) {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Règle la netteté de l'image au pixel près !</p>
      
      <div style="position:relative; width:100%; height:200px; margin-bottom:var(--space-md); border-radius:8px; overflow:hidden;">
        <img id="focus-img" src="../assets/img/mg_landscape.png" style="width:100%; height:100%; object-fit:cover; filter:blur(20px);">
      </div>
      <input type="range" id="focus-slider" class="input w-full" min="0" max="100" value="0">
      <button class="btn btn-primary w-full mt-sm" id="focus-btn">C'EST NET</button>
    `;
    gameArea.appendChild(card);
    
    const slider = document.getElementById('focus-slider');
    const img = document.getElementById('focus-img');
    const btn = document.getElementById('focus-btn');
    
    const target = Math.floor(Math.random() * 60 + 20);
    
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      const diff = Math.abs(val - target);
      const blur = Math.min(20, diff * 0.4);
      img.style.filter = `blur(${blur}px)`;
    });
    
    btn.addEventListener('click', () => {
      if(!canAnswer) return;
      canAnswer = false;
      const diff = Math.abs(parseInt(slider.value) - target);
      if(diff <= 5) {
        img.style.filter = 'none';
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        Sound.wrong();
        onMiniGameEnd(0);
      }
    });
  }

  // ─── MINI-GAME: LE GLITCH ──────────────────────────────────
  function buildGlitch(mg, time) {
    const s2Init = Math.random()>0.5 ? 80 : -80;
    const s3Init = Math.random()>0.5 ? 90 : -90;
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mini-game-header">
        <div>
          <div class="mini-game-number">Mini-jeu ${mgIndex+1} / ${MINI_GAMES.length}</div>
          <div class="mini-game-title">${mg.icon} ${mg.name}</div>
        </div>
      </div>
      <p class="text-sm text-secondary mb-md">Répare l'image en alignant les bandes avec la souris !</p>
      
      <div style="position:relative; width:280px; height:280px; margin:0 auto; background:#111; overflow:hidden; border-radius:8px;">
        <!-- Top static -->
        <div style="position:absolute; top:0; left:0; width:100%; height:33.33%; background:url('../assets/img/mg_glitch.png'); background-size:280px 280px; background-position:0 0;"></div>
        <!-- Middle draggable -->
        <input type="range" id="glitch-2" class="glitch-slider" min="-100" max="100" value="${s2Init}" style="position:absolute; top:33.33%; left:0; width:100%; height:33.33%; opacity:0; z-index:10; cursor:ew-resize;">
        <div id="glitch-2-vis" style="position:absolute; top:33.33%; left:${s2Init}px; width:100%; height:33.33%; background:url('../assets/img/mg_glitch.png'); background-size:280px 280px; background-position:0 -93.3px; pointer-events:none;"></div>
        <!-- Bottom draggable -->
        <input type="range" id="glitch-3" class="glitch-slider" min="-100" max="100" value="${s3Init}" style="position:absolute; top:66.66%; left:0; width:100%; height:33.33%; opacity:0; z-index:10; cursor:ew-resize;">
        <div id="glitch-3-vis" style="position:absolute; top:66.66%; left:${s3Init}px; width:100%; height:33.33%; background:url('../assets/img/mg_glitch.png'); background-size:280px 280px; background-position:0 -186.6px; pointer-events:none;"></div>
      </div>
      
      <button class="btn btn-primary w-full mt-md" id="glitch-btn">RÉPARÉ</button>
    `;
    gameArea.appendChild(card);
    
    const s2 = document.getElementById('glitch-2');
    const v2 = document.getElementById('glitch-2-vis');
    const s3 = document.getElementById('glitch-3');
    const v3 = document.getElementById('glitch-3-vis');
    
    s2.addEventListener('input', () => v2.style.left = s2.value + 'px');
    s3.addEventListener('input', () => v3.style.left = s3.value + 'px');
    
    document.getElementById('glitch-btn').addEventListener('click', () => {
      if(!canAnswer) return;
      canAnswer = false;
      const diff = Math.abs(parseInt(s2.value)) + Math.abs(parseInt(s3.value));
      if(diff <= 15) {
        v2.style.left = '0px'; v3.style.left = '0px';
        Sound.good();
        onMiniGameEnd(mg.maxPts);
      } else {
        Sound.wrong();
        onMiniGameEnd(0);
      }
    });
  }

  // ─── START ────────────────────────────────────────────────────

  // startGame is deferred via start button in final-screen or handled via UI.
  // Wait, the original code called it automatically. Let's wrap in an interaction to allow AudioContext to start properly.
  document.getElementById('final-screen').classList.add('show');
  document.getElementById('final-total').textContent = "Prêt ?";
  document.getElementById('final-max').style.display = "none";
  document.getElementById('mg-scores-list').style.display = "none";
  document.getElementById('final-rank-letter').textContent = "⚡";
  document.getElementById('final-rank-text').textContent = "MEGA MODE";
  
  const playBtn = document.getElementById('replay-btn');
  playBtn.textContent = "COMMENCER";
  playBtn.addEventListener('click', () => {
    // Enable AudioContext on first gesture
    Sound.init();
    if (window.speechSynthesis) {
      const ut = new SpeechSynthesisUtterance("");
      ut.volume = 0;
      window.speechSynthesis.speak(ut);
    }
    
    // Reset final screen UI for real end
    document.getElementById('final-max').style.display = "block";
    document.getElementById('mg-scores-list').style.display = "flex";
    playBtn.textContent = "Rejouer";
    
    startGame();
  });
