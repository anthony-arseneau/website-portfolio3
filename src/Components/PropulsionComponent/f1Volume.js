import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Shared helpers for the F1 viewer's velocity volume (public/f1/vortex.bin,
// loaded by loadVortex() in F1CfdVortex.jsx) and for the colour map every
// scene uses.
//
// The volume is a regular grid of the DES snapshot's velocity over half the
// car: node (i, j, k) sits at Fluent (x0 + i·h, j·h, k·h). In the viewer's
// model coordinates that is x = Fluent x − 1.55, |z| = Fluent y, y = Fluent z.
// ─────────────────────────────────────────────────────────────

const FLUENT_X_AT_ORIGIN = 1.55;
export const FREE_STREAM = 50;   // m/s, the CFD inlet speed

// Fluent-style rainbow: blue -> cyan -> green -> yellow -> red
export const RAINBOW_GLSL = /* glsl */ `
  vec3 rainbow(float s) {
    s = clamp(s, 0.0, 1.0);
    return clamp(vec3(
      1.5 - abs(4.0 * s - 3.0),
      1.5 - abs(4.0 * s - 2.0),
      1.5 - abs(4.0 * s - 1.0)
    ), 0.0, 1.0);
  }
`;

export function rainbow(s, out = [0, 0, 0]) {
  const c = Math.min(Math.max(s, 0), 1);
  for (let k = 0; k < 3; k++) out[k] = Math.min(Math.max(1.5 - Math.abs(4 * c - (3 - k)), 0), 1);
  return out;
}

// Size and placement of the grid, from what loadVortex() returns.
export function volumeGrid(vol) {
  const { width: nx, height: ny, depth: nz, data } = vol.vel.image;
  const h = (vol.x1 - vol.x0) / (nx - 1);
  return {
    nx, ny, nz, h, data,
    vscale: vol.vscale,
    xMin: vol.x0 - FLUENT_X_AT_ORIGIN,   // model-space box the grid covers
    xMax: vol.x1 - FLUENT_X_AT_ORIGIN,
    zMax: (ny - 1) * h,
    yMax: (nz - 1) * h,
  };
}

// ── On the GPU ───────────────────────────────────────────────
// velAt(p) is the texel at model point p: rgb = velocity, a = 1 inside the car.
export const VOLUME_GLSL = /* glsl */ `
  precision highp sampler3D;
  uniform sampler3D uVel;
  uniform vec3 uGrid;    // model x of the first node, node spacing [m], velocity scale [m/s]
  uniform vec3 uGridN;   // nodes along the car, across the half-car, and up
  vec4 velAt(vec3 p) {
    vec3 g = vec3(p.x - uGrid.x, abs(p.z), p.y) / uGrid.y;
    return texture(uVel, (g + 0.5) / uGridN);
  }
  float speedOf(vec4 v) { return length(v.rgb * 2.0 - 1.0) * uGrid.z; }
`;

// Fills the { value } holders a shader using VOLUME_GLSL was given.
export function setVolumeUniforms(uniforms, vol) {
  const g = volumeGrid(vol);
  uniforms.uVel.value = vol.vel;
  uniforms.uGrid.value.set(g.xMin, g.h, g.vscale);
  uniforms.uGridN.value.set(g.nx, g.ny, g.nz);
}

// ── On the CPU ───────────────────────────────────────────────
// Speed [m/s] at a model point, interpolated from the fluid nodes only. `out.fluid`
// is how much of the interpolation came from fluid (0 = wholly inside the car).
function sampleSpeed(g, x, y, z, out) {
  const fi = Math.min(Math.max((x - g.xMin) / g.h, 0), g.nx - 1.001);
  const fj = Math.min(Math.abs(z) / g.h, g.ny - 1.001);
  const fk = Math.min(Math.max(y / g.h, 0), g.nz - 1.001);
  const i = Math.floor(fi), j = Math.floor(fj), k = Math.floor(fk);
  const u = fi - i, v = fj - j, w = fk - k;
  let fluid = 0, vx = 0, vy = 0, vz = 0;
  for (let c = 0; c < 8; c++) {
    const di = c & 1, dj = (c >> 1) & 1, dk = c >> 2;
    const o = (((k + dk) * g.ny + (j + dj)) * g.nx + (i + di)) * 4;
    if (g.data[o + 3] > 127) continue;
    const wt = (di ? u : 1 - u) * (dj ? v : 1 - v) * (dk ? w : 1 - w);
    fluid += wt;
    vx += wt * g.data[o];
    vy += wt * g.data[o + 1];
    vz += wt * g.data[o + 2];
  }
  out.fluid = fluid;
  out.speed = fluid > 1e-4
    ? Math.hypot(vx / fluid / 127.5 - 1, vy / fluid / 127.5 - 1, vz / fluid / 127.5 - 1) * g.vscale
    : 0;
  return out;
}

