import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// F1 "smoke tunnel" driven by the Ansys Fluent solution.
//
// field.bin = the Fluent cell-centre velocity + turbulent kinetic energy (k)
// resampled onto a uniform 5 cm grid (half car, y >= 0, mirrored here).
// Particles follow the mean RANS velocity and get a random fluctuating
// velocity u' (Langevin / Ornstein-Uhlenbeck model, sigma = sqrt(2k/3)),
// the same idea as Fluent's discrete-random-walk particle dispersion.
// So the churn is modelled from k — it is not resolved eddies (RANS).
//
// Exports:
//   default    -> standalone section visual (car + smoke)
//   SmokeField -> just the smoke, to drop into another <Canvas>
//   WheelFill  -> solid cylinders that close the open inner sides of the wheels
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;
const CAR_URL = `${BASE}f1/car.glb`;
const FIELD_URL = `${BASE}f1/field.bin`;

const CX = 1.55;            // Fluent x of the scene origin (same as car.glb)
const N_PARTICLES = 9000;
const SLOWMO = 0.1;         // simulated seconds per real second
const TAU = 0.012;          // Lagrangian time scale of u' [s]
const V_MAX = 75;           // colour range [m/s]
const SPAWN_X = -1.9;
const KILL_X = 7.3;

// Fluent (x, y, z) -> three.js (x, y, z): z is up in Fluent, y is up in three
const toThree = (x, y, z, out, i) => {
  out[i] = x - CX; out[i + 1] = z; out[i + 2] = -y;
};

// ── Field loading / sampling ─────────────────────────────────
async function loadField(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const nx = dv.getUint32(0, true), ny = dv.getUint32(4, true), nz = dv.getUint32(8, true);
  const x0 = dv.getFloat32(12, true), y0 = dv.getFloat32(16, true), z0 = dv.getFloat32(20, true);
  const h = dv.getFloat32(24, true), vs = dv.getFloat32(28, true);
  const raw = new Int8Array(buf, 32);
  const n = nx * ny * nz;
  const u = new Float32Array(n), v = new Float32Array(n), w = new Float32Array(n);
  const sk = new Float32Array(n), solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const kb = raw[i * 4 + 3] & 255;
    if (kb === 255) { solid[i] = 1; continue; }
    u[i] = (raw[i * 4] / 127) * vs;
    v[i] = (raw[i * 4 + 1] / 127) * vs;
    w[i] = (raw[i * 4 + 2] / 127) * vs;
    sk[i] = (kb / 254) * 10; // sqrt(k)
  }
  return { nx, ny, nz, x0, y0, z0, h, u, v, w, sk, solid };
}

// trilinear sample; returns false if the point touches solid / leaves the box
const S = { u: 0, v: 0, w: 0, sk: 0 };
function sample(F, x, y, z) {
  const sgn = y < 0 ? -1 : 1;
  const ay = Math.abs(y);
  const fx = (x - F.x0) / F.h, fy = (ay - F.y0) / F.h, fz = (z - F.z0) / F.h;
  const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz);
  if (i < 0 || j < 0 || k < 0 || i >= F.nx - 1 || j >= F.ny - 1 || k >= F.nz - 1) return false;
  const tx = fx - i, ty = fy - j, tz = fz - k;
  const sy = F.nz, sx = F.ny * F.nz;
  let u = 0, v = 0, w = 0, sk = 0;
  for (let c = 0; c < 8; c++) {
    const di = c & 1, dj = (c >> 1) & 1, dk = (c >> 2) & 1;
    const id = (i + di) * sx + (j + dj) * sy + (k + dk);
    if (F.solid[id]) return false;
    const wt = (di ? tx : 1 - tx) * (dj ? ty : 1 - ty) * (dk ? tz : 1 - tz);
    u += F.u[id] * wt; v += F.v[id] * wt; w += F.w[id] * wt; sk += F.sk[id] * wt;
  }
  S.u = u; S.v = v * sgn; S.w = w; S.sk = sk;
  return true;
}

