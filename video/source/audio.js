// Synthesised soundtrack (music + UI sound effects) for the install videos.
// Usage: DEV=ios|and node audio.js  -> writes audio-<dev>.wav
//        EVENTS=events.json OUT=x.wav node audio.js  (custom timeline, see admin/events.json)
const fs = require('fs');

const EV = process.env.EVENTS ? JSON.parse(fs.readFileSync(process.env.EVENTS, 'utf8')) : null;
const SR = 44100, DUR = EV ? EV.dur : 27.5, N = Math.round(SR * DUR);
const DEV = process.env.DEV === 'and' ? 'and' : 'ios';

// ---------- buffers: dry music, music reverb send, sfx, sfx reverb send ----------
const mk = () => [new Float32Array(N), new Float32Array(N)];
const music = mk(), musicVerb = mk(), sfx = mk(), sfxVerb = mk();
const duck = new Float32Array(N).fill(1);

let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TAU = Math.PI * 2;

function add(buf, send, i, l, r, sendAmt) {
  if (i < 0 || i >= N) return;
  buf[0][i] += l; buf[1][i] += r;
  if (send) { send[0][i] += l * sendAmt; send[1][i] += r * sendAmt; }
}

// ---------- instruments ----------
// warm pad: detuned additive voices, slow envelope
function pad(t0, dur, midi, vel) {
  const f = mtof(midi), a = 1.2, rel = 1.6, len = dur + rel;
  const det = [-0.11, 0, 0.12], pan = [0.25, 0.5, 0.75];
  for (let k = 0; k < len * SR; k++) {
    const t = k / SR, i = Math.round(t0 * SR) + k;
    let env = Math.min(1, t / a);
    if (t > dur) env *= Math.exp(-(t - dur) * 3);
    let l = 0, r = 0;
    for (let v = 0; v < 3; v++) {
      const ff = f * Math.pow(2, det[v] / 12);
      let s = 0;
      for (let h = 1; h <= 5; h++) s += Math.sin(TAU * ff * h * t + v * h) / Math.pow(h, 1.7);
      l += s * (1 - pan[v]); r += s * pan[v];
    }
    const g = vel * env * 0.05;
    add(music, musicVerb, i, l * g, r * g, 0.9);
  }
}

// e-piano / bell pluck (2-op FM)
function pluck(buf, send, t0, midi, vel, panv = 0.5, bright = 1, decay = 2.6, sendAmt = 0.6) {
  const f = mtof(midi), len = 3.2;
  for (let k = 0; k < len * SR; k++) {
    const t = k / SR, i = Math.round(t0 * SR) + k;
    const env = Math.exp(-t * decay) * Math.min(1, t / 0.003);
    const idx = bright * 2.2 * Math.exp(-t * 7);
    const s = Math.sin(TAU * f * t + idx * Math.sin(TAU * f * t)) + 0.25 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 5);
    const g = vel * env;
    add(buf, send, i, s * g * (1 - panv) * 2, s * g * panv * 2, sendAmt);
  }
}

function bass(t0, dur, midi, vel) {
  const f = mtof(midi);
  for (let k = 0; k < (dur + 0.3) * SR; k++) {
    const t = k / SR, i = Math.round(t0 * SR) + k;
    let env = Math.min(1, t / 0.02) * Math.exp(-t * 0.9);
    if (t > dur) env *= Math.exp(-(t - dur) * 14);
    const s = Math.tanh(1.6 * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t)));
    add(music, null, i, s * env * vel, s * env * vel, 0);
  }
}

function kick(t0, vel) {
  let ph = 0;
  for (let k = 0; k < 0.5 * SR; k++) {
    const t = k / SR, i = Math.round(t0 * SR) + k;
    const f = 45 + 95 * Math.exp(-t * 28);
    ph += TAU * f / SR;
    const s = Math.sin(ph) * Math.exp(-t * 7) * vel;
    add(music, null, i, s, s, 0);
    // sidechain-style duck for pad/plucks
    if (i < N) duck[i] = Math.min(duck[i], 1 - 0.45 * Math.exp(-t * 6));
  }
}

// filtered noise hit (snap / hat)
function noiseHit(t0, vel, fc, q, decay, len, panv = 0.5, sendAmt = 0.3) {
  let low = 0, band = 0;
  const fq = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR);
  for (let k = 0; k < len * SR; k++) {
    const t = k / SR, i = Math.round(t0 * SR) + k;
    const x = rnd();
    low += fq * band; const high = x - low - q * band; band += fq * high;
    const s = (fc > 4000 ? high : band) * Math.exp(-t * decay) * vel;
    add(music, musicVerb, i, s * (1 - panv) * 2, s * panv * 2, sendAmt);
  }
}

