import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ── Constants ──────────────────────────────────────────────
const GAMMA = 1.2;
const R_GAS = 360;
const NUM_PARTICLES = 8000;

const R_CHAMBER = 1.5;
const R_THROAT = 0.85;
const R_EXIT = 2.75;
const THICKNESS = 0.12;
const X_CHAM_END = 2.0;
const X_CONV_END = 3.0;
const X_THR_END = 3.0;
const X_TRANS_END = 5.0;
const X_EXIT = 10.0;
const X_PLUME = 15.0;
const TRANS_RISE = 0.4;
const N_X = 100;

const BEIGE = '#EBE7DD';

// ── Math helpers ───────────────────────────────────────────
function linspace(start, end, n) {
  const step = (end - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + i * step);
}

function nozzleRadius(x) {
  if (x <= X_CHAM_END) return R_CHAMBER;
  if (x <= X_CONV_END) {
    const t = (x - X_CHAM_END) / (X_CONV_END - X_CHAM_END);
    return R_THROAT + (R_CHAMBER - R_THROAT) * (1 - t) ** 2;
  }
  if (x <= X_THR_END) return R_THROAT;
  if (x <= X_TRANS_END) {
    const L4 = X_TRANS_END - X_THR_END;
    const t = (x - X_THR_END) / L4;
    return R_THROAT + TRANS_RISE * t * t;
  }
  const L4 = X_TRANS_END - X_THR_END;
  const L5 = X_EXIT - X_TRANS_END;
  const t = Math.min((x - X_TRANS_END) / L5, 1);
  const RBS = R_THROAT + TRANS_RISE;
  const dR = R_EXIT - RBS;
  const q = (2 * TRANS_RISE / L4) * L5 / dR;
  return RBS + dR * (1 - (1 - t) ** q);
}

function plumeRadius(x) {
  if (x <= X_EXIT) return nozzleRadius(x);
  return nozzleRadius(X_EXIT) + 0.3 * (x - X_EXIT);
}

function interp(x, xArr, yArr) {
  if (x <= xArr[0]) return yArr[0];
  if (x >= xArr[xArr.length - 1]) return yArr[yArr.length - 1];
  let lo = 0, hi = xArr.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xArr[mid] <= x) lo = mid; else hi = mid;
  }
  const t = (x - xArr[lo]) / (xArr[hi] - xArr[lo]);
  return yArr[lo] + t * (yArr[hi] - yArr[lo]);
}

// ── Mach solver ────────────────────────────────────────────
function areaMachRHS(M) {
  const exp = (GAMMA + 1) / (2 * (GAMMA - 1));
  return (1 / M) * ((2 / (GAMMA + 1)) * (1 + (GAMMA - 1) / 2 * M * M)) ** exp;
}

function solveMach(aRatio, subsonic) {
  let lo = subsonic ? 1e-4 : 1 + 1e-6;
  let hi = subsonic ? 1 - 1e-6 : 30;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const f = areaMachRHS(mid);
    if (f > aRatio) { if (subsonic) lo = mid; else hi = mid; }
    else { if (subsonic) hi = mid; else lo = mid; }
  }
  return (lo + hi) / 2;
}

// ── Precomputed geometry & Mach (module-level, runs once) ──
const xPts = linspace(0, X_EXIT, N_X);
const rInner = xPts.map(nozzleRadius);
const xThroat = (X_CONV_END + X_THR_END) / 2;
const rThroat = interp(xThroat, xPts, rInner);
const aStar = Math.PI * rThroat * rThroat;
const dx = xPts[1] - xPts[0];

const machProfile = xPts.map((x, i) => {
  if (Math.abs(x - xThroat) < dx * 1.5) return 1.0;
  const a = Math.PI * rInner[i] * rInner[i];
  const aRatio = a / aStar;
  try { return solveMach(aRatio, x < xThroat); }
  catch { return 1.0; }
});

const machExit = machProfile[machProfile.length - 1];
const machMax = Math.max(...machProfile);

// Intensity lookup table
const ILUT_N = 400;
const ILUT_DX = (X_PLUME + 1) / (ILUT_N - 1);
const intensityLUT = new Float64Array(ILUT_N);
for (let i = 0; i < ILUT_N; i++) {
  const x = i * ILUT_DX;
  const m = interp(x, xPts, machProfile);
  intensityLUT[i] = Math.min(m / machMax, 1);
}