// ── Shaders ──────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  attribute float aSpeed;
  attribute float aAlpha;
  attribute float aSize;
  uniform float uScale;
  uniform float uVMax;
  varying vec3 vColor;
  varying float vAlpha;
  vec3 rainbow(float s) {
    s = clamp(s, 0.0, 1.0);
    return clamp(vec3(1.5 - abs(4.0 * s - 3.0), 1.5 - abs(4.0 * s - 2.0), 1.5 - abs(4.0 * s - 1.0)), 0.0, 1.0);
  }
  void main() {
    vColor = rainbow(aSpeed / uVMax) * 0.9;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / -mv.z;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r2 = dot(c, c);
    if (r2 > 0.25) discard;
    float soft = exp(-r2 * 10.0);          // gaussian puff
    gl_FragColor = vec4(vColor, soft * vAlpha * uOpacity);
  }
`;

// ── Smoke particles ──────────────────────────────────────────
export function SmokeField({ started = true, count = N_PARTICLES }) {
  const [field, setField] = useState(null);
  const { size, gl } = useThree();

  useEffect(() => {
    let alive = true;
    loadField(FIELD_URL).then((f) => { if (alive) setField(f); });
    return () => { alive = false; };
  }, []);

  const dark = typeof document !== 'undefined'
    && document.documentElement.getAttribute('data-theme') === 'dark';

  const sim = useMemo(() => {
    const p = new Float32Array(count * 3);   // Fluent coords
    const f = new Float32Array(count * 3);   // fluctuating velocity u'
    const age = new Float32Array(count);
    const pos = new Float32Array(count * 3); // three coords
    const speed = new Float32Array(count);
    const alpha = new Float32Array(count);
    const psize = new Float32Array(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(psize, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(1.5, 0.5, 0), 8);
    return { p, f, age, pos, speed, alpha, psize, g };
  }, [count]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uScale: { value: 1 },
      uVMax: { value: V_MAX },
      uOpacity: { value: dark ? 0.1 : 0.15 },
    },
  }), [dark]);

  useEffect(() => {
    material.uniforms.uScale.value = size.height * gl.getPixelRatio() * 0.9;
  }, [size, gl, material]);

  // respawn a particle in the inlet plane; `spread` scatters the first fill
  const spawn = (i, spread) => {
    const { p, f, age } = sim;
    p[i * 3] = SPAWN_X + (spread ? Math.random() * (KILL_X - SPAWN_X) : Math.random() * 0.3);
    p[i * 3 + 1] = (Math.random() * 2 - 1) * 0.95;
    p[i * 3 + 2] = 0.03 + Math.random() ** 1.4 * 1.05; // denser near the ground / car
    f[i * 3] = f[i * 3 + 1] = f[i * 3 + 2] = 0;
    age[i] = spread ? Math.random() * 0.5 : 0;
  };

  const initialised = useRef(false);

  useFrame((_, delta) => {
    if (!field || !started) return;
    const { p, f, age, pos, speed, alpha, psize, g } = sim;
    if (!initialised.current) {
      for (let i = 0; i < count; i++) spawn(i, true);
      initialised.current = true;
    }
    const dt = Math.min(delta, 1 / 30) * SLOWMO;
    const decay = Math.exp(-dt / TAU);
    const kick = Math.sqrt(1 - decay * decay);

    for (let i = 0; i < count; i++) {
      const o = i * 3;
      let x = p[o], y = p[o + 1], z = p[o + 2];
      if (!sample(field, x, y, z) || x > KILL_X) {
        spawn(i, false);
        x = p[o]; y = p[o + 1]; z = p[o + 2];
        if (!sample(field, x, y, z)) { alpha[i] = 0; continue; }
      }
      // Langevin update of the turbulent fluctuation, sigma = sqrt(2k/3)
      const sig = S.sk * 0.8165;
      const g1 = Math.random() + Math.random() + Math.random() - 1.5; // ~N(0, 0.5)
      const g2 = Math.random() + Math.random() + Math.random() - 1.5;
      const g3 = Math.random() + Math.random() + Math.random() - 1.5;
      f[o] = f[o] * decay + kick * sig * g1 * 2;
      f[o + 1] = f[o + 1] * decay + kick * sig * g2 * 2;
      f[o + 2] = f[o + 2] * decay + kick * sig * g3 * 2;

      x += (S.u + f[o]) * dt;
      y += (S.v + f[o + 1]) * dt;
      z += (S.w + f[o + 2]) * dt;
      if (z < 0.005) z = 0.005;
      p[o] = x; p[o + 1] = y; p[o + 2] = z;
      age[i] += dt;

      const spd = Math.hypot(S.u, S.v, S.w);
      speed[i] = spd;
      // fade in at the inlet, fade out near the outlet
      const fin = Math.min(age[i] / 0.01, 1);
      const fout = Math.min((KILL_X - x) / 1.5, 1);
      alpha[i] = Math.max(0, fin * fout) * (0.45 + 0.55 * Math.min(S.sk / 4, 1));
      // puffs swell where turbulence is high
      psize[i] = (0.16 + 0.34 * Math.min(S.sk / 5, 1)) * (0.6 + 0.4 * Math.min(age[i] / 0.06, 1));
      toThree(x, y, z, pos, o);
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.aSpeed.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
  });

  if (!field) return null;
  return <points geometry={sim.g} material={material} renderOrder={1} frustumCulled={false} />;
}

// ── Solid wheels ─────────────────────────────────────────────
// The wheel STLs are open on the side facing the car, so fill each wheel
// with a closed cylinder (Fluent coords: centre x/z, radius, y-span).
const WHEELS = [
  { x: 0.2027, z: 0.363, r: 0.355, y0: 0.62, y1: 1.0 },
  { x: 3.648, z: 0.344, r: 0.35, y0: 0.535, y1: 1.0 },
];

export function WheelFill({ color = '#0d0d0e' }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 }), [color]);
  return (
    <>
      {WHEELS.flatMap((wh, i) => [1, -1].map((s) => {
        const len = wh.y1 - wh.y0;
        const yc = s * (wh.y0 + wh.y1) / 2;
        return (
          // cylinder axis = three.js z (= Fluent -y)
          <mesh key={`${i}${s}`} position={[wh.x - CX, wh.z, -yc]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
            <cylinderGeometry args={[wh.r, wh.r, len, 48]} />
          </mesh>
        );
      }))}
    </>
  );
}

// ── Standalone section visual ────────────────────────────────
const MATERIALS = {
  body:   { color: '#EBE7DD', metalness: 0.35, roughness: 0.35 },
  floor:  { color: '#151517', metalness: 0.5,  roughness: 0.6  },
  wings:  { color: '#1c1c1f', metalness: 0.6,  roughness: 0.4  },
  wheels: { color: '#0d0d0e', metalness: 0.1,  roughness: 0.8  },
  susp:   { color: '#2a2a2d', metalness: 0.7,  roughness: 0.4  },
};

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

function F1CfdSmoke() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); ob.disconnect(); } }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <div className="w-full" ref={ref}>
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden rounded-sm cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [7.6, 3.4, 6.9], fov: 40 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.35} />
          <hemisphereLight args={['#dfe6ff', '#1a1a1a', 0.9]} />
          <directionalLight position={[4, 8, 5]} intensity={1.4} />
          <directionalLight position={[-6, 3, -4]} intensity={0.5} />
          <Suspense fallback={null}><Car /></Suspense>
          <WheelFill />
          <SmokeField started={inView} />
          <OrbitControls target={[1.3, 0.35, 0]} enableZoom={false} enablePan={false}
            autoRotate={inView} autoRotateSpeed={1.1}
            minPolarAngle={0.35} maxPolarAngle={Math.PI / 2 - 0.05} />
        </Canvas>
        <div className="pointer-events-none absolute right-3 bottom-3 text-right text-[10px] sm:text-xs uppercase tracking-[0.2em] text-text-muted">
          <p>Smoke advected through the Fluent velocity field</p>
          <p className="mt-1 normal-case tracking-normal opacity-70">turbulent dispersion from k (k-ω SST, RANS) · colour = speed</p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(CAR_URL);

export default F1CfdSmoke;
