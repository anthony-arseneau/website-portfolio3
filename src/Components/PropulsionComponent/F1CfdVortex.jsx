import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// F1 vortex structures — translucent iso-surface of the Q-criterion,
// ray-marched on the GPU from public/f1/vortex.bin
// (built by tools/f1/build_vortex_volume.py from a Fluent export).
//
// The shells are lit from their own gradient normals and stacked
// front-to-back, so overlapping eddies read as one translucent cloud.
// Motion: the field is flow-mapped along the local Fluent velocity
// (two phase-shifted lookups blended), so every structure slides
// downstream at the speed the air has at that point.
//
// Exports
//   VortexIso({ weight, dark, iso })  drop into an existing <Canvas>.
//        weight: optional ref whose .current is 0..1 (reveal / cross-fade).
//        It lives in the car's model coordinates (the same frame as car.glb
//        and pathlines.bin) and ray-marches in its own local space, so it can
//        sit inside any moving / yawing group, e.g. next to the streak-line
//        mesh in F1CfdSimulation's Rig, and it follows the car.
//   loadVortex()  the shared volume textures (velocity, Q, solid mask).
//   useFlowCycle(active)  timeline for showing the smoke and the streak lines
//        one after the other: smoke -> nothing -> lines -> nothing -> repeat.
//        Returns refs: smoke (0..1), lines (0..1) and linesTime (seconds since
//        the lines came on, -1 while they are off).
//        tools/f1/vortex-cycle.patch wires it into F1CfdSimulation.jsx.
//   default  standalone viewer (static car + vortices), for testing.
//
// This file is self-contained on purpose: it imports nothing from the
// other F1 components, so it can be merged without touching them.
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;
const CX = 1.55;            // Fluent x at the scene origin

export const VORTEX_DEFAULTS = {
  iso: 0.22,                // iso level in encoded units (see build script); lower = more structures.
                            // 0.22 is Q of about 1500 1/s^2, tuned on the DES snapshot
  advect: 0.006,            // seconds of flow each structure slides per cycle
  cycle: 0.55,              // flow-map cycles per second
};

// Seconds. The gap is the moment with neither smoke nor lines on screen.
export const CYCLE = { smokeIn: 1.2, smokeHold: 6.5, fadeOut: 0.6, gap: 0.7, linesHold: 8.5 };

export function useFlowCycle(active = true, timing = CYCLE) {
  const state = useMemo(() => ({ smoke: { current: 0 }, lines: { current: 0 }, linesTime: { current: -1 }, t: 0 }), []);
  useFrame((_, rawDt) => {
    if (!active) return;
    const { smokeIn, smokeHold, fadeOut, gap, linesHold } = timing;
    const smokeEnd = smokeIn + smokeHold;          // smoke starts to fade
    const linesStart = smokeEnd + fadeOut + gap;   // lines start to draw
    const linesEnd = linesStart + linesHold;       // lines start to fade
    const total = linesEnd + fadeOut + gap;
    state.t = (state.t + Math.min(rawDt, 0.05)) % total;
    const t = state.t;
    const ease = (x) => { const c = Math.min(Math.max(x, 0), 1); return c * c * (3 - 2 * c); };
    state.smoke.current = t < smokeEnd ? ease(t / smokeIn) : 1 - ease((t - smokeEnd) / fadeOut);
    const linesOn = t >= linesStart && t < linesEnd + fadeOut;
    state.linesTime.current = linesOn ? t - linesStart : -1;
    state.lines.current = linesOn ? 1 - ease((t - linesEnd) / fadeOut) : 0;
  });
  return state;
}

