/* ==========================================================================
   Web Audio API & Background Music Player (Zero sound for 1, 2, 3, 5)
   ========================================================================== */

class ChristmasAudioSynth {
  constructor() {
    this.ctx = null;
    this.isEnabled = true;
    this.lastPlayTime = 0;

    // Background Audio Track
    this.bgMusic = new Audio('images/audio.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.6;
    this.isMusicPlaying = false;

    this.bgMusic.addEventListener('loadedmetadata', () => {
      this.bgMusic.currentTime = 12;
    });
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isEnabled && !this.isMusicPlaying) {
      this.bgMusic.play().then(() => {
        this.isMusicPlaying = true;
      }).catch(e => {
        console.warn("Audio play blocked until user interaction:", e);
      });
    }
  }

  toggleSound() {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.init();
      this.bgMusic.play();
      this.isMusicPlaying = true;
    } else {
      this.bgMusic.pause();
      this.isMusicPlaying = false;
    }
    return this.isEnabled;
  }

  playBell(freq, duration = 1.2, volume = 0.3) {
    if (!this.isEnabled || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + duration);
    } catch (e) {
      console.warn("Audio playback error:", e);
    }
  }

  playGestureEffect(mode) {
    if (!this.isEnabled) return;

    // Zero sound for 1, 2, 3, 5 as requested!
    if (mode === 1 || mode === 2 || mode === 3 || mode === 5) {
      return;
    }

    this.init();
    const now = Date.now();
    if (now - this.lastPlayTime < 300) return;
    this.lastPlayTime = now;

    if (mode === 8) { // Romantic Heart Harmony Arpeggio 💖
      const heartNotes = [440.00, 554.37, 659.25, 880.00];
      heartNotes.forEach((freq, idx) => {
        setTimeout(() => this.playBell(freq, 1.4, 0.2), idx * 120);
      });
    }
  }
}

window.ChristmasAudioSynth = ChristmasAudioSynth;
