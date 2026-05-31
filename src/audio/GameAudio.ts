// ---------------------------------------------------------------------------
// Audio 100% procedurale (Web Audio API): nessun file, peso zero.
// SFX chiptune per salto e moneta + musichetta in loop (lead + basso).
// Usa il contesto audio di Phaser, così lo sblocco su iOS (serve un primo
// tocco) è già gestito dal sound manager.
// ---------------------------------------------------------------------------

// Note (Hz) usate dalla melodia — La minore pentatonica (sapore arcade).
const A2 = 110, E2 = 82.41, C3 = 130.81, G2 = 98;
const A4 = 440, C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880;

const STEP = 0.16; // durata di uno step (secondi)
// 16 step di lead; 0 = pausa.
const LEAD = [A4, E5, A5, E5, C5, E5, A5, G5, D5, A4, D5, E5, C5, A4, E5, G5];
// basso: una nota ogni 4 step (Am – C – G – Em)
const BASS = [A2, C3, G2, E2];

type Osc = OscillatorType;

export class GameAudio {
  private ctx: AudioContext;
  private master: GainNode;
  private music: GainNode;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private _muted = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.45;
    this.master.connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.gain.value = 0.16;
    this.music.connect(this.master);
  }

  get muted(): boolean {
    return this._muted;
  }

  /** Una nota con inviluppo attacco/decadimento. */
  private note(freq: number, start: number, dur: number, type: Osc, peak: number, dest: AudioNode): void {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(dest);
    o.start(start);
    o.stop(start + dur + 0.03);
  }

  /** Salto: blip in salita. */
  jump(): void {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(640, t + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.2);
  }

  /** Moneta: due note rapide (classico). */
  coin(): void {
    const t = this.ctx.currentTime;
    this.note(988, t, 0.08, 'square', 0.3, this.master); // B5
    this.note(1319, t + 0.08, 0.16, 'square', 0.3, this.master); // E6
  }

  startMusic(): void {
    if (this.timer != null) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.nextTime = this.ctx.currentTime + 0.08;
    this.step = 0;
    this.timer = window.setInterval(() => this.scheduler(), 25);
  }

  stopMusic(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    // ramp morbido per evitare "click"
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(this._muted ? 0 : 0.45, t + 0.05);
    return this._muted;
  }

  /** Lookahead scheduler: pianifica gli step nei prossimi ~100ms. */
  private scheduler(): void {
    while (this.nextTime < this.ctx.currentTime + 0.1) {
      const i = this.step % 16;
      const lead = LEAD[i];
      if (lead) this.note(lead, this.nextTime, STEP * 0.9, 'square', 0.14, this.music);
      if (i % 4 === 0) this.note(BASS[i / 4], this.nextTime, STEP * 3.6, 'triangle', 0.22, this.music);
      this.nextTime += STEP;
      this.step++;
    }
  }
}