async function fetchVortex() {
  const buf = await (await fetch(`${BASE}f1/vortex.bin`)).arrayBuffer();
  const dv = new DataView(buf);
  const nx = dv.getUint32(0, true), ny = dv.getUint32(4, true), nz = dv.getUint32(8, true);
  const [x0, x1, y1, z1, vscale] = [12, 16, 20, 24, 28].map((o) => dv.getFloat32(o, true));
  const transient = dv.getUint32(32, true) === 1;
  const n = nx * ny * nz;
  const mk = (data, format) => {
    const t = new THREE.Data3DTexture(data, nx, ny, nz);
    t.format = format; t.type = THREE.UnsignedByteType;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.unpackAlignment = 1; t.needsUpdate = true;
    return t;
  };
  return {
    vel: mk(new Uint8Array(buf, 36, n * 4), THREE.RGBAFormat),
    q: mk(new Uint8Array(buf, 36 + n * 4, n * 2), THREE.RGFormat),
    x0, x1, y1, z1, vscale, transient,
  };
}

// The volume is fetched once and shared: other scenes (slices, surface colouring)
// can call loadVortex() too and get the same textures.
//   vel : Data3DTexture RGBA8, rgb = Fluent (u, v, w) as (c * 2 - 1) * vscale [m/s], a = 1 inside the car
//   q   : Data3DTexture RG8,   r = Q (log-encoded), g = neighbourhood max of r
//   x0, x1, y1, z1 : box in Fluent metres (y from 0, z from 0); texture coords of a point in
//                    model space p are ((p.x + 1.55 - x0) / (x1 - x0), abs(p.z) / y1, p.y / z1)
let vortexPromise = null;
export function loadVortex() {
  if (!vortexPromise) vortexPromise = fetchVortex().catch((e) => { vortexPromise = null; throw e; });
  return vortexPromise;
}