// ── Surface pressure, estimated ──────────────────────────────
// No pressure field was exported, so this is not the solver's pressure. It is an
// estimate from Bernoulli: take the air speed a few centimetres off the surface and
// call the pressure coefficient Cp = 1 − (|V| / V∞)². It reads right where the flow
// is attached (stagnation at the nose and wing leading edges, suction where the air
// speeds up) and wrong in separated flow and wakes, where slow air shows as high
// pressure. The caption says "estimated" for that reason.
export const CP_RANGE = [-1.2, 1];                    // blue .. red
const CP_OFFSETS = [0.04, 0.06, 0.08, 0.11, 0.14];    // metres off the surface to try, nearest first
const CP_SMOOTH = 2;                                  // passes of averaging over neighbouring vertices

// Per-vertex Cp colours for a geometry in model coordinates (position, normal and an
// index are needed), as linear RGB ready to blend into a material's diffuse colour.
export function surfacePressureColours(geometry, vol) {
  const g = volumeGrid(vol);
  const pos = geometry.attributes.position;
  const nrm = geometry.attributes.normal;
  const n = pos.count;
  const cp = new Float32Array(n).fill(NaN);
  const a = {}, b = {};

  for (let v = 0; v < n; v++) {
    const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
    const nx = nrm.getX(v), ny = nrm.getY(v), nz = nrm.getZ(v);
    // The normal should point into the air. Where it points into the car instead
    // (inside-out faces), look the other way.
    const d0 = CP_OFFSETS[0];
    sampleSpeed(g, x + nx * d0, y + ny * d0, z + nz * d0, a);
    sampleSpeed(g, x - nx * d0, y - ny * d0, z - nz * d0, b);
    const side = a.fluid < 0.5 && b.fluid >= 0.5 ? -1 : 1;
    let { fluid, speed } = side > 0 ? a : b;
    for (let k = 1; k < CP_OFFSETS.length && fluid < 0.5; k++) {
      const d = side * CP_OFFSETS[k];
      sampleSpeed(g, x + nx * d, y + ny * d, z + nz * d, a);
      if (a.fluid > fluid) ({ fluid, speed } = a);
    }
    // vertices with no air within reach (inside the bodywork) are filled in below
    if (fluid >= 0.25) {
      const ratio = speed / FREE_STREAM;
      cp[v] = Math.min(Math.max(1 - ratio * ratio, CP_RANGE[0]), CP_RANGE[1]);
    }
  }

  // Average over neighbouring vertices: takes the grid's 2.8 cm steps out of the
  // picture and gives the vertices that found no air the value of those around them.
  const index = geometry.index;
  if (index) {
    const sum = new Float32Array(n);
    const count = new Uint16Array(n);
    for (let pass = 0; pass < CP_SMOOTH + 4; pass++) {
      sum.fill(0); count.fill(0);
      for (let t = 0; t < index.count; t += 3) {
        for (let e = 0; e < 3; e++) {
          const p = index.getX(t + e), q = index.getX(t + ((e + 1) % 3));
          if (!Number.isNaN(cp[q])) { sum[p] += cp[q]; count[p]++; }
          if (!Number.isNaN(cp[p])) { sum[q] += cp[p]; count[q]++; }
        }
      }
      // the first passes smooth; the rest only spread into what is still empty
      for (let v = 0; v < n; v++) {
        if (!count[v]) continue;
        if (Number.isNaN(cp[v])) cp[v] = sum[v] / count[v];
        else if (pass < CP_SMOOTH) cp[v] = 0.5 * cp[v] + 0.5 * (sum[v] / count[v]);
      }
    }
  }

  const colours = new Float32Array(n * 3);
  const rgb = [0, 0, 0];
  for (let v = 0; v < n; v++) {
    const value = Number.isNaN(cp[v]) ? 0 : cp[v];
    rainbow((value - CP_RANGE[0]) / (CP_RANGE[1] - CP_RANGE[0]), rgb);
    // the rainbow is defined as display (sRGB) colours; materials blend in linear
    for (let k = 0; k < 3; k++) colours[v * 3 + k] = Math.pow(rgb[k], 2.2);
  }
  return { colours, cp };
}

