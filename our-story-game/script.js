/**
 * MISSION ∞ — Ahmed × Esraa
 * A Romantic 2D Adventure & Platformer built with HTML5 Canvas + Vanilla JavaScript
 * Zero external libraries — Pure HTML5 Canvas & Web Audio API
 */

'use strict';

/* ==========================================================================
   1. Game State & Progress Storage
   ========================================================================== */

const gameState = {
  currentLevel: 1,
  unlockedLevels: [1],
  health: 3,
  maxHealth: 3,
  collectiblesCollected: 0,
  collectiblesRequired: 5,
  totalInfinityFound: 0,
  collectedInfinityIds: new Set(),
  checkpoints: { 1: null, 2: null, 3: null, 4: null, 5: null },
  inventory: {
    infinity: 0,
    key: false,
    ring: false
  },
  activeCharacter: 'ahmed', // 'ahmed' | 'esraa'
  esraaTimer: 0,
  esraaPerformance: 'good', // 'good' | 'stellar'
  esraaShortcutUnlocked: false,
  gameStatus: 'intro_hook', // 'intro_hook' | 'title_splash' | 'playing' | 'paused' | 'level_complete' | 'game_over' | 'finale'
  soundEnabled: false,
  easterEggClicks: 0
};

// Safe localStorage persistence
try {
  const savedUnlocked = localStorage.getItem('mission_inf_unlocked');
  if (savedUnlocked) {
    const parsed = JSON.parse(savedUnlocked);
    if (Array.isArray(parsed) && parsed.length > 0) gameState.unlockedLevels = parsed;
  }
  const savedCollected = localStorage.getItem('mission_inf_collected_ids');
  if (savedCollected) {
    const arr = JSON.parse(savedCollected);
    if (Array.isArray(arr)) gameState.collectedInfinityIds = new Set(arr);
  }
} catch (_) {}

function saveProgress() {
  try {
    localStorage.setItem('mission_inf_unlocked', JSON.stringify(gameState.unlockedLevels));
    localStorage.setItem('mission_inf_collected_ids', JSON.stringify(Array.from(gameState.collectedInfinityIds)));
  } catch (_) {}
}

/* ==========================================================================
   2. Web Audio API Synthesizer (Zero Missing Files, Pure Synthesized SFX)
   ========================================================================== */

class SoundManager {
  constructor() {
    this.audioEl = document.getElementById('bg-audio');
    this.audioCtx = null;
    this.isPlaying = false;
    this.ambientInterval = null;
    this.masterGain = null;
    this.compressor = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();

        // Dynamics compressor to ensure romantic sounds blend softly without clipping
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(12, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.audioCtx.currentTime);
        this.compressor.connect(this.audioCtx.destination);

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
        this.masterGain.connect(this.compressor);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Short, romantic jump sound effect.
   * Ahmed: Warm, resonant romantic harp pluck chord.
   * Esraa: Airy, starry celesta arpeggio.
   */
  playJump(character = 'ahmed') {
    if (!gameState.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      if (character === 'esraa') {
        // Esraa's leap: Delicate crystalline celesta flourish (rising 3-note romantic chime)
        const notes = [783.99, 987.77, 1318.51]; // G5, B5, E6
        notes.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const noteTime = now + idx * 0.038;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.03, noteTime + 0.14);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.08, noteTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.17);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(noteTime);
          osc.stop(noteTime + 0.18);
        });
      } else {
        // Ahmed's leap: Warm romantic harp pluck (dual-harmonic acoustic lift)
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        const gain2 = this.audioCtx.createGain();

        // Fundamental root note rising from E4 to C5
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(329.63, now); // E4
        osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.13); // C5

        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.exponentialRampToValueAtTime(0.09, now + 0.012);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        // Warm harmonic overtone (G5 chime pluck)
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(783.99, now); // G5
        osc2.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);

        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.masterGain);
        gain2.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.16);
        osc2.stop(now + 0.16);
      }
    } catch (_) {}
  }

  /**
   * Short, romantic item collection sound effect.
   * Cascading music-box / sparkling chimes that evoke discovering love symbols.
   */
  playCollect(type = 'infinity') {
    if (!gameState.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // Romantic ascending arpeggio notes
      let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major triad)
      if (type === 'ring') {
        notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 to G6 romantic promise
      } else if (type === 'key') {
        notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
      } else if (type === 'chest') {
        notes = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
      }

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const noteTime = now + idx * 0.045;

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.095, noteTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.24);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });

      // Subtle romantic high-sparkle shimmer
      const shimmerOsc = this.audioCtx.createOscillator();
      const shimmerGain = this.audioCtx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(1760.00, now + 0.08); // A6
      shimmerGain.gain.setValueAtTime(0.001, now + 0.08);
      shimmerGain.gain.exponentialRampToValueAtTime(0.03, now + 0.12);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.masterGain);
      shimmerOsc.start(now + 0.08);
      shimmerOsc.stop(now + 0.29);
    } catch (_) {}
  }

  /**
   * Short, soft, romantic landing sound effect.
   * Gentle cushioned contact — warm acoustic velvet touchdown.
   */
  playLand(character = 'ahmed', velocity = 200) {
    if (!gameState.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const volumeFactor = Math.min(1.2, Math.max(0.4, velocity / 350));

      // 1. Soft acoustic sub-resonance (cushioned touchdown)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.075);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.065 * volumeFactor, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);

      // 2. Character-specific subtle landing harmonic
      if (character === 'esraa') {
        // Delicate soft bell twinkle for Esraa's ballet touchdown
        const bellOsc = this.audioCtx.createOscillator();
        const bellGain = this.audioCtx.createGain();
        bellOsc.type = 'triangle';
        bellOsc.frequency.setValueAtTime(1046.50, now); // C6
        bellGain.gain.setValueAtTime(0.001, now);
        bellGain.gain.exponentialRampToValueAtTime(0.025 * volumeFactor, now + 0.008);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        bellOsc.connect(bellGain);
        bellGain.connect(this.masterGain);
        bellOsc.start(now);
        bellOsc.stop(now + 0.08);
      } else {
        // Soft acoustic breath puff for Ahmed
        const puffOsc = this.audioCtx.createOscillator();
        const puffGain = this.audioCtx.createGain();
        puffOsc.type = 'triangle';
        puffOsc.frequency.setValueAtTime(220, now);
        puffOsc.frequency.exponentialRampToValueAtTime(110, now + 0.06);

        puffGain.gain.setValueAtTime(0.001, now);
        puffGain.gain.exponentialRampToValueAtTime(0.03 * volumeFactor, now + 0.008);
        puffGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

        puffOsc.connect(puffGain);
        puffGain.connect(this.masterGain);
        puffOsc.start(now);
        puffOsc.stop(now + 0.07);
      }
    } catch (_) {}
  }

  /**
   * Generic SFX dispatcher for full backward compatibility across the codebase.
   */
  playSfx(type, options = null) {
    if (type === 'jump') {
      this.playJump('ahmed');
    } else if (type === 'esraa_jump') {
      this.playJump('esraa');
    } else if (type === 'land') {
      this.playLand('ahmed', typeof options === 'number' ? options : 200);
    } else if (type === 'esraa_land') {
      this.playLand('esraa', typeof options === 'number' ? options : 200);
    } else if (type === 'collect') {
      this.playCollect(typeof options === 'string' ? options : 'infinity');
    } else {
      // General atmospheric SFX
      if (!gameState.soundEnabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      try {
        const now = this.audioCtx.currentTime;

        if (type === 'click') {
          // Romantic water-drop / crystal click
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now);
          osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.07);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.075);
        } else if (type === 'checkpoint') {
          // Romantic harp glissando
          const cpNotes = [440, 554.37, 659.25, 880];
          cpNotes.forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const t = now + i * 0.06;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.exponentialRampToValueAtTime(0.08, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.23);
          });
        } else if (type === 'hit') {
          // Soft cushioned warning pulse
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.17);
        } else if (type === 'door') {
          // Romantic celestial chime chord
          const doorNotes = [261.63, 392.00, 523.25, 659.25];
          doorNotes.forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const t = now + i * 0.08;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.46);
          });
        } else if (type === 'victory') {
          // Romantic orchestral bell harmony
          const vicNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
          vicNotes.forEach((freq, idx) => {
            const noteOsc = this.audioCtx.createOscillator();
            const noteGain = this.audioCtx.createGain();
            const t = now + idx * 0.09;
            noteOsc.type = 'triangle';
            noteOsc.frequency.setValueAtTime(freq, t);
            noteGain.gain.setValueAtTime(0.001, t);
            noteGain.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
            noteOsc.connect(noteGain);
            noteGain.connect(this.masterGain);
            noteOsc.start(t);
            noteOsc.stop(t + 0.33);
          });
        }
      } catch (_) {}
    }
  }

  /**
   * Romantic ambient chord progression playing gently in the background.
   * Keeps the game's emotional romantic atmosphere alive.
   */
  startAmbient() {
    this.stopAmbient();
    // Warm romantic progression: Cmaj9 -> Am9 -> Fmaj7 -> Gsus4
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 261.63, 329.63, 392.00], // Fmaj7
      [196.00, 261.63, 293.66, 392.00]  // Gsus4
    ];
    let chordIdx = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const current = chords[chordIdx % chords.length];
      current.forEach((freq, i) => {
        setTimeout(() => {
          if (this.isPlaying && this.audioCtx) {
            try {
              const now = this.audioCtx.currentTime;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();
              osc.type = i === 0 ? 'sine' : 'triangle';
              osc.frequency.setValueAtTime(freq, now);
              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.exponentialRampToValueAtTime(0.022, now + 0.35);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(now);
              osc.stop(now + 2.45);
            } catch (_) {}
          }
        }, i * 320);
      });
      chordIdx++;
    };

    playStep();
    this.ambientInterval = setInterval(playStep, 3200);
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  toggle() {
    this.initContext();
    this.isPlaying = !this.isPlaying;
    gameState.soundEnabled = this.isPlaying;

    const icon = document.getElementById('sound-icon');
    if (icon) icon.textContent = this.isPlaying ? '🔊' : '🔇';

    if (this.isPlaying) {
      if (this.audioEl && this.audioEl.src) {
        const playPromise = this.audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => this.startAmbient());
        }
      } else {
        this.startAmbient();
      }
    } else {
      if (this.audioEl) this.audioEl.pause();
      this.stopAmbient();
    }
  }
}

const soundManager = new SoundManager();
const audioManager = soundManager; // backward compatibility

if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
  window.soundManager = soundManager;
  window.audioManager = soundManager;
}

/* ==========================================================================
   3. Input Handler (Keyboard + Mobile Touch Controls)
   ========================================================================== */