const vertexShader = /* glsl */ `
  out vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  precision highp sampler3D;
  uniform sampler3D uVel;   // rgb = velocity, a = solid
  uniform sampler3D uQ;     // r = Q (log), g = neighbourhood max of r
  uniform vec4 uBox;        // x0, x1, y1, z1 (Fluent)
  uniform vec3 uBoxMin; uniform vec3 uBoxMax;
  uniform float uVScale; uniform float uTime; uniform float uOpacity;
  uniform float uIso; uniform float uAdvect; uniform float uCycle;
  uniform vec3 uColor; uniform vec3 uRim;
  uniform vec3 uCamLocal;   // camera position in this mesh's local space
  in vec3 vLocal;
  out vec4 outColor;

  vec3 volCoord(vec3 p) {
    return vec3((p.x + ${CX.toFixed(2)} - uBox.x) / (uBox.y - uBox.x), abs(p.z) / uBox.z, p.y / uBox.w);
  }
  float edgeFade(vec3 t) {
    return smoothstep(0.0, 0.04, t.x) * smoothstep(1.0, 0.86, t.x)
         * smoothstep(1.0, 0.9, t.y) * smoothstep(1.0, 0.9, t.z);
  }
  float qAt(vec3 p) {
    vec3 t = volCoord(p);
    if (t.x < 0.0 || t.x > 1.0 || t.y > 1.0 || t.z < 0.0 || t.z > 1.0) return 0.0;
    return texture(uQ, t).r * edgeFade(t);
  }
  // flow-mapped field: two lookups displaced along the local velocity
  float field(vec3 p, vec3 v, vec2 ph, float w) {
    return mix(qAt(p - v * ph.x), qAt(p - v * ph.y), w);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec3 ro = uCamLocal;
    vec3 rd = normalize(vLocal - ro);
    vec3 inv = 1.0 / rd;
    vec3 a = (uBoxMin - ro) * inv, b = (uBoxMax - ro) * inv;
    vec3 mn = min(a, b), mx = max(a, b);
    float tn = max(max(mn.x, mn.y), max(mn.z, 0.0));
    float tf = min(min(mx.x, mx.y), mx.z);
    if (tf <= tn) discard;

    const int STEPS = 150;
    float dt = max((tf - tn) / float(STEPS), 0.026);
    float t = tn + dt * hash(gl_FragCoord.xy);

    // flow-map phases (centred, so the time-average position is the true one)
    float c = uTime * uCycle;
    float p1 = fract(c), p2 = fract(c + 0.5);
    vec2 ph = (vec2(p1, p2) - 0.5) * uAdvect;
    float w = abs(2.0 * p1 - 1.0);

    // structures grow out of nothing as the scene fades in
    float iso = mix(0.95, uIso, smoothstep(0.0, 1.0, uOpacity));

    vec3 L = normalize(vec3(0.35, 1.0, 0.45));
    vec3 col = vec3(0.0);
    float T = 1.0;
    float prevF = 0.0, prevT = t;
    vec3 prevV = vec3(0.0);
    int hits = 0;

    for (int i = 0; i < STEPS; i++) {
      if (t > tf) break;
      vec3 p = ro + rd * t;
      vec3 tc = volCoord(p);
      vec2 qq = texture(uQ, tc).rg;
      float f = 0.0;
      vec3 v = vec3(0.0);
      if (qq.g >= iso) {                       // something could be here: evaluate properly
        vec4 vs = texture(uVel, tc);
        if (vs.a > 0.5) break;                 // the car hides what is behind it
        vec3 vf = (vs.rgb * 2.0 - 1.0) * uVScale;
        v = vec3(vf.x, vf.z, vf.y * sign(p.z));
        f = field(p, v, ph, w);
      } else if (texture(uVel, tc).a > 0.5) break;

      if ((prevF - iso) * (f - iso) < 0.0) {   // crossed the iso-surface
        float s = (iso - prevF) / (f - prevF);
        vec3 hp = ro + rd * mix(prevT, t, s);
        vec3 hv = mix(prevV, v, s);
        const float e = 0.022;
        vec3 n = vec3(
          field(hp + vec3(e, 0, 0), hv, ph, w) - field(hp - vec3(e, 0, 0), hv, ph, w),
          field(hp + vec3(0, e, 0), hv, ph, w) - field(hp - vec3(0, e, 0), hv, ph, w),
          field(hp + vec3(0, 0, e), hv, ph, w) - field(hp - vec3(0, 0, e), hv, ph, w));
        n = normalize(n + 1e-5);
        if (dot(n, rd) > 0.0) n = -n;          // face the viewer
        float ndv = max(dot(n, -rd), 0.0);
        float fres = pow(1.0 - ndv, 2.2);
        float diff = 0.55 + 0.45 * max(dot(n, L), 0.0);
        float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 24.0) * 0.15;
        vec3 shell = mix(uColor * diff, uRim, fres * 0.38) + spec;
        float al = mix(0.25, 0.66, fres);
        col += T * al * shell;
        T *= 1.0 - al;
        if (++hits >= 6 || T < 0.04) break;
      }
      if (f > iso) {                            // faint haze inside the eddies
        float h = 1.0 - exp(-(f - iso) * 9.0 * dt);
        col += T * h * uColor * 0.85;
        T *= 1.0 - h;
      }
      prevF = f; prevT = t; prevV = v;
      t += dt;
    }

    float alpha = (1.0 - T) * smoothstep(0.0, 0.35, uOpacity);
    if (alpha < 0.004) discard;
    outColor = vec4(col / max(1.0 - T, 1e-4), alpha);
  }
`;

