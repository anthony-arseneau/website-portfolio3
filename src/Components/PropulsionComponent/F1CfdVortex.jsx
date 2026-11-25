import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildFlowMap, makeNoiseTexture } from './f1Volume';

// ─────────────────────────────────────────────────────────────
// F1 vortex structures — smoke that fills the regions of high Q-criterion,
// ray-marched on the GPU from public/f1/vortex.bin
// (built by tools/f1/build_vortex_volume.py from a Fluent export).
//
// The Q field marks where the vortices are; it is one snapshot, so in the
// car's frame those regions stay put. What moves is the smoke inside them.
// Its wisps are carried by the snapshot's own velocity field (see buildFlowMap
// in f1Volume.js): they race past the outside of the car, crawl through its
// wake and wind round the vortex cores, the way smoke in a wind tunnel pours
// through a standing vortex. The wisps also eat into the edges of the smoke, so
// its outline keeps changing. It is one colour, thin enough to see the car
// through, and shaded by how much smoke lies between each point and the light.
// What the car hides is decided by the car itself: each frame the scene's depth
// is drawn to a texture and every ray stops where it meets real bodywork.
//
// Exports
//   VortexIso({ weight, dark, iso })  the smoke; drop into an existing <Canvas>.
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
// It needs only f1Volume.js from the other F1 files.
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;
const CX = 1.55;            // Fluent x at the scene origin

