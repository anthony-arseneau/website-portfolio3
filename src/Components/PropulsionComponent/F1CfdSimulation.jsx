import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildCar } from './f1Car';
import { buildArrival, buildLap, hash, roadLeft, roadRight, sampleArrival, sampleLap, vnoise } from './f1Lap';

// ─────────────────────────────────────────────────────────────
// F1 external-aero CFD viewer
// Pathlines exported from Ansys Fluent 2026 R1 Student
// (half-car symmetry model, k-ω SST, 50 m/s inlet + moving ground),
// mirrored across the symmetry plane. Geometry: Flexcompute F1_2025.
// Data files live in /public/f1 (built by the asset script).
//
// The camera is fixed, low and close. The car arrives from far off to
// the right along a curved path, settles at its station and then "laps
// a circuit" in place: it yaws through the corners, rides its suspension
// and spins its wheels at true speed, with the streak lines carried along
// in the car's frame.
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;
const CAR_URL = `${BASE}f1/car.glb`;
const LINES_URL = `${BASE}f1/pathlines.bin`;

// ── Streak lines ─────────────────────────────────────────────
const V_MAX = 75;          // colormap range [m/s]
const SLOWMO = 0.4;        // simulated seconds per real second at full speed
const PERIOD = 0.15;       // gap between streaks along a line [sim s]
const STREAK = 0.5;        // streak length as a fraction of PERIOD
const LINE_WIDTH = 1.7;    // streak half-width [css px]
const WAVE_START = 0.1;    // seconds into the arrival before the first line starts
const WAVE_SPREAD = 0.5;   // seconds for the start to reach the outermost line
const GROW_RATE = 0.45;    // how fast a started line draws downstream [sim s per s]
const WAKE_EXTEND = 5;     // metres each line is carried on behind the exported data
const WAKE_RECOVERY = 0.09; // seconds for the wake's velocity deficit to decay [sim s]
const FREE_STREAM = 50;    // m/s
// Every line starts the same distance ahead of the front wing's leading edge.
// The wing is swept back like an arrowhead, so the starts form the same shallow
// V: furthest forward on the centreline, further back going outboard.
const FRONT_WING_X = -2.59;     // leading edge on the centreline [m]
const FRONT_WING_SWEEP = 0.325; // metres further back per metre outboard (≈ 18°)
const START_AHEAD = 0.75;       // metres ahead of the leading edge the lines start
// The export seeds the lines in rows by height. Rows seeded above this height [m]
// are left out for now: that is the top three rows (1.00, 0.86 and 0.73 m), eight
// lines in all. Set it to Infinity to show every line.
const HIDE_SEEDS_ABOVE = 0.7;
// Individual lines left out, by where they are seeded: [height, distance either
// side of the centreline] in metres. Each entry removes a mirrored pair. This one
// is the outer end of the top remaining row, the two upper corners of the pattern.
const HIDE_SEEDS = [[0.59, 0.44]];

// ── Camera and station ───────────────────────────────────────
const CAM_DIST = 8;        // metres from the car
const CAM_ELEV = 33;       // degrees above the horizon: looking well down on the car
const CAM_AZIM = 47.6;     // degrees round from the car's tail
const TARGET = [0, 0.4, 0];
const CAMERA = [
  CAM_DIST * Math.cos((CAM_ELEV * Math.PI) / 180) * Math.cos((CAM_AZIM * Math.PI) / 180),
  TARGET[1] + CAM_DIST * Math.sin((CAM_ELEV * Math.PI) / 180),
  CAM_DIST * Math.cos((CAM_ELEV * Math.PI) / 180) * Math.sin((CAM_AZIM * Math.PI) / 180),
];
const FOV = 40;
const PIVOT_X = 0.7;       // point of the model [m] the car yaws about
const STATION_PX = 400;    // station's distance from the canvas' left edge (desktop)
const STATION_LEAN = 62;   // degrees the car at its station points towards the camera (0 = side-on, 90 = head-on);
                           // from this height that reads as aimed at the bottom-left corner, a little steeper
