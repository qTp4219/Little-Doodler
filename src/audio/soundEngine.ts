/**
 * Toddler Audio Synthesizer (Web Audio API)
 * Zero external audio files, instant response (<10ms), zero 404 risks.
 * Calibrated for gentle, soft, ear-safe volume on phone & tablet speakers.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastSoundTime = 0;
  private minIntervalMs = 35; // Prevents audio crackle on rapid multi-finger taps

  constructor() {
    // Check persisted mute preference
    try {
      const saved = localStorage.getItem('toddler_audio_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      // Ignore storage restrictions
    }
  }

  private initCtx(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      }
    } catch {
      // Audio not supported
    }
    return null;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('toddler_audio_muted', String(this.isMuted));
    } catch {
      // Ignore storage restrictions
    }
    if (!this.isMuted) {
      this.playPop(440);
    }
    return this.isMuted;
  }

  private canPlay(): boolean {
    if (this.isMuted) return false;
    const now = performance.now();
    if (now - this.lastSoundTime < this.minIntervalMs) {
      return false;
    }
    this.lastSoundTime = now;
    return true;
  }

  /**
   * Play a warm marimba / xylophone note for color picking or button taps
   */
  public playColorNote(freq: number) {
    if (!this.canPlay()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Low-pass filter for soft acoustic warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Gentle overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      gain2.gain.setValueAtTime(0.04, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(filter);
      gain2.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.33);
      osc2.stop(now + 0.23);
    } catch {
      // Ignore audio glitches
    }
  }

  /**
   * Play a bubbly pop sound when filling a shape
   */
  public playPop(baseFreq = 320) {
    if (!this.canPlay()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Quick pitch rise then decay like popping a bubble
      osc.frequency.setValueAtTime(baseFreq * 0.75, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.14);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }

  /**
   * Play a sparkling fairy chime (for sparkle brush or card tap)
   */
  public playSparkle() {
    if (!this.canPlay()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.045;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.23);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play a gentle whoosh for undo or clear
   */
  public playWhoosh() {
    if (!this.canPlay()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // Ignore
    }
  }

  /**
   * Play cheerful fanfare when opening a picture
   */
  public playFanfare() {
    if (!this.canPlay()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Joyful major arpeggio
      const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.14, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEngine();

