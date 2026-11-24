import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// F1 CFD showcase — four views of one Ansys Fluent 2026 R1 solution
// (half-car symmetry, k-ω SST, 50 m/s, moving ground), cycling with
// cross-fades:
//   1. Pathlines coloured by velocity magnitude
//   2. Surface pressure coefficient Cp on the body
//   3. Velocity-magnitude section sweeping nose -> wake
//   4. Vorticity: translucent smoke ray-marched through |ω|, with fine
//      detail modulated by turbulent kinetic energy
// Data (public/f1, built from the Fluent exports):
//   car.bin       decimated Flexcompute F1_2025 car + per-vertex Cp
//                 (Cp estimated from near-surface speed via Bernoulli)
//   volume.bin    3.3 cm grid: RGBA8 = |V|, sqrt(k), |ω| (log), solid mask
//   pathlines.bin Fluent pathlines (mirrored)
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;
const CX = 1.55; // Fluent x at scene origin
const MODE_TIME = 8;    // seconds per scene
const FADE_RATE = 2.2;  // cross-fade speed

const MODES = [
  { key: 'pathlines', title: 'Pathlines', sub: 'Velocity magnitude', range: ['0', '75 m/s'], bar: 'rainbow' },
  { key: 'cp', title: 'Surface pressure', sub: 'Pressure coefficient Cp (from near-wall velocity)', range: ['-1.2', '1.0'], bar: 'rainbow' },
  { key: 'slice', title: 'Velocity field', sub: 'Sweeping cross-section |V|', range: ['0', '75 m/s'], bar: 'rainbow' },
  { key: 'vortex', title: 'Vortical wake', sub: 'Vorticity |ω| · turbulence k', range: null, bar: null },
];

const BODY_COLORS = {
  body: '#EBE7DD', floor: '#1a1a1c', wings: '#222225', wheels: '#111112', susp: '#2c2c2f',
};
const GROUP_NAMES = ['body', 'floor', 'wings', 'wheels', 'susp'];

const RAINBOW_GLSL = /* glsl */ `
  vec3 rainbow(float s) {
    s = clamp(s, 0.0, 1.0);
    return clamp(vec3(1.5 - abs(4.0 * s - 3.0), 1.5 - abs(4.0 * s - 2.0), 1.5 - abs(4.0 * s - 1.0)), 0.0, 1.0);
  }
`;
const rainbowJS = (s) => {
  s = Math.min(Math.max(s, 0), 1);
  const c = (v) => Math.min(Math.max(v, 0), 1);
  return [c(1.5 - Math.abs(4 * s - 3)), c(1.5 - Math.abs(4 * s - 2)), c(1.5 - Math.abs(4 * s - 1))];
};