// The same estimate per pixel, for the wheels: they spin, so a colour stored on
// their vertices would turn with them, while the pressure pattern stays put.
// p and n are a point on the surface and its normal in model coordinates.
export const SURFACE_CP_GLSL = /* glsl */ `
  ${RAINBOW_GLSL}
  ${VOLUME_GLSL}
  vec3 surfaceCpColour(vec3 p, vec3 n) {
    if (velAt(p + n * 0.04).a > 0.5 && velAt(p - n * 0.04).a < 0.5) n = -n;
    vec4 v = velAt(p + n * 0.04);
    for (int i = 1; i < 4; i++) {
      if (v.a < 0.5) break;
      v = velAt(p + n * (0.04 + 0.03 * float(i)));
    }
    float ratio = speedOf(v) / ${FREE_STREAM.toFixed(1)};
    float cp = clamp(1.0 - ratio * ratio, ${CP_RANGE[0].toFixed(2)}, ${CP_RANGE[1].toFixed(2)});
    return pow(rainbow((cp - ${CP_RANGE[0].toFixed(2)}) / ${(CP_RANGE[1] - CP_RANGE[0]).toFixed(2)}), vec3(2.2));
  }
`;

// ── Flow map, for smoke that moves with the air ──────────────
// For the air now at each grid node this works out where it came into the box
// and how long it took to get here, by following the velocity field back
// upstream one plane of nodes at a time. A pattern drawn in those coordinates
// and slid along in time moves exactly as that (steady) flow would carry it:
// fast outside the car, slowly in its wake, and winding round the vortices.
// Stored per node, relative to the node itself so it stays small:
//   r  lag: metres the air is behind where the free stream would have put it
//   g  sideways, b upwards: metres from here to where it entered (half-car frame)
//   a  stretch: how much the flow has strained the pattern here (1 = not at all)
// Both builders below take tens of milliseconds, and run while the car is already
// moving. They are async and hand the page back every few milliseconds, so the
// animation does not stall while they work.
function makeBreather(budgetMs = 5) {
  let last = performance.now();
  return () => {
    if (performance.now() - last < budgetMs) return null;
    return new Promise((resolve) => { setTimeout(() => { last = performance.now(); resolve(); }, 0); });
  };
}

const FLOW_MIN_SPEED = 10;   // m/s: slowest the air is taken to move downstream (reverse flow has no upstream)
const FLOW_MAX_SHIFT = 2;    // nodes sideways per plane, at most