// ---------- SFX ----------
function swoosh(t0, dur, f0, f1, vel, p0 = 0.3, p1 = 0.7) {
  let low = 0, band = 0;
  for (let k = 0; k < dur * SR; k++) {
    const t = k / SR, u = t / dur, i = Math.round(t0 * SR) + k;
    const fc = f0 * Math.pow(f1 / f0, u);
    const fq = 2 * Math.sin(Math.PI * fc / SR);
    const x = rnd();
    low += fq * band; const high = x - low - 0.55 * band; band += fq * high;
    const env = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 2);
    const s = band * env * vel, pn = p0 + (p1 - p0) * u;
    add(sfx, sfxVerb, i, s * (1 - pn) * 2, s * pn * 2, 0.5);
  }
}

function tap(t0, vel = 1) {
  for (let k = 0; k < 0.12 * SR; k++) {
    const t = k / SR, i = Math.round(t0 * SR) + k;
    const tick = Math.sin(TAU * 2400 * t) * Math.exp(-t * 160) * 0.35;
    const body = Math.sin(TAU * (260 + 200 * Math.exp(-t * 60)) * t) * Math.exp(-t * 45) * 0.6;
    const nz = rnd() * Math.exp(-t * 700) * 0.25;
    const s = (tick + body + nz) * vel;
    add(sfx, sfxVerb, i, s, s, 0.15);
  }
}

function pop(t0, vel = 1) {
  let ph = 0;
  for (let k = 0; k < 0.25 * SR; k++) {
    const t = k / SR, i = Math.round(t0 * SR) + k;
    ph += TAU * (380 + 700 * (1 - Math.exp(-t * 40))) / SR;
    const s = Math.sin(ph) * Math.exp(-t * 26) * vel * 0.7;
    add(sfx, sfxVerb, i, s, s, 0.3);
  }
}

function chime(t0, notes, gap, vel) {
  notes.forEach((m, j) => pluck(sfx, sfxVerb, t0 + j * gap, m, vel, 0.3 + 0.4 * (j / Math.max(1, notes.length - 1)), 0.6, 2.2, 0.9));
}

function riser(t0, dur, vel) {
  let low = 0, band = 0;
  for (let k = 0; k < dur * SR; k++) {
    const t = k / SR, u = t / dur, i = Math.round(t0 * SR) + k;
    const fc = 300 * Math.pow(25, u), fq = 2 * Math.sin(Math.PI * Math.min(fc, 9000) / SR);
    const x = rnd();
    low += fq * band; const high = x - low - 0.4 * band; band += fq * high;
    const s = band * Math.pow(u, 2.2) * vel;
    add(sfx, sfxVerb, i, s, s, 0.7);
  }
}

// ---------- music arrangement (75 BPM, bar = 3.2 s, downbeats at 1.8 + 3.2k) ----------
const BEAT = 0.8, BAR = 3.2, START = 1.8;
const CH = [ // [bass, pad notes]
  [43, [59, 62, 66, 69]], // Gmaj9
  [45, [61, 64, 66, 71]], // A6/9
  [42, [57, 61, 64, 68]], // F#m7(9)
  [35, [62, 66, 69, 73]], // Bm9
  [43, [59, 62, 66, 69]], // Gmaj9
  [45, [61, 64, 66, 71]], // A6/9
  [40, [55, 59, 62, 66]], // Em9
  [38, [54, 57, 61, 64]], // Dmaj9 (resolution)
];
{ // longer timelines: repeat the first 7 bars, keep Dmaj9 as the final bar
  const bars = Math.ceil((DUR - 1.8) / 3.2), last = CH.pop();
  for (let k = CH.length; k < bars - 1; k++) CH.push(CH[k % 7]);
  CH.length = bars - 1; CH.push(last);
}
// intro pad swell on Gmaj9
CH[0][1].forEach((m) => pad(0.0, START + 0.2, m, 0.55));
riser(0.2, START - 0.2, 0.22);
pluck(music, musicVerb, START, 74, 0.09, 0.5, 0.5, 1.2, 0.9);

CH.forEach(([b, notes], bar) => {
  const t = START + bar * BAR, last = bar === CH.length - 1;
  const len = last ? DUR - t - 1.2 : BAR;
  notes.forEach((m) => pad(t, len, m, 0.7));
  if (bar >= 1) bass(t, last ? 2.4 : BEAT * 1.5, b + 12, 0.11);
  if (bar >= 1 && !last) bass(t + BEAT * 2.5, BEAT * 1.2, b + 12, 0.08);
  // arpeggio (8ths), lighter in first bar
  const order = [0, 2, 1, 3, 2, 1, 3, 2];
  const steps = last ? 4 : 8;
  for (let s = 0; s < steps; s++) {
    const m = notes[order[s]] + 12;
    pluck(music, musicVerb, t + s * BEAT / 2, m, (bar === 0 ? 0.035 : 0.05) * (s % 2 ? 0.75 : 1), s % 2 ? 0.35 : 0.65, 0.8, 3.0, 0.55);
  }
  // drums from bar 1 until the outro bar
  if (bar >= 1 && !last) {
    for (let q = 0; q < 4; q++) {
      const bt = t + q * BEAT;
      if (q === 0 || (q === 2)) kick(bt, 0.55);
      if (q === 1 || q === 3) noiseHit(bt, 0.11, 1800, 0.9, 30, 0.25, 0.5, 0.5); // soft snap
      for (let h = 0; h < 4; h++) noiseHit(bt + h * BEAT / 4, h % 2 ? 0.025 : 0.04, 9000, 0.7, 70, 0.06, h % 2 ? 0.35 : 0.65, 0.1);
    }
  }
});