export const VORTEX_DEFAULTS = {
  iso: 0.2,                 // Q level (encoded units, see build script) where smoke starts; lower = more smoke.
                            // 0.22 is Q of about 1500 1/s^2, tuned on the DES snapshot
  soft: 0.22,               // how far above iso the smoke reaches full strength (soft edges)
  density: 6,               // how thick the smoke is [per metre]
  speed: 9,                 // how fast the wisps move where the air is at free-stream speed [m/s]; slower air carries them slower
  grain: 0.5,               // wisp size: repeats of the noise block per metre across the flow (they are stretched along it)
  erode: 0.34,              // how far the wisps eat into the edges of the smoke (in the units of iso)
  lag: 0.45,                // how much of the real slow-down in the wake the wisps show (1 = all of it, but it smears them)
  // The data stops about 2.8 m behind the car. Past `tailFrom` metres before that end
  // the wake is carried on for `tail` metres (as far back as the streak lines go) by
  // replaying the last `tailWindow` metres of real wake back and forth, thinning to nothing.
  tailFrom: 0.5,
  tail: 4.65,
  tailWindow: 1.7,
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

// The build script zeroes Q in the two layers of cells next to every surface
// (the shear there would otherwise coat the whole car), and its wheel mask is a
// little larger than the tyres. Drawn as smoke, that leaves an empty shell of
// roughly 6 to 10 cm between the smoke and the bodywork, most obvious round the
// tyres. This carries the smoke that is already next to a surface across that
// shell, and a little way into the solid, so it reaches the car. Nothing is
// added where there was no smoke beside the surface.
const FILL_BAND = 3;     // cells from a solid cell that count as "next to the surface"
const FILL_STEPS = 5;    // cells the smoke is carried
const FILL_KEEP = 0.94;  // strength kept per cell carried

function fillToSurface(q, mask, nx, ny, nz) {
  const n = nx * ny * nz;
  const sx = 1, sy = nx, sz = nx * ny;
  const each = (fn) => {
    for (let k = 0, c = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++, c++) fn(c, i, j, k);
  };
  // band = solid cells and everything within FILL_BAND cells of one
  let band = new Uint8Array(n);
  for (let c = 0; c < n; c++) band[c] = mask[c * 4 + 3] > 127 ? 1 : 0;
  for (let step = 0; step < FILL_BAND; step++) {
    const next = band.slice();
    each((c, i, j, k) => {
      if (band[c]) return;
      if ((i > 0 && band[c - sx]) || (i < nx - 1 && band[c + sx]) || (j > 0 && band[c - sy]) || (j < ny - 1 && band[c + sy])
        || (k > 0 && band[c - sz]) || (k < nz - 1 && band[c + sz])) next[c] = 1;
    });
    band = next;
  }
  // carry the strongest neighbouring Q inwards, one cell per step
  let cur = new Uint8Array(n);
  for (let c = 0; c < n; c++) cur[c] = q[c * 2];
  for (let step = 0; step < FILL_STEPS; step++) {
    const next = cur.slice();
    each((c, i, j, k) => {
      if (!band[c]) return;
      let m = 0;
      if (i > 0) m = Math.max(m, cur[c - sx]);
      if (i < nx - 1) m = Math.max(m, cur[c + sx]);
      if (j > 0) m = Math.max(m, cur[c - sy]);
      if (j < ny - 1) m = Math.max(m, cur[c + sy]);
      if (k > 0) m = Math.max(m, cur[c - sz]);
      if (k < nz - 1) m = Math.max(m, cur[c + sz]);
      m = Math.floor(m * FILL_KEEP);
      if (m > cur[c]) next[c] = m;
    });
    cur = next;
  }
  for (let c = 0; c < n; c++) {
    q[c * 2] = cur[c];
    if (cur[c] > q[c * 2 + 1]) q[c * 2 + 1] = cur[c];   // keep the "smoke nearby" channel an upper bound
  }
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
  // The smoke does not use the car mask in vel.a to hide itself (the scene's
  // real depth does that; the mask left dotted holes around thin parts), only
  // for closing the gap described in fillToSurface.
  const velData = new Uint8Array(buf, 36, n * 4);
  const q = new Uint8Array(buf.slice(36 + n * 4, 36 + n * 6));
  fillToSurface(q, velData, nx, ny, nz);
  return {
    vel: mk(velData, THREE.RGBAFormat),
    q: mk(q, THREE.RGFormat),
    x0, x1, y1, z1, vscale, transient,
  };
}

// The volume is fetched once and shared: other scenes (slices, surface colouring)
// can call loadVortex() too and get the same textures.
//   vel : Data3DTexture RGBA8, rgb = Fluent (u, v, w) as (c * 2 - 1) * vscale [m/s], a = 1 inside the car
//   q   : Data3DTexture RG8,   r = Q (log-encoded), g = neighbourhood max of r. Next to
//         surfaces r has been filled in by fillToSurface (the file blanks it there).
//   x0, x1, y1, z1 : box in Fluent metres (y from 0, z from 0); texture coords of a point in
//                    model space p are ((p.x + 1.55 - x0) / (x1 - x0), abs(p.z) / y1, p.y / z1)
let vortexPromise = null;
export function loadVortex() {
  if (!vortexPromise) vortexPromise = fetchVortex().catch((e) => { vortexPromise = null; throw e; });
  return vortexPromise;
}

// Everything the smoke draws from: the volume, plus the flow map and the noise block
// its wisps are read from. Built once and kept, like the volume's own textures.
let smokePromise = null;
function loadSmoke() {
  if (!smokePromise) {
    smokePromise = loadVortex()
      .then(async (vol) => ({ vol, flow: await buildFlowMap(vol), noise: await makeNoiseTexture() }))
      .catch((e) => { smokePromise = null; throw e; });
  }
  return smokePromise;
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
  uniform sampler3D uQ;     // r = Q (log), g = neighbourhood max of r
  uniform sampler2D uDepth; // depth of the opaque scene (the car), same pixels as this pass
  uniform vec2 uRes;        // size of that depth texture in pixels
  uniform vec2 uNearFar;
  uniform vec3 uCamFwd;     // camera forward in this mesh's local space
  uniform vec4 uBox;        // x0, x1, y1, z1 (Fluent)
  uniform vec3 uBoxMin; uniform vec3 uBoxMax;
  uniform float uOpacity;
  uniform float uIso; uniform float uSoft; uniform float uDensity;
  uniform sampler3D uFlow;  // where the air at each point came from (see buildFlowMap)
  uniform sampler3D uNoise; // repeating block of soft noise, with mipmaps
  uniform float uScroll; uniform float uGrain; uniform float uErode; uniform float uLag;
  uniform vec3 uTail;       // tailFrom, tail, tailWindow [m]
  uniform vec3 uColor; uniform vec3 uRim;
  uniform vec3 uCamLocal;   // camera position in this mesh's local space
  in vec3 vLocal;
  out vec4 outColor;

  // metres past the point where the carried-on wake takes over (negative before it)
  float pastData(vec3 p) { return p.x + ${CX.toFixed(2)} - (uBox.y - uTail.x); }
  vec3 volCoord(vec3 p) {
    float x = p.x + ${CX.toFixed(2)};
    float d = pastData(p);
    if (d > 0.0) {                 // behind the data: bounce back and forth over its last stretch
      float m = mod(d, 2.0 * uTail.z);
      x = uBox.y - uTail.x - (m < uTail.z ? m : 2.0 * uTail.z - m);
    }
    return vec3((x - uBox.x) / (uBox.y - uBox.x), abs(p.z) / uBox.z, p.y / uBox.w);
  }
  float edgeFade(vec3 t, vec3 p) {
    return smoothstep(0.0, 0.04, t.x) * (1.0 - smoothstep(0.1, 1.0, pastData(p) / uTail.y))
         * smoothstep(1.0, 0.9, t.y) * smoothstep(1.0, 0.9, t.z);
  }
  // how much smoke the vortices hold at p, 0..1, before the grain
  float envelope(vec3 p, float iso) {
    vec3 t = volCoord(p);
    if (t.x < 0.0 || t.x > 1.0 || t.y > 1.0 || t.z < 0.0 || t.z > 1.0) return 0.0;
    return smoothstep(iso, iso + uSoft, texture(uQ, t).r) * edgeFade(t, p);
  }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  // Wisps carried by the flow, 0..1. uFlow says where the air now at p came into
  // the box and how far it lags the free stream; the noise is read there and slid
  // back with time, so it travels at the local air speed along the local direction.
  // Where the flow has strained the pattern too fine to draw, a blurrier copy is read.
  float wisps(vec3 p, vec3 tc) {
    vec4 m = texture(uFlow, tc);
    vec3 x = vec3((p.x + m.r * uLag - uScroll) * 0.4, p.y + m.b, sign(p.z) * (abs(p.z) + m.g)) * uGrain;
    float lod = log2(max(m.a * 0.3, 1.0));
    float n = 0.7 * textureLod(uNoise, x, lod).r + 0.3 * textureLod(uNoise, x * 2.3 + 0.37, lod + 1.0).r;
    return smoothstep(0.3, 0.7, n);
  }

  void main() {
    vec3 ro = uCamLocal;
    vec3 rd = normalize(vLocal - ro);
    vec3 inv = 1.0 / rd;
    vec3 a = (uBoxMin - ro) * inv, b = (uBoxMax - ro) * inv;
    vec3 mn = min(a, b), mx = max(a, b);
    float tn = max(max(mn.x, mn.y), max(mn.z, 0.0));
    float tf = min(min(mx.x, mx.y), mx.z);
    // stop at the bodywork: distance along this ray to whatever the scene drew here
    float depth = texture(uDepth, gl_FragCoord.xy / uRes).r;
    float viewDist = (uNearFar.x * uNearFar.y) / (uNearFar.y - depth * (uNearFar.y - uNearFar.x));
    float tScene = viewDist / max(dot(rd, uCamFwd), 1e-4);
    tf = min(tf, tScene);
    if (tf <= tn) discard;

    const int STEPS = 150;
    float dt = max((tf - tn) / float(STEPS), 0.03);
    float t = tn + dt * hash(gl_FragCoord.xy);

    // the smoke grows out of the vortex cores as the scene fades in
    float iso = mix(0.9, uIso, smoothstep(0.0, 1.0, uOpacity));

    vec3 L = normalize(vec3(0.35, 1.0, 0.45));
    vec3 col = vec3(0.0);
    float T = 1.0;

    for (int i = 0; i < STEPS; i++) {
      if (t > tf) break;
      vec3 p = ro + rd * t;
      vec3 tc = volCoord(p);
      vec2 qq = texture(uQ, tc).rg;
      if (qq.g + 0.5 * uErode >= iso) {          // smoke could be here: evaluate properly
        float n = wisps(p, tc);
        // the wisps push the edge of the smoke in and out as they pass
        float e = smoothstep(iso, iso + uSoft, qq.r + (n - 0.5) * uErode) * edgeFade(tc, p);
        if (e > 0.002) {
          // thin out just in front of a surface, so the smoke meets the car softly
          float d = e * mix(0.3, 1.0, n) * uDensity * smoothstep(0.0, 0.025, tScene - t);
          // two looks towards the light: smoke under more smoke is darker
          float shade = exp(-1.3 * envelope(p + L * 0.09, iso) - 1.3 * envelope(p + L * 0.24, iso));
          float al = 1.0 - exp(-d * dt);
          col += T * al * mix(uColor * 0.55, uRim, shade);
          T *= 1.0 - al;
          if (T < 0.03) break;
        }
      }
      t += dt;
    }

    float alpha = (1.0 - T) * smoothstep(0.0, 0.35, uOpacity);
    if (alpha < 0.004) discard;
    outColor = vec4(col / max(1.0 - T, 1e-4), alpha);
  }
`;

export function VortexIso({ weight, dark, iso = VORTEX_DEFAULTS.iso }) {
  const scroll = useRef(0);
  // follows the site theme unless told otherwise
  const isDark = dark ?? (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');
  const [smoke, setSmoke] = useState(null);
  useEffect(() => { let ok = true; loadSmoke().then((v) => ok && setSmoke(v)).catch(() => {}); return () => { ok = false; }; }, []);
  const ref = useRef();

  const built = useMemo(() => {
    if (!smoke) return null;
    const { vol } = smoke;
    const min = new THREE.Vector3(vol.x0 - CX, 0, -vol.y1);
    // the box runs on behind the data by the length of the carried-on wake
    const max = new THREE.Vector3(vol.x1 - CX - VORTEX_DEFAULTS.tailFrom + VORTEX_DEFAULTS.tail, vol.z1, vol.y1);
    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader, fragmentShader,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide,
      uniforms: {
        uQ: { value: vol.q },
        uDepth: { value: null }, uRes: { value: new THREE.Vector2(1, 1) },
        uNearFar: { value: new THREE.Vector2(0.1, 1000) }, uCamFwd: { value: new THREE.Vector3(0, 0, -1) },
        uBox: { value: new THREE.Vector4(vol.x0, vol.x1, vol.y1, vol.z1) },
        uBoxMin: { value: min }, uBoxMax: { value: max },
        uOpacity: { value: 0 },
        uIso: { value: iso }, uSoft: { value: VORTEX_DEFAULTS.soft }, uDensity: { value: VORTEX_DEFAULTS.density },
        uScroll: { value: 0 }, uGrain: { value: VORTEX_DEFAULTS.grain },
        uErode: { value: VORTEX_DEFAULTS.erode }, uLag: { value: VORTEX_DEFAULTS.lag },
        uFlow: { value: smoke.flow }, uNoise: { value: smoke.noise },
        uTail: { value: new THREE.Vector3(VORTEX_DEFAULTS.tailFrom, VORTEX_DEFAULTS.tail, VORTEX_DEFAULTS.tailWindow) },
        // one colour: cool lavender-grey, lighter where the smoke is lit. The light theme
        // gets a deeper shade so the smoke shows against the pale page.
        uCamLocal: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Vector3(...(isDark ? [0.66, 0.68, 0.9] : [0.42, 0.44, 0.6])) },
        uRim: { value: new THREE.Vector3(...(isDark ? [0.92, 0.94, 1.0] : [0.7, 0.72, 0.88])) },
      },
    });
    const size = max.clone().sub(min), centre = max.clone().add(min).multiplyScalar(0.5);
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z).translate(centre.x, centre.y, centre.z);
    return { material, geometry };
  }, [smoke, isDark, iso]);

  useEffect(() => () => { if (built) { built.material.dispose(); built.geometry.dispose(); } }, [built]);

  // rays are marched in local space, so the volume follows whatever group it is in
  const inv = useMemo(() => new THREE.Matrix4(), []);
  const onBeforeRender = (_r, _s, camera) => {
    if (!built || !ref.current) return;
    inv.copy(ref.current.matrixWorld).invert();
    built.material.uniforms.uCamLocal.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
    camera.getWorldDirection(built.material.uniforms.uCamFwd.value).transformDirection(inv);
    built.material.uniforms.uNearFar.value.set(camera.near, camera.far);
  };

  useFrame((_, dt) => {
    if (!built) return;
    const w = weight ? weight.current : 1;
    // the grain streams while the smoke is showing; it rewinds unseen in between,
    // so the offset never grows large enough to lose precision
    scroll.current = w > 0.004 ? scroll.current + Math.min(dt, 0.05) * VORTEX_DEFAULTS.speed : 0;
    built.material.uniforms.uScroll.value = scroll.current;
    built.material.uniforms.uOpacity.value = w;
    if (ref.current) ref.current.visible = w > 0.004;
  });

  if (!built) return null;
  return (
    <>
      <mesh ref={ref} geometry={built.geometry} material={built.material}
        onBeforeRender={onBeforeRender} frustumCulled={false} renderOrder={6} />
      <SceneDepth smoke={ref} material={built.material} />
    </>
  );
}

// Draws the scene's depth (without the smoke) into a texture each frame the
// smoke is showing. It is its own component so that it mounts, and therefore
// runs each frame, after whatever moves the car: the depth then matches the
// pose the smoke is about to be drawn in.
function SceneDepth({ smoke, material }) {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    t.depthTexture = new THREE.DepthTexture(1, 1);
    t.depthTexture.type = THREE.UnsignedIntType;
    t.depthTexture.minFilter = t.depthTexture.magFilter = THREE.NearestFilter;
    return t;
  }, []);
  useEffect(() => () => { target.depthTexture.dispose(); target.dispose(); }, [target]);

  const buffer = useMemo(() => new THREE.Vector2(), []);
  useFrame(({ scene, camera }) => {
    const mesh = smoke.current;
    if (!mesh || !mesh.visible) return;
    gl.getDrawingBufferSize(buffer);
    if (target.width !== buffer.x || target.height !== buffer.y) target.setSize(buffer.x, buffer.y);
    mesh.visible = false;
    gl.setRenderTarget(target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    mesh.visible = true;
    material.uniforms.uDepth.value = target.depthTexture;
    material.uniforms.uRes.value.copy(buffer);
  });
  return null;
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
