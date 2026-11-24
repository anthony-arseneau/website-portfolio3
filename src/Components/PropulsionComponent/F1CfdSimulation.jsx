import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// F1 external-aero CFD viewer
// Pathlines exported from Ansys Fluent 2026 R1 Student
// (half-car symmetry model, k-ω SST, 50 m/s inlet + moving ground),
// mirrored across the symmetry plane. Geometry: Flexcompute F1_2025.
// Data files live in /public/f1 (built by the asset script).
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;
const CAR_URL = `${BASE}f1/car.glb`;
const LINES_URL = `${BASE}f1/pathlines.bin`;

const V_MAX = 75;          // colormap range [m/s]
const SLOWMO = 0.12;       // simulated seconds per real second
const PERIOD = 0.11;       // gap between streaks along a line [sim s]
const STREAK = 0.38;       // streak length as fraction of PERIOD
const GROW_TIME = 3.0;     // seconds for lines to draw in

const MATERIALS = {
  body:   { color: '#EBE7DD', metalness: 0.35, roughness: 0.35 },
  floor:  { color: '#151517', metalness: 0.5,  roughness: 0.6  },
  wings:  { color: '#1c1c1f', metalness: 0.6,  roughness: 0.4  },
  wheels: { color: '#0d0d0e', metalness: 0.1,  roughness: 0.8  },
  susp:   { color: '#2a2a2d', metalness: 0.7,  roughness: 0.4  },
};

