// Web Audio API sound system — enhanced orchestral
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function createReverb(ctx: AudioContext, duration = 1.5): ConvolverNode {
  const conv = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  conv.buffer = buffer;
  return conv;
}

export function playHitSound() {
  const ctx = getCtx();
  // Meaty orchestral hit
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const noise = ctx.createBufferSource();
  const gain = ctx.createGain();
  const gain2 = ctx.createGain();
  const noiseGain = ctx.createGain();

  // Impact thud
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  // Crack
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(800, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
  gain2.gain.setValueAtTime(0.12, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

  // Noise burst
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.5;
  noise.buffer = noiseBuffer;
  noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  osc.connect(gain).connect(ctx.destination);
  osc2.connect(gain2).connect(ctx.destination);
  noise.connect(noiseGain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.15);
  osc2.start(); osc2.stop(ctx.currentTime + 0.06);
  noise.start(); noise.stop(ctx.currentTime + 0.05);
}

export function playSpecialSound() {
  const ctx = getCtx();
  // Orchestral rising sweep with reverb
  const reverb = createReverb(ctx, 0.8);
  const dry = ctx.createGain();
  dry.gain.value = 0.7;
  const wet = ctx.createGain();
  wet.gain.value = 0.3;

  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i < 2 ? 'sawtooth' : 'triangle';
    const baseFreq = 250 + i * 120;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + i * 0.04);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 3, ctx.currentTime + i * 0.04 + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.04 + 0.35);
    osc.connect(gain);
    gain.connect(dry).connect(ctx.destination);
    gain.connect(wet).connect(reverb).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.04);
    osc.stop(ctx.currentTime + i * 0.04 + 0.35);
  }
}

export function playSuperSound() {
  const ctx = getCtx();
  // Epic orchestral chord with timpani
  const reverb = createReverb(ctx, 1.2);
  const freqs = [165, 220, 277, 330, 440, 554];
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i < 3 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f * 1.8, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    const wet = ctx.createGain(); wet.gain.value = 0.15;
    gain.connect(wet).connect(reverb).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.02);
    osc.stop(ctx.currentTime + 0.6);
  });

  // Timpani
  const timpani = ctx.createOscillator();
  const tGain = ctx.createGain();
  timpani.type = 'sine';
  timpani.frequency.setValueAtTime(80, ctx.currentTime);
  timpani.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
  tGain.gain.setValueAtTime(0.3, ctx.currentTime);
  tGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
  timpani.connect(tGain).connect(ctx.destination);
  timpani.start(); timpani.stop(ctx.currentTime + 0.4);
}

export function playKOSound() {
  const ctx = getCtx();
  const reverb = createReverb(ctx, 2);
  // Dramatic brass descent
  [600, 500, 400, 300].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
    osc.frequency.exponentialRampToValueAtTime(f * 0.3, ctx.currentTime + i * 0.12 + 0.5);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.5);
    osc.connect(gain).connect(ctx.destination);
    const wet = ctx.createGain(); wet.gain.value = 0.2;
    gain.connect(wet).connect(reverb).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.5);
  });

  // Low boom
  const boom = ctx.createOscillator();
  const bGain = ctx.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(50, ctx.currentTime);
  boom.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1);
  bGain.gain.setValueAtTime(0.4, ctx.currentTime);
  bGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
  boom.connect(bGain).connect(ctx.destination);
  boom.start(); boom.stop(ctx.currentTime + 1);
}

export function playBlockSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const gain2 = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1200, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
  gain2.gain.setValueAtTime(0.08, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
  osc.connect(gain).connect(ctx.destination);
  osc2.connect(gain2).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.1);
  osc2.start(); osc2.stop(ctx.currentTime + 0.06);
}

export function playSelectSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
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
  const reverb = createReverb(ctx, 1.5);
  const notes = [392, 494, 587, 784, 988];
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i < 3 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
    osc.connect(gain).connect(ctx.destination);
    const wet = ctx.createGain(); wet.gain.value = 0.2;
    gain.connect(wet).connect(reverb).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.4);
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
    lfo.frequency.value = 0.15 + Math.random() * 0.25;
    lfoGain.gain.value = freq * 0.02;
    lfo.connect(lfoGain).connect(osc.frequency);
    gain.gain.value = vol;
    osc.connect(gain).connect(ctx.destination);
    osc.start(); lfo.start();
    ambientOscillators.push(osc, lfo);
    ambientGains.push(gain);
  };

  if (stage === 'default') {
    createDrone(55, 'sine', 0.05);
    createDrone(82.5, 'sine', 0.035);
    createDrone(110, 'triangle', 0.02);
    createDrone(165, 'sine', 0.012);
    createDrone(220, 'sine', 0.006);
  } else if (stage === 'infierno') {
    createDrone(36, 'sawtooth', 0.035);
    createDrone(55, 'square', 0.02);
    createDrone(73, 'sawtooth', 0.025);
    createDrone(110, 'square', 0.012);
    createDrone(146, 'sawtooth', 0.008);
  } else if (stage === 'cielo') {
    createDrone(220, 'sine', 0.025);
    createDrone(330, 'sine', 0.018);
    createDrone(440, 'triangle', 0.01);
    createDrone(550, 'sine', 0.006);
    createDrone(660, 'sine', 0.004);
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

  // Ethereal orchestral pad
  const notes = [82.4, 110, 138.6, 164.8, 220, 277];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = i < 3 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    lfo.frequency.value = 0.08 + Math.random() * 0.12;
    lfoGain.gain.value = freq * 0.012;
    lfo.connect(lfoGain).connect(osc.frequency);
    gain.gain.value = 0.018;
    osc.connect(gain).connect(ctx.destination);
    osc.start(); lfo.start();
    menuOscillators.push(osc, lfo);
    menuGains.push(gain);
  });
}