// ---------- sound effects (timed to the animation) ----------
if (EV) {
  (EV.taps || []).forEach((t) => tap(t));
  (EV.keys || []).forEach((t) => tap(t, 0.32));
  (EV.up || []).forEach((t) => swoosh(t - 0.05, 0.6, 250, 2600, 0.26));
  (EV.down || []).forEach((t) => swoosh(t - 0.05, 0.6, 2600, 300, 0.24));
  (EV.pops || []).forEach((t) => { pop(t); chime(t + 0.02, [81, 88], 0.08, 0.08); });
  (EV.steps || []).forEach((t, j) => pluck(sfx, sfxVerb, t + 0.05, [86, 88, 90, 93, 95, 98][j % 6], 0.045, 0.5, 0.3, 4, 0.8));
  swoosh(0.45, 1.3, 180, 2200, 0.32);
  (EV.heads || []).forEach((t) => swoosh(t - 0.1, 0.8, 600, 3500, 0.15, 0.6, 0.4));
  chime(EV.done, [74, 78, 81, 85, 88, 93], 0.085, 0.07);
} else {
swoosh(0.45, 1.3, 180, 2200, 0.32);                // phone rises in
swoosh(4.3, 0.7, 600, 3500, 0.16, 0.6, 0.4);       // headline change
[5.0, 8.2, 11.4, 15.6, 18.8].forEach((t, j) => pluck(sfx, sfxVerb, t + 0.05, [86, 88, 90, 93, 98][j], 0.05, 0.5, 0.3, 4, 0.8)); // step tick

if (DEV === 'ios') {
  [9.6, 13.1, 17.1, 20.9].forEach((t) => tap(t));
  swoosh(9.95, 0.6, 250, 2600, 0.28);   // share sheet up
  swoosh(14.55, 0.6, 250, 2600, 0.25);  // add dialog up
  swoosh(17.55, 0.7, 2600, 300, 0.26);  // to home screen
  pop(18.3); chime(18.32, [81, 88], 0.08, 0.08);
} else {
  [9.6, 12.9, 16.9, 20.9].forEach((t) => tap(t));
  swoosh(9.7, 0.45, 900, 4200, 0.2);    // menu opens
  swoosh(13.65, 0.5, 400, 3000, 0.22);  // install dialog
  swoosh(17.65, 0.7, 2600, 300, 0.26);  // to home screen
  pop(18.4); chime(18.42, [81, 88], 0.08, 0.08);
}
swoosh(21.05, 0.75, 300, 5000, 0.3);              // app opens
chime(22.45, [74, 78, 81, 85, 88, 93], 0.085, 0.07); // "tayyor" sparkle
swoosh(22.35, 0.9, 500, 3000, 0.14, 0.4, 0.6);
}

// ---------- reverb (Schroeder/Freeverb-lite) ----------
function reverb(src, room = 0.86, damp = 0.35) {
  const out = mk();
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116];
  const aps = [556, 441, 341, 225];
  for (let ch = 0; ch < 2; ch++) {
    const sp = ch ? 23 : 0, x = src[ch], y = out[ch];
    const cb = combs.map((d) => ({ b: new Float32Array(d + sp), p: 0, f: 0 }));
    const ab = aps.map((d) => ({ b: new Float32Array(d + sp), p: 0 }));
    for (let i = 0; i < N; i++) {
      let s = 0;
      for (const c of cb) {
        const o = c.b[c.p];
        c.f = o * (1 - damp) + c.f * damp;
        c.b[c.p] = x[i] * 0.015 + c.f * room;
        c.p = (c.p + 1) % c.b.length; s += o;
      }
      for (const a of ab) {
        const o = a.b[a.p]; const v = s + o * 0.5;
        a.b[a.p] = v; a.p = (a.p + 1) % a.b.length; s = o - v * 0.5;
      }
      y[i] = s;
    }
  }
  return out;
}
const mv = reverb(musicVerb, 0.88, 0.4), sv = reverb(sfxVerb, 0.8, 0.3);

// ---------- mix + master ----------
const L = new Float32Array(N), R = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.4) * Math.min(1, (DUR - t) / 1.4);
  const d = duck[i];
  for (let ch = 0; ch < 2; ch++) {
    let s = (music[ch][i] * 0.9 + mv[ch][i] * 0.55 * d) * (0.75 + 0.25 * d) + sfx[ch][i] * 1.0 + sv[ch][i] * 0.45;
    s = Math.tanh(s * 1.3) * fade;
    (ch ? R : L)[i] = s; peak = Math.max(peak, Math.abs(s));
  }
}
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4);
}
const OUT = process.env.OUT || `audio-${DEV}.wav`;
fs.writeFileSync(OUT, buf);
console.log('wrote', OUT, 'peak', peak.toFixed(3));