const LAP_SKIP = 2.6;      // seconds of the start straight already covered by the arrival
const FAR_START = 0;       // extra metres away the car starts, shed on the run-in

// ── Ride ─────────────────────────────────────────────────────
const CAR_SPEED = 50;      // m/s at full speed (the CFD inlet speed): road and wheels run at true rate
const SHUTTER = 0.8;       // fraction of each frame the wheels blur across
const KICK_SPACING = 70;   // one candidate sideways jolt per this many metres
const ROLL_GAIN = 0.07;    // body roll per unit of cornering load [rad]
const PITCH_GAIN = 0.05;   // dive/squat per unit of braking/acceleration [rad]
const SURGE_GAIN = 0.9;    // metres the car pulls ahead/drops back per unit of acceleration
const STEER_GAIN = 0.2;    // front-wheel lock per unit of yaw rate / speed [rad]
const TRACK_WIDTH = 1.6;
// Distance from a front wheel's steering axis [m] within which the lines turn
// fully with the wheel, and beyond which they are left alone.
const BEND_FULL = 0.5;
const BEND_NONE = 1.05;

// x position of the station inside a canvas of this width [css px]
function stationX(width) {
  const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  return desktop ? Math.min(STATION_PX, width * 0.52) : width / 2;
}

// ── Pathline loading ─────────────────────────────────────────
// File format: u32 nLines, u32 n[i]..., then per line n*5 float32 (x,y,z, t, |V|)
// Each line becomes a camera-facing ribbon (two vertices per sample) so it can
// be drawn thicker than WebGL's one-pixel lines.

// The Fluent export stops every pathline at x ≈ 4.6 m, about 2 m behind the
// rear wing. To let the wake trail further back, each line is carried on past
// that point by a simple model, not by CFD: it keeps the velocity it left the
// data with, and that velocity relaxes back towards the free stream. The
// carried-on part fades out along its length.
function extendWake(pts) {
  const n = pts.length;
  const end = pts[n - 1];
  const back = pts[Math.max(n - 4, 0)];
  const span = Math.max(end[3] - back[3], 1e-6);
  const dir = [(end[0] - back[0]) / span, (end[1] - back[1]) / span, (end[2] - back[2]) / span];
  const mag = Math.hypot(...dir) || 1;
  const v0 = dir.map((c) => (c / mag) * end[4]);
  const step = 0.002;
  let [x, y, z, t] = end;
  let travelled = 0;
  while (travelled < WAKE_EXTEND) {
    const k = Math.exp(-(t - end[3]) / WAKE_RECOVERY);
    const vx = FREE_STREAM + (v0[0] - FREE_STREAM) * k;
    const vy = v0[1] * k * k;   // swirl and upwash die away faster than the deficit
    const vz = v0[2] * k * k;
    x += vx * step;
    y = Math.max(y + vy * step, 0.01);
    z += vz * step;
    t += step;
    const speed = Math.hypot(vx, vy, vz);
    travelled += speed * step;
    pts.push([x, y, z, t, speed]);
  }
  return end[3];   // time at which the real data ends
}

// Moves a line's start onto the arrow-shaped front (see START_AHEAD). The export
// seeds every line on one flat plane 0.46 m ahead of the wing tip of the nose:
// outboard lines are trimmed back from it, and lines near the centre are run
// upstream of it in a straight line at their seed velocity (the air there is
// still undisturbed). Times are re-zeroed so each line starts at t = 0.
function shapeStart(pts) {
  const xStart = FRONT_WING_X + FRONT_WING_SWEEP * Math.abs(pts[0][2]) - START_AHEAD;
  const a = pts[0];
  const b = pts[1];
  if (a[0] > xStart) {
    const dt = b[3] - a[3];
    const v = [(b[0] - a[0]) / dt, (b[1] - a[1]) / dt, (b[2] - a[2]) / dt];
    const need = (a[0] - xStart) / v[0];
    const lead = [];
    for (let k = Math.ceil(need / dt); k >= 1; k--) {
      const t = Math.min(k * dt, need);
      lead.push([a[0] - v[0] * t, Math.max(a[1] - v[1] * t, 0.005), a[2] - v[2] * t, a[3] - t, a[4]]);
    }
    pts.unshift(...lead);
  } else {
    let k = 0;
    while (k < pts.length - 2 && pts[k + 1][0] < xStart) k++;
    const p0 = pts[k];
    const p1 = pts[k + 1];
    const f = Math.min(Math.max((xStart - p0[0]) / (p1[0] - p0[0]), 0), 1);
    pts.splice(0, k + 1, p0.map((c, i) => c + (p1[i] - c) * f));
  }
  const t0 = pts[0][3];
  pts.forEach((pt) => { pt[3] -= t0; });
}