export function VortexIso({ weight, dark, iso = VORTEX_DEFAULTS.iso }) {
  // follows the site theme unless told otherwise
  const isDark = dark ?? (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');
  const [vol, setVol] = useState(null);
  useEffect(() => { let ok = true; loadVortex().then((v) => ok && setVol(v)); return () => { ok = false; }; }, []);
  const ref = useRef();

  const built = useMemo(() => {
    if (!vol) return null;
    const min = new THREE.Vector3(vol.x0 - CX, 0, -vol.y1);
    const max = new THREE.Vector3(vol.x1 - CX, vol.z1, vol.y1);
    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader, fragmentShader,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide,
      uniforms: {
        uVel: { value: vol.vel }, uQ: { value: vol.q },
        uBox: { value: new THREE.Vector4(vol.x0, vol.x1, vol.y1, vol.z1) },
        uBoxMin: { value: min }, uBoxMax: { value: max },
        uVScale: { value: vol.vscale }, uTime: { value: 0 }, uOpacity: { value: 0 },
        uIso: { value: iso }, uAdvect: { value: VORTEX_DEFAULTS.advect }, uCycle: { value: VORTEX_DEFAULTS.cycle },
        // one colour: cool lavender-grey, lighter rim where a shell turns edge-on
        uCamLocal: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Vector3(...(isDark ? [0.66, 0.68, 0.9] : [0.63, 0.65, 0.84])) },
        uRim: { value: new THREE.Vector3(...(isDark ? [0.92, 0.94, 1.0] : [0.86, 0.87, 0.97])) },
      },
    });
    const size = max.clone().sub(min), centre = max.clone().add(min).multiplyScalar(0.5);
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z).translate(centre.x, centre.y, centre.z);
    return { material, geometry };
  }, [vol, isDark, iso]);

  useEffect(() => () => { if (built) { built.material.dispose(); built.geometry.dispose(); } }, [built]);

  // rays are marched in local space, so the volume follows whatever group it is in
  const inv = useMemo(() => new THREE.Matrix4(), []);
  const onBeforeRender = (_r, _s, camera) => {
    if (!built || !ref.current) return;
    inv.copy(ref.current.matrixWorld).invert();
    built.material.uniforms.uCamLocal.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
  };

  useFrame((_, dt) => {
    if (!built) return;
    const w = weight ? weight.current : 1;
    built.material.uniforms.uTime.value += dt;
    built.material.uniforms.uOpacity.value = w;
    if (ref.current) ref.current.visible = w > 0.004;
  });

  if (!built) return null;
  return (
    <mesh ref={ref} geometry={built.geometry} material={built.material}
      onBeforeRender={onBeforeRender} frustumCulled={false} renderOrder={6} />
  );
}

// ── Standalone viewer (testing) ──────────────────────────────
const CAR_URL = `${BASE}f1/car.glb`;

function PlainCar() {
  const { scene } = useGLTF(CAR_URL);
  const car = useMemo(() => {
    const root = scene.clone(true);
    // matte clay, like a CFD render
    const mat = new THREE.MeshStandardMaterial({ color: '#b4b4b0', roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide });
    root.traverse((o) => { if (o.isMesh) { o.geometry.computeVertexNormals(); o.material = mat; } });
    return root;
  }, [scene]);
  return <primitive object={car} />;
}

function F1CfdVortex() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const weight = useRef(0);
  const dark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); ob.disconnect(); } }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  function Fade() {
    useFrame((_, dt) => { weight.current += ((inView ? 1 : 0) - weight.current) * Math.min(1, dt * 1.2); });
    return null;
  }

  return (
    <div className="w-full" ref={ref}>
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden rounded-sm cursor-grab active:cursor-grabbing">
        {/* dpr capped: the ray-marcher is fill-rate bound */}
        <Canvas dpr={[1, 1.5]} camera={{ position: [-5.2, 2.6, 5.6], fov: 40 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.5} />
          <hemisphereLight args={['#ffffff', '#3a3a40', 0.9]} />
          <directionalLight position={[3, 8, 4]} intensity={1.3} />
          <Suspense fallback={null}><PlainCar /></Suspense>
          <VortexIso weight={weight} dark={dark} />
          <Fade />
          <OrbitControls target={[1.0, 0.4, 0]} enableZoom={false} enablePan={false}
            autoRotate={inView} autoRotateSpeed={0.8} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2 - 0.05} />
        </Canvas>
        <div className="pointer-events-none absolute right-3 bottom-3 text-right text-[10px] sm:text-xs uppercase tracking-[0.2em] text-text-muted">
          <p className="text-text-primary">Vortex structures</p>
          <p className="mt-0.5 normal-case tracking-normal">Iso-surface of Q-criterion</p>
          <p className="mt-2 normal-case tracking-normal opacity-70">Ansys Fluent · geometry: Flexcompute F1_2025</p>
        </div>
      </div>
    </div>
  );
}

export default F1CfdVortex;