// ── Pathline loading ─────────────────────────────────────────
// Format: u32 nLines, u32 n[i]..., then per line n*5 float32 (x,y,z, t, |V|)
async function loadPathlines(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const nLines = dv.getUint32(0, true);
  const counts = [];
  for (let i = 0; i < nLines; i++) counts.push(dv.getUint32(4 + 4 * i, true));
  const data = new Float32Array(buf, 4 + 4 * nLines);
  const total = counts.reduce((a, b) => a + b, 0);

  const pos = new Float32Array(total * 3);
  const time = new Float32Array(total);
  const speed = new Float32Array(total);
  const offset = new Float32Array(total);
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

const vertexShader = /* glsl */ `
  attribute float aTime;
  attribute float aSpeed;
  attribute float aOffset;
  varying float vTime;
  varying float vOffset;
  varying vec3 vColor;
  uniform float uVMax;

  // Fluent-style rainbow: blue -> cyan -> green -> yellow -> red
  vec3 rainbow(float s) {
    s = clamp(s, 0.0, 1.0);
    return clamp(vec3(
      1.5 - abs(4.0 * s - 3.0),
      1.5 - abs(4.0 * s - 2.0),
      1.5 - abs(4.0 * s - 1.0)
    ), 0.0, 1.0);
  }

  void main() {
    vTime = aTime;
    vOffset = aOffset;
    vColor = rainbow(aSpeed / uVMax);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vTime;
  varying float vOffset;
  varying vec3 vColor;
  uniform float uSimTime;
  uniform float uGrow;
  uniform float uPeriod;
  uniform float uStreak;

  void main() {
    // lines "grow" downstream during the intro
    if (vTime > uGrow) discard;
    // distance behind the moving streak head, in periods
    float w = fract((uSimTime - vTime) / uPeriod + vOffset);
    float streak = w < uStreak ? pow(1.0 - w / uStreak, 1.5) : 0.0;
    float alpha = 0.28 + 0.72 * streak;
    vec3 col = mix(vColor * 0.85, vColor, streak);
    gl_FragColor = vec4(col, alpha);
  }
`;

// Thick streak bodies drawn as round points along the line
const pointVertexShader = /* glsl */ `
  attribute float aTime;
  attribute float aSpeed;
  attribute float aOffset;
  uniform float uSimTime;
  uniform float uGrow;
  uniform float uPeriod;
  uniform float uStreak;
  uniform float uVMax;
  uniform float uSize;
  varying vec3 vColor;
  varying float vStreak;
  vec3 rainbow(float s) {
    s = clamp(s, 0.0, 1.0);
    return clamp(vec3(1.5 - abs(4.0 * s - 3.0), 1.5 - abs(4.0 * s - 2.0), 1.5 - abs(4.0 * s - 1.0)), 0.0, 1.0);
  }
  void main() {
    float w = fract((uSimTime - aTime) / uPeriod + aOffset);
    vStreak = (aTime > uGrow || w >= uStreak) ? 0.0 : pow(1.0 - w / uStreak, 1.2);
    vColor = rainbow(aSpeed / uVMax);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = vStreak > 0.0 ? uSize * (0.35 + 0.65 * vStreak) : 0.0;
  }
`;

const pointFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vStreak;
  void main() {
    if (vStreak <= 0.0) discard;
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    gl_FragColor = vec4(vColor, 0.9 * vStreak);
  }
`;

function Pathlines({ started }) {
  const [geometry, setGeometry] = useState(null);
  const grow = useRef(0);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSimTime: { value: 0 },
      uGrow: { value: 0 },
      uPeriod: { value: PERIOD },
      uStreak: { value: STREAK },
      uVMax: { value: V_MAX },
    },
  }), []);

  const pointMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    transparent: true,
    depthWrite: false,
    // share the animated uniforms with the line material
    uniforms: { ...material.uniforms, uSize: { value: 4.0 * Math.min(window.devicePixelRatio || 1, 2) } },
  }), [material]);

  useEffect(() => {
    let alive = true;
    loadPathlines(LINES_URL).then((g) => { if (alive) setGeometry(g); });
    return () => { alive = false; };
  }, []);

  useFrame((_, delta) => {
    if (!started || !geometry) return;
    grow.current = Math.min(grow.current + delta / GROW_TIME, 1);
    // ease-out so the lines shoot forward then settle
    const e = 1 - (1 - grow.current) ** 3;
    material.uniforms.uGrow.value = e * 0.25 + (grow.current >= 1 ? 10 : 0);
    material.uniforms.uSimTime.value += delta * SLOWMO;
  });

  if (!geometry) return null;
  return (
    <>
      <lineSegments geometry={geometry} material={material} renderOrder={2} />
      <points geometry={geometry} material={pointMaterial} renderOrder={3} />
    </>
  );
}

function Car() {
  const { scene } = useGLTF(CAR_URL);
  const car = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      if (!o.isMesh) return;
      const key = Object.keys(MATERIALS).find((k) => o.name.startsWith(k)) || 'body';
      o.material = new THREE.MeshStandardMaterial({ ...MATERIALS[key], side: THREE.DoubleSide });
      o.geometry.computeVertexNormals();
    });
    return root;
  }, [scene]);
  return <primitive object={car} />;
}

const CAM_FROM = [12.0, 1.8, 8.5];
const CAM_TO = [7.6, 3.4, 6.9];
const CAM_DURATION = 2.5;

function CameraIntro({ started }) {
  const elapsed = useRef(0);
  const done = useRef(false);
  useFrame(({ camera }, delta) => {
    if (!started || done.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / CAM_DURATION, 1);
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

function F1Scene({ started }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 5]} intensity={1.4} />
      <directionalLight position={[-6, 3, -4]} intensity={0.5} />
      <hemisphereLight args={['#dfe6ff', '#1a1a1a', 0.9]} />
      <Suspense fallback={null}>
        <Car />
      </Suspense>
      <Pathlines started={started} />
      <CameraIntro started={started} />
      {/* autoRotate spins the view about the vertical (y) axis */}
      <OrbitControls
        target={[1.3, 0.35, 0]}
        enableZoom={false}
        enablePan={false}
        autoRotate={started}
        autoRotateSpeed={1.1}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 text-right text-[10px] sm:text-xs uppercase tracking-[0.2em] text-text-muted">
      <p className="mb-1.5">Velocity magnitude [m/s]</p>
      <div
        className="ml-auto h-2 w-40 sm:w-52 rounded-sm"
        style={{ background: 'linear-gradient(90deg,#0000ff,#00ffff,#00ff00,#ffff00,#ff0000)' }}
      />
      <div className="mt-1 ml-auto flex w-40 sm:w-52 justify-between">
        <span>0</span><span>{V_MAX}</span>
      </div>
      <p className="mt-2 normal-case tracking-normal opacity-70">
        Ansys Fluent · k-ω SST · 50 m/s · geometry: Flexcompute F1_2025
      </p>
    </div>
  );
}

function F1CfdSimulation() {
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
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden rounded-sm cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: CAM_FROM, fov: 40 }} gl={{ alpha: true, antialias: true }}>
          <F1Scene started={inView} />
        </Canvas>
        <Legend />
      </div>
    </div>
  );
}

useGLTF.preload(CAR_URL);

export default F1CfdSimulation;
