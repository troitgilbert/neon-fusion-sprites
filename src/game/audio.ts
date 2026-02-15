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
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.4);
}

export function playSuperSound() {
  const ctx = getCtx();
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300 + i * 200, ctx.currentTime + i * 0.08);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + i * 0.08 + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.3);
  }
}

export function playKOSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.6);
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

  if (stage === 'nada') return; // silence

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

  if (stage === 'default') { // Galaxia
    createDrone(55, 'sine', 0.06);
    createDrone(82.5, 'sine', 0.04);
    createDrone(110, 'triangle', 0.02);
  } else if (stage === 'infierno') {
    createDrone(40, 'sawtooth', 0.04);
    createDrone(60, 'square', 0.02);
    createDrone(80, 'sawtooth', 0.03);
  } else if (stage === 'cielo') {
    createDrone(220, 'sine', 0.03);
    createDrone(330, 'sine', 0.02);
    createDrone(440, 'triangle', 0.01);
  }
}
