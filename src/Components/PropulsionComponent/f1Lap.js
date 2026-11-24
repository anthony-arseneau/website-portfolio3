// ─────────────────────────────────────────────────────────────
// Lap model for the F1 viewer.
// The camera never moves, so a lap is described only by what it
// does to the car: heading (yaw) and speed as functions of time,
// plus a bumpy road surface as a function of distance travelled.
// ─────────────────────────────────────────────────────────────

// Corners are kept brisk and the straights stretched; lap ≈ 2.4 min
const CORNER_SCALE = 1.15;
const STRAIGHT_SCALE = 1.6;

// [seconds, turn in degrees (+ left / − right), corner speed 0..1]
// Clockwise circuit: the turns add up to exactly −360°, so the car is
// back on its starting heading when the lap wraps and the loop is seamless.
const TRACK = [
  [3.0,    0],        // start/finish straight — the arrival joins the lap here
  [3.2,  -85, 0.50],  // T1  right
  [1.4,    0],
  [2.4,   50, 0.62],  // T2  left
  [0.8,    0],
  [3.4,  115, 0.42],  // T3  harder left
  [5.0,    0],
  [2.6,  -70, 0.66],  // T4  right
  [2.2,  -55, 0.72],  // T5  right
  [5.5,    0],
  [4.4, -150, 0.34],  // T6  hairpin right
  [7.0,    0],        // back straight
  [1.7,   35, 0.80],  // T7  chicane left
  [1.7,  -40, 0.78],  // T8  chicane right
  [1.0,    0],
  [2.4,   60, 0.66],  // T9  left
  [4.0,    0],
  [4.6, -110, 0.48],  // T10 long right
  [2.6,    0],
  [2.4,   75, 0.60],  // T11 esses: left
  [2.2,  -80, 0.58],  // T12 right
  [2.2,   70, 0.62],  // T13 left
  [1.8,    0],
  [3.2,  -95, 0.50],  // T14 right
  [8.0,    0],        // long straight
  [2.2,  -30, 0.86],  // T15 fast right kink
  [1.2,    0],
  [3.0,   90, 0.52],  // T16 left
  [3.2,    0],
  [3.4,  -95, 0.46],  // T17 right
  [1.8,    0],
  [2.8,  -45, 0.70],  // T18 final right, back onto the straight
  [2.0,    0],
];

const TABLE_DT = 1 / 30;
const ACCEL = 0.17;   // speed fraction gained per second
const BRAKE = 0.42;   // speed fraction lost per second

export function buildLap() {
  const segs = [];
  let t = 0, yaw = 0;
  TRACK.forEach(([seconds, deg, vc = 1], i) => {
    const dur = seconds * (deg ? CORNER_SCALE : STRAIGHT_SCALE);
    const turn = (deg * Math.PI) / 180;
    segs.push({ i, t0: t, dur, yaw0: yaw, turn, vc });
    t += dur;
    yaw += turn;
  });
  const lapTime = t;

  // Speed profile: corner speed through the middle of each corner, flat out
  // elsewhere, then limited by how hard the car can brake and accelerate.
  const n = Math.round(lapTime / TABLE_DT);
  const dt = lapTime / n;
  let v = new Float32Array(n).fill(1);
  segs.forEach((s) => {
    if (!s.turn) return;
    const a = Math.floor((s.t0 + 0.2 * s.dur) / dt);
    const b = Math.ceil((s.t0 + 0.8 * s.dur) / dt);
    for (let k = a; k <= b; k++) v[k % n] = Math.min(v[k % n], s.vc);
  });
  for (let k = 0; k < 2 * n; k++) {
    const j = k % n;
    v[j] = Math.min(v[j], v[(j - 1 + n) % n] + ACCEL * dt);
  }
  for (let k = 2 * n - 1; k >= 0; k--) {
    const j = k % n;
    v[j] = Math.min(v[j], v[(j + 1) % n] + BRAKE * dt);
  }
  // soften the kinks so pitch changes are not instantaneous
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(n);
    const R = 5;
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let d = -R; d <= R; d++) sum += v[(j + d + n) % n];
      out[j] = sum / (2 * R + 1);
    }
    v = out;
  }

  return { segs, lapTime, lapYaw: yaw, speed: v, n, dt };
}

// State of the car at time t (seconds since the lap clock started).
export function sampleLap(lap, t, out = {}) {
  const laps = Math.floor(t / lap.lapTime);
  const tl = t - laps * lap.lapTime;

  let seg = lap.segs[lap.segs.length - 1];
  for (let k = 0; k < lap.segs.length; k++) {
    const s = lap.segs[k];
    if (tl < s.t0 + s.dur) { seg = s; break; }
  }
  const u = Math.min(Math.max((tl - seg.t0) / seg.dur, 0), 1);
  // smootherstep: yaw rate and yaw acceleration are both zero at corner ends
  const ease = u * u * u * (u * (6 * u - 15) + 10);
  out.yaw = laps * lap.lapYaw + seg.yaw0 + seg.turn * ease;
  out.rate = (seg.turn * 30 * u * u * (1 - u) * (1 - u)) / seg.dur;

  const x = tl / lap.dt;
  const i0 = Math.floor(x) % lap.n;
  const i1 = (i0 + 1) % lap.n;
  const f = x - Math.floor(x);
  out.speed = lap.speed[i0] * (1 - f) + lap.speed[i1] * f;
  out.accel = (lap.speed[i1] - lap.speed[i0]) / lap.dt;
  out.seg = seg;
  out.u = u;
  return out;
}