async function loadPathlines(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const nFile = dv.getUint32(0, true);
  const counts = [];
  for (let i = 0; i < nFile; i++) counts.push(dv.getUint32(4 + 4 * i, true));
  const data = new Float32Array(buf, 4 + 4 * nFile);

  let p = 0;
  const allLines = counts.map((n) => {
    const pts = [];
    for (let k = 0; k < n; k++, p += 5) pts.push([data[p], data[p + 1], data[p + 2], data[p + 3], data[p + 4]]);
    return { pts };
  });
  // drop the top rows and single lines (see HIDE_SEEDS_ABOVE, HIDE_SEEDS), shape the
  // starts, then carry the rest on behind the car
  const lineSet = allLines
    .filter((l) => l.pts[0][1] < HIDE_SEEDS_ABOVE)
    .filter((l) => !HIDE_SEEDS.some(([y, z]) => Math.abs(l.pts[0][1] - y) < 0.03 && Math.abs(Math.abs(l.pts[0][2]) - z) < 0.03));
  lineSet.forEach((l) => { shapeStart(l.pts); l.dataEnd = extendWake(l.pts); });
  const nLines = lineSet.length;
  const total = lineSet.reduce((sum, l) => sum + l.pts.length, 0);

  // Where each line starts, measured from the middle of the seed rake:
  // the start-up wave runs from the centre lines outwards.
  const yMid = lineSet.reduce((sum, l) => sum + l.pts[0][1], 0) / nLines;
  const spread = lineSet.map((l) => Math.hypot(l.pts[0][2], l.pts[0][1] - yMid));
  const maxSpread = Math.max(...spread, 1e-6);

  const pos = new Float32Array(total * 6);
  const prev = new Float32Array(total * 6);
  const next = new Float32Array(total * 6);
  const side = new Float32Array(total * 2);
  const time = new Float32Array(total * 2);
  const speed = new Float32Array(total * 2);
  const offset = new Float32Array(total * 2);
  const delay = new Float32Array(total * 2);
  const remain = new Float32Array(total * 2);
  const index = new Uint32Array((total - nLines) * 6);

  let v = 0, q = 0;
  lineSet.forEach(({ pts, dataEnd }, line) => {
    const n = pts.length;
    const off = Math.random();
    const tEnd = pts[n - 1][3];
    for (let k = 0; k < n; k++) {
      const c = pts[k];
      const a = pts[Math.max(k - 1, 0)];
      const b = pts[Math.min(k + 1, n - 1)];
      for (let e = 0; e < 2; e++, v++) {
        pos.set([c[0], c[1], c[2]], v * 3);
        prev.set([a[0], a[1], a[2]], v * 3);
        next.set([b[0], b[1], b[2]], v * 3);
        side[v] = e ? 1 : -1;
        time[v] = c[3];
        speed[v] = c[4];
        offset[v] = off;
        delay[v] = spread[line] / maxSpread;
        // 1 where the real data ends, falling to 0 at the far end of the wake
        remain[v] = (tEnd - c[3]) / (tEnd - dataEnd);
      }
      if (k > 0) {
        index.set([v - 4, v - 3, v - 2, v - 2, v - 3, v - 1], q);
        q += 6;
      }
    }
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aPrev', new THREE.BufferAttribute(prev, 3));
  g.setAttribute('aNext', new THREE.BufferAttribute(next, 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setAttribute('aTime', new THREE.BufferAttribute(time, 1));
  g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  g.setAttribute('aOffset', new THREE.BufferAttribute(offset, 1));
  g.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
  g.setAttribute('aRemain', new THREE.BufferAttribute(remain, 1));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  return g;
}

// aTime is the residence time Fluent integrated along each pathline, so a
// streak that advances at a constant rate in aTime covers ground at exactly
// the local flow velocity: it stretches and races where the air is fast and
// bunches up where it is slow.
const STREAK_GLSL = /* glsl */ `
  uniform float uSimTime;
  uniform float uPeriod;
  uniform float uStreak;
  float streakAt(float t, float off) {
    float w = fract((uSimTime - t) / uPeriod + off);
    return w < uStreak ? pow(1.0 - w / uStreak, 1.5) : 0.0;
  }
`;

const lineVertexShader = /* glsl */ `
  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute float aSide;
  attribute float aTime;
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aDelay;
  attribute float aRemain;
  uniform vec2 uRes;
  uniform float uWidth;
  uniform float uRefDist;
  uniform float uVMax;
  uniform float uSteer;
  uniform vec2 uWheelL;
  uniform vec2 uWheelR;
  uniform vec2 uBend;
  varying float vTime;
  varying float vOffset;
  varying float vDelay;
  varying float vRemain;
  varying float vSide;
  varying float vNear;
  varying vec3 vColor;
  ${STREAK_GLSL}

  // Fluent-style rainbow: blue -> cyan -> green -> yellow -> red
  vec3 rainbow(float s) {
    s = clamp(s, 0.0, 1.0);
    return clamp(vec3(
      1.5 - abs(4.0 * s - 3.0),
      1.5 - abs(4.0 * s - 2.0),
      1.5 - abs(4.0 * s - 1.0)
    ), 0.0, 1.0);
  }

  // The CFD was run with the front wheels straight. When they steer, the air
  // around each one is turned with it: a point is rotated about that wheel's
  // steering axis by the full steer angle close to the tyre, easing to nothing
  // further out, so the lines bend round the turned wheel instead of cutting
  // through it.
  vec3 steerBend(vec3 p, vec2 hub) {
    vec2 d = p.xz - hub;
    float a = uSteer * (1.0 - smoothstep(uBend.x, uBend.y, length(d)));
    float s = sin(a);
    float c = cos(a);
    p.xz = hub + vec2(d.x * c + d.y * s, d.y * c - d.x * s);
    return p;
  }
  vec3 steered(vec3 p) {
    return steerBend(steerBend(p, uWheelL), uWheelR);
  }

  void main() {
    vTime = aTime;
    vOffset = aOffset;
    vDelay = aDelay;
    vRemain = aRemain;
    vSide = aSide;
    vColor = rainbow(aSpeed / uVMax);

    mat4 m = projectionMatrix * modelViewMatrix;
    vec4 c = m * vec4(steered(position), 1.0);
    vNear = c.w;
    vec4 a = m * vec4(steered(aPrev), 1.0);
    vec4 b = m * vec4(steered(aNext), 1.0);
    vec2 dir = (b.xy / b.w - a.xy / a.w) * uRes;
    float len = length(dir);
    dir = len > 1e-5 ? dir / len : vec2(1.0, 0.0);

    // widen the ribbon under a streak, and with nearness to the camera
    float px = uWidth * (0.55 + 0.85 * streakAt(aTime, aOffset)) * clamp(uRefDist / c.w, 0.6, 1.5);
    c.xy += vec2(-dir.y, dir.x) * aSide * px * 2.0 / uRes * c.w;
    gl_Position = c;
  }
`;

const lineFragmentShader = /* glsl */ `
  varying float vTime;
  varying float vOffset;
  varying float vDelay;
  varying float vRemain;
  varying float vSide;
  varying float vNear;
  varying vec3 vColor;
  uniform float uReveal;
  uniform float uSpread;
  uniform float uGrowRate;
  ${STREAK_GLSL}

  void main() {
    // each line draws itself downstream once the start-up wave reaches it
    float grown = (uReveal - vDelay * uSpread) * uGrowRate;
    float shown = smoothstep(0.0, 0.012, grown - vTime);
    if (shown <= 0.0) discard;

    float streak = streakAt(vTime, vOffset);
    float edge = 1.0 - smoothstep(0.45, 1.0, abs(vSide));
    // fade in at the seed, out along the carried-on wake, and out before a line can pass through the camera
    float ends = smoothstep(0.0, 0.008, vTime) * smoothstep(0.0, 0.9, vRemain) * smoothstep(0.6, 2.4, vNear);
    float alpha = (0.2 + 0.8 * streak) * edge * ends * shown;
    vec3 col = mix(vColor * 0.8, mix(vColor, vec3(1.0), 0.3 * streak * streak * streak), streak);
    gl_FragColor = vec4(col, alpha);
  }
`;

function usePathlines() {
  const [state, setState] = useState({ geometry: null, done: false });
  useEffect(() => {
    let alive = true;
    let loaded = null;
    loadPathlines(LINES_URL)
      .then((g) => { loaded = g; if (alive) setState({ geometry: g, done: true }); else g.dispose(); })
      .catch(() => { if (alive) setState({ geometry: null, done: true }); });
    return () => { alive = false; if (loaded) loaded.dispose(); };
  }, []);
  return state;
}

// Soft car-shaped patch under the car so its ride height reads against the ground.
// The rectangle is drawn off-canvas and only its blurred shadow lands in view.
function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 512;
  // The canvas spans 7.4 m of car length (left = nose). The patch stops about
  // 0.2 m short of the nose tip, so its soft edge reaches the front of the wing
  // without running out far ahead of the car.
  ctx.fillRect(44 - 512, 38, 174, 52);
  return new THREE.CanvasTexture(c);
}

// Damped spring step for state[key] / state[key + 'V'] towards `target`.
function spring(state, key, target, omega, zeta, dt) {
  const vKey = `${key}V`;
  state[vKey] += (-omega * omega * (state[key] - target) - 2 * zeta * omega * state[vKey]) * dt;
  state[key] += state[vKey] * dt;
}

function Rig({ started }) {
  const { scene } = useGLTF(CAR_URL);
  const lines = usePathlines();
  const car = useMemo(() => buildCar(scene), [scene]);
  const lap = useMemo(() => buildLap(), []);
  const arrival = useMemo(() => buildArrival(180 + STATION_LEAN), []);
  const shadow = useMemo(() => makeShadowTexture(), []);
  const size = useThree((s) => s.size);

  const lineMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: lineVertexShader,
    fragmentShader: lineFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uSimTime: { value: 0 },
      uPeriod: { value: PERIOD },
      uStreak: { value: STREAK },
      uVMax: { value: V_MAX },
      uRes: { value: new THREE.Vector2(1, 1) },
      uWidth: { value: LINE_WIDTH },
      uRefDist: { value: CAM_DIST },
      uReveal: { value: -1 },
      uSpread: { value: WAVE_SPREAD },
      uGrowRate: { value: GROW_RATE },
      uSteer: { value: 0 },
      uWheelL: { value: new THREE.Vector2() },
      uWheelR: { value: new THREE.Vector2() },
      uBend: { value: new THREE.Vector2(BEND_FULL, BEND_NONE) },
    },
  }), []);

  useEffect(() => {
    // front wheel steering axes, for bending the lines round a turned wheel
    const [left, right] = car.wheels;
    if (left && right) {
      lineMaterial.uniforms.uWheelL.value.set(left.pivot.position.x, left.pivot.position.z);
      lineMaterial.uniforms.uWheelR.value.set(right.pivot.position.x, right.pivot.position.z);
    }
  }, [car, lineMaterial]);
  useEffect(() => () => { car.dispose(); }, [car]);
  useEffect(() => () => { lineMaterial.dispose(); shadow.dispose(); }, [lineMaterial, shadow]);

  const root = useRef();
  const bodyRef = useRef();
  const sim = useRef(null);
  const now = useRef({});
  const arriving = useRef({});

  const wheelMid = (car.wheelbase.front + car.wheelbase.rear) / 2;
  const wheelbase = car.wheelbase.rear - car.wheelbase.front;

  useFrame(({ camera }, rawDt) => {
    if (!started || !lines.done || !root.current) return;
    const dt = Math.min(rawDt, 0.05);

    if (!sim.current) {
      // Ground axes as the camera sees them: screen right, and away from it.
      camera.updateMatrixWorld();
      const view = camera.getWorldDirection(new THREE.Vector3());
      const right = new THREE.Vector3().crossVectors(view, camera.up).setY(0).normalize();
      const depth = view.clone().setY(0).normalize();
      const forward = right.clone().multiplyScalar(Math.cos(arrival.final)).addScaledVector(depth, Math.sin(arrival.final));

      // Where there is little room to the right of the station, squeeze the path sideways a little.
      const room = size.width - stationX(size.width);
      const squeeze = THREE.MathUtils.clamp(room / (290 * camera.zoom + 20), 0.65, 1);

      // The straight run-in begins beyond the right edge of all but the widest
      // screens. Skip the part nobody can see: start the clock with the car just
      // outside the edge.
      const probe = new THREE.Vector3();
      const a = {};
      const edge = 1 + 140 / size.width;
      let t0 = 0;
      for (; t0 < arrival.runIn; t0 += 0.02) {
        sampleArrival(arrival, t0, FAR_START, a);
        probe.copy(right).multiplyScalar(a.x * squeeze).addScaledVector(depth, a.z).setY(0.4);
        if (probe.project(camera).x < edge) break;
      }

      sim.current = {
        t: t0, squeeze, road: 0, simTime: 0, frame: 1 / 60, kickCell: -1, lastSeg: -1, lastU: 0,
        right, depth, yaw0: Math.atan2(forward.z, -forward.x),
        lat: 0, latV: 0, yawJ: 0, yawJV: 0, surge: 0, surgeV: 0,
        front: 0, frontV: 0, rear: 0, rearV: 0, roll: 0, rollV: 0, pitch: 0, pitchV: 0,
      };
      root.current.visible = true;
    }

    const s = sim.current;
    s.t += dt;
    // The lap clock starts as the arrival ends, a little way down the start straight.
    const L = sampleLap(lap, Math.max(0, s.t - arrival.total) + LAP_SKIP, now.current);
    const A = sampleArrival(arrival, s.t, FAR_START, arriving.current);
    const speed = L.speed;
    const rate = L.rate + A.rate;
    s.road += speed * CAR_SPEED * dt;

    // ── Road under each wheel (the rear axle meets every bump a moment later)
    const kerb = L.seg.turn !== 0 && L.seg.vc < 0.7 && hash(L.seg.i * 3.3) < 0.7 && L.u > 0.3 && L.u < 0.7
      ? 0.011 * Math.abs(((s.road * 0.2) % 1) * 2 - 1)
      : 0;
    const kerbL = L.seg.turn > 0 ? kerb : 0;
    const kerbR = L.seg.turn < 0 ? kerb : 0;
    const fl = roadLeft(s.road) + kerbL;
    const fr = roadRight(s.road) + kerbR;
    const rl = roadLeft(s.road - wheelbase) + kerbL;
    const rr = roadRight(s.road - wheelbase) + kerbR;
    const heights = [fl, fr, rl, rr];

    // ── Sudden sideways twitches, scattered along the road so no two laps match
    const cell = Math.floor(s.road / KICK_SPACING);
    if (cell !== s.kickCell) {
      s.kickCell = cell;
      if (hash(cell * 2.31 + 1.7) < 0.55) {
        const dir = hash(cell * 9.13) < 0.5 ? -1 : 1;
        const mag = 0.35 + hash(cell * 4.71);
        s.latV += dir * mag * 1.2;
        s.yawJV += dir * mag * 0.7 * (hash(cell * 6.17) - 0.3);
      }
    }
    // a little snap of oversteer on the way out of the slow corners
    if (L.seg.i === s.lastSeg && s.lastU < 0.72 && L.u >= 0.72 && L.seg.turn !== 0 && L.seg.vc < 0.6) {
      s.yawJV += Math.sign(L.seg.turn) * 0.8;
      s.latV += -Math.sign(L.seg.turn) * 0.6;
    }
    s.lastSeg = L.seg.i;
    s.lastU = L.u;

    // ── Sprung mass: stiff, so it twitches over the surface instead of floating
    const load = 0.65 * Math.tanh((speed * rate) / 0.65);   // cornering load, + in left turns; saturates smoothly
    const rollTarget = -ROLL_GAIN * load - ((fl + rl) - (fr + rr)) / (2 * TRACK_WIDTH);
    const pitchTarget = -PITCH_GAIN * L.accel;
    const wander = (vnoise(s.road * 0.008) - 0.5) * 0.05;
    const steps = Math.max(1, Math.ceil(dt / 0.006));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      spring(s, 'front', (fl + fr) / 2, 30, 0.5, h);
      spring(s, 'rear', (rl + rr) / 2, 30, 0.5, h);
      spring(s, 'roll', rollTarget, 28, 0.5, h);
      spring(s, 'pitch', pitchTarget, 12, 0.7, h);
      spring(s, 'lat', wander, 18, 0.55, h);
      spring(s, 'yawJ', 0, 20, 0.55, h);
      spring(s, 'surge', SURGE_GAIN * L.accel, 5, 0.9, h);
    }

    // ── Whole car: arrival path, heading, and movement about the station
    const yaw = s.yaw0 + A.turn + L.yaw + s.yawJ + (vnoise(s.road * 0.02 + 40) - 0.5) * 0.012;
    root.current.rotation.y = yaw;
    root.current.position.set(
      s.right.x * A.x * s.squeeze + s.depth.x * A.z + Math.sin(yaw) * s.lat - Math.cos(yaw) * s.surge,
      0,
      s.right.z * A.x * s.squeeze + s.depth.z * A.z + Math.cos(yaw) * s.lat + Math.sin(yaw) * s.surge,
    );

    // ── Body on its suspension (rotation.x > 0 drops the left side, rotation.z > 0 the nose)
    const body = bodyRef.current;
    body.position.y = Math.max((s.front + s.rear) / 2, -0.02);
    body.rotation.x = s.roll;
    body.rotation.z = s.pitch + (s.rear - s.front) / wheelbase;

    // ── Wheels: follow the road, turn at true road speed, fronts steer into the corner
    const steer = 0.26 * Math.tanh((STEER_GAIN * rate) / Math.max(speed, 0.3) / 0.26)
      + s.yawJ * -0.8 + (vnoise(s.t * 2.7) - 0.5) * 0.02;
    s.frame += (dt - s.frame) * 0.1;
    let blur = 0;
    car.wheels.forEach((w, i) => {
      const omega = (speed * CAR_SPEED) / w.radius;
      w.angle = (w.angle + omega * dt) % (Math.PI * 2);
      w.pivot.position.y = w.baseY + heights[i];
      w.spin.rotation.z = w.angle;
      if (w.front) w.pivot.rotation.y = steer;
      blur += (omega * s.frame) / (Math.PI * 2) / car.wheels.length;
    });
    car.wheelBlur.value = Math.min(blur * SHUTTER, 1);

    // ── Streak lines. Wrapping at a whole number of periods is invisible.
    s.simTime = (s.simTime + dt * SLOWMO * (0.5 + 0.5 * speed)) % (PERIOD * 1024);
    lineMaterial.uniforms.uSimTime.value = s.simTime;
    lineMaterial.uniforms.uSteer.value = steer;
    lineMaterial.uniforms.uReveal.value = s.t - WAVE_START;
    lineMaterial.uniforms.uRes.value.set(size.width, size.height);
  });

  return (
    <group ref={root} visible={false}>
      <group position={[-PIVOT_X, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.02, 0.004, 0]} renderOrder={1}>
          <planeGeometry args={[7.4, 3.7]} />
          <meshBasicMaterial map={shadow} transparent depthWrite={false} />
        </mesh>
        <group ref={bodyRef} position={[wheelMid, 0, 0]}>
          <primitive object={car.body} position={[-wheelMid, 0, 0]} />
        </group>
        {car.wheels.map((w, i) => <primitive key={i} object={w.pivot} />)}
        {lines.geometry && (
          <mesh geometry={lines.geometry} material={lineMaterial} frustumCulled={false} renderOrder={2} />
        )}
      </group>
    </group>
  );
}