export async function buildFlowMap(vol) {
  const g = volumeGrid(vol);
  const { nx, ny, nz, h, data, vscale } = g;
  const plane = ny * nz;
  const n = nx * plane;
  const breathe = makeBreather();
  const lag = new Float32Array(n);
  const side = new Float32Array(n);
  const up = new Float32Array(n);
  // values on the plane upstream of the one being worked out
  let pT = new Float32Array(plane), pA = new Float32Array(plane), pB = new Float32Array(plane);
  let cT = new Float32Array(plane), cA = new Float32Array(plane), cB = new Float32Array(plane);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) { pA[k * ny + j] = j * h; pB[k * ny + j] = k * h; }

  for (let i = 1; i < nx; i++) {
    await breathe();
    for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
        const c = (k * ny + j) * nx + i;
        const ux = Math.max((data[c * 4] / 127.5 - 1) * vscale, FLOW_MIN_SPEED);
        const steps = 1 / ux;   // seconds per metre downstream
        const sj = Math.min(Math.max((data[c * 4 + 1] / 127.5 - 1) * vscale * steps, -FLOW_MAX_SHIFT), FLOW_MAX_SHIFT);
        const sk = Math.min(Math.max((data[c * 4 + 2] / 127.5 - 1) * vscale * steps, -FLOW_MAX_SHIFT), FLOW_MAX_SHIFT);
        // where this air was on the plane before (mirrored at the centreline, held at the ground and the edges)
        const fj = Math.min(Math.abs(j - sj), ny - 1.001);
        const fk = Math.min(Math.max(k - sk, 0), nz - 1.001);
        const j0 = Math.floor(fj), k0 = Math.floor(fk);
        const u = fj - j0, v = fk - k0;
        const o = k0 * ny + j0;
        const w00 = (1 - u) * (1 - v), w10 = u * (1 - v), w01 = (1 - u) * v, w11 = u * v;
        const q = k * ny + j;
        cT[q] = w00 * pT[o] + w10 * pT[o + 1] + w01 * pT[o + ny] + w11 * pT[o + ny + 1] + h * steps;
        cA[q] = w00 * pA[o] + w10 * pA[o + 1] + w01 * pA[o + ny] + w11 * pA[o + ny + 1];
        cB[q] = w00 * pB[o] + w10 * pB[o + 1] + w01 * pB[o + ny] + w11 * pB[o + ny + 1];
        lag[c] = FREE_STREAM * cT[q] - i * h;
        side[c] = cA[q] - j * h;
        up[c] = cB[q] - k * h;
      }
    }
    [pT, cT] = [cT, pT]; [pA, cA] = [cA, pA]; [pB, cB] = [cB, pB];
  }

  // strain: how fast the pattern's coordinates change from node to node, against 1 for undisturbed air
  const out = new Uint16Array(n * 4);
  const half = THREE.DataUtils.toHalfFloat;
  const strides = [1, nx, nx * ny];
  const sizes = [nx, ny, nz];
  for (let k = 0, c = 0; k < nz; k++) {
    await breathe();
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++, c++) {
        const at = [i, j, k];
        let sum = 0;
        for (let axis = 0; axis < 3; axis++) {
          const lo = at[axis] > 0 ? c - strides[axis] : c;
          const hi = at[axis] < sizes[axis] - 1 ? c + strides[axis] : c;
          const span = ((hi - lo) / strides[axis]) * h;
          const dx = (lag[hi] - lag[lo]) / span + (axis === 0 ? 1 : 0);
          const dy = (side[hi] - side[lo]) / span + (axis === 1 ? 1 : 0);
          const dz = (up[hi] - up[lo]) / span + (axis === 2 ? 1 : 0);
          sum += dx * dx + dy * dy + dz * dz;
        }
        out[c * 4] = half(lag[c]);
        out[c * 4 + 1] = half(side[c]);
        out[c * 4 + 2] = half(up[c]);
        out[c * 4 + 3] = half(Math.min(Math.sqrt(sum / 3), 64));
      }
    }
  }
  const texture = new THREE.Data3DTexture(out, nx, ny, nz);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.HalfFloatType;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

// A block of soft noise that repeats seamlessly in every direction, with
// mipmaps, so a shader can read wisps from it with one lookup and ask for a
// blurrier copy where the flow has strained the pattern too fine to draw.
export async function makeNoiseTexture(size = 64) {
  let seed = 12345;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const octaves = [[8, 0.5], [16, 0.32], [32, 0.18]].map(([period, weight]) => {
    const lattice = new Float32Array(period * period * period);
    for (let c = 0; c < lattice.length; c++) lattice[c] = random();
    return { period, weight, lattice };
  });
  const value = new Float32Array(size * size * size);
  let min = Infinity, max = -Infinity;
  const breathe = makeBreather();
  for (let z = 0, c = 0; z < size; z++) {
    await breathe();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++, c++) {
        let sum = 0;
        for (const { period, weight, lattice } of octaves) {
          const s = period / size;
          const fx = x * s, fy = y * s, fz = z * s;
          const x0 = Math.floor(fx), y0 = Math.floor(fy), z0 = Math.floor(fz);
          const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period, z1 = (z0 + 1) % period;
          let u = fx - x0, v = fy - y0, w = fz - z0;
          u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
          const at = (a, b, d) => lattice[(d * period + b) * period + a];
          sum += weight * (
            (1 - w) * ((1 - v) * ((1 - u) * at(x0, y0, z0) + u * at(x1, y0, z0)) + v * ((1 - u) * at(x0, y1, z0) + u * at(x1, y1, z0)))
            + w * ((1 - v) * ((1 - u) * at(x0, y0, z1) + u * at(x1, y0, z1)) + v * ((1 - u) * at(x0, y1, z1) + u * at(x1, y1, z1))));
        }
        value[c] = sum;
        min = Math.min(min, sum); max = Math.max(max, sum);
      }
    }
  }
  const bytes = new Uint8Array(value.length);
  for (let c = 0; c < value.length; c++) bytes[c] = Math.round(((value[c] - min) / (max - min)) * 255);
  const texture = new THREE.Data3DTexture(bytes, size, size, size);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