function getMachIntensity(x) {
  const idx = x / ILUT_DX;
  const i = Math.min(Math.max(Math.floor(idx), 0), ILUT_N - 2);
  const t = idx - i;
  return intensityLUT[i] + t * (intensityLUT[i + 1] - intensityLUT[i]);
}

function getIntensity(axial, radX, radZ) {
  const machI = getMachIntensity(axial);
  const rMax = plumeRadius(axial);
  const r = Math.sqrt(radX * radX + radZ * radZ);
  const rNorm = rMax > 0 ? Math.min(r / rMax, 1) : 0;
  return Math.min(Math.max(machI * (1 - rNorm * rNorm * Math.sqrt(rNorm)), 0), 1);
}

// ── Fire color mapping (intensity 0-1 → RGB 0-1) ──────────
const FIRE_STOPS = [
  { t: 0.0, r: 139 / 255, g: 0, b: 0 },
  { t: 0.3, r: 1, g: 69 / 255, b: 0 },
  { t: 0.6, r: 1, g: 165 / 255, b: 0 },
  { t: 0.8, r: 1, g: 1, b: 1 },
  { t: 1.0, r: 0, g: 1, b: 1 },
];

function intensityToRGB(v) {
  v = Math.max(0, Math.min(1, v));
  let i = 0;
  while (i < FIRE_STOPS.length - 2 && FIRE_STOPS[i + 1].t < v) i++;
  const a = FIRE_STOPS[i], b = FIRE_STOPS[i + 1];
  const frac = b.t > a.t ? (v - a.t) / (b.t - a.t) : 0;
  return [
    a.r + frac * (b.r - a.r),
    a.g + frac * (b.g - a.g),
    a.b + frac * (b.b - a.b),
  ];
}

// ── Precomputed LatheGeometry profiles ─────────────────────
// LatheGeometry revolves around Y, so Vector2(radius, axialPos)
const innerLathePts = xPts.map((x, i) => new THREE.Vector2(rInner[i], x));
const outerLathePts = xPts.map((x, i) => new THREE.Vector2(rInner[i] + THICKNESS, x));

// ── KPI computation ────────────────────────────────────────
function computeKpis(pcMpa, tc) {
  const pc = pcMpa * 1e6;
  const me = machExit;
  const tExit = tc / (1 + (GAMMA - 1) / 2 * me * me);
  const pExit = pc / (1 + (GAMMA - 1) / 2 * me * me) ** (GAMMA / (GAMMA - 1));
  const vExit = me * Math.sqrt(GAMMA * R_GAS * tExit);
  const mdot = pc * Math.PI * R_THROAT * R_THROAT / Math.sqrt(tc) *
    Math.sqrt(GAMMA / R_GAS * (2 / (GAMMA + 1)) ** ((GAMMA + 1) / (GAMMA - 1)));
  const thrust = mdot * vExit + pExit * Math.PI * R_EXIT * R_EXIT;
  return {
    exitMach: me.toFixed(2),
    exitTemp: tExit.toFixed(0),
    exitPressure: (pExit / 1e3).toFixed(1),
    exitVelocity: vExit.toFixed(0),
    thrust: (thrust / 1e3).toFixed(1),
  };
}

// ════════════════════════════════════════════════════════════
// 3D Components
// ════════════════════════════════════════════════════════════