// Slides the whole picture sideways so the station sits right of centre on
// desktop, clear of the text, while the camera still orbits the car itself.
// Narrower canvases also zoom out a little so the lines fit side-on.
// The canvas is taller than its layout box by `pad` px above and below; the
// field of view widens to match, so the car stays the same size and the extra
// height is simply more sky and ground for the lines.
function StationOffset({ pad }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const shift = stationX(size.width) - size.width / 2;
    const boxHeight = Math.max(size.height - 2 * pad, 1);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (size.height / boxHeight)));
    camera.zoom = THREE.MathUtils.clamp(0.7 + (size.width / boxHeight - 1.1) * 0.86, 0.7, 1);
    camera.setViewOffset(size.width, size.height, -shift, 0, size.width, size.height);
    return () => { camera.zoom = 1; camera.fov = FOV; camera.clearViewOffset(); };
  }, [camera, size, pad]);
  return null;
}

function F1Scene({ started, pad, dragTarget }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 5]} intensity={1.4} />
      <directionalLight position={[-6, 3, -4]} intensity={0.5} />
      <hemisphereLight args={['#dfe6ff', '#1a1a1a', 0.9]} />
      <StationOffset pad={pad} />
      <Suspense fallback={null}>
        <Rig started={started} />
      </Suspense>
      {/* The view can still be dragged (over the layout box only), but it no longer turns by itself: the car does. */}
      {dragTarget && <OrbitControls
        domElement={dragTarget}
        target={TARGET}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />}
    </>
  );
}

