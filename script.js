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
        } else if (type === 'attack') {
          // Punch / power strike woosh + resonant impact
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.14);
        } else if (type === 'switch') {
          // Duo character swap chime
          const swNotes = [587.33, 880.00];
          swNotes.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const t = now + idx * 0.05;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.exponentialRampToValueAtTime(0.08, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.23);
          });
        } else if (type === 'lever') {
          // Mechanical gear/lever switch
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.11);
        } else if (type === 'plate') {
          // Deep stone pressure plate trigger
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === 'smash') {
          // Breakable barrier shatter
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'defeat') {
          // Enemy defeated sparkle pop
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.13);
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
      if (e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'KeyJ' || e.code === 'KeyZ') {
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
      if (w <= 335) return 1.62;
      if (w <= 365) return 1.50;
      if (w <= 395) return 1.42;
      if (w <= 435) return 1.32;
      return 1.25;
    } else {
      // Landscape: tuned for strong character presence (8-14%+ screen height)
      if (h <= 390) return 1.32;
      if (h <= 450) return 1.26;
      if (h <= 600) return 1.20;
      return 1.15;
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
    this.width = 30;
    this.height = 54;
    this.speed = 225;
    this.jumpForce = 525;
    this.gravity = 1180;
    this.grounded = false;
    this.facing = 1;
    this.state = 'idle'; // 'idle' | 'run' | 'jump' | 'fall' | 'push' | 'attack'
    this.runCycle = 0;
    this.breathCycle = Math.random() * Math.PI * 2;
    this.blinkTimer = Math.random() * 3 + 2;
    this.isBlinking = false;
    this.invulnerableTimer = 0;
    this.jumpCount = 0;
    this.maxJumps = 2; // Ahmed ability: Double Jump!
    this.character = 'ahmed';
    this.attackCooldown = 0;
    this.attackTimer = 0;
    this.isAttacking = false;
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
      this.jumpCount = this.grounded ? 1 : 2;
      this.velocityY = -(force !== null ? force : this.jumpForce);
      this.grounded = false;
      soundManager.playJump(this.character);
      if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
        const pColor = this.character === 'esraa' ? '#FFA6B5' : '#E7D5B0';
        gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height, pColor, 6, 75, 0.35);
      }
    }
  }

  attack() {
    if (this.attackCooldown > 0) return;
    this.isAttacking = true;
    this.attackTimer = 0.24;
    this.attackCooldown = 0.36;
    soundManager.playSfx('attack');

    if (typeof gameInstance !== 'undefined' && gameInstance) {
      const punchX = this.x + this.width / 2 + this.facing * 28;
      const punchY = this.y + this.height / 2;
      gameInstance.particles.emit(punchX, punchY, '#C9A86A', 12, 120, 0.35);
      gameInstance.particles.emit(punchX, punchY, '#FFEAA7', 8, 90, 0.25);
      gameInstance.handleAhmedAttack(punchX, punchY, this.facing);
    }
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return;
    this.invulnerableTimer = 1.0; // 1 second invulnerability window

    gameState.health = Math.max(0, gameState.health - 1);
    UIManager.updateHealth();
    soundManager.playSfx('hit');

    // Small physical knockback & hit reaction
    this.velocityX = -this.facing * 140;
    this.velocityY = -180;

    if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
      gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height / 2, '#E84A64', 14, 110, 0.5);
    }

    // Character-specific hit reaction speech bubble (Requirement 7)
    if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.speech) {
      if (this.character === 'esraa') {
        gameInstance.speech.add('إسراء', 'أوح! 💥 خلي بالك يا أحمد!', this, 2.2);
      } else {
        gameInstance.speech.add('أحمد', 'آخ! 💥 مسير الحي يتلاقى!', this, 2.2);
      }
    }

    // ONLY when health reaches ZERO (0 ❤️), trigger checkpoint recovery (Requirement 21)
    if (gameState.health <= 0) {
      if (typeof gameInstance !== 'undefined' && gameInstance) {
        setTimeout(() => {
          gameState.health = gameState.maxHealth;
          UIManager.updateHealth();
          gameInstance.respawnAtCheckpoint();
          UIManager.showSystemToast('تم العودة من آخر نقطة تقدم ❤️');
        }, 500);
      }
    }
  }

  handleCollision(platforms, wasGrounded = true) {
    if (!platforms || !Array.isArray(platforms)) return;

    for (const p of platforms) {
      if (p.isOpen) continue;
      const ph = p.h !== undefined ? p.h : (p.height !== undefined ? p.height : 0);
      if (this.collidesWith(p)) {
        if (this.velocityY > 0) {
          const impactSpeed = this.velocityY;
          this.y = p.y - this.height;
          this.velocityY = 0;

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

    for (const p of platforms) {
      if (p.isOpen) continue;
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

  update(dt, input, platforms, pushableBlocks = []) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Natural breathing & eye blinking
    this.breathCycle += dt * 3.5;
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer < -0.15) {
        this.isBlinking = false;
        this.blinkTimer = Math.random() * 3.5 + 2.2;
      }
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

    // Ahmed's Power Push Ability (pushes heavy stones & blocks with athletic force)
    let isPushing = false;
    if (this.character === 'ahmed' && pushableBlocks && pushableBlocks.length > 0) {
      for (const b of pushableBlocks) {
        const touchLeft = (this.x + this.width >= b.x - 2) && (this.x + this.width <= b.x + 14) &&
                          (this.y + this.height > b.y + 6) && (this.y < b.y + b.h - 4);
        const touchRight = (this.x <= b.x + b.w + 2) && (this.x >= b.x + b.w - 14) &&
                           (this.y + this.height > b.y + 6) && (this.y < b.y + b.h - 4);

        if (touchLeft && this.velocityX > 0) {
          b.x += 85 * dt;
          isPushing = true;
          if (Math.random() < 0.15 && typeof gameInstance !== 'undefined' && gameInstance) {
            gameInstance.particles.emit(b.x + 4, b.y + b.h - 2, '#C9A86A', 2, 25, 0.2);
            soundManager.playSfx('click');
          }
        } else if (touchRight && this.velocityX < 0) {
          b.x -= 85 * dt;
          isPushing = true;
          if (Math.random() < 0.15 && typeof gameInstance !== 'undefined' && gameInstance) {
            gameInstance.particles.emit(b.x + b.w - 4, b.y + b.h - 2, '#C9A86A', 2, 25, 0.2);
            soundManager.playSfx('click');
          }
        }
      }
    }

    const wasGrounded = this.grounded;
    this.applyGravity(dt);
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    this.grounded = false;

    this.handleCollision(platforms, wasGrounded);

    if (this.isAttacking) {
      this.state = 'attack';
    } else if (!this.grounded) {
      this.state = this.velocityY < 0 ? 'jump' : 'fall';
    } else if (isPushing) {
      this.state = 'push';
      this.runCycle += dt * 8;
    } else if (Math.abs(this.velocityX) > 10) {
      this.state = 'run';
      this.runCycle += dt * 13;
    } else {
      this.state = 'idle';
      this.runCycle = 0;
    }
  }

  updateCompanionAI(dt, targetPlayer, platforms, pushableBlocks = []) {
    if (!targetPlayer) return;
    this.invulnerableTimer = 0;

    // Natural breathing & blinking
    this.breathCycle += dt * 3.5;
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer < -0.15) {
        this.isBlinking = false;
        this.blinkTimer = Math.random() * 3.5 + 2.2;
      }
    }

    const dx = targetPlayer.x - this.x;
    const dy = targetPlayer.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Smooth recovery if companion is separated far away (> 480px)
    if (dist > 480) {
      this.x = targetPlayer.x - (targetPlayer.facing || 1) * 44;
      this.y = targetPlayer.y;
      this.velocityX = 0;
      this.velocityY = 0;
      if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
        const pColor = this.character === 'esraa' ? '#FFA6B5' : '#E7D5B0';
        gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height / 2, pColor, 10, 80, 0.4);
      }
      return;
    }

    this.velocityX = 0;

    // Check if companion is currently resting on an active pressure plate
    const isOnPlate = typeof gameInstance !== 'undefined' && gameInstance &&
                      gameInstance.pressurePlates &&
                      gameInstance.pressurePlates.some(plate => this.collidesWith(plate));

    // If on a pressure plate and active player is reasonably close, stay holding the plate!
    if (isOnPlate && Math.abs(dx) < 280) {
      this.facing = dx >= 0 ? 1 : -1;
    } else {
      // Maintain natural companion spacing (44px - 56px) to avoid visual overlapping
      if (Math.abs(dx) > 52) {
        const dir = dx > 0 ? 1 : -1;
        this.velocityX = dir * (this.speed * 0.94);
        this.facing = dir;
      } else if (Math.abs(dx) < 70) {
        // Natural mutual glance: turn to face active player when standing close
        this.facing = dx >= 0 ? 1 : -1;
      }
    }

    const wasGrounded = this.grounded;
    if (this.grounded) {
      const checkX = this.x + this.facing * (this.width + 12);
      const isBlocked = platforms && platforms.some(p => {
        if (p.isOpen) return false;
        const pw = p.w || p.width || 0;
        const ph = p.h || p.height || 0;
        return checkX >= p.x && checkX <= p.x + pw && (this.y + this.height - 12) >= p.y && (this.y + this.height - 12) <= p.y + ph;
      });

      const playerIsHigher = dy < -26 && Math.abs(dx) < 130;
      if (isBlocked || playerIsHigher) {
        this.jump();
      }
    }

    this.applyGravity(dt);
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    this.grounded = false;
    this.handleCollision(platforms, wasGrounded);

    if (!this.grounded) {
      this.state = this.velocityY < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.velocityX) > 10) {
      this.state = 'run';
      this.runCycle += dt * 12;
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

    const isActive = gameState.activeCharacter === 'ahmed';

    ctx.save();
    ctx.translate(screenX + (this.width * zoom) / 2, screenY + (this.height * zoom) / 2);
    ctx.scale(zoom, zoom);

    // 1. ACTIVE CHARACTER INDICATOR (Subtle golden diamond marker + soft ground halo)
    if (isActive) {
      const bob = Math.sin(Date.now() / 220) * 3;
      // Floating Golden Diamond Marker
      ctx.fillStyle = '#E7D5B0';
      ctx.strokeStyle = '#C9A86A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const markerY = -34 + bob;
      ctx.moveTo(0, markerY - 5);
      ctx.lineTo(4, markerY);
      ctx.lineTo(0, markerY + 5);
      ctx.lineTo(-4, markerY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Soft ground ring
      ctx.strokeStyle = 'rgba(201, 168, 106, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 26, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Facing direction flip
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    const isRunning = this.state === 'run';
    const isPushing = this.state === 'push';
    const isJumping = this.state === 'jump';
    const isFalling = this.state === 'fall';
    const breath = this.state === 'idle' ? Math.sin(this.breathCycle) * 1.2 : 0;
    const legSwing = (isRunning || isPushing) ? Math.sin(this.runCycle) * 8 : (isJumping ? -4 : (isFalling ? 3 : 0));

    // 2. LEGS & TROUSERS (Tailored dark charcoal trousers with articulated shoes)
    ctx.fillStyle = '#181924';
    // Back leg
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(5 - legSwing, 22);
    ctx.lineTo(1 - legSwing, 22);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    // Front leg
    ctx.beginPath();
    ctx.moveTo(-3, 8);
    ctx.lineTo(-5 + legSwing, 22);
    ctx.lineTo(-1 + legSwing, 22);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    // Trouser crease detail
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2 + legSwing * 0.4, 10);
    ctx.lineTo(-3 + legSwing * 0.9, 21);
    ctx.stroke();

    // 3. SHOES (Polished chestnut adventure boots with gold buckle)
    // Back shoe
    ctx.fillStyle = '#442F21';
    ctx.fillRect(0 - legSwing, 22, 7, 4);
    ctx.fillStyle = '#1A110B';
    ctx.fillRect(0 - legSwing, 25, 7, 1.5);
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(2 - legSwing, 23, 2, 2);

    // Front shoe
    ctx.fillStyle = '#533928';
    ctx.fillRect(-6 + legSwing, 22, 7, 4);
    ctx.fillStyle = '#1A110B';
    ctx.fillRect(-6 + legSwing, 25, 7, 1.5);
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-4 + legSwing, 23, 2, 2);

    // 4. TORSO / SUIT JACKET (Midnight Navy tailored blazer with gold piping & buttons)
    const jacketTilt = isPushing ? 5 : (isRunning ? 2 : 0);
    ctx.save();
    ctx.translate(0, -2 + breath);
    ctx.rotate((jacketTilt * Math.PI) / 180);

    // Jacket base
    ctx.fillStyle = '#212338';
    ctx.beginPath();
    ctx.roundRect(-10, -9, 20, 19, [3, 3, 2, 2]);
    ctx.fill();

    // Lapel & Gold piping
    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, -9);
    ctx.lineTo(-3, 1);
    ctx.lineTo(0, 7);
    ctx.stroke();

    // Shirt & Tie
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(4, -9);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Silk Crimson Tie
    ctx.fillStyle = '#D92B45';
    ctx.beginPath();
    ctx.moveTo(-1.8, -7);
    ctx.lineTo(1.8, -7);
    ctx.lineTo(1.2, 3);
    ctx.lineTo(0, 5);
    ctx.lineTo(-1.2, 3);
    ctx.closePath();
    ctx.fill();

    // Gold infinity lapel pin
    ctx.fillStyle = '#E7D5B0';
    ctx.beginPath();
    ctx.arc(6, -5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Gold Buttons
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-1, 3, 2, 2);

    // 5. ARMS & HANDS
    if (this.state === 'attack' || this.isAttacking) {
      // Powerful extended straight punch with golden glowing aura
      ctx.strokeStyle = '#212338';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.lineTo(20, -2);
      ctx.stroke();

      // Hand / Fist
      ctx.fillStyle = '#FCE4D6';
      ctx.beginPath();
      ctx.arc(21, -2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Golden energy strike effect
      ctx.strokeStyle = '#FFEAA7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(22, -2, 7, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    } else if (isPushing) {
      // Braced athletic push pose
      ctx.strokeStyle = '#212338';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(14, 5);
      ctx.stroke();

      ctx.fillStyle = '#FCE4D6';
      ctx.fillRect(13, 2, 4, 4);
    } else {
      // Natural arm swing
      const armSwing = isRunning ? -Math.sin(this.runCycle) * 7 : 0;
      ctx.strokeStyle = '#212338';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.lineTo(1 + armSwing, 6);
      ctx.stroke();

      // Hand & gold watch
      ctx.fillStyle = '#C9A86A';
      ctx.fillRect(0 + armSwing, 4.5, 3, 1.5);
      ctx.fillStyle = '#FCE4D6';
      ctx.beginPath();
      ctx.arc(1 + armSwing, 7.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 6. HEAD, FACE & HAIR (Expressive cinematic 2D styling)
    const headY = -18 + breath;

    // Neck
    ctx.fillStyle = '#F3CFBA';
    ctx.fillRect(-3, headY + 5, 6, 6);

    // Face oval
    ctx.fillStyle = '#FCE4D6';
    ctx.beginPath();
    ctx.ellipse(0, headY, 8.5, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft warm cheek shading
    ctx.fillStyle = 'rgba(224, 130, 110, 0.35)';
    ctx.beginPath();
    ctx.arc(4, headY + 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Dark espresso with bright white catchlight)
    if (this.isBlinking) {
      ctx.strokeStyle = '#1A1416';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(2, headY - 1);
      ctx.lineTo(6, headY - 1);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(2, headY - 2.5, 4.5, 3.5);
      ctx.fillStyle = '#1A1416';
      ctx.fillRect(3.5, headY - 2.5, 2.8, 3.5);
      // Catchlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(5, headY - 2.5, 1.2, 1.2);
    }

    // Eyebrows (Confident / expressive)
    ctx.strokeStyle = '#1E1618';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (this.state === 'attack' || isPushing) {
      ctx.moveTo(1, headY - 4.5);
      ctx.lineTo(6.5, headY - 3.5);
    } else {
      ctx.moveTo(1.5, headY - 4.5);
      ctx.lineTo(6.5, headY - 4.8);
    }
    ctx.stroke();

    // Mouth (Confident warm smile / determined grin)
    ctx.strokeStyle = '#8B3A3A';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (isPushing) {
      ctx.moveTo(2, headY + 5);
      ctx.lineTo(5.5, headY + 5);
    } else {
      ctx.arc(4, headY + 3.5, 2.5, 0.1, Math.PI * 0.85);
    }
    ctx.stroke();

    // Voluminous Pompadour / Side-Part Hair
    ctx.fillStyle = '#1E1618';
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9.5, Math.PI * 0.9, Math.PI * 2.1);
    ctx.lineTo(9.5, headY - 1);
    ctx.lineTo(8, headY + 4);
    ctx.lineTo(5.5, headY - 3);
    ctx.lineTo(-7.5, headY + 2);
    ctx.closePath();
    ctx.fill();

    // Front textured hair lock
    ctx.beginPath();
    ctx.moveTo(-1, headY - 10);
    ctx.quadraticCurveTo(6, headY - 11, 7, headY - 5);
    ctx.lineTo(3, headY - 5);
    ctx.closePath();
    ctx.fill();

    // Hair highlight sheen
    ctx.fillStyle = '#433235';
    ctx.beginPath();
    ctx.ellipse(1, headY - 9, 5, 1.8, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* ==========================================================================
   8. Esraa Character Class (Playable Heroine & Cooperative Partner)
   ========================================================================== */

class EsraaPlayer extends Player {
  constructor(x, y) {
    super(x, y);
    this.width = 28;
    this.height = 50;
    this.speed = 220;
    this.jumpForce = 520; // Completely normal, natural jump
    this.gravity = 1140;
    this.facing = -1;
    this.character = 'esraa';
    this.maxJumps = 1; // Esraa uses normal single jump (NO flip/spin)
    this.petalTimer = 0;
    this.interactTimer = 0;
    this.state = 'idle'; // 'idle' | 'run' | 'jump' | 'fall' | 'interact'
  }

  jump(force = null) {
    if (this.grounded || this.jumpCount < this.maxJumps) {
      this.jumpCount = 1;
      this.velocityY = -(force !== null ? force : this.jumpForce);
      this.grounded = false;

      soundManager.playJump('esraa');

      if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
        gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height - 2, '#FFA6B5', 8, 65, 0.35);
      }
    }
  }

  interact() {
    this.interactTimer = 0.32;
    this.state = 'interact';
    soundManager.playSfx('click');

    if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
      const reachX = this.x + this.width / 2 + this.facing * 20;
      const reachY = this.y + this.height / 2 - 4;
      gameInstance.particles.emit(reachX, reachY, '#FFA6B5', 8, 75, 0.35);
      gameInstance.particles.emit(reachX, reachY, '#FFEAA7', 5, 55, 0.25);
    }
  }

  update(dt, input, platforms, pushableBlocks = []) {
    super.update(dt, input, platforms, pushableBlocks);

    if (this.interactTimer > 0) {
      this.interactTimer -= dt;
    }

    // Subtle flower petal trail while walking
    if (this.state === 'run') {
      this.petalTimer += dt;
      if (this.petalTimer > 0.22) {
        this.petalTimer = 0;
        if (typeof gameInstance !== 'undefined' && gameInstance && gameInstance.particles) {
          gameInstance.particles.emit(
            this.x + this.width / 2 - this.facing * 8,
            this.y + this.height - 3,
            '#FFA6B5',
            1,
            20,
            0.3
          );
        }
      }
    }

    // Explicit state resolution
    if (this.interactTimer > 0) {
      this.state = 'interact';
    } else if (!this.grounded) {
      this.state = this.velocityY < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.velocityX) > 10) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }
  }

  updateCompanionAI(dt, targetPlayer, platforms, pushableBlocks = []) {
    super.updateCompanionAI(dt, targetPlayer, platforms, pushableBlocks);
    if (this.interactTimer > 0) {
      this.interactTimer -= dt;
      this.state = 'interact';
    }
  }

  draw(ctx, camera) {
    const screenX = camera ? camera.toScreenX(this.x) : Math.round(this.x);
    const screenY = camera ? camera.toScreenY(this.y) : Math.round(this.y);
    const zoom = camera ? camera.zoom : 1.0;

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

    const isActive = gameState.activeCharacter === 'esraa';

    ctx.save();
    ctx.translate(screenX + (this.width * zoom) / 2, screenY + (this.height * zoom) / 2);
    ctx.scale(zoom, zoom);

    // 1. ACTIVE CHARACTER INDICATOR (Subtle rose-gold blossom marker + soft ground halo)
    if (isActive) {
      const bob = Math.sin(Date.now() / 220) * 3;
      // Floating Rose Star Marker
      ctx.fillStyle = '#FFA6B5';
      ctx.strokeStyle = '#E84A64';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const markerY = -32 + bob;
      ctx.arc(0, markerY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFEAA7';
      ctx.beginPath();
      ctx.arc(0, markerY, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Soft ground ring
      ctx.strokeStyle = 'rgba(255, 166, 181, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 24, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Facing direction flip
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    const isRunning = this.state === 'run';
    const isJumping = this.state === 'jump';
    const isFalling = this.state === 'fall';
    const isInteracting = this.state === 'interact';
    const inAir = isJumping || isFalling;
    const breath = this.state === 'idle' ? Math.sin(this.breathCycle) * 1.1 : 0;
    const legSwing = isRunning ? Math.sin(this.runCycle) * 7 : (isJumping ? -3 : (isFalling ? 3 : 0));
    const dressSway = isRunning ? Math.sin(this.runCycle) * 4 : (inAir ? -3 : 0);

    // 2. LEGS & TIGHTS (Fitted dark plum tights with stylish rose-gold adventure boots)
    ctx.fillStyle = '#361521';
    // Back leg
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.lineTo(4 - legSwing, 21);
    ctx.lineTo(1 - legSwing, 21);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // Front leg
    ctx.beginPath();
    ctx.moveTo(-2, 10);
    ctx.lineTo(-4 + legSwing, 21);
    ctx.lineTo(-1 + legSwing, 21);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // Rose-Gold Adventure Boots
    ctx.fillStyle = '#7E2338';
    ctx.fillRect(-5 + legSwing, 21, 6, 3.5);
    ctx.fillRect(1 - legSwing, 21, 6, 3.5);
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-3 + legSwing, 21.5, 2, 1.5);
    ctx.fillRect(3 - legSwing, 21.5, 2, 1.5);

    // 3. ELEGANT BURGUNDY & ROSE DRESS (Layered bodice, waist sash, pleated skirt)
    const dressHeight = 20;

    // Flowing dark wavy hair back layer (behind dress)
    ctx.fillStyle = '#231518';
    ctx.beginPath();
    ctx.moveTo(-6, -12 + breath);
    ctx.quadraticCurveTo(-11 - dressSway, 0, -8 - dressSway, 14);
    ctx.lineTo(-3, 14);
    ctx.lineTo(0, -6 + breath);
    ctx.closePath();
    ctx.fill();

    // Flared Pleated Skirt (Sways dynamically with physics)
    ctx.fillStyle = '#9C2746';
    ctx.beginPath();
    ctx.moveTo(-7, -4 + breath);
    ctx.lineTo(7, -4 + breath);
    ctx.lineTo(11 + dressSway, dressHeight + breath);
    ctx.quadraticCurveTo(0, dressHeight + 2 + breath, -11 + dressSway, dressHeight + breath);
    ctx.closePath();
    ctx.fill();

    // Skirt pleat shadow & gold trim hem
    ctx.fillStyle = '#831F39';
    ctx.beginPath();
    ctx.moveTo(1, -2 + breath);
    ctx.lineTo(4 + dressSway * 0.7, dressHeight + breath);
    ctx.lineTo(-1 + dressSway * 0.7, dressHeight + breath);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11 + dressSway, dressHeight + breath);
    ctx.quadraticCurveTo(0, dressHeight + 2 + breath, 11 + dressSway, dressHeight + breath);
    ctx.stroke();

    // Bodice
    ctx.fillStyle = '#B83256';
    ctx.beginPath();
    ctx.roundRect(-8, -9 + breath, 16, 12, [3, 3, 1, 1]);
    ctx.fill();

    // Gold embroidered neckline
    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -9 + breath, 4.5, 0, Math.PI);
    ctx.stroke();

    // Gold waist sash & dangling infinity charm
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-8.5, 1 + breath, 17, 2.5);
    ctx.fillStyle = '#E7D5B0';
    ctx.beginPath();
    ctx.arc(2, 5 + breath, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 4. ARMS & ACCESSORIES
    if (isInteracting) {
      // Graceful reaching arm pose with glowing pink stardust fingertips
      ctx.fillStyle = '#D96B85';
      ctx.beginPath();
      ctx.arc(-2, -6 + breath, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FDF0E7';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-2, -5 + breath);
      ctx.lineTo(14, -2 + breath);
      ctx.stroke();

      // Gold bracelet
      ctx.fillStyle = '#C9A86A';
      ctx.fillRect(8, -3.5 + breath, 2.5, 2);

      // Reaching hand & stardust sparkle
      ctx.fillStyle = '#FDF0E7';
      ctx.beginPath();
      ctx.arc(15, -2 + breath, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle halo
      ctx.fillStyle = '#FFA6B5';
      ctx.beginPath();
      ctx.arc(17, -2 + breath, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const armSwing = isRunning ? -Math.sin(this.runCycle) * 6 : 0;
      // Cap sleeve
      ctx.fillStyle = '#D96B85';
      ctx.beginPath();
      ctx.arc(-4, -6 + breath, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Arm
      ctx.strokeStyle = '#FDF0E7';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-3, -5 + breath);
      ctx.lineTo(0 + armSwing, 3 + breath);
      ctx.stroke();

      // Gold bracelet & hand
      ctx.fillStyle = '#C9A86A';
      ctx.fillRect(-1 + armSwing, 1.5 + breath, 2.5, 1.2);
      ctx.fillStyle = '#FDF0E7';
      ctx.beginPath();
      ctx.arc(0 + armSwing, 4.5 + breath, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. HEAD, RADIANT FACE & GORGEOUS HAIR
    const headY = -17 + breath;

    // Graceful neck
    ctx.fillStyle = '#F5DDCF';
    ctx.fillRect(-2.5, headY + 5, 5, 5);

    // Face oval
    ctx.fillStyle = '#FDF0E7';
    ctx.beginPath();
    ctx.ellipse(0, headY, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rosy blushed cheeks
    ctx.fillStyle = 'rgba(255, 150, 170, 0.65)';
    ctx.beginPath();
    ctx.arc(-4.5, headY + 2.5, 2.2, 0, Math.PI * 2);
    ctx.arc(4.5, headY + 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Almond Eyes with sweet eyelashes & catchlight
    if (this.isBlinking) {
      ctx.strokeStyle = '#221517';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(1.5, headY - 1);
      ctx.lineTo(5.5, headY - 1);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(1.5, headY - 2.5, 4.2, 3.2);
      ctx.fillStyle = '#221517';
      ctx.fillRect(2.8, headY - 2.5, 2.5, 3.2);
      // Catchlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(4.2, headY - 2.5, 1.1, 1.1);
      // Eyelash
      ctx.strokeStyle = '#221517';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(1.5, headY - 2.5);
      ctx.lineTo(5.8, headY - 2.5);
      ctx.lineTo(6.5, headY - 3.5);
      ctx.stroke();
    }

    // Arched Eyebrow
    ctx.strokeStyle = '#2C191D';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(3.5, headY - 3.5, 3, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();

    // Sweet Radiant Smile
    ctx.strokeStyle = '#D93856';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(3.5, headY + 3.2, 2.2, 0.1, Math.PI * 0.85);
    ctx.stroke();

    // Flowing Dark Brunette Wavy Hair
    ctx.fillStyle = '#231518';
    ctx.beginPath();
    ctx.arc(0, headY - 1.5, 9, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineTo(8.5, headY + 3);
    ctx.lineTo(6, headY - 2);
    ctx.lineTo(-7.5, headY + 4);
    ctx.closePath();
    ctx.fill();

    // Front soft bangs
    ctx.beginPath();
    ctx.moveTo(-5, headY - 8);
    ctx.quadraticCurveTo(0, headY - 5, 5, headY - 7);
    ctx.lineTo(0, headY - 9);
    ctx.closePath();
    ctx.fill();

    // Hair highlights
    ctx.fillStyle = '#452A30';
    ctx.beginPath();
    ctx.ellipse(0, headY - 8, 4.5, 1.6, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Blossom Hairpin Clip (🌸 with pastel petals & gold pearl core)
    ctx.fillStyle = '#FFA6B5';
    ctx.beginPath();
    ctx.arc(6.5, headY - 6.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.arc(6.5, headY - 6.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.Player = Player;
  window.EsraaPlayer = EsraaPlayer;
}

/* ==========================================================================
   9. Reusable Cooperative Puzzle System & Enemies
   ========================================================================== */

class PressurePlate {
  constructor(id, x, y, w = 38, h = 10, targetId = '', label = '') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.targetId = targetId;
    this.label = label;
    this.isPressed = false;
    this.wasPressed = false;
  }

  update(ahmed, esraa, pushableBlocks = []) {
    this.wasPressed = this.isPressed;
    let pressed = false;

    const checkStanding = (char) => {
      if (!char) return false;
      const charBottom = char.y + char.height;
      return char.x + char.width > this.x + 2 &&
             char.x < this.x + this.w - 2 &&
             charBottom >= this.y - 4 &&
             charBottom <= this.y + this.h + 8;
    };

    if (checkStanding(ahmed) || checkStanding(esraa)) {
      pressed = true;
    }

    if (!pressed && pushableBlocks) {
      for (const b of pushableBlocks) {
        const bBottom = b.y + b.h;
        if (b.x + b.w > this.x + 2 && b.x < this.x + this.w - 2 &&
            bBottom >= this.y - 4 && bBottom <= this.y + this.h + 8) {
          pressed = true;
          break;
        }
      }
    }

    this.isPressed = pressed;
    if (this.isPressed && !this.wasPressed) {
      soundManager.playSfx('plate');
      if (typeof gameInstance !== 'undefined' && gameInstance) {
        gameInstance.particles.emit(this.x + this.w / 2, this.y + 2, '#C9A86A', 6, 50, 0.25);
      }
    }
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    const pressOffset = this.isPressed ? Math.round(5 * zoom) : 0;

    // Base bracket
    ctx.fillStyle = '#1D1D28';
    ctx.fillRect(sx - 2, sy + 3 * zoom, sw + 4, sh);

    // Plate top
    ctx.fillStyle = this.isPressed ? '#7BE495' : '#C9A86A';
    ctx.fillRect(sx, sy + pressOffset, sw, Math.max(3, sh - pressOffset));
    ctx.strokeStyle = this.isPressed ? '#A7F3D0' : '#E7D5B0';
    ctx.lineWidth = Math.max(1, Math.round(1 * zoom));
    ctx.strokeRect(sx, sy + pressOffset, sw, Math.max(3, sh - pressOffset));

    // Glyph / Icon
    ctx.fillStyle = '#12121A';
    ctx.beginPath();
    ctx.arc(sx + sw / 2, sy + pressOffset + Math.max(2, (sh - pressOffset) / 2), 3 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Lever {
  constructor(id, x, y, targetId = '', isTimed = false, timerDuration = 9, label = '') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = 26;
    this.h = 32;
    this.targetId = targetId;
    this.isTimed = isTimed;
    this.timerDuration = timerDuration;
    this.timer = 0;
    this.activated = false;
    this.label = label;
  }

  toggle() {
    soundManager.playSfx('lever');
    if (this.isTimed) {
      this.timer = this.timerDuration;
      this.activated = true;
    } else {
      this.activated = !this.activated;
    }
    if (typeof gameInstance !== 'undefined' && gameInstance) {
      gameInstance.particles.emit(this.x + this.w / 2, this.y + this.h / 2, '#FFA6B5', 8, 60, 0.3);
    }
  }

  update(dt) {
    if (this.isTimed && this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0;
        this.activated = false;
        soundManager.playSfx('lever');
      }
    }
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    // Mount base
    ctx.fillStyle = '#262635';
    ctx.fillRect(sx + 2 * zoom, sy + sh - 8 * zoom, sw - 4 * zoom, 8 * zoom);
    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * zoom));
    ctx.strokeRect(sx + 2 * zoom, sy + sh - 8 * zoom, sw - 4 * zoom, 8 * zoom);

    // Lever arm (tilted left if inactive, right if active)
    const pivotX = sx + sw / 2;
    const pivotY = sy + sh - 4 * zoom;
    const armLength = 20 * zoom;
    const angle = this.activated ? (Math.PI / 4) : (-Math.PI / 4);
    const tipX = pivotX + Math.sin(angle) * armLength;
    const tipY = pivotY - Math.cos(angle) * armLength;

    ctx.strokeStyle = this.activated ? '#7BE495' : '#C9A86A';
    ctx.lineWidth = Math.max(2, Math.round(3 * zoom));
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Lever handle bulb
    ctx.fillStyle = this.activated ? '#7BE495' : '#FFA6B5';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4.5 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // Countdown text for timed lever
    if (this.isTimed && this.timer > 0) {
      ctx.font = `bold ${Math.round(11 * zoom)}px sans-serif`;
      ctx.fillStyle = '#FFA6B5';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(this.timer)}s`, sx + sw / 2, sy - 6 * zoom);
    }
  }
}

class Gate {
  constructor(id, x, y, w = 20, h = 90, requiredTriggers = 1, label = '') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.requiredTriggers = requiredTriggers;
    this.label = label;
    this.isOpen = false;
    this.openProgress = 0; // 0 = closed, 1 = fully open
  }

  update(dt, plates = [], levers = []) {
    let activeCount = 0;
    if (plates) {
      for (const p of plates) {
        if (p.targetId === this.id && p.isPressed) activeCount++;
      }
    }
    if (levers) {
      for (const l of levers) {
        if (l.targetId === this.id && l.activated) activeCount++;
      }
    }

    const shouldOpen = activeCount >= this.requiredTriggers;
    if (shouldOpen && !this.isOpen) {
      soundManager.playSfx('door');
    }
    this.isOpen = shouldOpen;

    const targetProgress = this.isOpen ? 1 : 0;
    this.openProgress += (targetProgress - this.openProgress) * Math.min(1, dt * 5);
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    const slideOffset = Math.round(this.openProgress * sh);

    // Gate frame border
    ctx.strokeStyle = this.isOpen ? 'rgba(123, 228, 149, 0.6)' : 'rgba(201, 168, 106, 0.8)';
    ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
    ctx.strokeRect(sx, sy, sw, sh);

    // Sliding gate body
    if (slideOffset < sh) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.clip();

      ctx.fillStyle = this.isOpen ? 'rgba(28, 42, 35, 0.85)' : 'rgba(22, 22, 32, 0.95)';
      ctx.fillRect(sx, sy - slideOffset, sw, sh);

      // Gate decorative vertical bars
      ctx.strokeStyle = this.isOpen ? '#7BE495' : '#C9A86A';
      ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
      for (let bx = sx + 4 * zoom; bx < sx + sw - 2 * zoom; bx += 6 * zoom) {
        ctx.beginPath();
        ctx.moveTo(bx, sy - slideOffset);
        ctx.lineTo(bx, sy + sh - slideOffset);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}

class PushableBlock {
  constructor(id, x, y, w = 38, h = 38, isRock = true) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 1100;
    this.grounded = false;
    this.isRock = isRock;
  }

  update(dt, platforms = []) {
    this.vy += this.gravity * dt;
    if (this.vy > 800) this.vy = 800;

    this.y += this.vy * dt;
    this.grounded = false;

    if (platforms) {
      for (const p of platforms) {
        if (p.isOpen) continue;
        const pw = p.w !== undefined ? p.w : p.width;
        const ph = p.h !== undefined ? p.h : p.height;
        if (this.x < p.x + pw && this.x + this.w > p.x &&
            this.y < p.y + ph && this.y + this.h > p.y) {
          if (this.vy > 0) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.grounded = true;
          }
        }
      }
    }
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    // Stone Rock / Pushable Block
    ctx.fillStyle = this.isRock ? '#3A3644' : '#2C2A38';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
    ctx.strokeRect(sx, sy, sw, sh);

    // Rune inscription / stone cracks
    ctx.strokeStyle = 'rgba(231, 213, 176, 0.45)';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * zoom));
    ctx.beginPath();
    ctx.moveTo(sx + 6 * zoom, sy + 6 * zoom);
    ctx.lineTo(sx + sw - 6 * zoom, sy + sh - 6 * zoom);
    ctx.moveTo(sx + sw - 6 * zoom, sy + 6 * zoom);
    ctx.lineTo(sx + 6 * zoom, sy + sh - 6 * zoom);
    ctx.stroke();
  }
}

class BreakableBarrier {
  constructor(id, x, y, w = 24, h = 68, label = 'barrier') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.destroyed = false;
  }

  hit() {
    if (this.destroyed) return;
    this.destroyed = true;
    soundManager.playSfx('smash');
    if (typeof gameInstance !== 'undefined' && gameInstance) {
      gameInstance.particles.emit(this.x + this.w / 2, this.y + this.h / 2, '#C9A86A', 18, 140, 0.55);
      gameInstance.particles.emit(this.x + this.w / 2, this.y + this.h / 2, '#E7D5B0', 10, 100, 0.4);
    }
  }

  draw(ctx, camera) {
    if (this.destroyed) return;
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    // Wooden timber barricade
    ctx.fillStyle = '#4A3425';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#8E7342';
    ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
    ctx.strokeRect(sx, sy, sw, sh);

    // Cross planks & crack marks
    ctx.strokeStyle = '#C9A86A';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + sw, sy + sh);
    ctx.moveTo(sx + sw, sy);
    ctx.lineTo(sx, sy + sh);
    ctx.stroke();
  }
}

class NarrowPassage {
  constructor(id, x, y, w = 90, h = 34, label = '') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    // Low ceiling marker (floral arch / crystal narrow arch)
    ctx.fillStyle = 'rgba(255, 166, 181, 0.12)';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = 'rgba(255, 166, 181, 0.45)';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * zoom));
    ctx.setLineDash([4 * zoom, 4 * zoom]);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.setLineDash([]);

    // Cute narrow passage flower label
    ctx.font = `${Math.round(10 * zoom)}px sans-serif`;
    ctx.fillStyle = '#FFA6B5';
    ctx.textAlign = 'center';
    ctx.fillText('🌸 ممر إسراء', sx + sw / 2, sy + sh / 2 + 4 * zoom);
  }
}

class Enemy {
  constructor(id, x, y, minX, maxX, speed = 50, name = 'حارس الآلية') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 24;
    this.minX = minX;
    this.maxX = maxX;
    this.speed = speed;
    this.dir = 1;
    this.name = name;
    this.alive = true;
    this.walkCycle = 0;
  }

  update(dt) {
    if (!this.alive) return;
    this.x += this.speed * this.dir * dt;
    if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.dir = -1;
    } else if (this.x <= this.minX) {
      this.x = this.minX;
      this.dir = 1;
    }
    this.walkCycle += dt * 8;
  }

  hit() {
    if (!this.alive) return;
    this.alive = false;
    soundManager.playSfx('defeat');
    if (typeof gameInstance !== 'undefined' && gameInstance) {
      gameInstance.particles.emit(this.x + this.w / 2, this.y + this.h / 2, '#FFA6B5', 14, 110, 0.45);
      gameInstance.particles.emit(this.x + this.w / 2, this.y + this.h / 2, '#C9A86A', 8, 80, 0.35);
    }
  }

  draw(ctx, camera) {
    if (!this.alive) return;
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    ctx.save();
    ctx.translate(sx + sw / 2, sy + sh / 2);
    ctx.scale(zoom, zoom);
    if (this.dir === -1) ctx.scale(-1, 1);

    // Cute mechanical beetle / shadow critter
    ctx.fillStyle = '#222230';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#E84A64';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing ruby eyes
    ctx.fillStyle = '#E84A64';
    ctx.beginPath();
    ctx.arc(6, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tiny marching legs
    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = 1.8;
    const legWobble = Math.sin(this.walkCycle) * 3;
    ctx.beginPath();
    ctx.moveTo(-6, 6); ctx.lineTo(-8, 11 + legWobble);
    ctx.moveTo(0, 6);  ctx.lineTo(0, 11 - legWobble);
    ctx.moveTo(6, 6);  ctx.lineTo(8, 11 + legWobble);
    ctx.stroke();

    ctx.restore();
  }
}

/* ==========================================================================
   9.5 Milk Tea Stand & Environmental Props
   ========================================================================== */

class MilkTeaStand {
  constructor(id, x, y, label = 'استراحة الشاي بلبن') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = 78;
    this.h = 60;
    this.label = label;
    this.used = false;
  }

  interact(character, game) {
    if (this.used) {
      game.speech.add(character === 'esraa' ? 'إسراء' : 'أحمد', 'شربنا وخلصنا... يلا نكمل! ❤️', game.activePlayer, 2.4);
      return;
    }
    this.used = true;
    soundManager.playCollect('ring');
    gameState.health = gameState.maxHealth;
    UIManager.updateHealth();
    UIManager.showSystemToast('☕ استراحة شاي بلبن منعشة! تم استرجاع كامل الطاقة ❤️');

    if (character === 'esraa') {
      game.speech.add('إسراء', 'شاي بلبن؟ ☕', game.esraa, 2.5);
      setTimeout(() => {
        game.speech.add('أحمد', 'دلوقتي؟ 😂', game.player, 2.3);
        setTimeout(() => {
          game.speech.add('إسراء', 'آه دلوقتي ❤️', game.esraa, 2.4);
        }, 1700);
      }, 1700);
    } else {
      game.speech.add('أحمد', 'استراحة شاي بلبن؟ ☕', game.player, 2.5);
      setTimeout(() => {
        game.speech.add('إسراء', 'دلوقتي؟ 😂 أحسن توقيت! ❤️', game.esraa, 2.4);
      }, 1700);
    }

    if (game.particles) {
      game.particles.emit(this.x + 39, this.y + 20, '#FFA6B5', 20, 110, 0.6);
      game.particles.emit(this.x + 39, this.y + 20, '#FFEAA7', 14, 90, 0.5);
    }
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    // Stall Counter & Wooden Legs
    ctx.fillStyle = '#4A3425';
    ctx.fillRect(sx, sy + 25 * zoom, sw, sh - 25 * zoom);
    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * zoom));
    ctx.strokeRect(sx, sy + 25 * zoom, sw, sh - 25 * zoom);

    // Striped Awning (Burgundy & Gold)
    const awningH = 18 * zoom;
    ctx.fillStyle = '#9C2746';
    ctx.fillRect(sx - 4 * zoom, sy, sw + 8 * zoom, awningH);
    ctx.fillStyle = '#C9A86A';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(sx - 4 * zoom + i * 20 * zoom, sy, 10 * zoom, awningH);
    }

    // Wooden Signboard: "شاي بلبن"
    ctx.fillStyle = '#1D1D28';
    ctx.fillRect(sx + 8 * zoom, sy + 28 * zoom, sw - 16 * zoom, 16 * zoom);
    ctx.strokeStyle = '#FFA6B5';
    ctx.strokeRect(sx + 8 * zoom, sy + 28 * zoom, sw - 16 * zoom, 16 * zoom);
    ctx.font = `bold ${Math.round(9 * zoom)}px sans-serif`;
    ctx.fillStyle = '#FFEAA7';
    ctx.textAlign = 'center';
    ctx.fillText('☕ شاي بلبن', sx + sw / 2, sy + 40 * zoom);

    // Steaming Cup on Counter
    const cupX = sx + sw / 2 + 18 * zoom;
    const cupY = sy + 22 * zoom;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(cupX - 4 * zoom, cupY - 6 * zoom, 9 * zoom, 8 * zoom, 2 * zoom);
    ctx.fill();

    // Warm Steam Animation
    const steamBob = Math.sin(Date.now() / 200) * 3 * zoom;
    ctx.strokeStyle = 'rgba(255, 234, 167, 0.7)';
    ctx.lineWidth = Math.max(1, Math.round(1.2 * zoom));
    ctx.beginPath();
    ctx.moveTo(cupX, cupY - 7 * zoom);
    ctx.quadraticCurveTo(cupX + 3 * zoom, cupY - 12 * zoom + steamBob, cupX, cupY - 16 * zoom);
    ctx.stroke();
  }
}

class FootballMatchStand {
  constructor(id, x, y, label = 'مباراة الأهلي ⚽') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = 80;
    this.h = 60;
    this.label = label;
    this.used = false;
  }

  interact(character, game) {
    if (this.used) {
      game.speech.add(character === 'esraa' ? 'إسراء' : 'أحمد', 'الأهلي فاز والحمد لله... يلا نكمل مشوارنا! 🦅❤️', game.activePlayer, 2.5);
      return;
    }
    this.used = true;
    soundManager.playSfx('checkpoint');
    UIManager.showSystemToast('⚽ دقيقة مباراة الأهلي! (الأهلي بطل إفريقيا 🦅❤️)');

    game.speech.add('إسراء', 'هنقف نتفرج؟ ⚽', game.esraa, 2.4);
    setTimeout(() => {
      game.speech.add('أحمد', 'دقيقة بس... مباراة الأهلي! 🦅🔥', game.player, 2.5);
      setTimeout(() => {
        game.speech.add('إسراء', 'دقيقة بتاعتك دي طويلة أوي 😂 كفاية بقى!', game.esraa, 2.7);
        setTimeout(() => {
          game.speech.add('أحمد', 'ماشي ماشي... يلا نكمل رحلتنا ❤️', game.player, 2.5);
        }, 2200);
      }, 2200);
    }, 2000);

    if (game.particles) {
      game.particles.emit(this.x + 40, this.y + 20, '#E84A64', 18, 120, 0.6);
      game.particles.emit(this.x + 40, this.y + 20, '#C9A86A', 12, 90, 0.5);
    }
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;
    const sw = Math.ceil(this.w * zoom);
    const sh = Math.ceil(this.h * zoom);

    // Roadside Stand Frame & Glowing TV Screen
    ctx.fillStyle = '#231518';
    ctx.fillRect(sx, sy + 15 * zoom, sw, sh - 15 * zoom);
    ctx.strokeStyle = '#E84A64';
    ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
    ctx.strokeRect(sx, sy + 15 * zoom, sw, sh - 15 * zoom);

    // Red Al Ahly Screen
    ctx.fillStyle = '#9C2746';
    ctx.fillRect(sx + 8 * zoom, sy + 20 * zoom, sw - 16 * zoom, 24 * zoom);
    ctx.font = `bold ${Math.round(10 * zoom)}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ الأهلي', sx + sw / 2, sy + 36 * zoom);

    // Golden Eagle crest
    ctx.font = `${Math.round(12 * zoom)}px sans-serif`;
    ctx.fillText('🦅', sx + sw / 2, sy + 10 * zoom);
  }
}

class SceneryProp {
  constructor(type, x, y, options = {}) {
    this.type = type; // 'tree' | 'lantern' | 'bench' | 'flowers' | 'sign' | 'fence'
    this.x = x;
    this.y = y;
    this.options = options;
  }

  draw(ctx, camera) {
    const sx = camera ? camera.toScreenX(this.x) : this.x;
    const sy = camera ? camera.toScreenY(this.y) : this.y;
    const zoom = camera ? camera.zoom : 1.0;

    if (this.type === 'tree') {
      // Trunk
      ctx.fillStyle = '#3A271D';
      ctx.fillRect(sx - 5 * zoom, sy - 50 * zoom, 10 * zoom, 50 * zoom);
      // Foliage
      ctx.fillStyle = '#223828';
      ctx.beginPath();
      ctx.arc(sx, sy - 65 * zoom, 26 * zoom, 0, Math.PI * 2);
      ctx.arc(sx - 14 * zoom, sy - 55 * zoom, 18 * zoom, 0, Math.PI * 2);
      ctx.arc(sx + 14 * zoom, sy - 55 * zoom, 18 * zoom, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'lantern') {
      // Post
      ctx.strokeStyle = '#C9A86A';
      ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy - 42 * zoom);
      ctx.stroke();
      // Glowing Lamp
      ctx.fillStyle = 'rgba(255, 234, 167, 0.85)';
      ctx.beginPath();
      ctx.arc(sx, sy - 44 * zoom, 6 * zoom, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'bench') {
      ctx.fillStyle = '#5A3825';
      ctx.fillRect(sx, sy - 14 * zoom, 34 * zoom, 4 * zoom);
      ctx.fillRect(sx + 3 * zoom, sy - 10 * zoom, 4 * zoom, 10 * zoom);
      ctx.fillRect(sx + 27 * zoom, sy - 10 * zoom, 4 * zoom, 10 * zoom);
    } else if (this.type === 'flowers') {
      const colors = ['#FFA6B5', '#FFEAA7', '#E84A64'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(sx + i * 8 * zoom, sy - 4 * zoom, 3 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'fence') {
      ctx.strokeStyle = '#6E4E38';
      ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
      ctx.beginPath();
      ctx.moveTo(sx, sy - 16 * zoom); ctx.lineTo(sx + 40 * zoom, sy - 16 * zoom);
      ctx.moveTo(sx, sy - 8 * zoom);  ctx.lineTo(sx + 40 * zoom, sy - 8 * zoom);
      ctx.moveTo(sx + 5 * zoom, sy); ctx.lineTo(sx + 5 * zoom, sy - 20 * zoom);
      ctx.moveTo(sx + 35 * zoom, sy); ctx.lineTo(sx + 35 * zoom, sy - 20 * zoom);
      ctx.stroke();
    }
  }
}

/* ==========================================================================
   10. Continuous Journey World Configuration (One Unified Side-Scrolling World)
   ========================================================================== */

const continuousWorld = {
  cleanName: "طريق الخطوبة ∞",
  name: "MISSION ∞: رحلة الخطوبة",
  width: 10800,
  height: 700,
  playerStart: { x: 80, y: 480 },
  esraaStart: { x: 125, y: 480 },
  collectiblesRequired: 8,

  // Continuous Solid Ground Across the Whole Journey (NO PITS)
  platforms: [
    // Base Continuous Ground Highway
    { x: 0, y: 550, w: 10800, h: 150, type: 'ground' },

    // SECTION 1: Hurdles (Boxes & Low Walls)
    { x: 420, y: 508, w: 42, h: 42, type: 'platform' }, // Wooden crate
    { x: 740, y: 488, w: 34, h: 62, type: 'platform' }, // Low stone wall
    { x: 1060, y: 470, w: 110, h: 22, type: 'platform' }, // Stepping ledge

    // SECTION 2: Elevated Switch Ledge for Esraa
    { x: 1720, y: 440, w: 140, h: 22, type: 'platform' },
    { x: 1920, y: 350, w: 120, h: 22, type: 'platform' },

    // SECTION 3: Boulder Alcove & Hurdle Boxes
    { x: 3200, y: 430, w: 90, h: 22, type: 'platform' },
    { x: 3640, y: 508, w: 40, h: 42, type: 'platform' },
    { x: 3880, y: 460, w: 120, h: 22, type: 'platform' },

    // SECTION 4: Dual Plate Route
    { x: 4680, y: 450, w: 120, h: 22, type: 'platform' },
    { x: 5240, y: 470, w: 110, h: 22, type: 'platform' },

    // SECTION 5: Tea Stop Hillside Platforms
    { x: 6360, y: 470, w: 130, h: 22, type: 'platform' },
    { x: 6600, y: 410, w: 130, h: 22, type: 'platform' },

    // SECTION 6: Guardian Forest Platforms
    { x: 7360, y: 460, w: 130, h: 22, type: 'platform' },
    { x: 7920, y: 460, w: 120, h: 22, type: 'platform' },

    // SECTION 7: High Moving Bridge
    { x: 8640, y: 440, w: 130, h: 22, type: 'platform' },
    { x: 8840, y: 460, w: 150, h: 22, type: 'moving', minX: 8800, maxX: 9040, speed: 70, dir: 1 },
    { x: 9240, y: 440, w: 140, h: 22, type: 'platform' },

    // SECTION 8: Mountain Temple Pedestals
    { x: 9800, y: 460, w: 140, h: 22, type: 'platform' },
    { x: 10040, y: 440, w: 140, h: 22, type: 'platform' }
  ],

  // Cooperative Pressure Plates
  pressurePlates: [
    // Section 2: Side plate for opening gate 1
    { id: 'plate_sec_2', x: 1760, y: 430, w: 38, h: 10, targetId: 'gate_coop_1', label: 'لوح الممر' },
    // Section 4: Dual Plates A & B (both required to open vault gate!)
    { id: 'plate_dual_a', x: 4600, y: 540, w: 38, h: 10, targetId: 'gate_dual', label: 'لوح أحمد (A)' },
    { id: 'plate_dual_b', x: 4900, y: 540, w: 38, h: 10, targetId: 'gate_dual', label: 'لوح إسراء (B)' },
    // Section 7: Bridge plate
    { id: 'plate_bridge', x: 8680, y: 430, w: 38, h: 10, targetId: 'gate_bridge', label: 'لوح الجسر' }
  ],

  // Levers
  levers: [
    // Section 2: Elevated lever for Esraa
    { id: 'lever_sec_2', x: 1960, y: 318, targetId: 'gate_coop_1', isTimed: false, label: 'مفتاح البوابة' },
    // Section 6: Forest lever
    { id: 'lever_forest', x: 7400, y: 428, targetId: 'gate_forest', isTimed: false, label: 'مفتاح الغابة' }
  ],

  // Cooperative Physical Gates
  gates: [
    // Section 2: First cooperative gate
    { id: 'gate_coop_1', x: 2100, y: 460, w: 20, h: 90, requiredTriggers: 1, label: 'بوابة الممر' },
    // Section 4: Vault Gate requiring BOTH plates active
    { id: 'gate_dual', x: 5080, y: 460, w: 20, h: 90, requiredTriggers: 2, label: 'بوابة التعاون الكبرى' },
    // Section 6: Forest gate
    { id: 'gate_forest', x: 8080, y: 460, w: 20, h: 90, requiredTriggers: 1, label: 'بوابة الغابة' },
    // Section 7: Mountain bridge gate
    { id: 'gate_bridge', x: 9440, y: 460, w: 20, h: 90, requiredTriggers: 1, label: 'بوابة الجبال' }
  ],

  // Pushable Heavy Boulders (Ahmed power-pushes them)
  pushableBlocks: [
    { id: 'rock_heavy_1', x: 3180, y: 510, w: 42, h: 40, isRock: true },
    { id: 'rock_bridge_1', x: 8520, y: 510, w: 40, h: 40, isRock: true }
  ],

  // Breakable Wooden Barricades (Ahmed smashes them)
  breakableBarriers: [
    { id: 'barr_timber_1', x: 7680, y: 482, w: 24, h: 68, label: 'حاجز خشبي' }
  ],

  // Narrow Passages (Only Esraa can fit through)
  narrowPassages: [
    { id: 'narrow_sec_2', x: 1840, y: 516, w: 90, h: 34, label: 'ممر الورد' },
    { id: 'narrow_forest', x: 7720, y: 516, w: 90, h: 34, label: 'ممر الغابة' }
  ],

  // Small Non-Horror Mechanical & Forest Enemies
  enemies: [
    { id: 'en_village_1', x: 2500, y: 526, minX: 2420, maxX: 2650, speed: 45, name: 'حارس الآلية' },
    { id: 'en_forest_1', x: 7420, y: 526, minX: 7320, maxX: 7580, speed: 50, name: 'حارس الغابة' },
    { id: 'en_mountain_1', x: 9060, y: 526, minX: 8980, maxX: 9180, speed: 55, name: 'حارس الجبال' }
  ],

  // Milk Tea Roadside Stops
  milkteaStands: [
    { id: 'tea_stand_1', x: 6040, y: 490, label: 'استراحة شاي بلبن' }
  ],

  // Football Match Roadside Distraction (Al Ahly Match)
  footballStands: [
    { id: 'football_stand_1', x: 3900, y: 490, label: 'مباراة الأهلي ⚽' }
  ],

  // Scenery Props
  scenery: [
    { type: 'lantern', x: 220, y: 550 },
    { type: 'bench', x: 320, y: 550 },
    { type: 'tree', x: 580, y: 550 },
    { type: 'flowers', x: 620, y: 550 },
    { type: 'fence', x: 880, y: 550 },
    { type: 'tree', x: 1340, y: 550 },
    { type: 'lantern', x: 2020, y: 550 },
    { type: 'tree', x: 2750, y: 550 },
    { type: 'fence', x: 3450, y: 550 },
    { type: 'lantern', x: 4420, y: 550 },
    { type: 'flowers', x: 4500, y: 550 },
    { type: 'bench', x: 5960, y: 550 },
    { type: 'lantern', x: 6160, y: 550 },
    { type: 'tree', x: 6800, y: 550 },
    { type: 'fence', x: 7200, y: 550 },
    { type: 'tree', x: 8200, y: 550 },
    { type: 'lantern', x: 8400, y: 550 },
    { type: 'lantern', x: 9600, y: 550 },
    { type: 'flowers', x: 9750, y: 550 }
  ],

  // Infinity Collectibles (Disappear instantly on pickup)
  collectibles: [
    { id: 'inf_c_1', x: 440, y: 440, collected: false },
    { id: 'inf_c_2', x: 755, y: 410, collected: false },
    { id: 'inf_c_3', x: 1960, y: 280, collected: false },
    { id: 'inf_c_4', x: 2320, y: 490, collected: false },
    { id: 'inf_c_5', x: 3340, y: 490, collected: false },
    { id: 'inf_c_6', x: 4750, y: 400, collected: false },
    { id: 'inf_c_7', x: 6080, y: 410, collected: false },
    { id: 'inf_c_8', x: 7480, y: 410, collected: false },
    { id: 'inf_c_9', x: 8900, y: 390, collected: false },
    { id: 'inf_c_10', x: 10100, y: 380, collected: false }
  ],

  // Pickups
  keyPickup: { x: 5160, y: 495, w: 26, h: 26, collected: false },
  ringSealPickup: { x: 7850, y: 495, w: 26, h: 26, collected: false },

  // Subtle Road Checkpoints
  checkpoints: [
    { x: 1400, y: 490, w: 26, h: 60, reached: false, name: 'نقطة الممر' },
    { x: 2860, y: 490, w: 26, h: 60, reached: false, name: 'نقطة الصخرة' },
    { x: 4300, y: 490, w: 26, h: 60, reached: false, name: 'نقطة التعاون' },
    { x: 5700, y: 490, w: 26, h: 60, reached: false, name: 'استراحة الشاي' },
    { x: 7100, y: 490, w: 26, h: 60, reached: false, name: 'غابة الحراس' },
    { x: 8500, y: 490, w: 26, h: 60, reached: false, name: 'جسور الوادي' },
    { x: 9700, y: 490, w: 26, h: 60, reached: false, name: 'حرم اللانهاية' }
  ],

  // End Pedestals & Grand Infinity Gate
  pedestals: [
    { id: 1, x: 9960, y: 505, w: 36, h: 45, item: 'key', icon: '🔑', label: 'المفتاح', inserted: false },
    { id: 2, x: 10120, y: 505, w: 36, h: 45, item: 'ring', icon: '💍', label: 'الوعد', inserted: false }
  ],
  grandInfinityGate: { x: 10350, y: 410, w: 90, h: 140, open: false },
  exitGate: { x: 10600, y: 450, w: 60, h: 100 },

  // Authentic Dialogue Triggers Along the Journey
  dialogueTriggers: [
    { x: 140, speaker: "إسراء", text: "أهلاً... نكمل؟ ❤️", triggered: false },
    { x: 260, speaker: "أحمد", text: "يلا خطوة بخطوة سوا!", triggered: false },
    { x: 1600, speaker: "إسراء", text: "استنى... البوابة مقفولة!", triggered: false },
    { x: 1660, speaker: "أحمد", text: "جربي الممر اللي فوق يا إسراء ✨", triggered: false },
    { x: 2160, speaker: "إسراء", text: "فتحتها! يلا نعدي سوا ❤️", triggered: false },
    { x: 3000, speaker: "أحمد", text: "سيبوا الصخرة دي ليا! هزقها بقوة 💪", triggered: false },
    { x: 3320, speaker: "إسراء", text: "عاش يا بطل! الطريق اتفتح وفيه رمز ∞ مخفي ✨", triggered: false },
    { x: 4450, speaker: "إسراء", text: "في لوحين... نقف عليهم مع بعض عشان البوابة تفتح! 💍", triggered: false },
    { x: 5900, speaker: "أحمد", text: "بصي يا إسراء... استراحة شاي بلبن! ☕", triggered: false },
    { x: 7200, speaker: "أحمد", text: "حارس قدامنا... هتعامل معاه بلكمتي! 👊", triggered: false },
    { x: 8400, speaker: "إسراء", text: "الجسور عالية... ثبتي خطواتك وأنا وراكي ❤️", triggered: false },
    { x: 9800, speaker: "إسراء", text: "وصلنا للبوابة الكبرى... جاهز يا أحمد؟ 💍", triggered: false },
    { x: 10150, speaker: "أحمد", text: "المفتاح والوعد هيدخلونا طريق اللانهاية سوا! 💍✨", triggered: false }
  ]
};

const levels = {
  1: continuousWorld,
  // Seamless section presets if selected from menu
  2: { ...continuousWorld, playerStart: { x: 2860, y: 480 }, esraaStart: { x: 2900, y: 480 } },
  3: { ...continuousWorld, playerStart: { x: 4300, y: 480 }, esraaStart: { x: 4340, y: 480 } },
  4: { ...continuousWorld, playerStart: { x: 5700, y: 480 }, esraaStart: { x: 5740, y: 480 } },
  5: { ...continuousWorld, playerStart: { x: 8500, y: 480 }, esraaStart: { x: 8540, y: 480 } }
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
  window.MilkTeaStand = MilkTeaStand;
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
    this.activePlayer = character === 'esraa' ? this.esraa : this.player;
    this.companionPlayer = character === 'esraa' ? this.player : this.esraa;

    soundManager.playSfx('switch');

    const switchBtn = document.getElementById('btn-switch-player');
    const hudIcon = document.getElementById('switch-player-icon');
    const hudName = document.getElementById('switch-player-name');
    const touchIcon = document.getElementById('touch-switch-icon');
    const touchSub = document.getElementById('touch-switch-sub');
    const touchActionIcon = document.getElementById('touch-action-icon');
    const touchActionSub = document.getElementById('touch-action-sub');

    if (character === 'esraa') {
      if (switchBtn) switchBtn.classList.add('active-esraa');
      if (hudIcon) hudIcon.textContent = '👰';
      if (hudName) hudName.textContent = 'إسراء (مُفعل)';
      if (touchIcon) touchIcon.textContent = '🤵';
      if (touchSub) touchSub.textContent = 'أحمد';
      if (touchActionIcon) touchActionIcon.textContent = '🖐️';
      if (touchActionSub) touchActionSub.textContent = 'تفاعل';
      UIManager.showSystemToast('تحكم إسراء مفعل الآن ✨');
    } else {
      if (switchBtn) switchBtn.classList.remove('active-esraa');
      if (hudIcon) hudIcon.textContent = '🤵';
      if (hudName) hudName.textContent = 'أحمد (مُفعل)';
      if (touchIcon) touchIcon.textContent = '👰';
      if (touchSub) touchSub.textContent = 'إسراء';
      if (touchActionIcon) touchActionIcon.textContent = '👊';
      if (touchActionSub) touchActionSub.textContent = 'هجوم/دفع';
      UIManager.showSystemToast('تحكم أحمد مفعل الآن 💪');
    }
  }

  bindDOM() {
    const checkOrientationPrompt = () => {
      const isPortraitMobile = window.innerHeight > window.innerWidth && window.innerWidth < 850;
      const promptModal = document.getElementById('modal-landscape-prompt');
      if (promptModal) {
        if (isPortraitMobile && (gameState.gameStatus === 'playing' || gameState.gameStatus === 'title_splash')) {
          promptModal.classList.remove('hidden');
        } else {
          promptModal.classList.add('hidden');
        }
      }
    };

    const handleLayoutChange = () => {
      this.initCanvasSize();
      checkOrientationPrompt();
      if (this.currentLevelData && this.activePlayer) {
        this.camera.follow(this.activePlayer, this.currentLevelData.width, this.currentLevelData.height, 1.0);
      }
    };

    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleLayoutChange, 120);
    });
    document.addEventListener('fullscreenchange', handleLayoutChange);
    document.addEventListener('webkitfullscreenchange', handleLayoutChange);

    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => handleLayoutChange());
      ro.observe(canvasContainer);
    }

    // Fullscreen Toggle
    const fullscreenBtn = document.getElementById('btn-fullscreen-toggle');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement && !(document).webkitFullscreenElement) {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(() => {});
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
          }
          if (fullscreenIcon) fullscreenIcon.textContent = '✕';
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
          if (fullscreenIcon) fullscreenIcon.textContent = '⛶';
        }
        setTimeout(handleLayoutChange, 150);
      });
    }

    // Force Landscape & Dismiss Landscape Prompt Buttons
    const btnForceLandscape = document.getElementById('btn-force-landscape');
    const btnDismissLandscape = document.getElementById('btn-dismiss-landscape');
    const promptModal = document.getElementById('modal-landscape-prompt');

    if (btnForceLandscape) {
      btnForceLandscape.addEventListener('click', async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape').catch(() => {});
          }
        } catch (_) {}
        if (promptModal) promptModal.classList.add('hidden');
        setTimeout(handleLayoutChange, 150);
      });
    }

    if (btnDismissLandscape) {
      btnDismissLandscape.addEventListener('click', () => {
        if (promptModal) promptModal.classList.add('hidden');
      });
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
    if (!this.currentLevelData.hazards) this.currentLevelData.hazards = this.currentLevelData.distractions || [];

    // Filter out already collected infinity symbols to prevent duplicates
    if (this.currentLevelData.collectibles) {
      this.currentLevelData.collectibles = this.currentLevelData.collectibles.filter(
        c => !gameState.collectedInfinityIds.has(c.id)
      );
    }
    this.currentLevelData.infinitySymbols = this.currentLevelData.collectibles;
    gameState.collectiblesRequired = this.currentLevelData.collectiblesRequired || 4;

    // Instantiate cooperative puzzle entities & scenery
    this.pressurePlates = (this.currentLevelData.pressurePlates || []).map(
      p => new PressurePlate(p.id, p.x, p.y, p.w, p.h, p.targetId, p.label)
    );
    this.levers = (this.currentLevelData.levers || []).map(
      l => new Lever(l.id, l.x, l.y, l.targetId, l.isTimed, l.timerDuration, l.label)
    );
    this.gates = (this.currentLevelData.gates || []).map(
      g => new Gate(g.id, g.x, g.y, g.w, g.h, g.requiredTriggers, g.label)
    );
    this.pushableBlocks = (this.currentLevelData.pushableBlocks || []).map(
      b => new PushableBlock(b.id, b.x, b.y, b.w, b.h, b.isRock)
    );
    this.breakableBarriers = (this.currentLevelData.breakableBarriers || []).map(
      b => new BreakableBarrier(b.id, b.x, b.y, b.w, b.h, b.label)
    );
    this.narrowPassages = (this.currentLevelData.narrowPassages || []).map(
      n => new NarrowPassage(n.id, n.x, n.y, n.w, n.h, n.label)
    );
    this.enemies = (this.currentLevelData.enemies || []).map(
      e => new Enemy(e.id, e.x, e.y, e.minX, e.maxX, e.speed, e.name)
    );
    this.milkteaStands = (this.currentLevelData.milkteaStands || []).map(
      m => new MilkTeaStand(m.id, m.x, m.y, m.label)
    );
    this.footballStands = (this.currentLevelData.footballStands || []).map(
      f => new FootballMatchStand(f.id, f.x, f.y, f.label)
    );
    this.sceneryProps = (this.currentLevelData.scenery || []).map(
      s => new SceneryProp(s.type, s.x, s.y, s.options)
    );

    // Reset both Ahmed and Esraa positions (They start together in the same level!)
    const start = this.currentLevelData.playerStart;
    this.player.x = start.x;
    this.player.y = start.y;
    this.player.velocityX = 0;
    this.player.velocityY = 0;

    const eStart = this.currentLevelData.esraaStart || { x: start.x + 35, y: start.y };
    this.esraa.x = eStart.x;
    this.esraa.y = eStart.y;
    this.esraa.velocityX = 0;
    this.esraa.velocityY = 0;

    this.switchControlTo('ahmed');

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

    soundManager.playSfx('checkpoint');
  }

  handleAhmedAttack(punchX, punchY, facing) {
    // Check enemies
    if (this.enemies) {
      for (const en of this.enemies) {
        if (!en.alive) continue;
        const dist = Math.hypot(punchX - (en.x + en.w / 2), punchY - (en.y + en.h / 2));
        if (dist < 44) {
          en.hit();
          this.speech.add('إسراء', 'عاش يا أحمد! 👏', this.esraa, 2.2);
          UIManager.showSystemToast(`تمت هزيمة ${en.name} 💥`);
        }
      }
    }

    // Check breakable barriers
    if (this.breakableBarriers) {
      for (const barr of this.breakableBarriers) {
        if (barr.destroyed) continue;
        const dist = Math.hypot(punchX - (barr.x + barr.w / 2), punchY - (barr.y + barr.h / 2));
        if (dist < 46) {
          barr.hit();
          this.speech.add('إسراء', 'قوة خارقة! الطريق اتفتح ✨', this.esraa, 2.2);
          UIManager.showSystemToast('تم تحطيم الحاجز بنجاح 💥');
        }
      }
    }
  }

  respawnAtCheckpoint() {
    this.fallCount++;
    const targetPlayer = this.activePlayer;
    let cp = gameState.checkpoints[gameState.currentLevel] || this.currentLevelData.playerStart;

    this.player.x = cp.x;
    this.player.y = cp.y;
    this.player.velocityX = 0;
    this.player.velocityY = 0;

    this.esraa.x = cp.x + 32;
    this.esraa.y = cp.y;
    this.esraa.velocityX = 0;
    this.esraa.velocityY = 0;

    soundManager.playSfx('hit');

    // Occasional comedic/romantic dialogue on repeated falls
    if (this.fallCount >= 2) {
      const fallQuotes = [
        "إنت بتقع في نفس المكان كل مرة؟ 😂",
        "قولتلك خلي بالك 😂",
        "نبدأ من هنا... عادي مكملين سوا ❤️",
        "ركز شوية يا بطل! 😉"
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
      1: "إسراء: أهو كده... أول خطوة سوا وبداية حكايتنا! ❤️",
      2: "إسراء: شفت لما اتعاونّا؟ مفيش لغز يقدر يوقفنا! ✨",
      3: "إسراء: برافو يا أحمد! عدينا أصعب جسور مع بعض.",
      4: "إسراء: النجوم نورت طريقنا... مبقاش غير البوابة الكبرى!",
      5: "إسراء: وصلنا يا أحمد... المهمة تمت بنجاح! ❤️"
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
    // 1. If Ahmed is active, trigger his power attack
    if (gameState.activeCharacter === 'ahmed') {
      this.player.attack();
    } else if (gameState.activeCharacter === 'esraa') {
      this.esraa.interact();
    }

    // 2. Check nearby levers
    if (this.levers) {
      const center = this.activePlayer.getCenter();
      for (const lev of this.levers) {
        if (Math.hypot(center.x - (lev.x + lev.w / 2), center.y - (lev.y + lev.h / 2)) < 44) {
          lev.toggle();
          UIManager.showSystemToast(lev.isTimed ? 'تم تفعيل المفتاح المؤقت ⏱️' : 'تم تبديل المفتاح ⚙️');
          return;
        }
      }
    }

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

    // Milk Tea Roadside Stand
    else if (act.type === 'milktea') {
      const stand = act.data;
      stand.interact(gameState.activeCharacter, this);
    }

    // Al Ahly Football Match Roadside Distraction
    else if (act.type === 'football') {
      const stand = act.data;
      stand.interact(gameState.activeCharacter, this);
    }

    // Key Pickup
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
          soundManager.playSfx('click');
          this.particles.emit(ped.x + 17, ped.y + 15, '#C9A86A', 16, 120, 0.6);
          UIManager.showSystemToast('CLICK! تم تركيب المفتاح');
        } else if (ped.item === 'ring' && gameState.inventory.ring) {
          ped.inserted = true;
          soundManager.playSfx('click');
          this.particles.emit(ped.x + 17, ped.y + 15, '#FFA6B5', 16, 120, 0.6);
          UIManager.showSystemToast('CLICK! تم تركيب رمز الوعد');
        } else {
          UIManager.showSystemToast(`محتاج ${ped.label} لتركيبه هنا!`);
        }

        const allInserted = this.currentLevelData.pedestals.every(p => p.inserted);
        if (allInserted) {
          this.currentLevelData.grandInfinityGate.open = true;
          soundManager.playSfx('door');
          this.speech.add('إسراء', 'بوابة اللانهاية اتفتحت... ادخل يا أحمد ❤️', this.esraa, 3.5);
          UIManager.showSystemToast('تم فتح بوابة اللانهاية الكبرى!');
        }
      }
    }
  }

  update(dt) {
    if (gameState.gameStatus !== 'playing') return;

    // Control switch logic (instant swap between Ahmed and Esraa)
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

    // Update puzzle entities
    if (this.pressurePlates) {
      for (const plate of this.pressurePlates) {
        plate.update(this.player, this.esraa, this.pushableBlocks);
      }
    }
    if (this.levers) {
      for (const lever of this.levers) {
        lever.update(dt);
      }
    }
    if (this.gates) {
      for (const gate of this.gates) {
        gate.update(dt, this.pressurePlates, this.levers);
      }
    }
    if (this.pushableBlocks) {
      for (const block of this.pushableBlocks) {
        block.update(dt, this.currentLevelData.platforms);
      }
    }
    if (this.enemies) {
      for (const en of this.enemies) {
        en.update(dt);
        if (en.alive && this.activePlayer.collidesWith(en)) {
          this.activePlayer.takeDamage();
        }
      }
    }

    // Combined platform collisions (platforms + closed gates + solid barriers)
    const closedGates = (this.gates || []).filter(g => !g.isOpen);
    const solidBarriers = (this.breakableBarriers || []).filter(b => !b.destroyed);
    const combinedPlatforms = [
      ...(this.currentLevelData.platforms || []),
      ...closedGates,
      ...solidBarriers
    ];

    // Narrow passage constraint: Only Esraa can pass through!
    if (this.narrowPassages && gameState.activeCharacter === 'ahmed') {
      for (const np of this.narrowPassages) {
        if (this.player.collidesWith(np)) {
          this.player.x = np.x - this.player.width - 2;
          this.player.velocityX = 0;
          this.speech.add('أحمد', 'الممر ضيق عليا... دورك يا إسراء! ✨', this.player, 2.5);
        }
      }
    }

    // Update active player & companion duo AI
    this.activePlayer.update(dt, this.input, combinedPlatforms, this.pushableBlocks);
    this.companionPlayer.updateCompanionAI(dt, this.activePlayer, combinedPlatforms, this.pushableBlocks);

    // Camera follow the currently controlled player with smooth interpolation and dt
    this.camera.follow(this.activePlayer, this.currentLevelData.width, this.currentLevelData.height, dt);

    // Out-of-bounds recovery safeguard (resets position smoothly without deducting health)
    if (this.activePlayer.y > 640) {
      this.activePlayer.y = 480;
      this.activePlayer.velocityY = 0;
    }

    // Infinity Collectibles Collection
    if (this.currentLevelData.collectibles) {
      for (let i = this.currentLevelData.collectibles.length - 1; i >= 0; i--) {
        const c = this.currentLevelData.collectibles[i];
        if (c.collected || gameState.collectedInfinityIds.has(c.id)) {
          this.currentLevelData.collectibles.splice(i, 1);
          continue;
        }

        const center = this.activePlayer.getCenter();
        const dist = Math.hypot(center.x - c.x, center.y - c.y);
        if (dist < 34) {
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

    // Level 4: Star Stones
    if (gameState.currentLevel === 4 && this.currentLevelData.starStones) {
      for (const stone of this.currentLevelData.starStones) {
        if (!stone.activated) {
          const center = this.activePlayer.getCenter();
          const dist = Math.hypot(center.x - stone.x, center.y - stone.y);
          if (dist < 36) {
            stone.activated = true;
            soundManager.playSfx('checkpoint');
            this.particles.emit(stone.x, stone.y, '#FFA6B5', 18, 130, 0.6);
            UIManager.showSystemToast(`تم تنشيط ${stone.icon}! ✨`);
          }
        }
      }
    }

    // Story dialogue triggers
    if (this.currentLevelData.dialogueTriggers) {
      for (const trig of this.currentLevelData.dialogueTriggers) {
        if (!trig.triggered && this.player.x >= trig.x) {
          trig.triggered = true;
          this.speech.add(trig.speaker, trig.text, trig.speaker === 'إسراء' ? this.esraa : this.player, 3.0);
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
            soundManager.playSfx('checkpoint');
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

    // Dynamic HUD Section Name update during continuous side-scrolling journey
    if (this.currentLevelData && this.activePlayer) {
      const px = this.activePlayer.x;
      let sectionLabel = "MISSION ∞: مسار البداية";
      if (px >= 9600) sectionLabel = "MISSION ∞: حرم اللانهاية الكبرى 💍";
      else if (px >= 8400) sectionLabel = "MISSION ∞: جسور الوادي العالية 🌉";
      else if (px >= 7000) sectionLabel = "MISSION ∞: غابة الحراس 🌲";
      else if (px >= 5600) sectionLabel = "MISSION ∞: استراحة شاي بلبن ☕";
      else if (px >= 4200) sectionLabel = "MISSION ∞: لوح التعاون المشترك 🤝";
      else if (px >= 2800) sectionLabel = "MISSION ∞: صخرة التحدي 💪";
      else if (px >= 1400) sectionLabel = "MISSION ∞: بوابة الممر ⛩️";
      UIManager.updateLevelLabel(sectionLabel);
    }

    // Rare Idle Humor Dialogue (Requirement 17 & 18)
    if (this.activePlayer && Math.abs(this.activePlayer.velocityX) < 5 && this.activePlayer.grounded) {
      this.idleTimer = (this.idleTimer || 0) + dt;
      if (this.idleTimer > 9.5) {
        this.idleTimer = -14.0; // Cooldown before next idle line
        if (gameState.activeCharacter === 'ahmed') {
          const lines = [
            "هنكمل ولا هنبات هنا؟ 😂",
            "خلصت استراحة يا بطل؟ 😉",
            "يلا يا أحمد... الطريق مستنينا! ❤️"
          ];
          const line = lines[Math.floor(Math.random() * lines.length)];
          this.speech.add('إسراء', line, this.esraa, 2.8);
        } else {
          const lines = [
            "يلا بينا يا إسراء ولا إيه؟ 😂",
            "وقفنا كتير يا بطلة! 😉",
            "جاهزة نكمل مشوارنا؟ ❤️"
          ];
          const line = lines[Math.floor(Math.random() * lines.length)];
          this.speech.add('أحمد', line, this.player, 2.8);
        }
      }
    } else {
      this.idleTimer = 0;
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

    // Milk Tea Roadside Stand
    if (!found && this.milkteaStands) {
      for (const ms of this.milkteaStands) {
        if (!ms.used && Math.hypot(center.x - (ms.x + ms.w / 2), center.y - (ms.y + ms.h / 2)) < 52) {
          found = { type: 'milktea', data: ms, text: 'استراحة شاي بلبن ☕' };
          break;
        }
      }
    }

    // Al Ahly Football Match Roadside Distraction
    if (!found && this.footballStands) {
      for (const fs of this.footballStands) {
        if (!fs.used && Math.hypot(center.x - (fs.x + fs.w / 2), center.y - (fs.y + fs.h / 2)) < 52) {
          found = { type: 'football', data: fs, text: 'مباراة الأهلي ⚽' };
          break;
        }
      }
    }

    // Key Pickup
    if (!found && this.currentLevelData.keyPickup && !this.currentLevelData.keyPickup.collected) {
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

    // Environmental Scenery Props (Trees, Lanterns, Benches, Flowers, Fences)
    if (this.sceneryProps) {
      for (const sp of this.sceneryProps) sp.draw(ctx, this.camera);
    }

    // Roadside Milk Tea Stops
    if (this.milkteaStands) {
      for (const ms of this.milkteaStands) ms.draw(ctx, this.camera);
    }

    // Al Ahly Football Match Roadside Distractions
    if (this.footballStands) {
      for (const fs of this.footballStands) fs.draw(ctx, this.camera);
    }

    // Cooperative Puzzle Objects & Barriers
    if (this.narrowPassages) {
      for (const np of this.narrowPassages) np.draw(ctx, this.camera);
    }
    if (this.pressurePlates) {
      for (const plate of this.pressurePlates) plate.draw(ctx, this.camera);
    }
    if (this.levers) {
      for (const lever of this.levers) lever.draw(ctx, this.camera);
    }
    if (this.gates) {
      for (const gate of this.gates) gate.draw(ctx, this.camera);
    }
    if (this.pushableBlocks) {
      for (const block of this.pushableBlocks) block.draw(ctx, this.camera);
    }
    if (this.breakableBarriers) {
      for (const barr of this.breakableBarriers) barr.draw(ctx, this.camera);
    }
    if (this.enemies) {
      for (const en of this.enemies) en.draw(ctx, this.camera);
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
      const auraRadius = Math.max(10, 82 * zoom);
      const isEsraa = gameState.activeCharacter === 'esraa';
      const auraGrad = ctx.createRadialGradient(
        charScreenX, charScreenY, 2,
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
      const r0 = Math.max(0, Math.min(viewW, viewH) * 0.1);
      const r1 = Math.max(r0 + 20, Math.max(viewW, viewH) * 0.9);
      const vigGrad = ctx.createRadialGradient(
        charScreenX, charScreenY, r0,
        viewW / 2, viewH / 2, r1
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