function NozzleWalls() {
  const innerGeom = useMemo(() => new THREE.LatheGeometry(innerLathePts, 64), []);
  const outerGeom = useMemo(() => new THREE.LatheGeometry(outerLathePts, 64), []);
  const capInGeom = useMemo(() => new THREE.RingGeometry(rInner[0], rInner[0] + THICKNESS, 64), []);
  const capExGeom = useMemo(() => new THREE.RingGeometry(rInner[N_X - 1], rInner[N_X - 1] + THICKNESS, 64), []);

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    metalness: 0.85,
    roughness: 0.15,
    side: THREE.DoubleSide,
    transparent: false,
    wireframe: false,
  }), []);

  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#333333',
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  }), []);

  return (
    <group rotation={[0, 0, -Math.PI / 2]}>
      <mesh geometry={innerGeom} material={wallMat} />
      <mesh geometry={innerGeom} material={wireMat} />
      <mesh geometry={outerGeom} material={wallMat} />
      <mesh geometry={outerGeom} material={wireMat} />
      <mesh geometry={capInGeom} material={wallMat} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={capInGeom} material={wireMat} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={capExGeom} material={wallMat} position={[0, X_EXIT, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={capExGeom} material={wireMat} position={[0, X_EXIT, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

function FireParticles() {
  const pointsRef = useRef();
  const readyRef = useRef(false);
  const traitsRef = useRef({ rNorms: new Float32Array(NUM_PARTICLES), thetas: new Float32Array(NUM_PARTICLES) });

  useEffect(() => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;

    const pos = new Float32Array(NUM_PARTICLES * 3);
    const col = new Float32Array(NUM_PARTICLES * 3);

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const axial = Math.random() * X_PLUME;
      const rMax = plumeRadius(axial);
      const rNorm = Math.random();
      const theta = Math.random() * 2 * Math.PI;
      traitsRef.current.rNorms[i] = rNorm;
      traitsRef.current.thetas[i] = theta;

      const r = rMax * Math.sqrt(rNorm);
      pos[i * 3] = axial;
      pos[i * 3 + 1] = r * Math.cos(theta);
      pos[i * 3 + 2] = r * Math.sin(theta);

      const intensity = getIntensity(axial, pos[i * 3 + 1], pos[i * 3 + 2]);
      const [cr, cg, cb] = intensityToRGB(intensity);
      col[i * 3] = cr;
      col[i * 3 + 1] = cg;
      col[i * 3 + 2] = cb;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    readyRef.current = true;
  }, []);

  useFrame((_, delta) => {
    if (!readyRef.current || !pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    const col = pointsRef.current.geometry.attributes.color.array;
    const speed = 5.0 * Math.min(delta, 0.05);

    for (let i = 0; i < NUM_PARTICLES; i++) {
      let x = pos[i * 3] + speed;

      if (x > X_PLUME) {
        x = Math.random() * 2.0;
        traitsRef.current.rNorms[i] = Math.random();
        traitsRef.current.thetas[i] = Math.random() * 2 * Math.PI;
      }

      const rMax = plumeRadius(x);
      const rNorm = traitsRef.current.rNorms[i];
      const theta = traitsRef.current.thetas[i];
      const r = rMax * Math.sqrt(rNorm);

      pos[i * 3] = x;
      pos[i * 3 + 1] = r * Math.cos(theta);
      pos[i * 3 + 2] = r * Math.sin(theta);

      const intensity = getIntensity(x, pos[i * 3 + 1], pos[i * 3 + 2]);
      const [cr, cg, cb] = intensityToRGB(intensity);
      col[i * 3] = cr;
      col[i * 3 + 1] = cg;
      col[i * 3 + 2] = cb;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

const CAM_FROM = [-10.5, -1.4, 2.1];
const CAM_TO = [-6.3, -9.2, 5.8];
const CAM_DURATION = 2.5; // seconds

function CameraIntro({ started }) {
  const elapsed = useRef(0);
  const done = useRef(false);

  useFrame(({ camera }, delta) => {
    if (!started || done.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / CAM_DURATION, 1);
    // Smooth ease-out cubic
    const e = 1 - (1 - t) ** 3;
    camera.position.set(
      CAM_FROM[0] + (CAM_TO[0] - CAM_FROM[0]) * e,
      CAM_FROM[1] + (CAM_TO[1] - CAM_FROM[1]) * e,
      CAM_FROM[2] + (CAM_TO[2] - CAM_FROM[2]) * e,
    );
    if (t >= 1) done.current = true;
  });
  return null;
}

function NozzleScene({ started }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 10, 10]} intensity={1} />
      <Environment preset="city" environmentIntensity={0.5} />
      <NozzleWalls />
      <FireParticles />
      <CameraIntro started={started} />
      <OrbitControls
        target={[5, 0, 0]}
        enableZoom={false}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════
function NozzleSimulation() {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);

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

  return (
    <div className="w-full" ref={containerRef}>
      <div className="w-full h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden rounded-sm cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: CAM_FROM, fov: 45 }}
          gl={{ alpha: true, antialias: true }}
        >
          <NozzleScene started={inView} />
        </Canvas>
      </div>
    </div>
  );
}

export default NozzleSimulation;