// Extra view height, in px, above and below the layout box at each breakpoint.
function viewPad() {
  if (typeof window === 'undefined') return 0;
  if (window.matchMedia('(min-width: 1024px)').matches) return 150;
  return window.matchMedia('(min-width: 768px)').matches ? 110 : 80;
}

function F1CfdSimulation() {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [pad, setPad] = useState(viewPad);
  const [dragTarget, setDragTarget] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setPad(viewPad());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // All four edges fade out: top and bottom across the extra height, the sides a little.
  const desktop = pad >= 150;
  const mask = `linear-gradient(to right, transparent, black ${desktop ? 9 : 5}%, black 95%, transparent), `
    + `linear-gradient(to bottom, transparent, black ${Math.round(pad * 0.9)}px, black calc(100% - ${Math.round(pad * 0.9)}px), transparent)`;

  return (
    <div className="w-full" ref={containerRef}>
      {/* This box is what the page lays out. The canvas overhangs it above and below
          without taking any space, and ignores the pointer so it never blocks what it overlaps. */}
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px]">
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: -pad,
            bottom: -pad,
            maskImage: mask,
            WebkitMaskImage: mask,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        >
          <Canvas camera={{ position: CAMERA, fov: FOV }} gl={{ alpha: true, antialias: true }} style={{ pointerEvents: 'none' }}>
            <F1Scene started={inView} pad={pad} dragTarget={dragTarget} />
          </Canvas>
        </div>
        {/* dragging to look around happens on the layout box only */}
        <div ref={setDragTarget} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      </div>
    </div>
  );
}

useGLTF.preload(CAR_URL);

export default F1CfdSimulation;