// ── Loaders ──────────────────────────────────────────────────
async function loadCar() {
  const buf = await (await fetch(`${BASE}f1/car.bin`)).arrayBuffer();
  const dv = new DataView(buf);
  const n = dv.getUint32(0, true);
  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push([dv.getUint32(4 + 8 * i, true), dv.getUint32(8 + 8 * i, true)]);
  let off = 4 + 8 * n;
  return sizes.map(([nv, nf], gi) => {
    const pos = new Float32Array(buf, off, nv * 3); off += nv * 12;
    const cpB = new Uint8Array(buf, off, nv); off += nv + ((4 - (nv % 4)) % 4);
    const idx = new Uint16Array(buf, off, nf * 3); off += nf * 6 + ((4 - ((nf * 6) % 4)) % 4);
    const col = new Float32Array(nv * 3);
    for (let i = 0; i < nv; i++) {
      const cp = (cpB[i] / 255) * 3.5 - 2.5;
      const [r, g, b] = rainbowJS((cp + 1.2) / 2.2);
      col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    return { name: GROUP_NAMES[gi], geometry: g };
  });
}

async function loadVolume() {
  const buf = await (await fetch(`${BASE}f1/volume.bin`)).arrayBuffer();
  const dv = new DataView(buf);
  const nx = dv.getUint32(0, true), ny = dv.getUint32(4, true), nz = dv.getUint32(8, true);
  const x0 = dv.getFloat32(12, true), x1 = dv.getFloat32(16, true);
  const y1 = dv.getFloat32(20, true), z1 = dv.getFloat32(24, true);
  const tex = new THREE.Data3DTexture(new Uint8Array(buf, 28, nx * ny * nz * 4), nx, ny, nz);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return { tex, x0, x1, y1, z1 };
}

async function loadPathlines() {
  const buf = await (await fetch(`${BASE}f1/pathlines.bin`)).arrayBuffer();
  const dv = new DataView(buf);
  const nLines = dv.getUint32(0, true);
  const counts = [];
  for (let i = 0; i < nLines; i++) counts.push(dv.getUint32(4 + 4 * i, true));
  const data = new Float32Array(buf, 4 + 4 * nLines);
  const total = counts.reduce((a, b) => a + b, 0);
  const pos = new Float32Array(total * 3), time = new Float32Array(total);
  const speed = new Float32Array(total), offset = new Float32Array(total);
  const index = [];
  let p = 0, v = 0;
  counts.forEach((n) => {
    const off = Math.random();
    for (let k = 0; k < n; k++, p += 5, v++) {
      pos[v * 3] = data[p]; pos[v * 3 + 1] = data[p + 1]; pos[v * 3 + 2] = data[p + 2];
      time[v] = data[p + 3]; speed[v] = data[p + 4]; offset[v] = off;
      if (k > 0) index.push(v - 1, v);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTime', new THREE.BufferAttribute(time, 1));
  g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  g.setAttribute('aOffset', new THREE.BufferAttribute(offset, 1));
  g.setIndex(index);
  return g;
}

// ── 1. Pathlines ─────────────────────────────────────────────
const lineVS = /* glsl */ `
  attribute float aTime; attribute float aSpeed; attribute float aOffset;
  uniform float uSimTime;
  varying float vStreak; varying vec3 vColor;
  ${RAINBOW_GLSL}
  void main() {
    float w = fract((uSimTime - aTime) / 0.11 + aOffset);
    vStreak = w < 0.38 ? pow(1.0 - w / 0.38, 1.4) : 0.0;
    vColor = rainbow(aSpeed / 75.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = vStreak > 0.0 ? uPointSize * (0.35 + 0.65 * vStreak) : 0.0;
  }
`;
const lineFS = /* glsl */ `
  uniform float uOpacity; uniform float uIsPoint;
  varying float vStreak; varying vec3 vColor;
  void main() {
    if (uIsPoint > 0.5) {
      vec2 c = gl_PointCoord - 0.5;
      if (vStreak <= 0.0 || dot(c, c) > 0.25) discard;
      gl_FragColor = vec4(vColor, 0.9 * vStreak * uOpacity);
    } else {
      gl_FragColor = vec4(vColor * (0.85 + 0.15 * vStreak), (0.25 + 0.75 * vStreak) * uOpacity);
    }
  }
`;

function Pathlines({ weight }) {
  const [geometry, setGeometry] = useState(null);
  useEffect(() => { loadPathlines().then(setGeometry); }, []);
  const [lineMat, pointMat] = useMemo(() => {
    const shared = { uSimTime: { value: 0 }, uOpacity: { value: 0 }, uPointSize: { value: 4 * Math.min(window.devicePixelRatio || 1, 2) } };
    const mk = (isPoint) => new THREE.ShaderMaterial({
      vertexShader: 'uniform float uPointSize;\n' + lineVS, fragmentShader: lineFS, transparent: true, depthWrite: false,
      uniforms: { ...shared, uIsPoint: { value: isPoint ? 1 : 0 } },
    });
    return [mk(false), mk(true)];
  }, []);
  useFrame((_, dt) => {
    lineMat.uniforms.uSimTime.value += dt * 0.12;
    lineMat.uniforms.uOpacity.value = weight.current;
  });
  if (!geometry) return null;
  return (
    <group visible>
      <lineSegments geometry={geometry} material={lineMat} renderOrder={3} />
      <points geometry={geometry} material={pointMat} renderOrder={4} />
    </group>
  );
}

// ── 2. Car (Cp blend) + solid wheel fill ─────────────────────
function Car({ cpWeight }) {
  const [parts, setParts] = useState(null);
  useEffect(() => { loadCar().then(setParts); }, []);
  const uCp = useMemo(() => ({ value: 0 }), []);
  const materials = useMemo(() => {
    const m = {};
    GROUP_NAMES.forEach((name) => {
      const mat = new THREE.MeshStandardMaterial({
        color: BODY_COLORS[name], vertexColors: true, side: THREE.DoubleSide,
        metalness: name === 'body' ? 0.3 : 0.5, roughness: name === 'wheels' ? 0.8 : 0.4,
      });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uCpMix = uCp;
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uCpMix;')
          .replace('#include <color_fragment>', 'diffuseColor.rgb = mix(diffuseColor.rgb, vColor, uCpMix);');
      };
      m[name] = mat;
    });
    return m;
  }, [uCp]);
  useFrame(() => { uCp.value = cpWeight.current; });
  if (!parts) return null;
  return (
    <>
      {parts.map((p) => <mesh key={p.name} geometry={p.geometry} material={materials[p.name]} />)}
      <WheelFill />
    </>
  );
}

// Wheel STLs are open on the side facing the car: close them with cylinders.
const WHEELS = [
  { x: 0.2027, z: 0.363, r: 0.355, y0: 0.62, y1: 1.0 },
  { x: 3.648, z: 0.344, r: 0.35, y0: 0.535, y1: 1.0 },
];
function WheelFill() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111112', roughness: 0.85 }), []);
  return WHEELS.flatMap((w, i) => [1, -1].map((s) => (
    <mesh key={`${i}${s}`} material={mat} rotation={[Math.PI / 2, 0, 0]}
      position={[w.x - CX, w.z, -s * (w.y0 + w.y1) / 2]}>
      <cylinderGeometry args={[w.r, w.r, w.y1 - w.y0, 48]} />
    </mesh>
  )));
}

// ── shared volume sampling (Fluent coords from three coords) ─
const VOLUME_GLSL = /* glsl */ `
  uniform highp sampler3D uVol;
  uniform vec4 uBox; // x0, x1, y1, z1  (Fluent)
  vec3 volCoord(vec3 p) { // three -> texture coords (mirrored about symmetry plane)
    return vec3((p.x + ${CX.toFixed(2)} - uBox.x) / (uBox.y - uBox.x), abs(p.z) / uBox.z, p.y / uBox.w);
  }
  bool inBox(vec3 t) { return all(greaterThanEqual(t, vec3(0.0))) && all(lessThanEqual(t, vec3(1.0))); }
`;

// ── 3. Sweeping velocity section ─────────────────────────────
const sliceVS = /* glsl */ `
  out vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const sliceFS = /* glsl */ `
  precision highp float;
  ${VOLUME_GLSL}
  ${RAINBOW_GLSL}
  uniform float uOpacity;
  in vec3 vWorld;
  out vec4 outColor;
  void main() {
    vec3 t = volCoord(vWorld);
    if (!inBox(t)) discard;
    vec4 s = texture(uVol, t);
    if (s.a > 0.5) discard;
    vec3 c = rainbow(s.r * 80.0 / 75.0);
    // soft edge so the section does not end in a hard rectangle
    float edge = smoothstep(0.0, 0.08, min(min(t.y, 1.0 - t.y) * 2.0, 1.0 - t.z));
    outColor = vec4(c, 0.82 * uOpacity * edge);
  }
`;

function VelocitySlice({ vol, weight }) {
  const ref = useRef();
  const sweep = useRef(0);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: sliceVS, fragmentShader: sliceFS,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uVol: { value: vol.tex }, uBox: { value: new THREE.Vector4(vol.x0, vol.x1, vol.y1, vol.z1) }, uOpacity: { value: 0 } },
  }), [vol]);
  const floorMat = useMemo(() => {
    const m = mat.clone();
    m.uniforms = { ...mat.uniforms, uOpacity: { value: 0 } };
    return m;
  }, [mat]);
  useFrame((_, dt) => {
    const w = weight.current;
    mat.uniforms.uOpacity.value = w;
    floorMat.uniforms.uOpacity.value = w * 0.55;
    if (w < 0.01) { sweep.current = 0; return; }
    sweep.current += dt / (MODE_TIME * 0.9);
    const e = Math.min(sweep.current, 1);
    const xs = (vol.x0 + 0.3 - CX) + (vol.x1 - vol.x0 - 0.6) * (0.5 - 0.5 * Math.cos(Math.PI * e));
    if (ref.current) ref.current.position.x = xs;
  });
  const H = vol.z1, W = vol.y1 * 2;
  return (
    <>
      {/* vertical cross-section, sweeps along the car */}
      <mesh ref={ref} material={mat} renderOrder={2} rotation={[0, Math.PI / 2, 0]} position={[0, H / 2, 0]}>
        <planeGeometry args={[W, H, 1, 1]} />
      </mesh>
      {/* horizontal section near the floor showing the wake */}
      <mesh material={floorMat} renderOrder={1} rotation={[-Math.PI / 2, 0, 0]}
        position={[(vol.x0 + vol.x1) / 2 - CX, 0.12, 0]}>
        <planeGeometry args={[vol.x1 - vol.x0, W, 1, 1]} />
      </mesh>
    </>
  );
}

// ── 4. Vortical wake: translucent single-colour smoke ────────
const volVS = /* glsl */ `
  out vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const volFS = /* glsl */ `
  precision highp float;
  ${VOLUME_GLSL}
  uniform vec3 uBoxMin; uniform vec3 uBoxMax;
  uniform float uTime; uniform float uOpacity; uniform vec3 uSmoke;
  in vec3 vWorld;
  out vec4 outColor;

  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { return 0.55 * noise(p) + 0.3 * noise(p * 2.13 + 3.1) + 0.15 * noise(p * 4.37 + 7.7); }

  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vWorld - ro);
    vec3 inv = 1.0 / rd;
    vec3 t0 = (uBoxMin - ro) * inv, t1 = (uBoxMax - ro) * inv;
    vec3 tmin = min(t0, t1), tmax = max(t0, t1);
    float tn = max(max(tmin.x, tmin.y), max(tmin.z, 0.0));
    float tf = min(min(tmax.x, tmax.y), tmax.z);
    if (tf <= tn) discard;

    const int STEPS = 140;
    float dt = (tf - tn) / float(STEPS);
    float jitter = hash(vec3(floor(gl_FragCoord.xy), 1.0));
    float T = 1.0;  // transmittance
    vec3 col = vec3(0.0);
    for (int i = 0; i < STEPS; i++) {
      vec3 p = ro + rd * (tn + (float(i) + jitter) * dt);
      vec3 tc = volCoord(p);
      vec4 s = texture(uVol, tc);
      if (s.a > 0.5) break;
      float fade = smoothstep(0.0, 0.05, tc.x) * smoothstep(1.0, 0.88, tc.x)
                 * smoothstep(1.0, 0.8, tc.y) * smoothstep(1.0, 0.8, tc.z);                          // the car occludes what is behind it
      float k = s.g;
      // strong vorticity AND turbulence -> the wake, not the attached boundary layers
      float vort = fade * smoothstep(0.38, 0.8, s.b) * smoothstep(0.12, 0.45, k);
      if (vort <= 0.0) continue;
      // small eddies: domain-warped noise advected downstream; finer where k is high
      vec3 q = vec3(p.x - uTime * 1.4, p.y, p.z) * (3.2 + 4.5 * k);
      vec3 warp = vec3(noise(q * 0.5 + 1.7), noise(q * 0.5 + 9.2), noise(q * 0.5 + 4.4)) - 0.5;
      float n = fbm(q + warp * 2.2);
      float dens = vort * smoothstep(0.48, 0.72, n);
      if (dens <= 0.001) continue;
      float a = 1.0 - exp(-dens * 3.2 * dt * 10.0);
      // light from above: denser-looking wisps get slightly darker edges
      float shade = 0.78 + 0.22 * smoothstep(0.5, 0.8, n);
      col += T * a * uSmoke * shade;
      T *= 1.0 - a;
      if (T < 0.05) break;
    }
    float alpha = (1.0 - T) * uOpacity * 0.85;
    if (alpha < 0.003) discard;
    outColor = vec4(col / max(1.0 - T, 1e-4), alpha);
  }
`;

function VortexSmoke({ vol, weight, dark }) {
  const min = useMemo(() => new THREE.Vector3(vol.x0 - CX, 0.0, -vol.y1), [vol]);
  const max = useMemo(() => new THREE.Vector3(vol.x1 - CX, vol.z1, vol.y1), [vol]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: volVS, fragmentShader: volFS,
    transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide,
    uniforms: {
      uVol: { value: vol.tex }, uBox: { value: new THREE.Vector4(vol.x0, vol.x1, vol.y1, vol.z1) },
      uBoxMin: { value: min }, uBoxMax: { value: max },
      uTime: { value: 0 }, uOpacity: { value: 0 },
      uSmoke: { value: new THREE.Vector3(...(dark ? [0.78, 0.8, 0.95] : [0.55, 0.58, 0.82])) },
    },
  }), [vol, min, max, dark]);
  const ref = useRef();
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uOpacity.value = weight.current;
    if (ref.current) ref.current.visible = weight.current > 0.005;
  });
  const size = max.clone().sub(min), centre = max.clone().add(min).multiplyScalar(0.5);
  return (
    <mesh ref={ref} material={mat} position={centre} renderOrder={5}>
      <boxGeometry args={[size.x, size.y, size.z]} />
    </mesh>
  );
}

