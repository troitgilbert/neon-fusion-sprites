// Web Audio API sound system
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playHitSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.15);
}

export function playSpecialSound() {
  const ctx = getCtx();
  // Orchestral-style rising sweep
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const baseFreq = 300 + i * 150;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + i * 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + i * 0.05 + 0.25);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.05);
    osc.stop(ctx.currentTime + i * 0.05 + 0.3);
  }
}

export function playSuperSound() {
  const ctx = getCtx();
  // Epic orchestral chord
  const freqs = [220, 277, 330, 440, 554];
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i < 2 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f * 1.5, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.03);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.03);
    osc.stop(ctx.currentTime + 0.5);
  });
}

export function playKOSound() {
  const ctx = getCtx();
  // Dramatic descending brass
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();
  osc1.type = 'sawtooth'; osc2.type = 'square';
  osc1.frequency.setValueAtTime(600, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.8);
  osc2.frequency.setValueAtTime(400, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.8);
  gain1.gain.setValueAtTime(0.3, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  gain2.gain.setValueAtTime(0.15, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  osc1.connect(gain1).connect(ctx.destination);
  osc2.connect(gain2).connect(ctx.destination);
  osc1.start(); osc1.stop(ctx.currentTime + 0.8);
  osc2.start(); osc2.stop(ctx.currentTime + 0.8);
}

export function playBlockSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.08);
}

export function playSelectSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.12);
}

export function playConfirmSound() {
  const ctx = getCtx();
  [523, 659, 784].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.15);
  });
}

export function playAchievementSound() {
  const ctx = getCtx();
  const notes = [392, 494, 587, 784];
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.3);
  });
}

// Stage ambient music
let ambientOscillators: OscillatorNode[] = [];
let ambientGains: GainNode[] = [];

export function stopAmbient() {
  ambientOscillators.forEach(o => { try { o.stop(); } catch {} });
  ambientOscillators = [];
  ambientGains = [];
}

export function startAmbient(stage: string) {
  stopAmbient();
  const ctx = getCtx();

  if (stage === 'nada') return;

  const createDrone = (freq: number, type: OscillatorType, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    lfo.frequency.value = 0.2 + Math.random() * 0.3;
    lfoGain.gain.value = freq * 0.02;
    lfo.connect(lfoGain).connect(osc.frequency);
    gain.gain.value = vol;
    osc.connect(gain).connect(ctx.destination);
    osc.start(); lfo.start();
    ambientOscillators.push(osc, lfo);
    ambientGains.push(gain);
  };

  if (stage === 'default') {
    createDrone(55, 'sine', 0.06);
    createDrone(82.5, 'sine', 0.04);
    createDrone(110, 'triangle', 0.02);
    createDrone(165, 'sine', 0.015);
  } else if (stage === 'infierno') {
    createDrone(40, 'sawtooth', 0.04);
    createDrone(60, 'square', 0.02);
    createDrone(80, 'sawtooth', 0.03);
    createDrone(120, 'square', 0.015);
  } else if (stage === 'cielo') {
    createDrone(220, 'sine', 0.03);
    createDrone(330, 'sine', 0.02);
    createDrone(440, 'triangle', 0.01);
    createDrone(550, 'sine', 0.008);
  }
}

// Menu background music
let menuOscillators: OscillatorNode[] = [];
let menuGains: GainNode[] = [];

export function stopMenuMusic() {
  menuOscillators.forEach(o => { try { o.stop(); } catch {} });
  menuOscillators = [];
  menuGains = [];
}

export function startMenuMusic() {
  stopMenuMusic();
  const ctx = getCtx();

  // Ethereal pad
  const notes = [110, 138.6, 164.8, 220];
  notes.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    lfo.frequency.value = 0.1 + Math.random() * 0.15;
    lfoGain.gain.value = freq * 0.015;
    lfo.connect(lfoGain).connect(osc.frequency);
    gain.gain.value = 0.025;
    osc.connect(gain).connect(ctx.destination);
    osc.start(); lfo.start();
    menuOscillators.push(osc, lfo);
    menuGains.push(gain);
  });
}