// ── Arrival ──────────────────────────────────────────────────
// How the car reaches its station, seen from above in the camera's own ground
// axes (x = screen right, z = away from the camera). It starts a short way
// behind the station, almost on the line the car will end up pointing along
// (so from the top right of the picture), makes a slight swerve to the right
// onto the station heading and runs straight in, while its speed
// relative to the camera falls to zero.
// [start second, seconds, turn in degrees (+ left / − right)]
const ARRIVAL = [
  [0.35, 0.40, -8],   // a slight swerve onto the station heading
];
const ARRIVAL_TIME = 0.9;   // seconds, including the straight run into the station
const ARRIVAL_SPEED = 69;   // closing speed at the start [m/s]; the car starts about 24 m out
const ARRIVAL_EASE = 1.6;   // how early that closing speed is shed

// `finalDeg` is the station heading, measured anticlockwise from screen right.
export function buildArrival(finalDeg) {
  const turns = ARRIVAL.map(([t0, dur, deg]) => ({ t0, dur, turn: (deg * Math.PI) / 180 }));
  const total = ARRIVAL_TIME;
  const final = (finalDeg * Math.PI) / 180;
  const start = final - turns.reduce((sum, k) => sum + k.turn, 0);

  // heading (absolute) and yaw rate at time tt
  const heading = (tt, out) => {
    out.angle = start;
    out.rate = 0;
    for (let k = 0; k < turns.length; k++) {
      const u = Math.min(Math.max((tt - turns[k].t0) / turns[k].dur, 0), 1);
      out.angle += turns[k].turn * u * u * u * (u * (6 * u - 15) + 10);
      out.rate += (turns[k].turn * 30 * u * u * (1 - u) * (1 - u)) / turns[k].dur;
    }
    return out;
  };

  // The path is integrated backwards from the station, so it always ends there.
  const n = 600;
  const dt = total / n;
  const x = new Float32Array(n + 1);
  const z = new Float32Array(n + 1);
  const h = {};
  for (let i = n - 1; i >= 0; i--) {
    const tm = (i + 0.5) * dt;
    const v = ARRIVAL_SPEED * Math.pow(1 - tm / total, ARRIVAL_EASE);
    heading(tm, h);
    x[i] = x[i + 1] - v * Math.cos(h.angle) * dt;
    z[i] = z[i + 1] - v * Math.sin(h.angle) * dt;
  }
  return { total, final, start, runIn: ARRIVAL[0][0], heading, x, z, n, dt };
}

// Position relative to the station, heading relative to the station heading
// and yaw rate, `t` seconds into the arrival. `extra` metres are added to the
// straight run-in before the swerve, so the car can start that much further away.
export function sampleArrival(arr, t, extra = 0, out = {}) {
  const tt = Math.min(Math.max(t, 0), arr.total);
  const f = tt / arr.dt;
  const i = Math.min(Math.floor(f), arr.n - 1);
  const w = f - i;
  out.x = arr.x[i] * (1 - w) + arr.x[i + 1] * w;
  out.z = arr.z[i] * (1 - w) + arr.z[i + 1] * w;
  if (tt < arr.runIn) {
    const back = extra * (1 - tt / arr.runIn) ** 2;
    out.x -= Math.cos(arr.start) * back;
    out.z -= Math.sin(arr.start) * back;
  }
  arr.heading(tt, out);
  out.turn = out.angle - arr.final;
  return out;
}

// ── Deterministic noise ──────────────────────────────────────
export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function vnoise(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

const BUMP_SPACING = 45;   // one candidate bump per this many metres
const BUMP_WIDTH = 2.6;    // half-width of a bump [m]

// Road height [m] under a wheel after `s` metres, for one wheel track.
// The car covers 50 m of this every second at full speed, so the surface is
// kept low and long: a stiff car at speed buzzes and twitches, it does not bounce.
function lane(s, seed) {
  let h = (vnoise(s * 0.2 + seed * 17.3) - 0.5) * 0.012
        + (vnoise(s * 0.05 + seed * 5.1) - 0.5) * 0.02;
  const cell = Math.floor(s / BUMP_SPACING);
  const key = cell * 1.37 + seed * 91.7;
  if (hash(key) < 0.55) {
    const centre = (cell + 0.25 + 0.5 * hash(key + 3.1)) * BUMP_SPACING;
    const x = (s - centre) / BUMP_WIDTH;
    if (x > -1 && x < 1) {
      const height = 0.015 + 0.032 * hash(key + 7.7);
      const sign = hash(key + 5.3) < 0.78 ? 1 : -1;
      h += sign * height * (0.5 + 0.5 * Math.cos(Math.PI * x));
    }
  }
  return h;
}

// Left and right wheel tracks share most of the surface but not all of it,
// which is what makes the car rock from side to side.
export function roadLeft(s) { return 0.65 * lane(s, 0) + 0.35 * lane(s, 1); }
export function roadRight(s) { return 0.65 * lane(s, 0) + 0.35 * lane(s, 2); }