// ── Scene / mode cycling ─────────────────────────────────────
function Scene({ mode, started, dark }) {
  const [vol, setVol] = useState(null);
  useEffect(() => { loadVolume().then(setVol); }, []);
  const weights = useMemo(() => MODES.map(() => ({ current: 0 })), []);
  useFrame((_, dt) => {
    weights.forEach((w, i) => {
      const target = started && i === mode ? 1 : 0;
      w.current += (target - w.current) * Math.min(1, dt * FADE_RATE);
    });
  });
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#dfe6ff', '#1a1a1a', 0.9]} />
      <directionalLight position={[4, 8, 5]} intensity={1.4} />
      <directionalLight position={[-6, 3, -4]} intensity={0.5} />
      <Car cpWeight={weights[1]} />
      <Pathlines weight={weights[0]} />
      {vol && <VelocitySlice vol={vol} weight={weights[2]} />}
      {vol && <VortexSmoke vol={vol} weight={weights[3]} dark={dark} />}
      <OrbitControls target={[1.3, 0.35, 0]} enableZoom={false} enablePan={false}
        autoRotate={started} autoRotateSpeed={0.9}
        minPolarAngle={0.35} maxPolarAngle={Math.PI / 2 - 0.05} />
    </>
  );
}

function F1CfdShowcase() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [mode, setMode] = useState(0);
  const pausedUntil = useRef(0);
  const dark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); ob.disconnect(); } }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setMode((m) => (m + 1) % MODES.length);
    }, MODE_TIME * 1000);
    return () => clearInterval(id);
  }, [inView]);

  const pick = (i) => { setMode(i); pausedUntil.current = Date.now() + 20000; };
  const m = MODES[mode];

  return (
    <div className="w-full" ref={ref}>
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden rounded-sm cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [7.6, 3.4, 6.9], fov: 40 }} gl={{ alpha: true, antialias: true }}>
          <Scene mode={mode} started={inView} dark={dark} />
        </Canvas>

        {/* scene picker */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {MODES.map((md, i) => (
            <button key={md.key} type="button" onClick={() => pick(i)} aria-label={md.title}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === mode ? 'w-8 bg-text-primary' : 'w-3 bg-text-muted opacity-50 hover:opacity-100'}`} />
          ))}
        </div>

        {/* caption + legend */}
        <div className="pointer-events-none absolute right-3 bottom-3 text-right text-[10px] sm:text-xs uppercase tracking-[0.2em] text-text-muted">
          <p key={m.key} className="text-text-primary transition-opacity">{m.title}</p>
          <p className="mt-0.5 normal-case tracking-normal">{m.sub}</p>
          {m.bar && (
            <>
              <div className="ml-auto mt-1.5 h-2 w-40 sm:w-52 rounded-sm"
                style={{ background: 'linear-gradient(90deg,#0000ff,#00ffff,#00ff00,#ffff00,#ff0000)' }} />
              <div className="ml-auto mt-1 flex w-40 sm:w-52 justify-between"><span>{m.range[0]}</span><span>{m.range[1]}</span></div>
            </>
          )}
          <p className="mt-2 normal-case tracking-normal opacity-70">Ansys Fluent · k-ω SST · 50 m/s · geometry: Flexcompute F1_2025</p>
        </div>
      </div>
    </div>
  );
}

export default F1CfdShowcase;