class InputManager {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      jump: false,
      interact: false
    };
    this.switchRequested = false;

    this.bindKeyboard();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!this.keys.jump) this.onJumpPress();
        this.keys.jump = true;
      }
      if (e.code === 'KeyE') {
        this.keys.interact = true;
        this.onInteractPress();
      }
      // Control Switch hotkeys: C, Tab, or Q
      if (e.code === 'KeyC' || e.code === 'Tab' || e.code === 'KeyQ') {
        e.preventDefault();
        this.switchRequested = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.jump = false;
      if (e.code === 'KeyE') this.keys.interact = false;
    });
  }

  bindTouch() {
    const bindBtn = (id, prop, onPress) => {
      const el = document.getElementById(id);
      if (!el) return;

      const activePointers = new Set();

      const press = (e) => {
        e.preventDefault();
        e.stopPropagation();
        activePointers.add(e.pointerId);
        this.keys[prop] = true;
        el.classList.add('active');
        if (navigator.vibrate) {
          try { navigator.vibrate(12); } catch (_) {}
        }
        if (onPress) onPress();
      };

      const release = (e) => {
        e.preventDefault();
        e.stopPropagation();
        activePointers.delete(e.pointerId);
        if (activePointers.size === 0) {
          this.keys[prop] = false;
          el.classList.remove('active');
        }
      };

      el.addEventListener('pointerdown', (e) => {
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        press(e);
      });

      el.addEventListener('pointerup', (e) => {
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        release(e);
      });

      el.addEventListener('pointercancel', (e) => {
        release(e);
      });

      el.addEventListener('pointerleave', (e) => {
        if (!el.hasPointerCapture || !el.hasPointerCapture(e.pointerId)) {
          release(e);
        }
      });

      el.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
    bindBtn('btn-jump', 'jump', () => this.onJumpPress());
    bindBtn('btn-action', 'interact', () => this.onInteractPress());

    // Mobile on-screen character switch button
    const touchSwitchBtn = document.getElementById('btn-touch-switch');
    if (touchSwitchBtn) {
      const handleSwitchTouch = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.switchRequested = true;
        touchSwitchBtn.classList.add('active');
        if (navigator.vibrate) {
          try { navigator.vibrate(15); } catch (_) {}
        }
        setTimeout(() => touchSwitchBtn.classList.remove('active'), 180);
      };
      touchSwitchBtn.addEventListener('pointerdown', handleSwitchTouch);
      touchSwitchBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  onJumpPress() {
    if (gameInstance && gameInstance.activePlayer) {
      gameInstance.activePlayer.jump();
    }
  }

  onInteractPress() {
    if (gameInstance) {
      gameInstance.handleInteractAction();
    }
  }
}

/* ==========================================================================
   4. Smooth Camera System (Mobile Zoom + Look-Ahead + Level Bounds Clamp)
   ========================================================================== */

class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth || 390;
    this.viewportHeight = viewportHeight || 844;
    this.zoom = this.calculateZoom(this.viewportWidth, this.viewportHeight);
    this.worldWidth = 2600;
    this.worldHeight = 700;
    this.lookAheadX = 0;
    this.lookAheadY = 0;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.zoom = this.calculateZoom(w, h);
  }

  calculateZoom(w, h) {
    const isPortrait = h >= w;
    if (isPortrait) {
      // Dynamic zoom tailored to screen size:
      // Small phones (<= 340px, e.g. 320x568): 1.62x - character is clear, prominent & easy to control
      // Typical phones (360 - 390px, e.g. 390x844): 1.40x - 1.48x
      // Larger phones (412 - 430px, e.g. 430x932): 1.30x - 1.36x
      // Tablets in portrait: 1.25x
      if (w <= 335) return 1.62;
      if (w <= 365) return 1.50;
      if (w <= 395) return 1.42;
      if (w <= 435) return 1.32;
      return 1.25;
    } else {
      // Landscape: maintain excellent visibility without over-zooming
      if (h <= 420) return 1.12;
      if (h <= 600) return 1.18;
      return 1.08;
    }
  }

  toScreenX(worldX) {
    return Math.round((worldX - this.x) * this.zoom);
  }

  toScreenY(worldY) {
    return Math.round((worldY - this.y) * this.zoom);
  }

  toScreenDist(d) {
    return Math.round(d * this.zoom);
  }

  toWorldX(screenX) {
    return screenX / this.zoom + this.x;
  }

  toWorldY(screenY) {
    return screenY / this.zoom + this.y;
  }

  follow(target, levelWidth, levelHeight, dt = 0.016) {
    if (!target) return;
    this.worldWidth = levelWidth || 2600;
    this.worldHeight = levelHeight || 700;

    // Visible dimensions in world units given current zoom
    const visibleW = this.viewportWidth / this.zoom;
    const visibleH = this.viewportHeight / this.zoom;

    // Horizontal look-ahead based on movement and facing direction
    const moving = Math.abs(target.velocityX || 0) > 15;
    const facingDir = target.facing || 1;
    const targetLeadX = (moving ? facingDir * 60 : facingDir * 30);

    // Vertical look-ahead when jumping or falling
    const targetLeadY = (target.velocityY < -60 ? -45 : (target.velocityY > 120 ? 35 : 0));

    // Smoothly blend lookahead
    this.lookAheadX += (targetLeadX - this.lookAheadX) * 0.07;
    this.lookAheadY += (targetLeadY - this.lookAheadY) * 0.06;

    // Character target is positioned around visual center / slightly below center (0.60)
    // so the player can see platforms and hazards ahead and above
    const charCenterX = target.x + target.width / 2;
    const charCenterY = target.y + target.height / 2;

    const desiredX = charCenterX + this.lookAheadX - visibleW * 0.44;
    const desiredY = charCenterY + this.lookAheadY - visibleH * 0.60;

    // Smooth interpolation (cinematic follow without harsh snap or shake)
    const lerpRate = Math.min(1, dt * 7.0);
    this.x += (desiredX - this.x) * lerpRate;
    this.y += (desiredY - this.y) * lerpRate;

    // Clamp to level boundaries so empty space outside the level is NEVER revealed
    const maxX = Math.max(0, this.worldWidth - visibleW);
    const maxY = Math.max(0, this.worldHeight - visibleH);

    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
  }
}

/* ==========================================================================
   5. Particle System & Environmental FX
   ========================================================================== */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 80;
  }

  emit(x, y, color = '#C9A86A', count = 8, speed = 100, life = 0.5) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.8 + 0.2) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        color,
        life,
        maxLife: life,
        size: Math.random() * 3 + 2
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (const p of this.particles) {
      const sx = camera ? camera.toScreenX(p.x) : p.x;
      const sy = camera ? camera.toScreenY(p.y) : p.y;
      const size = camera ? Math.max(1, p.size * camera.zoom) : p.size;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ==========================================================================
   6. Speech Bubble Manager (Natural, Non-Spam In-Game Dialogue)
   ========================================================================== */

class SpeechBubbleManager {
  constructor() {
    this.bubbles = [];
  }

  add(speaker, text, targetObj, duration = 2.8, offset = { x: 0, y: -45 }) {
    this.bubbles = this.bubbles.filter(b => b.speaker !== speaker);
    this.bubbles.push({
      speaker,
      text,
      targetObj,
      duration,
      maxDuration: duration,
      offset
    });
  }

  update(dt) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.duration -= dt;
      if (b.duration <= 0) {
        this.bubbles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (const b of this.bubbles) {
      const obj = b.targetObj;
      if (!obj) continue;

      const screenX = camera ? camera.toScreenX(obj.x + obj.width / 2 + b.offset.x) : Math.round(obj.x + obj.width / 2 + b.offset.x);
      const screenY = camera ? camera.toScreenY(obj.y + b.offset.y) : Math.round(obj.y + b.offset.y);

      ctx.font = 'bold 12px sans-serif';
      const textMetrics = ctx.measureText(b.text);
      const padding = 12;
      const boxW = Math.max(110, textMetrics.width + padding * 2);
      const boxH = 32;

      const boxX = screenX - boxW / 2;
      const boxY = screenY - boxH;

      const alpha = Math.min(1, b.duration * 2);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = b.speaker === 'إسراء' ? 'rgba(32, 18, 26, 0.95)' : 'rgba(20, 20, 28, 0.95)';
      ctx.strokeStyle = b.speaker === 'إسراء' ? '#FFA6B5' : '#C9A86A';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(screenX - 6, boxY + boxH);
      ctx.lineTo(screenX, boxY + boxH + 6);
      ctx.lineTo(screenX + 6, boxY + boxH);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, screenX, boxY + boxH / 2);
    }
    ctx.restore();
  }
}

/* ==========================================================================
   7. Player Class (Ahmed — Main Playable Character)
   ========================================================================== */

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.width = 28;
    this.height = 50;
    this.speed = 225;
    this.jumpForce = 510;
    this.gravity = 1180;
    this.grounded = false;
    this.facing = 1;
    this.state = 'idle'; // 'idle' | 'run' | 'jump' | 'fall'
    this.runCycle = 0;
    this.invulnerableTimer = 0;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.character = 'ahmed';
  }

  get vx() { return this.velocityX; }
  set vx(val) { this.velocityX = val; }
  get vy() { return this.velocityY; }
  set vy(val) { this.velocityY = val; }

  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  applyGravity(dt = 0.016) {
    this.velocityY += this.gravity * dt;
    if (this.velocityY > 900) this.velocityY = 900;
  }

  jump(force = null) {
    if (this.grounded || this.jumpCount < this.maxJumps) {
      if (this.grounded) {
        this.jumpCount = 1;
      } else {
        this.jumpCount = 2;
      }
      this.velocityY = -(force !== null ? force : this.jumpForce);
      this.grounded = false;
      soundManager.playJump('ahmed');
      if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
        gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height, '#E7D5B0', 6, 75, 0.35);
      }
    }
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return;
    this.invulnerableTimer = 1.2;
    gameState.health = Math.max(0, gameState.health - 1);
    UIManager.updateHealth();
    soundManager.playSfx('hit');
    if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
      gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height / 2, '#E84A64', 12, 110, 0.5);
    }

    if (gameState.health <= 0) {
      if (typeof gameInstance !== 'undefined' && gameInstance) {
        gameInstance.handleGameOver();
      }
    } else {
      if (typeof gameInstance !== 'undefined' && gameInstance) {
        gameInstance.respawnAtCheckpoint();
      }
    }
  }

  handleCollision(platforms, wasGrounded = true) {
    if (!platforms || !Array.isArray(platforms)) return;

    // Check vertical collisions
    for (const p of platforms) {
      const ph = p.h !== undefined ? p.h : (p.height !== undefined ? p.height : 0);
      if (this.collidesWith(p)) {
        if (this.velocityY > 0) {
          const impactSpeed = this.velocityY;
          this.y = p.y - this.height;
          this.velocityY = 0;

          // Short, romantic landing sound effect when touching ground after falling
          if (!this.grounded && !wasGrounded && impactSpeed > 100) {
            soundManager.playLand(this.character, impactSpeed);
            if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
              const particleColor = this.character === 'esraa' ? '#FFA6B5' : '#E7D5B0';
              gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height, particleColor, 5, 45, 0.28);
            }
          }

          this.grounded = true;
          this.jumpCount = 0;
        } else if (this.velocityY < 0) {
          this.y = p.y + ph;
          this.velocityY = 0;
        }
      }
    }

    // Check horizontal collisions
    for (const p of platforms) {
      const pw = p.w !== undefined ? p.w : (p.width !== undefined ? p.width : 0);
      if (this.collidesWith(p)) {
        if (this.velocityX > 0) {
          this.x = p.x - this.width;
          this.velocityX = 0;
        } else if (this.velocityX < 0) {
          this.x = p.x + pw;
          this.velocityX = 0;
        }
      }
    }
  }

  collidesWith(rect) {
    if (!rect) return false;
    const rw = rect.w !== undefined ? rect.w : (rect.width !== undefined ? rect.width : 0);
    const rh = rect.h !== undefined ? rect.h : (rect.height !== undefined ? rect.height : 0);
    return (
      this.x < rect.x + rw &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rh &&
      this.y + this.height > rect.y
    );
  }

  update(dt, input, platforms) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    this.velocityX = 0;
    if (input && input.keys) {
      if (input.keys.left) {
        this.velocityX = -this.speed;
        this.facing = -1;
      }
      if (input.keys.right) {
        this.velocityX = this.speed;
        this.facing = 1;
      }
    }

    const wasGrounded = this.grounded;
    this.applyGravity(dt);
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    this.grounded = false;

    this.handleCollision(platforms, wasGrounded);

    if (!this.grounded) {
      this.state = this.velocityY < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.velocityX) > 10) {
      this.state = 'run';
      this.runCycle += dt * 14;
    } else {
      this.state = 'idle';
      this.runCycle = 0;
    }
  }

  draw(ctx, camera) {
    const screenX = camera ? camera.toScreenX(this.x) : Math.round(this.x);
    const screenY = camera ? camera.toScreenY(this.y) : Math.round(this.y);
    const zoom = camera ? camera.zoom : 1.0;

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

    ctx.save();
    ctx.translate(screenX + (this.width * zoom) / 2, screenY + (this.height * zoom) / 2);
    ctx.scale(zoom, zoom);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const legSwing = this.state === 'run' ? Math.sin(this.runCycle) * 7 : 0;

    // Legs
    ctx.strokeStyle = '#1D1D26';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-4, 9);
    ctx.lineTo(-4 - legSwing, 24);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, 9);
    ctx.lineTo(4 + legSwing, 24);
    ctx.stroke();

    // Shoes
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-7 - legSwing, 22, 6, 3);
    ctx.fillRect(1 + legSwing, 22, 6, 3);

    // Torso / Navy Suit Jacket
    ctx.fillStyle = '#20202F';
    ctx.fillRect(-9, -9, 18, 19);

    // Gold Button
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-1, -2, 2, 2.5);

    // Shirt & Red Tie
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(4, -9);
    ctx.lineTo(0, -1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#E84A64';
    ctx.beginPath();
    ctx.moveTo(-1.5, -7);
    ctx.lineTo(1.5, -7);
    ctx.lineTo(0, 2);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#FCE1CD';
    ctx.fillRect(-3, -15, 6, 6);
    ctx.beginPath();
    ctx.arc(0, -19, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#231815';
    ctx.beginPath();
    ctx.arc(0, -21, 8.5, Math.PI, Math.PI * 2);
    ctx.lineTo(8, -18);
    ctx.lineTo(5, -14);
    ctx.lineTo(-8, -17);
    ctx.closePath();
    ctx.fill();

    // Eye & Smile
    ctx.fillStyle = '#1A1614';
    ctx.fillRect(3, -19, 2, 2.5);

    ctx.strokeStyle = '#9E4D43';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(4, -14, 2.5, 0, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();
  }
}

/* ==========================================================================
   8. Esraa Character Class (Playable Heroine & Story Partner)
   ========================================================================== */

class EsraaPlayer extends Player {
  constructor(x, y) {
    super(x, y);
    this.width = 28;
    this.height = 48;
    this.speed = 220;
    this.jumpForce = 545; // Floaty, airy leap force
    this.gravity = 1040; // Lighter gravitational pull than Ahmed
    this.facing = -1;
    this.character = 'esraa';
    this.petalTimer = 0;
    this.jumpAirTime = 0;
    this.jumpSpinAngle = 0;
    this.isSpinning = false;
    this.jumpRibbonTrail = [];
    this.apexSparkleFired = false;
    this.stretchScaleY = 1;
    this.stretchScaleX = 1;
  }

  jump(force = null) {
    if (this.grounded || this.jumpCount < this.maxJumps) {
      if (this.grounded) {
        this.jumpCount = 1;
        this.isSpinning = false;
      } else {
        this.jumpCount = 2;
        this.isSpinning = true;
        this.jumpSpinAngle = 0;
      }
      this.velocityY = -(force !== null ? force : this.jumpForce);
      this.grounded = false;
      this.jumpAirTime = 0;
      this.apexSparkleFired = false;
      this.stretchScaleY = 1.12;
      this.stretchScaleX = 0.90;

      // Unique melodic chime audio for Esraa's leap
      soundManager.playJump('esraa');

      // Unique burst of floating pink petals and delicate sparkles
      if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
        const count = this.isSpinning ? 18 : 12;
        gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height - 2, '#FFA6B5', count, 100, 0.6);
        gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height - 2, '#FFD1DC', 8, 75, 0.5);
        gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height - 2, '#C9A86A', 6, 120, 0.45);
      }
    }
  }

  update(dt, input, platforms, isPlayable = true) {
    if (!isPlayable) {
      this.runCycle = 0;
      this.state = 'idle';
      this.applyGravity(dt);
      this.y += this.velocityY * dt;
      this.handleCollision(platforms);
      return;
    }

    super.update(dt, input, platforms);

    // Smooth recover of squash and stretch back to neutral 1.0
    this.stretchScaleY += (1 - this.stretchScaleY) * Math.min(1, dt * 10);
    this.stretchScaleX += (1 - this.stretchScaleX) * Math.min(1, dt * 10);

    if (!this.grounded) {
      this.jumpAirTime += dt;
      if (this.isSpinning) {
        this.jumpSpinAngle += dt * 16;
      }

      // Record ribbon trail points
      this.jumpRibbonTrail.unshift({
        x: this.x + this.width / 2 - this.facing * 6,
        y: this.y + this.height * 0.5,
        life: 0.28
      });
      if (this.jumpRibbonTrail.length > 8) this.jumpRibbonTrail.pop();

      // Apex sparkle burst when floating at the peak of the jump
      if (!this.apexSparkleFired && Math.abs(this.velocityY) < 45 && this.jumpAirTime > 0.15) {
        this.apexSparkleFired = true;
        if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
          gameInstance.particles.emit(this.x + this.width / 2, this.y - 6, '#FFA6B5', 5, 40, 0.45);
          gameInstance.particles.emit(this.x + this.width / 2, this.y - 6, '#C9A86A', 4, 50, 0.45);
        }
      }

      // Floating sparkles while descending gracefully
      if (this.velocityY > 40 && Math.random() < 0.4) {
        if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
          gameInstance.particles.emit(
            this.x + this.width / 2 + (Math.random() * 16 - 8),
            this.y + this.height - 3,
            '#FFA6B5',
            1,
            20,
            0.35
          );
        }
      }
    } else {
      this.jumpAirTime = 0;
      this.isSpinning = false;
      this.jumpSpinAngle = 0;
      this.apexSparkleFired = false;
      this.jumpRibbonTrail.length = 0;
    }

    // Sparkle trail while running
    if (this.state === 'run') {
      this.petalTimer += dt;
      if (this.petalTimer > 0.16) {
        this.petalTimer = 0;
        if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
          gameInstance.particles.emit(
            this.x + this.width / 2 - this.facing * 8,
            this.y + this.height - 3,
            '#FFA6B5',
            2,
            25,
            0.3
          );
        }
      }
    }
  }

  draw(ctx, camera) {
    const screenX = camera ? camera.toScreenX(this.x) : Math.round(this.x);
    const screenY = camera ? camera.toScreenY(this.y) : Math.round(this.y);
    const zoom = camera ? camera.zoom : 1.0;

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

    // Draw ethereal chiffon ribbon trail during leap
    if (this.jumpRibbonTrail.length > 1) {
      ctx.save();
      for (let i = 0; i < this.jumpRibbonTrail.length - 1; i++) {
        const pt = this.jumpRibbonTrail[i];
        const nextPt = this.jumpRibbonTrail[i + 1];
        const alpha = (1 - i / this.jumpRibbonTrail.length) * 0.45;
        ctx.strokeStyle = `rgba(255, 166, 181, ${alpha})`;
        ctx.lineWidth = Math.max(1, (4 - i * 0.4) * zoom);
        ctx.beginPath();
        const p1x = camera ? camera.toScreenX(pt.x) : pt.x;
        const p1y = camera ? camera.toScreenY(pt.y) : pt.y;
        const p2x = camera ? camera.toScreenX(nextPt.x) : nextPt.x;
        const p2y = camera ? camera.toScreenY(nextPt.y) : nextPt.y;
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenX + (this.width * zoom) / 2, screenY + (this.height * zoom) / 2);
    ctx.scale(zoom * this.stretchScaleX, zoom * this.stretchScaleY);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    const isJumping = this.state === 'jump';
    const isFalling = this.state === 'fall';
    const inAir = isJumping || isFalling;

    // Double-jump pirouette rotation
    if (this.isSpinning && inAir) {
      ctx.rotate(this.jumpSpinAngle * this.facing);
    }

    const runSway = this.state === 'run' ? Math.sin(this.runCycle) * 3 : 0;

    // Dynamic dress flare during jump vs run vs idle
    let dressFlairLeft = 0;
    let dressFlairRight = 0;
    let dressHeight = 22;

    if (isJumping) {
      // Graceful bell-curve flare upward/outward
      const flarePulse = Math.sin(this.jumpAirTime * 12) * 3;
      dressFlairLeft = -7 + flarePulse;
      dressFlairRight = 7 - flarePulse;
      dressHeight = 19;
    } else if (isFalling) {
      // Parachute billow outward
      dressFlairLeft = -9;
      dressFlairRight = 9;
      dressHeight = 21;
    } else if (this.state === 'run') {
      dressFlairLeft = runSway;
      dressFlairRight = -runSway;
    }

    // Shadow
    if (this.grounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 23, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(0, 26, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ballet-style Pointe Feet / Legs in air
    if (inAir) {
      ctx.fillStyle = '#9C2746';
      ctx.beginPath();
      ctx.moveTo(-3, 14);
      ctx.lineTo(-1, 25);
      ctx.lineTo(2, 25);
      ctx.lineTo(1, 14);
      ctx.fill();

      // Golden ballet ribbons
      ctx.fillStyle = '#C9A86A';
      ctx.fillRect(-1.5, 23, 4, 2.5);
    }

    // Elegant Burgundy & Gold Dress with dynamic curved hem
    ctx.fillStyle = '#9C2746';
    ctx.beginPath();
    ctx.moveTo(-9, -7);
    ctx.lineTo(9, -7);
    ctx.lineTo(13 + dressFlairRight, dressHeight);
    ctx.quadraticCurveTo(0, dressHeight + (inAir ? -3 : 2), -13 + dressFlairLeft, dressHeight);
    ctx.closePath();
    ctx.fill();

    // Gold waist ribbon
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-10, 4, 20, 2.5);

    // Neck & Face
    ctx.fillStyle = '#FCE1CD';
    ctx.fillRect(-3, -13, 6, 6);
    ctx.beginPath();
    ctx.arc(0, -17, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hair with flutter in wind
    ctx.fillStyle = '#2C1A1D';
    ctx.beginPath();
    ctx.arc(0, -19, 9, Math.PI, Math.PI * 2);
    const hairFlutter = inAir ? Math.sin(this.jumpAirTime * 14) * 4 : 0;
    ctx.lineTo(9 - (isJumping ? 4 : 0), 10 + hairFlutter);
    ctx.lineTo(-9, 10);
    ctx.closePath();
    ctx.fill();

    // Blossom Hairpin with glowing aura in air
    if (inAir) {
      ctx.fillStyle = 'rgba(255, 166, 181, 0.4)';
      ctx.beginPath();
      ctx.arc(6, -19, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFA6B5';
    ctx.beginPath();
    ctx.arc(6, -19, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.arc(6, -19, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes: Joyful curved squint in jump, normal otherwise
    if (isJumping) {
      ctx.strokeStyle = '#1E1A17';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-3.5, -17, 2, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3.5, -17, 2, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1E1A17';
      ctx.fillRect(-4, -18, 2, 2);
      ctx.fillRect(2, -18, 2, 2);
    }

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(255, 166, 181, 0.7)';
    ctx.beginPath();
    ctx.arc(-5, -15, 2.2, 0, Math.PI * 2);
    ctx.arc(5, -15, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#D92B45';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -14, 3, 0, Math.PI);
    ctx.stroke();

    // Graceful Arms animation
    if (isJumping) {
      // Raised gracefully above head in an elegant ballet curve
      ctx.strokeStyle = '#FCE1CD';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-6, -10, 9, Math.PI * 0.4, Math.PI * 1.3, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(6, -10, 9, Math.PI * 0.6, Math.PI * -0.3, true);
      ctx.stroke();

      // Gold wristlets
      ctx.fillStyle = '#C9A86A';
      ctx.fillRect(-12, -16, 2.5, 2);
      ctx.fillRect(10, -16, 2.5, 2);
    } else if (isFalling) {
      // Arms sweeping outward like delicate wings
      ctx.strokeStyle = '#FCE1CD';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-14, 5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(14, 5);
      ctx.stroke();
    }

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.Player = Player;
  window.EsraaPlayer = EsraaPlayer;
}

/* ==========================================================================
   9. The 5 Game Levels Configuration
   ========================================================================== */

const levels = {
  // MISSION 01: "البداية"
  1: {
    cleanName: "البداية",
    name: "MISSION 01: البداية",
    width: 2400,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 5,
    platforms: [
      { x: 0, y: 550, w: 460, h: 150, type: 'ground' },
      { x: 530, y: 480, w: 140, h: 24, type: 'platform' },
      { x: 740, y: 410, w: 150, h: 24, type: 'platform' },
      { x: 960, y: 470, w: 320, h: 180, type: 'ground' },
      { x: 1350, y: 430, w: 130, h: 22, type: 'moving', minX: 1330, maxX: 1530, speed: 60, dir: 1 },
      // Secret High Pathway
      { x: 1380, y: 280, w: 110, h: 20, type: 'platform' },
      { x: 1600, y: 380, w: 160, h: 24, type: 'platform' },
      { x: 1840, y: 460, w: 160, h: 24, type: 'platform' },
      { x: 2060, y: 540, w: 340, h: 160, type: 'ground' }
    ],
    distractions: [
      { x: 380, y: 505, w: 34, h: 34, icon: '☕', name: 'شاي بلبن', quote: 'سيب الشاي دلوقتي وركز يا أحمد! 😂', active: true },
      { x: 800, y: 365, w: 34, h: 34, icon: '⚽', name: 'ماتش الأهلي', quote: 'ماتش إيه اللي شاغل بالك دلوقتي! 😂', active: true },
      { x: 1210, y: 425, w: 34, h: 34, icon: '💬', name: 'إشعار واتساب', quote: 'سيب الموبايل وركز في الرحلة! 😉', active: true },
      { x: 1720, y: 335, w: 34, h: 34, icon: '🎮', name: 'بلايستيشن', quote: 'اللعب الحقيقي هنا معايا! 😂', active: true }
    ],
    collectibles: [
      { id: 'inf_1_1', x: 280, y: 490, collected: false },
      { id: 'inf_1_2', x: 600, y: 420, collected: false },
      { id: 'inf_1_3', x: 810, y: 350, collected: false },
      { id: 'inf_1_4', x: 1420, y: 370, collected: false },
      { id: 'inf_1_5', x: 1435, y: 230, collected: false } // Hidden high area
    ],
    checkpoints: [
      { x: 1000, y: 410, w: 26, h: 60, reached: false }
    ],
    exitGate: { x: 2310, y: 440, w: 60, h: 100 },
    dialogueTriggers: [
      { x: 1100, speaker: "إسراء", text: "أيوه كده... خطواتك مظبوطة! ❤️", triggered: false }
    ]
  },

  // MISSION 02: "المتاهة"
  2: {
    cleanName: "المتاهة",
    name: "MISSION 02: المتاهة",
    width: 2500,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 4,
    platforms: [
      { x: 0, y: 550, w: 420, h: 150, type: 'ground' },
      { x: 480, y: 460, w: 150, h: 24, type: 'platform' },
      { x: 700, y: 390, w: 160, h: 24, type: 'platform' },
      { x: 940, y: 450, w: 130, h: 22, type: 'moving', minX: 930, maxX: 1120, speed: 65, dir: 1 },
      { x: 1200, y: 520, w: 320, h: 180, type: 'ground' },
      // Hidden upper chamber
      { x: 1400, y: 340, w: 130, h: 22, type: 'platform' },
      { x: 1580, y: 440, w: 150, h: 24, type: 'platform' },
      { x: 1800, y: 540, w: 700, h: 160, type: 'ground' }
    ],
    distractions: [
      { x: 530, y: 415, w: 34, h: 34, icon: '🍕', name: 'بيتزا نص الليل', quote: 'مش وقت أكل يا أحمد... ركز في المفتاح! 🍕😂', active: true },
      { x: 1030, y: 390, w: 34, h: 34, icon: '📱', name: 'ريلز تيك توك', quote: 'هتفضل تسكرول ولا تدور على الخاتم؟ 📱👀', active: true },
      { x: 1620, y: 395, w: 34, h: 34, icon: '🚗', name: 'زحمة الكوبري', quote: 'عامل حسابك متتأخرش عليا! 🚗⏱️', active: true }
    ],
    collectibles: [
      { id: 'inf_2_1', x: 240, y: 490, collected: false },
      { id: 'inf_2_2', x: 780, y: 330, collected: false },
      { id: 'inf_2_3', x: 1300, y: 460, collected: false },
      { id: 'inf_2_4', x: 1465, y: 290, collected: false } // Hidden alcove
    ],
    keyPickup: { x: 780, y: 345, w: 26, h: 26, collected: false },
    ringSealPickup: { x: 1400, y: 475, w: 26, h: 26, collected: false },
    checkpoints: [
      { x: 1240, y: 460, w: 26, h: 60, reached: false }
    ],
    esraaNPC: { x: 1950, y: 490, active: true },
    exitGate: { x: 2360, y: 440, w: 60, h: 100 },
    dialogueTriggers: [
      { x: 150, speaker: "إسراء", text: "المفتاح والوعد هيفتحوا البوابة... دور كويس!", triggered: false }
    ]
  },

  // MISSION 03: "اللقاء"
  3: {
    cleanName: "اللقاء والانتظار",
    name: "MISSION 03: اللقاء والانتظار",
    width: 2600,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 4,
    platforms: [
      { x: 0, y: 550, w: 360, h: 150, type: 'ground' },
      { x: 420, y: 480, w: 120, h: 22, type: 'moving', minX: 410, maxX: 580, speed: 85, dir: 1 },
      { x: 660, y: 410, w: 130, h: 24, type: 'platform' },
      { x: 870, y: 360, w: 120, h: 22, type: 'moving', minX: 860, maxX: 1050, speed: 90, dir: -1 },
      { x: 1140, y: 450, w: 280, h: 150, type: 'ground' },
      { x: 1480, y: 490, w: 130, h: 22, type: 'platform' },
      { x: 1680, y: 410, w: 130, h: 24, type: 'platform' },
      { x: 1890, y: 350, w: 140, h: 24, type: 'platform' },
      { x: 2100, y: 430, w: 140, h: 22, type: 'moving', minX: 2080, maxX: 2260, speed: 95, dir: 1 },
      { x: 2340, y: 530, w: 260, h: 170, type: 'ground' }
    ],
    distractions: [
      { x: 710, y: 365, w: 34, h: 34, icon: '😴', name: 'غفوة 5 دقايق', quote: 'مفيش نوم هنا... المنصات بتتحرك! 😴⚡', active: true },
      { x: 1520, y: 445, w: 34, h: 34, icon: '👗', name: 'فستان الخطوبة', quote: 'لازم تقول تحفة على طول! 👗💅😂', active: true },
      { x: 1930, y: 305, w: 34, h: 34, icon: '📺', name: 'مسلسل تريند', quote: 'المسلسل مش هيهرب... كمل طريقك! 📺🍿', active: true }
    ],
    collectibles: [
      { id: 'inf_3_1', x: 260, y: 490, collected: false },
      { id: 'inf_3_2', x: 720, y: 350, collected: false },
      { id: 'inf_3_3', x: 1260, y: 390, collected: false },
      { id: 'inf_3_4', x: 1950, y: 290, collected: false }
    ],
    checkpoints: [
      { x: 1180, y: 390, w: 26, h: 60, reached: false }
    ],
    esraaNPC: { x: 1220, y: 400, active: true },
    exitGate: { x: 2500, y: 430, w: 60, h: 100 },
    dialogueTriggers: [
      { x: 450, speaker: "إسراء", text: "خلي بالك من المنصات المتحركة...", triggered: false },
      { x: 1150, speaker: "إسراء", text: "وصلت أخيرًا 😂 كنت مستنياني؟", triggered: false, isStoryMeeting: true }
    ]
  },

  // MISSION 04: "دور إسراء ❤️" — ESRAA IS FULLY PLAYABLE!
  4: {
    cleanName: "دور إسراء",
    name: "MISSION 04: دور إسراء ❤️",
    width: 2300,
    height: 700,
    playerStart: { x: 70, y: 480 },
    esraaStart: { x: 380, y: 330 },
    collectiblesRequired: 3,
    platforms: [
      // Starting Ahmed terrace
      { x: 0, y: 550, w: 360, h: 150, type: 'ground' },
      // Esraa's celestial crystal platforms
      { x: 360, y: 380, w: 130, h: 22, type: 'platform' },
      { x: 580, y: 320, w: 130, h: 22, type: 'platform' },
      { x: 800, y: 280, w: 130, h: 22, type: 'moving', minX: 790, maxX: 950, speed: 70, dir: 1 },
      { x: 1060, y: 320, w: 130, h: 22, type: 'platform' },
      { x: 1280, y: 360, w: 140, h: 22, type: 'platform' },
      // Final courtyard terrace
      { x: 1500, y: 550, w: 800, h: 150, type: 'ground' }
    ],
    // 3 Constellation Sun Stones for Esraa to activate
    starStones: [
      { id: 1, x: 640, y: 270, w: 32, h: 32, icon: '🌟', activated: false },
      { id: 2, x: 860, y: 230, w: 32, h: 32, icon: '✨', activated: false },
      { id: 3, x: 1340, y: 310, w: 32, h: 32, icon: '💫', activated: false }
    ],
    distractions: [
      { x: 620, y: 490, w: 34, h: 34, icon: '🍿', name: 'فيلم السهرة', quote: 'الفيلم بعد ما نخلص التحدي! 🍿❤️', active: true },
      { x: 1180, y: 475, w: 34, h: 34, icon: '📸', name: 'سيلفي الخطوبة', quote: 'ابتسمي الأول وأنتِ بتوصلي النجوم! 📸✨', active: true }
    ],
    collectibles: [
      { id: 'inf_4_1', x: 260, y: 490, collected: false },
      { id: 'inf_4_2', x: 640, y: 265, collected: false },
      { id: 'inf_4_3', x: 1340, y: 305, collected: false }
    ],
    checkpoints: [
      { x: 1560, y: 490, w: 26, h: 60, reached: false }
    ],
    exitGate: { x: 2160, y: 450, w: 60, h: 100 }
  },

  // MISSION 05: "طريق اللانهاية ∞"
  5: {
    cleanName: "طريق اللانهاية ∞",
    name: "MISSION 05: طريق اللانهاية ∞",
    width: 2400,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 4,
    platforms: [
      { x: 0, y: 550, w: 440, h: 150, type: 'ground' },
      { x: 500, y: 470, w: 140, h: 24, type: 'platform' },
      { x: 720, y: 400, w: 140, h: 24, type: 'platform' },
      { x: 940, y: 460, w: 120, h: 22, type: 'moving', minX: 930, maxX: 1100, speed: 75, dir: 1 },
      // Grand Temple Pedestal Floor
      { x: 1180, y: 520, w: 1220, h: 180, type: 'ground' }
    ],
    distractions: [
      { x: 550, y: 425, w: 34, h: 34, icon: '😎', name: 'كاريزما زائدة', quote: 'سيب النظارة دي وركز في الباب الأخير! 😎🔑', active: true },
      { x: 770, y: 355, w: 34, h: 34, icon: '🍨', name: 'آيس كريم مانجا', quote: 'الاحتفال بعد ما تفتح بوابة اللانهاية! 🍨✨', active: true },
      { x: 1320, y: 470, w: 34, h: 34, icon: '⏰', name: 'المنبه', quote: 'ده مش حلم يا أحمد... دي الحقيقة! ⏰💍', active: true }
    ],
    collectibles: [
      { id: 'inf_5_1', x: 260, y: 490, collected: false },
      { id: 'inf_5_2', x: 780, y: 340, collected: false },
      { id: 'inf_5_3', x: 1300, y: 460, collected: false },
      { id: 'inf_5_4', x: 1680, y: 460, collected: false }
    ],
    pedestals: [
      { id: 1, x: 1440, y: 475, w: 34, h: 45, item: 'key', icon: '🔑', label: 'المفتاح', inserted: false },
      { id: 2, x: 1660, y: 475, w: 34, h: 45, item: 'ring', icon: '💍', label: 'الوعد', inserted: false }
    ],
    esraaNPC: { x: 2160, y: 470, active: true },
    grandInfinityGate: { x: 1980, y: 380, w: 90, h: 140, open: false },
    checkpoints: [
      { x: 1220, y: 460, w: 26, h: 60, reached: false }
    ]
  }
};

// Aliases for compatibility
levels.level1 = levels[1];
levels.level2 = levels[2];
levels.level3 = levels[3];
levels.level4 = levels[4];
levels.level5 = levels[5];
const levelsConfig = levels;

if (typeof window !== 'undefined') {
  window.levels = levels;
  window.levelsConfig = levelsConfig;
}

/* ==========================================================================
   10. UI Manager
   ========================================================================== */

const UIManager = {
  toastTimeout: null,

  updateHealth() {
    const el = document.getElementById('hud-health');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < gameState.maxHealth; i++) {
      const span = document.createElement('span');
      span.className = 'heart-icon';
      span.textContent = i < gameState.health ? '❤️' : '🤍';
      el.appendChild(span);
    }
  },

  updateCollectibles() {
    const el = document.getElementById('hud-infinity-count');
    if (el) {
      el.textContent = `${gameState.collectiblesCollected}/${gameState.collectiblesRequired}`;
    }
  },

  updateInventory() {
    const keyBadge = document.getElementById('inv-key');
    const ringBadge = document.getElementById('inv-ring');
    if (keyBadge) keyBadge.classList.toggle('hidden', !gameState.inventory.key);
    if (ringBadge) ringBadge.classList.toggle('hidden', !gameState.inventory.ring);
  },

  updateLevelLabel(name) {
    const el = document.getElementById('hud-level-name');
    if (el) el.textContent = name;
  },

  showInteractPrompt(text = 'تفاعل') {
    const prompt = document.getElementById('interact-prompt');
    const label = document.getElementById('interact-prompt-text');
    if (prompt && label) {
      label.textContent = text;
      prompt.classList.remove('hidden');
    }
  },

  hideInteractPrompt() {
    const prompt = document.getElementById('interact-prompt');
    if (prompt) prompt.classList.add('hidden');
  },

  showSystemToast(text) {
    const toast = document.getElementById('system-toast');
    const textEl = document.getElementById('system-toast-text');
    if (!toast || !textEl) return;

    textEl.textContent = text;
    toast.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  },

  showModal(id) {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('active'));
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  },

  closeModals() {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('active'));
  },

  updateLevelSelectUI() {
    for (let i = 1; i <= 5; i++) {
      const card = document.getElementById(`lvl-card-${i}`);
      if (!card) continue;
      const isUnlocked = gameState.unlockedLevels.includes(i);
      if (isUnlocked) {
        card.classList.remove('locked');
        card.classList.add('unlocked');
        const status = card.querySelector('.lvl-status');
        if (status) status.textContent = 'مفتوحة ●';
      } else {
        card.classList.remove('unlocked');
        card.classList.add('locked');
        const status = card.querySelector('.lvl-status');
        if (status) status.textContent = 'مقفولة 🔒';
      }
    }
  }
};

/* ==========================================================================
   11. Main Game Engine Class
   ========================================================================== */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputManager();
    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.particles = new ParticleSystem();
    this.speech = new SpeechBubbleManager();

    this.player = new Player(80, 480);
    this.esraa = new EsraaPlayer(380, 330);
    this.activePlayer = this.player;

    this.currentLevelData = null;
    this.lastTime = 0;
    this.activeInteractable = null;
    this.floatingTexts = [];
    this.fallCount = 0;

    this.initCanvasSize();
    this.bindDOM();
  }

  initCanvasSize() {
    const container = document.getElementById('canvas-container') || document.body;
    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width || window.innerWidth);
    const h = Math.round(rect.height || (window.innerHeight - 52));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.camera.resize(w, h);
  }

  togglePlayerControl() {
    const nextChar = gameState.activeCharacter === 'ahmed' ? 'esraa' : 'ahmed';
    this.switchControlTo(nextChar);
  }

  switchControlTo(character) {
    gameState.activeCharacter = character;
    const banner = document.getElementById('character-switch-banner');
    const textEl = document.getElementById('character-switch-text');
    const subEl = document.getElementById('character-switch-sub');

    const switchBtn = document.getElementById('btn-switch-player');
    const hudIcon = document.getElementById('switch-player-icon');
    const hudName = document.getElementById('switch-player-name');
    const touchIcon = document.getElementById('touch-switch-icon');
    const touchSub = document.getElementById('touch-switch-sub');

    if (character === 'esraa') {
      // Ensure Esraa has valid positioning in levels where she hasn't started yet
      if (this.currentLevelData) {
        const isFarOrOffscreen = isNaN(this.esraa.x) ||
          this.esraa.y > this.currentLevelData.height ||
          Math.hypot(this.esraa.x - this.player.x, this.esraa.y - this.player.y) > 600;

        if (isFarOrOffscreen && gameState.currentLevel !== 4) {
          this.esraa.x = this.player.x + (this.player.facing === 1 ? -32 : 32);
          this.esraa.y = this.player.y;
          this.esraa.velocityX = 0;
          this.esraa.velocityY = 0;
          this.particles.emit(this.esraa.x + 14, this.esraa.y + 24, '#FFA6B5', 14, 100, 0.55);
        }
      }

      this.activePlayer = this.esraa;
      audioManager.playSfx('victory');

      if (switchBtn) switchBtn.classList.add('active-esraa');
      if (hudIcon) hudIcon.textContent = '🤵';
      if (hudName) hudName.textContent = 'أحمد';
      if (touchIcon) touchIcon.textContent = '👰';
      if (touchSub) touchSub.textContent = 'إسراء';

      if (banner && textEl && subEl) {
        textEl.textContent = 'دور إسراء ❤️';
        subEl.textContent = 'خدي الموبايل... دورك تعدي التحدي!';
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 3200);
      }
      UIManager.showSystemToast('تحكم إسراء مفعل الآن ✨ (C أو الزر للتبديل)');
    } else {
      this.activePlayer = this.player;
      audioManager.playSfx('checkpoint');

      if (switchBtn) switchBtn.classList.remove('active-esraa');
      if (hudIcon) hudIcon.textContent = '👰';
      if (hudName) hudName.textContent = 'إسراء';
      if (touchIcon) touchIcon.textContent = '🤵';
      if (touchSub) touchSub.textContent = 'أحمد';

      if (banner && textEl && subEl) {
        textEl.textContent = 'دور أحمد 🎮';
        subEl.textContent = 'رجعي الموبايل لأحمد... الطريق اتفتح!';
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 3200);
      }
      UIManager.showSystemToast('استكمل دور أحمد الآن ❤️ (C أو الزر للتبديل)');
    }
  }

  bindDOM() {
    const handleLayoutChange = () => {
      this.initCanvasSize();
      if (this.currentLevelData && this.activePlayer) {
        this.camera.follow(this.activePlayer, this.currentLevelData.width, this.currentLevelData.height, 1.0);
      }
    };

    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleLayoutChange, 120);
    });

    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => handleLayoutChange());
      ro.observe(canvasContainer);
    }

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) soundBtn.addEventListener('click', () => audioManager.toggle());

    // Character switch toggle button in HUD
    const switchBtn = document.getElementById('btn-switch-player');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        if (gameState.gameStatus === 'playing') {
          this.input.switchRequested = true;
        }
      });
    }

    // Level Select Modal Trigger
    const lvlBtn = document.getElementById('btn-level-select');
    if (lvlBtn) {
      lvlBtn.addEventListener('click', () => {
        UIManager.updateLevelSelectUI();
        UIManager.showModal('modal-level-select');
      });
    }

    const closeLvlBtn = document.getElementById('btn-close-level-select');
    if (closeLvlBtn) {
      closeLvlBtn.addEventListener('click', () => {
        UIManager.closeModals();
        gameState.gameStatus = 'playing';
      });
    }

    // Level Card Clicks
    for (let i = 1; i <= 5; i++) {
      const card = document.getElementById(`lvl-card-${i}`);
      if (card) {
        card.addEventListener('click', () => {
          if (gameState.unlockedLevels.includes(i)) {
            UIManager.closeModals();
            this.loadLevel(i);
          }
        });
      }
    }

    // Next Level from Victory Banner
    const nextLvlBtn = document.getElementById('btn-next-level');
    if (nextLvlBtn) {
      nextLvlBtn.addEventListener('click', () => {
        UIManager.closeModals();
        if (gameState.currentLevel < 5) {
          this.loadLevel(gameState.currentLevel + 1);
        } else {
          this.startFinale();
        }
      });
    }

    // Retry after fall / Game Over
    const retryBtn = document.getElementById('btn-retry-level');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        UIManager.closeModals();
        gameState.health = gameState.maxHealth;
        this.loadLevel(gameState.currentLevel);
      });
    }

    // Reset progress
    const resetProgressBtn = document.getElementById('btn-reset-progress');
    if (resetProgressBtn) {
      resetProgressBtn.addEventListener('click', () => {
        gameState.unlockedLevels = [1];
        gameState.collectedInfinityIds.clear();
        saveProgress();
        UIManager.closeModals();
        this.loadLevel(1);
      });
    }

    // Easter Egg trigger from header brand
    const brandInfinity = document.querySelector('.mission-brand .infinity-gold');
    if (brandInfinity) {
      brandInfinity.addEventListener('click', () => {
        gameState.easterEggClicks++;
        if (gameState.easterEggClicks >= 3) {
          audioManager.playSfx('victory');
          UIManager.showModal('modal-easter-egg');
        }
      });
    }

    const closeEasterBtn = document.getElementById('btn-close-easter');
    if (closeEasterBtn) {
      closeEasterBtn.addEventListener('click', () => {
        document.getElementById('modal-easter-egg').classList.remove('active');
      });
    }

    // Replay Story Button
    const replayBtn = document.getElementById('btn-replay-story');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        UIManager.closeModals();
        this.loadLevel(1);
      });
    }

    // Interactive Bear Couple Opening Screen ("Do you love me? ❤️")
    this.setupIntroHook();

    // Start Game Button in Title Splash
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => {
        UIManager.closeModals();
        this.startMission();
      });
    }

    // Game Over select levels button
    const gameOverLevelsBtn = document.getElementById('btn-game-over-levels');
    if (gameOverLevelsBtn) {
      gameOverLevelsBtn.addEventListener('click', () => {
        UIManager.updateLevelSelectUI();
        UIManager.showModal('modal-level-select');
      });
    }
  }

  setupIntroHook() {
    const btnHookNo = document.getElementById('btn-hook-no');
    const btnHookYes = document.getElementById('btn-hook-yes');
    const hookArena = document.getElementById('hook-decision-arena');
    const hookTaunt = document.getElementById('hook-taunt-msg');
    const bearStage = document.getElementById('bear-couple-stage');

    const girlEyesNormal = document.getElementById('girl-eyes-normal');
    const girlEyesPout = document.getElementById('girl-eyes-pout');
    const girlEyesLove = document.getElementById('girl-eyes-love');
    const girlArmsNormal = document.getElementById('girl-arms-normal');
    const girlArmsCrossed = document.getElementById('girl-arms-crossed');

    let noAttempts = 0;
    const noQuotes = [
      "Really? 🥺",
      "Are you sure? 😂",
      "Think again... 🐻",
      "Not an option! 😉",
      "الزرار ده شكلي هلغيه خالص 😂 اختار YES يلا!"
    ];

    const evadeNoButton = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!btnHookNo || !hookArena) return;

      const arenaRect = hookArena.getBoundingClientRect();
      const btnRect = btnHookNo.getBoundingClientRect();

      const padding = 12;
      const maxX = Math.max(10, arenaRect.width - btnRect.width - padding);
      const maxY = Math.max(10, arenaRect.height - btnRect.height - padding);

      const randomX = Math.floor(Math.random() * maxX);
      const randomY = Math.floor(Math.random() * maxY);

      btnHookNo.style.position = 'absolute';
      btnHookNo.style.left = `${randomX}px`;
      btnHookNo.style.top = `${randomY}px`;

      noAttempts++;
      if (hookTaunt) {
        hookTaunt.textContent = noQuotes[noAttempts % noQuotes.length];
        hookTaunt.style.color = '#FFA6B5';
      }

      // Emotional reaction of the female bear
      if (noAttempts === 1) {
        if (girlEyesNormal) girlEyesNormal.classList.add('hidden');
        if (girlEyesPout) girlEyesPout.classList.remove('hidden');
      } else if (noAttempts >= 2) {
        if (girlArmsNormal) girlArmsNormal.classList.add('hidden');
        if (girlArmsCrossed) girlArmsCrossed.classList.remove('hidden');
      }

      audioManager.playSfx('click');
    };

    if (btnHookNo) {
      btnHookNo.addEventListener('mouseenter', evadeNoButton);
      btnHookNo.addEventListener('pointerenter', evadeNoButton);
      btnHookNo.addEventListener('pointerdown', evadeNoButton);
      btnHookNo.addEventListener('touchstart', evadeNoButton, { passive: false });
    }

    if (btnHookYes) {
      btnHookYes.addEventListener('click', () => {
        if (!gameState.soundEnabled) audioManager.toggle();
        audioManager.playSfx('victory');

        // Romantic bear hug animation & heart explosion
        if (bearStage) bearStage.classList.add('hugging');
        if (girlEyesNormal) girlEyesNormal.classList.add('hidden');
        if (girlEyesPout) girlEyesPout.classList.add('hidden');
        if (girlEyesLove) girlEyesLove.classList.remove('hidden');

        if (hookArena) hookArena.style.pointerEvents = 'none';
        if (hookTaunt) {
          hookTaunt.textContent = "أيوة كده ❤️";
          hookTaunt.style.color = '#7BE495';
        }

        // Cinematic smooth transition to minimal Title Splash
        setTimeout(() => {
          UIManager.closeModals();
          UIManager.showModal('modal-title-splash');
        }, 1250);
      });
    }
  }

  startMission() {
    this.loadLevel(1);
  }

  loadLevel(levelNumber) {
    gameState.currentLevel = levelNumber;
    gameState.collectiblesCollected = 0;
    gameState.gameStatus = 'playing';

    // Deep clone level template
    this.currentLevelData = JSON.parse(JSON.stringify(levelsConfig[levelNumber]));
    if (!this.currentLevelData.hazards) this.currentLevelData.hazards = this.currentLevelData.distractions;

    // Filter out already collected infinity symbols to prevent duplicates
    if (this.currentLevelData.collectibles) {
      this.currentLevelData.collectibles = this.currentLevelData.collectibles.filter(
        c => !gameState.collectedInfinityIds.has(c.id)
      );
    }
    this.currentLevelData.infinitySymbols = this.currentLevelData.collectibles;
    gameState.collectiblesRequired = this.currentLevelData.collectiblesRequired || 5;

    // Reset player position
    const start = this.currentLevelData.playerStart;
    this.player.x = start.x;
    this.player.y = start.y;
    this.player.velocityX = 0;
    this.player.velocityY = 0;

    // Level 4 is Esraa's Dedicated Playable Challenge
    if (levelNumber === 4) {
      const eStart = this.currentLevelData.esraaStart || { x: 380, y: 330 };
      this.esraa.x = eStart.x;
      this.esraa.y = eStart.y;
      this.esraa.velocityX = 0;
      this.esraa.velocityY = 0;
      gameState.esraaTimer = 0;
      gameState.esraaShortcutUnlocked = false;
      this.switchControlTo('esraa');
    } else {
      this.switchControlTo('ahmed');
      if (this.currentLevelData.esraaNPC && this.currentLevelData.esraaNPC.active) {
        this.esraa.x = this.currentLevelData.esraaNPC.x;
        this.esraa.y = this.currentLevelData.esraaNPC.y;
      }
    }

    // Set Checkpoint
    gameState.checkpoints[levelNumber] = { x: start.x, y: start.y };

    // Minimal Level Intro Banner (1.8s then dissolves)
    const banner = document.getElementById('level-intro-banner');
    const numEl = document.getElementById('level-intro-number');
    const titleEl = document.getElementById('level-intro-title');
    if (banner && numEl && titleEl) {
      numEl.textContent = `MISSION 0${levelNumber}`;
      titleEl.textContent = this.currentLevelData.cleanName || `المرحلة ${levelNumber}`;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 2200);
    }

    UIManager.updateLevelLabel(this.currentLevelData.name);
    UIManager.updateCollectibles();
    UIManager.updateHealth();
    UIManager.updateInventory();

    audioManager.playSfx('checkpoint');
  }

  respawnAtCheckpoint() {
    this.fallCount++;
    const targetPlayer = this.activePlayer;
    let cp = gameState.checkpoints[gameState.currentLevel];
    if (gameState.currentLevel === 4 && gameState.activeCharacter === 'esraa') {
      cp = this.currentLevelData.esraaStart || { x: 380, y: 330 };
    } else if (!cp) {
      cp = this.currentLevelData.playerStart;
    }

    targetPlayer.x = cp.x;
    targetPlayer.y = cp.y;
    targetPlayer.velocityX = 0;
    targetPlayer.velocityY = 0;
    audioManager.playSfx('hit');

    // Occasional reactive dialogue on repeated falls
    if (this.fallCount >= 2) {
      const fallQuotes = [
        "إنت بتقع في نفس المكان كل مرة؟ 😂",
        "قولتلك خلي بالك 😂",
        "نبدأ من هنا... عادي ❤️",
        "ركز شوية! 😉"
      ];
      const quote = fallQuotes[Math.floor(Math.random() * fallQuotes.length)];
      this.speech.add('إسراء', quote, targetPlayer, 2.8);
    }
  }

  handleGameOver() {
    gameState.gameStatus = 'game_over';
    UIManager.showModal('modal-game-over');
  }

  completeLevel(levelNumber) {
    audioManager.playSfx('victory');
    const nextLvl = levelNumber + 1;
    if (nextLvl <= 5 && !gameState.unlockedLevels.includes(nextLvl)) {
      gameState.unlockedLevels.push(nextLvl);
      saveProgress();
    }

    if (levelNumber === 5) {
      this.startFinale();
      return;
    }

    gameState.gameStatus = 'level_complete';
    const titleEl = document.getElementById('complete-level-title');
    const esraaEl = document.getElementById('complete-level-esraa');
    const unlockEl = document.getElementById('unlock-text');

    const finishQuotes = {
      1: "إسراء: ماشي... نعديهالك ونشوف المرحلة الجاية! ❤️",
      2: "إسراء: أهو كده أثبت إنك بتعرف تدور وتفهم اللغز.",
      3: "إسراء: برافو! مكنتش متوقعة إنك هتعدي المنصات دي.",
      4: "إسراء: شفت بقى لما أنا لعبت فتحتلك الطريق إزاي؟ 😂❤️",
      5: "إسراء: أتممت المهمة كلها... خطوة الخطوبة تمت بنجاح!"
    };

    if (titleEl) titleEl.textContent = `MISSION 0${levelNumber}: ✓`;
    if (esraaEl) esraaEl.textContent = finishQuotes[levelNumber] || "إسراء: ممتاز!";
    if (unlockEl) {
      unlockEl.textContent = nextLvl <= 5 ? `تم فتح المرحلة ${nextLvl} بنجاح` : `تم فتح الخاتمة النهائية`;
    }

    UIManager.showModal('modal-level-complete');
  }

  startFinale() {
    gameState.gameStatus = 'finale';
    UIManager.showModal('modal-finale');
  }

  handleInteractAction() {
    if (!this.activeInteractable) return;
    const act = this.activeInteractable;

    // Chests
    if (act.type === 'chest') {
      const chest = act.data;
      if (!chest.opened) {
        chest.opened = true;
        gameState.collectiblesCollected++;
        gameState.inventory.infinity++;
        UIManager.updateCollectibles();
        UIManager.showSystemToast('تم فتح الصندوق والعثور على رمز ∞ مخفي!');
        soundManager.playCollect('chest');
        this.particles.emit(chest.x + 17, chest.y + 14, '#C9A86A', 16, 110, 0.6);
        this.speech.add('إسراء', 'لقيت حاجة محدش كان شايفها... ✨', this.activePlayer, 2.5);
      }
    }

    // Key in Level 2
    else if (act.type === 'key') {
      const keyObj = act.data;
      if (!keyObj.collected) {
        keyObj.collected = true;
        gameState.inventory.key = true;
        UIManager.updateInventory();
        UIManager.showSystemToast('تم الحصول على المفتاح الذهبي 🔑');
        soundManager.playCollect('key');
        this.particles.emit(keyObj.x + 13, keyObj.y + 13, '#C9A86A', 14, 100, 0.5);
      }
    }

    // Ring Seal in Level 2
    else if (act.type === 'ring_seal') {
      const sealObj = act.data;
      if (!sealObj.collected) {
        sealObj.collected = true;
        gameState.inventory.ring = true;
        UIManager.updateInventory();
        UIManager.showSystemToast('تم الحصول على رمز الوعد 💍');
        soundManager.playCollect('ring');
        this.particles.emit(sealObj.x + 13, sealObj.y + 13, '#FFA6B5', 14, 100, 0.5);
      }
    }

    // Level 5 Pedestals
    else if (act.type === 'pedestal') {
      const ped = act.data;
      if (!ped.inserted) {
        if (ped.item === 'key' && gameState.inventory.key) {
          ped.inserted = true;
          audioManager.playSfx('click');
          this.particles.emit(ped.x + 17, ped.y + 15, '#C9A86A', 16, 120, 0.6);
          UIManager.showSystemToast('CLICK! تم تركيب المفتاح');
        } else if (ped.item === 'ring' && gameState.inventory.ring) {
          ped.inserted = true;
          audioManager.playSfx('click');
          this.particles.emit(ped.x + 17, ped.y + 15, '#FFA6B5', 16, 120, 0.6);
          UIManager.showSystemToast('CLICK! تم تركيب رمز الوعد');
        } else {
          UIManager.showSystemToast(`محتاج ${ped.label} لتركيبه هنا!`);
        }

        const allInserted = this.currentLevelData.pedestals.every(p => p.inserted);
        if (allInserted) {
          this.currentLevelData.grandInfinityGate.open = true;
          audioManager.playSfx('door');
          this.speech.add('إسراء', 'بوابة اللانهاية اتفتحت... ادخل يا أحمد ❤️', this.esraa, 3.5);
          UIManager.showSystemToast('تم فتح بوابة اللانهاية الكبرى!');
        }
      }
    }
  }

  update(dt) {
    if (gameState.gameStatus !== 'playing') return;

    // Control switch logic in the main loop (toggling player input between Ahmed and Esraa)
    if (this.input.switchRequested) {
      this.input.switchRequested = false;
      this.togglePlayerControl();
    }

    // Moving platforms
    if (this.currentLevelData && this.currentLevelData.platforms) {
      for (const p of this.currentLevelData.platforms) {
        if (p.type === 'moving') {
          p.x += p.speed * p.dir * dt;
          if (p.x >= p.maxX) {
            p.x = p.maxX;
            p.dir = -1;
          } else if (p.x <= p.minX) {
            p.x = p.minX;
            p.dir = 1;
          }
        }
      }
    }

    // Update characters
    if (gameState.activeCharacter === 'ahmed') {
      this.player.update(dt, this.input, this.currentLevelData.platforms);
      if (this.currentLevelData.esraaNPC && this.currentLevelData.esraaNPC.active) {
        this.esraa.update(dt, null, this.currentLevelData.platforms, false);
      }
    } else {
      // Esraa is currently active & playable
      gameState.esraaTimer += dt;
      this.esraa.update(dt, this.input, this.currentLevelData.platforms, true);
      this.player.update(dt, null, this.currentLevelData.platforms);
    }

    // Camera follow the currently controlled player with smooth interpolation and dt
    this.camera.follow(this.activePlayer, this.currentLevelData.width, this.currentLevelData.height, dt);

    // Fall into bottom pit
    if (this.activePlayer.y > this.currentLevelData.height + 60) {
      this.activePlayer.takeDamage();
    }

    // Infinity Collectibles Collection (DISAPPEARS IMMEDIATELY BUG FIX)
    if (this.currentLevelData.collectibles) {
      for (let i = this.currentLevelData.collectibles.length - 1; i >= 0; i--) {
        const c = this.currentLevelData.collectibles[i];
        if (c.collected || gameState.collectedInfinityIds.has(c.id)) {
          this.currentLevelData.collectibles.splice(i, 1);
          continue;
        }

        const center = this.activePlayer.getCenter();
        const dist = Math.hypot(center.x - c.x, center.y - c.y);
        if (dist < 32) {
          c.collected = true;
          gameState.collectedInfinityIds.add(c.id);
          this.currentLevelData.collectibles.splice(i, 1);
          this.currentLevelData.infinitySymbols = this.currentLevelData.collectibles;

          gameState.collectiblesCollected++;
          gameState.totalInfinityFound++;
          UIManager.updateCollectibles();
          soundManager.playCollect('infinity');

          this.particles.emit(c.x, c.y, '#C9A86A', 16, 120, 0.6);
          this.particles.emit(c.x, c.y, '#FFA6B5', 8, 90, 0.4);

          this.floatingTexts.push({
            text: '+1 ∞',
            x: c.x,
            y: c.y - 12,
            vy: -45,
            life: 0.85,
            maxLife: 0.85,
            color: '#E7D5B0'
          });

          UIManager.showSystemToast('تم جمع رمز ∞');
          saveProgress();
        }
      }
    }

    // Level 4: Esraa's Star Stones
    if (gameState.currentLevel === 4 && this.currentLevelData.starStones) {
      for (const stone of this.currentLevelData.starStones) {
        if (!stone.activated) {
          const center = this.activePlayer.getCenter();
          const dist = Math.hypot(center.x - stone.x, center.y - stone.y);
          if (dist < 34) {
            stone.activated = true;
            audioManager.playSfx('checkpoint');
            this.particles.emit(stone.x, stone.y, '#FFA6B5', 18, 130, 0.6);

            // Construct bridge parts across chasm for Ahmed
            if (stone.id === 1) {
              this.currentLevelData.platforms.push({ x: 380, y: 550, w: 340, h: 26, type: 'ground' });
              UIManager.showSystemToast('تم تنشيط نجمة اللانهاية الأولى! 🌟');
            } else if (stone.id === 2) {
              this.currentLevelData.platforms.push({ x: 720, y: 550, w: 340, h: 26, type: 'ground' });
              UIManager.showSystemToast('تم تنشيط نجمة اللانهاية الثانية! ✨');
            } else if (stone.id === 3) {
              this.currentLevelData.platforms.push({ x: 1060, y: 550, w: 440, h: 26, type: 'ground' });
              UIManager.showSystemToast('اكتمل جسر اللانهاية! 💫');

              // Performance check
              if (gameState.esraaTimer <= 35) {
                gameState.esraaPerformance = 'stellar';
                gameState.esraaShortcutUnlocked = true;
                // Add elevated golden shortcut bridge
                this.currentLevelData.platforms.push({ x: 500, y: 440, w: 600, h: 20, type: 'platform' });
                this.speech.add('إسراء', 'أداء رائع! فتحتلك طريق دهبي مختصر! ⭐⭐⭐', this.esraa, 3.5);
              } else {
                this.speech.add('إسراء', 'فتحتلك الطريق كامل... انطلق يا أحمد! ❤️', this.esraa, 3.2);
              }

              // Switch control back to Ahmed after a moment
              setTimeout(() => {
                this.switchControlTo('ahmed');
              }, 2200);
            }
          }
        }
      }
    }

    // Distraction Hazards / Obstacles
    if (this.currentLevelData.hazards) {
      for (const d of this.currentLevelData.hazards) {
        if (!d.active) continue;
        const center = this.activePlayer.getCenter();
        const dist = Math.hypot(center.x - (d.x + d.w / 2), center.y - (d.y + d.h / 2));
        if (dist < 34) {
          if (!d.hitCooldown || Date.now() - d.hitCooldown > 2200) {
            d.hitCooldown = Date.now();
            audioManager.playSfx('hit');
            this.particles.emit(d.x + d.w / 2, d.y + d.h / 2, '#FFA6B5', 12, 90, 0.45);
            this.speech.add('إسراء', d.quote, this.activePlayer, 3.0);
            UIManager.showSystemToast(`عقبة تشتيت: ${d.name}! ⚠️`);
            this.activePlayer.velocityX = (this.activePlayer.x < d.x ? -1 : 1) * 160;
            this.activePlayer.velocityY = -180;
          }
        }
      }
    }

    // Level 3 Evasive NO Node
    if (gameState.currentLevel === 3) {
      const lvl = this.currentLevelData;
      if (lvl.noNode && lvl.noNode.active) {
        const distNo = Math.hypot(this.player.x - lvl.noNode.x, this.player.y - lvl.noNode.y);
        if (distNo < 130) {
          lvl.noNode.x += 160 * dt;
          if (lvl.noNode.x > 1850) {
            lvl.noNode.active = false;
            this.particles.emit(lvl.noNode.x, lvl.noNode.y, '#E84A64', 14, 110, 0.5);
            this.speech.add('إسراء', 'الـ NO هربت خلاص... مفيش غير YES! 😂❤️', this.player, 3.0);
          }
        }
      }
    }

    // Story dialogue trigger in Level 3
    if (gameState.currentLevel === 3 && this.currentLevelData.dialogueTriggers) {
      for (const trig of this.currentLevelData.dialogueTriggers) {
        if (!trig.triggered && this.player.x >= trig.x) {
          trig.triggered = true;
          if (trig.isStoryMeeting) {
            this.speech.add('إسراء', 'وصلت أخيرًا 😂', this.esraa, 2.5);
            setTimeout(() => {
              this.speech.add('أحمد', 'كنتِ مستنياني؟', this.player, 2.5);
            }, 2600);
            setTimeout(() => {
              this.speech.add('إسراء', 'يمكن... مكملين سوا! ❤️', this.esraa, 2.5);
            }, 5200);
          } else {
            this.speech.add(trig.speaker, trig.text, this.player, 2.8);
          }
        }
      }
    }

    // Checkpoints
    if (this.currentLevelData.checkpoints) {
      for (const cp of this.currentLevelData.checkpoints) {
        if (!cp.reached) {
          const center = this.activePlayer.getCenter();
          if (Math.hypot(center.x - (cp.x + cp.w / 2), center.y - (cp.y + cp.h / 2)) < 36) {
            cp.reached = true;
            gameState.checkpoints[gameState.currentLevel] = { x: cp.x, y: cp.y };
            audioManager.playSfx('checkpoint');
            this.particles.emit(cp.x + cp.w / 2, cp.y + cp.h / 2, '#7BE495', 16, 120, 0.6);
            UIManager.showSystemToast('تم حفظ نقطة التقدم بنجاح ✨');
            this.speech.add('إسراء', 'أهو كده! ❤️', this.activePlayer, 2.0);
          }
        }
      }
    }

    // Interactable proximity check
    this.checkInteractables();

    // Standard Exit Gates
    if (this.currentLevelData.exitGate) {
      const gate = this.currentLevelData.exitGate;
      const center = this.activePlayer.getCenter();
      if (Math.hypot(center.x - (gate.x + gate.w / 2), center.y - (gate.y + gate.h / 2)) < 42) {
        this.completeLevel(gameState.currentLevel);
      }
    }

    // Level 5 Grand Infinity Gate
    if (gameState.currentLevel === 5 && this.currentLevelData.grandInfinityGate) {
      const gGate = this.currentLevelData.grandInfinityGate;
      if (gGate.open) {
        const center = this.player.getCenter();
        if (Math.hypot(center.x - (gGate.x + gGate.w / 2), center.y - (gGate.y + gGate.h / 2)) < 55) {
          this.startFinale();
        }
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Particles & Speech Bubbles
    this.particles.update(dt);
    this.speech.update(dt);
  }

  checkInteractables() {
    this.activeInteractable = null;
    let found = null;
    const center = this.activePlayer.getCenter();

    // Key in Level 2
    if (this.currentLevelData.keyPickup && !this.currentLevelData.keyPickup.collected) {
      const k = this.currentLevelData.keyPickup;
      if (Math.hypot(center.x - (k.x + k.w / 2), center.y - (k.y + k.h / 2)) < 38) {
        found = { type: 'key', data: k, text: 'استلام المفتاح 🔑' };
      }
    }

    // Ring Seal in Level 2
    if (!found && this.currentLevelData.ringSealPickup && !this.currentLevelData.ringSealPickup.collected) {
      const r = this.currentLevelData.ringSealPickup;
      if (Math.hypot(center.x - (r.x + r.w / 2), center.y - (r.y + r.h / 2)) < 38) {
        found = { type: 'ring_seal', data: r, text: 'استلام رمز الوعد 💍' };
      }
    }

    // Pedestals in Level 5
    if (!found && this.currentLevelData.pedestals) {
      for (const ped of this.currentLevelData.pedestals) {
        if (!ped.inserted && Math.hypot(center.x - (ped.x + ped.w / 2), center.y - (ped.y + ped.h / 2)) < 42) {
          found = { type: 'pedestal', data: ped, text: `تركيب ${ped.label} ${ped.icon}` };
          break;
        }
      }
    }

    if (found) {
      this.activeInteractable = found;
      UIManager.showInteractPrompt(found.text);
    } else {
      UIManager.hideInteractPrompt();
    }
  }

  render() {
    const ctx = this.ctx;
    const viewW = this.camera.viewportWidth;
    const viewH = this.camera.viewportHeight;
    const cam = this.camera;
    const zoom = cam.zoom;
    const dpr = this.dpr || 1;

    // Ensure crisp rendering with effective DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);

    // Romantic Night Sky (Full screen background)
    ctx.fillStyle = '#0B0B0D';
    ctx.fillRect(0, 0, viewW, viewH);

    // Parallax Layer 1: Stars
    const starParallaxX = cam.x * 0.08;
    ctx.fillStyle = '#C9A86A';
    for (let i = 0; i < 48; i++) {
      const sx = ((i * 71 - starParallaxX) % (viewW + 100) + (viewW + 100)) % (viewW + 100) - 50;
      const sy = (i * 49) % (viewH * 0.65);
      ctx.globalAlpha = 0.25 + (i % 5) * 0.12;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Parallax Layer 2: Drifting Soft Clouds
    const cloudParallaxX = cam.x * 0.15 + (Date.now() / 1000) * 12;
    ctx.fillStyle = 'rgba(28, 25, 38, 0.45)';
    for (let c = 0; c < 5; c++) {
      const cx = ((c * 420 - cloudParallaxX) % (viewW + 400) + (viewW + 400)) % (viewW + 400) - 200;
      const cy = 60 + c * 35;
      ctx.beginPath();
      ctx.arc(cx, cy, 38 * zoom, 0, Math.PI * 2);
      ctx.arc(cx + 34 * zoom, cy - 10 * zoom, 48 * zoom, 0, Math.PI * 2);
      ctx.arc(cx + 74 * zoom, cy, 38 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!this.currentLevelData) return;

    // Platforms
    for (const p of this.currentLevelData.platforms) {
      const sx = cam.toScreenX(p.x);
      const sy = cam.toScreenY(p.y);
      const sw = Math.ceil(p.w * zoom);
      const sh = Math.ceil(p.h * zoom);

      if (sx + sw < 0 || sx > viewW || sy + sh < 0 || sy > viewH) continue;

      if (p.type === 'ground') {
        ctx.fillStyle = '#C9A86A';
        ctx.fillRect(sx, sy, sw, Math.max(3, Math.round(4 * zoom)));

        ctx.fillStyle = '#1E1E28';
        ctx.fillRect(sx, sy + Math.max(3, Math.round(4 * zoom)), sw, sh - Math.max(3, Math.round(4 * zoom)));

        ctx.fillStyle = '#161622';
        ctx.fillRect(sx, sy + Math.round(18 * zoom), sw, Math.max(0, sh - Math.round(18 * zoom)));
      } else {
        ctx.fillStyle = '#E7D5B0';
        ctx.fillRect(sx, sy, sw, Math.max(2, Math.round(3 * zoom)));

        ctx.fillStyle = '#2A2A38';
        ctx.fillRect(sx, sy + Math.max(2, Math.round(3 * zoom)), sw, sh - Math.max(2, Math.round(3 * zoom)));

        ctx.strokeStyle = 'rgba(201, 168, 106, 0.4)';
        ctx.lineWidth = Math.max(1, Math.round(1 * zoom));
        ctx.strokeRect(sx, sy, sw, sh);
      }
    }

    // Collectibles (Infinity Symbols — VISUALLY DISAPPEARS INSTANTLY ON PICKUP)
    if (this.currentLevelData.collectibles) {
      for (const c of this.currentLevelData.collectibles) {
        if (c.collected || gameState.collectedInfinityIds.has(c.id)) continue;

        const sx = cam.toScreenX(c.x);
        const sy = cam.toScreenY(c.y);
        const bob = Math.sin(Date.now() / 250 + c.x) * 4 * zoom;

        ctx.save();
        ctx.translate(sx, sy + bob);
        ctx.scale(zoom, zoom);

        ctx.fillStyle = 'rgba(201, 168, 106, 0.22)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#E7D5B0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('∞', 0, 0);

        ctx.restore();
      }
    }

    // Level 4: Star Stones
    if (gameState.currentLevel === 4 && this.currentLevelData.starStones) {
      for (const stone of this.currentLevelData.starStones) {
        const sx = cam.toScreenX(stone.x);
        const sy = cam.toScreenY(stone.y);
        const bob = Math.sin(Date.now() / 200 + stone.x) * 3 * zoom;

        ctx.save();
        ctx.translate(sx, sy + bob);
        ctx.scale(zoom, zoom);

        ctx.fillStyle = stone.activated ? 'rgba(123, 228, 149, 0.3)' : 'rgba(255, 166, 181, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stone.activated ? '✓' : stone.icon, 0, 0);

        ctx.restore();
      }
    }

    // Distraction Hazards
    if (this.currentLevelData.hazards) {
      for (const d of this.currentLevelData.hazards) {
        if (!d.active) continue;
        const sx = cam.toScreenX(d.x);
        const sy = cam.toScreenY(d.y);
        const sw = Math.ceil(d.w * zoom);
        const sh = Math.ceil(d.h * zoom);

        if (sx + sw < 0 || sx > viewW || sy + sh + 24 < 0 || sy > viewH) continue;

        const bob = Math.sin(Date.now() / 280 + d.x) * 3 * zoom;

        ctx.save();
        ctx.translate(sx + sw / 2, sy + sh / 2 + bob);
        ctx.scale(zoom, zoom);

        ctx.fillStyle = 'rgba(232, 74, 100, 0.16)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.icon, 0, -2);

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#FFA6B5';
        ctx.fillText(d.name, 0, 22);

        ctx.restore();
      }
    }

    // Key in Level 2
    if (this.currentLevelData.keyPickup && !this.currentLevelData.keyPickup.collected) {
      const k = this.currentLevelData.keyPickup;
      const sx = cam.toScreenX(k.x);
      const sy = cam.toScreenY(k.y);
      const bob = Math.sin(Date.now() / 200) * 3 * zoom;

      ctx.save();
      ctx.translate(sx + (k.w * zoom) / 2, sy + (k.h * zoom) / 2 + bob);
      ctx.scale(zoom, zoom);
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔑', 0, 0);
      ctx.restore();
    }

    // Ring Seal in Level 2
    if (this.currentLevelData.ringSealPickup && !this.currentLevelData.ringSealPickup.collected) {
      const r = this.currentLevelData.ringSealPickup;
      const sx = cam.toScreenX(r.x);
      const sy = cam.toScreenY(r.y);
      const bob = Math.sin(Date.now() / 220) * 3 * zoom;

      ctx.save();
      ctx.translate(sx + (r.w * zoom) / 2, sy + (r.h * zoom) / 2 + bob);
      ctx.scale(zoom, zoom);
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💍', 0, 0);
      ctx.restore();
    }

    // Checkpoints
    if (this.currentLevelData.checkpoints) {
      for (const cp of this.currentLevelData.checkpoints) {
        const sx = cam.toScreenX(cp.x);
        const sy = cam.toScreenY(cp.y);
        const ch = Math.ceil(cp.h * zoom);

        ctx.strokeStyle = cp.reached ? '#7BE495' : 'rgba(201, 168, 106, 0.5)';
        ctx.lineWidth = Math.max(2, Math.round(3 * zoom));
        ctx.beginPath();
        ctx.moveTo(sx, sy + ch);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        ctx.fillStyle = cp.reached ? '#7BE495' : '#C9A86A';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 18 * zoom, sy + 7 * zoom);
        ctx.lineTo(sx, sy + 14 * zoom);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Level 5 Pedestals
    if (this.currentLevelData.pedestals) {
      for (const ped of this.currentLevelData.pedestals) {
        const sx = cam.toScreenX(ped.x);
        const sy = cam.toScreenY(ped.y);
        const sw = Math.ceil(ped.w * zoom);
        const sh = Math.ceil(ped.h * zoom);

        ctx.fillStyle = '#2A2A38';
        ctx.fillRect(sx, sy + 15 * zoom, sw, sh - 15 * zoom);
        ctx.strokeStyle = '#C9A86A';
        ctx.strokeRect(sx, sy + 15 * zoom, sw, sh - 15 * zoom);

        ctx.save();
        ctx.translate(sx + sw / 2, sy + 8 * zoom);
        ctx.scale(zoom, zoom);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ped.inserted ? ped.icon : '⚪', 0, 0);
        ctx.restore();
      }
    }

    // Grand Infinity Gate in Level 5
    if (this.currentLevelData.grandInfinityGate) {
      const gGate = this.currentLevelData.grandInfinityGate;
      const sx = cam.toScreenX(gGate.x);
      const sy = cam.toScreenY(gGate.y);
      const sw = Math.ceil(gGate.w * zoom);
      const sh = Math.ceil(gGate.h * zoom);

      ctx.fillStyle = gGate.open ? 'rgba(123, 228, 149, 0.25)' : 'rgba(20, 20, 30, 0.95)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = gGate.open ? '#7BE495' : '#C9A86A';
      ctx.lineWidth = Math.max(2, Math.round(4 * zoom));
      ctx.strokeRect(sx, sy, sw, sh);

      ctx.save();
      ctx.translate(sx + sw / 2, sy + sh / 2 + 10 * zoom);
      ctx.scale(zoom, zoom);
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = gGate.open ? '#7BE495' : '#E7D5B0';
      ctx.textAlign = 'center';
      ctx.fillText('∞', 0, 0);
      ctx.restore();
    }

    // Standard Exit Gates
    if (this.currentLevelData.exitGate) {
      const gate = this.currentLevelData.exitGate;
      const sx = cam.toScreenX(gate.x);
      const sy = cam.toScreenY(gate.y);
      const sw = Math.ceil(gate.w * zoom);
      const sh = Math.ceil(gate.h * zoom);

      ctx.fillStyle = 'rgba(25, 25, 36, 0.92)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#C9A86A';
      ctx.lineWidth = Math.max(2, Math.round(3 * zoom));
      ctx.strokeRect(sx, sy, sw, sh);

      ctx.beginPath();
      ctx.arc(sx + sw / 2, sy, sw / 2, Math.PI, 0);
      ctx.stroke();

      ctx.save();
      ctx.translate(sx + sw / 2, sy + 55 * zoom);
      ctx.scale(zoom, zoom);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#E7D5B0';
      ctx.textAlign = 'center';
      ctx.fillText('∞', 0, 0);
      ctx.restore();
    }

    // Draw Characters
    // Draw Esraa if active, in Level 4, NPC active, or present in level
    if (gameState.activeCharacter === 'esraa' || gameState.currentLevel === 4 || (this.currentLevelData.esraaNPC && this.currentLevelData.esraaNPC.active) || this.esraa.x > 0) {
      this.esraa.draw(ctx, this.camera);
    }
    this.player.draw(ctx, this.camera);

    // Subtle Player Focus / Spotlight effect (Requirement 6)
    if (this.activePlayer) {
      const charScreenX = cam.toScreenX(this.activePlayer.x + this.activePlayer.width / 2);
      const charScreenY = cam.toScreenY(this.activePlayer.y + this.activePlayer.height / 2);

      // 1. Soft ambient aura around active character
      const auraRadius = 82 * zoom;
      const isEsraa = gameState.activeCharacter === 'esraa';
      const auraGrad = ctx.createRadialGradient(
        charScreenX, charScreenY, 8,
        charScreenX, charScreenY, auraRadius
      );
      auraGrad.addColorStop(0, isEsraa ? 'rgba(255, 166, 181, 0.16)' : 'rgba(201, 168, 106, 0.14)');
      auraGrad.addColorStop(0.5, isEsraa ? 'rgba(255, 166, 181, 0.05)' : 'rgba(201, 168, 106, 0.04)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(charScreenX, charScreenY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Soft environmental contrast vignette at canvas edges (without darkening whole screen)
      const vigGrad = ctx.createRadialGradient(
        charScreenX, charScreenY, Math.min(viewW, viewH) * 0.38,
        viewW / 2, viewH / 2, Math.max(viewW, viewH) * 0.82
      );
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(1, 'rgba(11, 11, 13, 0.24)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
    }

    // Floating Pickups Text (+1 ∞)
    for (const ft of this.floatingTexts) {
      const sx = cam.toScreenX(ft.x);
      const sy = cam.toScreenY(ft.y);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, ft.life * 1.5);
      ctx.fillText(ft.text, sx, sy);
    }
    ctx.globalAlpha = 1.0;

    // Draw Particles
    this.particles.draw(ctx, this.camera);

    // Draw Speech Bubbles
    this.speech.draw(ctx, this.camera);
  }

  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  start() {
    this.loadLevel(1);
    gameState.gameStatus = 'paused';
    UIManager.showModal('modal-intro-hook');
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Global instance
let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  gameInstance = new Game();
  gameInstance.start();

  // Seamlessly unlock and resume audio context on first user interaction
  const unlockAudio = () => {
    soundManager.initContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
});
