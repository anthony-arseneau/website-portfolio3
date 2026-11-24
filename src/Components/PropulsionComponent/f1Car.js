import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Turns the single static car mesh set into a car that can move:
// the body parts go in one group (so it can ride on its suspension)
// and the one 'wheels' mesh is cut into four wheels, each re-centred
// on its hub and squared up to its real spin axis.
// ─────────────────────────────────────────────────────────────

// Livery: the whole car is one white-grey, tyres included. The floor and
// suspension are a shade deeper so the shapes still separate under the light.
const MATERIALS = {
  body:   { color: '#E6E6E3', metalness: 0.3,  roughness: 0.34 },
  wings:  { color: '#E2E2DF', metalness: 0.3,  roughness: 0.36 },
  floor:  { color: '#CDCDCA', metalness: 0.35, roughness: 0.5  },
  susp:   { color: '#D2D2CF', metalness: 0.45, roughness: 0.42 },
  wheels: { color: '#E2E2DF', metalness: 0.1,  roughness: 0.7  },
};

// Solve a 3x3 linear system (Cramer's rule). Returns null if singular.
function solve3(m, r) {
  const det = (a) =>
    a[0] * (a[4] * a[8] - a[5] * a[7]) -
    a[1] * (a[3] * a[8] - a[5] * a[6]) +
    a[2] * (a[3] * a[7] - a[4] * a[6]);
  const d = det(m);
  if (Math.abs(d) < 1e-12) return null;
  const col = (k) => m.map((v, i) => (i % 3 === k ? r[(i / 3) | 0] : v));
  return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}

// Finds a wheel's hub centre, spin axis and radius from its vertices, and
// rewrites `pts` (xyz triples) into hub-centred coordinates whose z axis is
// the spin axis. The wheels are cambered, so spinning them about the car's
// own z axis would make them wobble.
export function fitWheel(pts) {
  const n = pts.length / 3;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pts.length; i++) {
    min[i % 3] = Math.min(min[i % 3], pts[i]);
    max[i % 3] = Math.max(max[i % 3], pts[i]);
  }
  const c0 = new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
  const outer = c0.z > 0 ? 1 : -1;
  const zOut = outer > 0 ? max[2] : min[2];

  // 1. Spin axis = normal of the flat outer wheel cover (least-squares plane).
  let sxx = 0, sxy = 0, syy = 0, sx = 0, sy = 0, sn = 0, sxz = 0, syz = 0, sz = 0;
  for (let i = 0; i < n; i++) {
    const x = pts[i * 3] - c0.x, y = pts[i * 3 + 1] - c0.y, z = pts[i * 3 + 2];
    if ((zOut - z) * outer > 0.05 || Math.hypot(x, y) > 0.26) continue;
    sxx += x * x; sxy += x * y; syy += y * y; sx += x; sy += y; sn++;
    sxz += x * z; syz += y * z; sz += z;
  }
  const plane = solve3([sxx, sxy, sx, sxy, syy, sy, sx, sy, sn], [sxz, syz, sz]);
  const axis = plane ? new THREE.Vector3(-plane[0], -plane[1], 1).normalize() : new THREE.Vector3(0, 0, 1);
  const align = new THREE.Quaternion().setFromUnitVectors(axis, new THREE.Vector3(0, 0, 1));

  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.set(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]).sub(c0).applyQuaternion(align);
    pts[i * 3] = v.x; pts[i * 3 + 1] = v.y; pts[i * 3 + 2] = v.z;
  }

  // 2. Hub centre and radius = circle through the tread. The CFD mesh has a
  //    contact-patch pad under each tyre, so points off the circle are dropped
  //    and the fit repeated.
  let cx = 0, cy = 0, radius = (max[0] - min[0]) / 2;
  for (let pass = 0; pass < 3; pass++) {
    let a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, k = 0;
    for (let i = 0; i < n; i++) {
      const x = pts[i * 3], y = pts[i * 3 + 1];
      const rr = Math.hypot(x - cx, y - cy);
      if (rr < radius * 0.94 || (pass > 0 && Math.abs(rr - radius) > 0.004)) continue;
      const q = x * x + y * y;
      a += x * x; b += x * y; c += x; d += y * y; e += y; f++;
      g -= x * q; h -= y * q; k -= q;
    }
    const fit = solve3([a, b, c, b, d, e, c, e, f], [g, h, k]);
    if (!fit) break;
    cx = -fit[0] / 2; cy = -fit[1] / 2;
    radius = Math.sqrt(Math.max(cx * cx + cy * cy - fit[2], 1e-6));
  }

  // The fit above averages in the rounded shoulders, so take the true tyre
  // radius from the top half, where there is no pad.
  let zMin = Infinity, zMax = -Infinity, top = 0;
  for (let i = 0; i < n; i++) {
    zMin = Math.min(zMin, pts[i * 3 + 2]); zMax = Math.max(zMax, pts[i * 3 + 2]);
    if (pts[i * 3 + 1] > cy) top = Math.max(top, Math.hypot(pts[i * 3] - cx, pts[i * 3 + 1] - cy));
  }
  if (top > 0) radius = top;
  const cz = (zMin + zMax) / 2;

  for (let i = 0; i < n; i++) {
    let x = pts[i * 3] - cx, y = pts[i * 3 + 1] - cy;
    const rr = Math.hypot(x, y);
    // shave the contact-patch pad back onto the tyre so it does not orbit
    if (rr > radius + 0.0005) { x *= radius / rr; y *= radius / rr; }
    pts[i * 3] = x; pts[i * 3 + 1] = y; pts[i * 3 + 2] -= cz;
  }

  const tilt = align.clone().invert();
  const centre = new THREE.Vector3(cx, cy, cz).applyQuaternion(tilt).add(c0);
  return { centre, tilt, radius };
}

// Paint applied in the wheel's own (spinning) frame. A plain tyre looks
// identical at every angle, so nothing would show it turning: the rim gets
// swept blades with one dark blade, the sidewall a broken grey stripe and the
// tread a few grey scuffs, all on the same white-grey as the body.
// At 180 km/h a wheel turns about a third of a revolution per frame, far too
// much to draw as sharp marks (they would strobe and seem to crawl backwards),
// so the paint is averaged over the arc the wheel sweeps during the frame:
// real motion blur. uWheelBlur is that arc, in turns.
const WHEEL_PAINT = /* glsl */ `
  uniform float uWheelBlur;
  float wheelMark(float a, float head, float len) {
    float u = fract(head - a);
    return u < len ? pow(1.0 - u / len, 0.7) * smoothstep(0.0, 0.012, u) : 0.0;
  }
  vec3 wheelPaint(vec3 p, vec3 base) {
    float r = length(p.xy);
    float a0 = atan(p.y, p.x) / 6.2831853 + 0.5;
    vec3 paint = vec3(0.78, 0.78, 0.76);   // the body's white-grey

    float blade = 0.0, accent = 0.0, wall = 0.0, tread = 0.0;
    const int TAPS = 24;
    for (int i = 0; i < TAPS; i++) {
      float a = a0 + uWheelBlur * (float(i) + 0.5) / float(TAPS);
      float sweep = a * 5.0 + r * 1.6;
      float f = fract(sweep);
      float b = pow(f, 2.2) * (1.0 - smoothstep(0.96, 1.0, f));
      blade += b;
      accent += b * step(4.0, mod(floor(sweep), 5.0));
      wall += max(max(wheelMark(a, 0.02, 0.27), wheelMark(a, 0.40, 0.15)), wheelMark(a, 0.71, 0.24));
      tread += max(max(wheelMark(a, 0.12, 0.10), wheelMark(a, 0.47, 0.18)),
                   max(wheelMark(a, 0.66, 0.07), wheelMark(a, 0.93, 0.14)));
    }
    blade /= float(TAPS); accent /= float(TAPS); wall /= float(TAPS); tread /= float(TAPS);

    vec3 col = base;
    if (r < 0.236) {
      col = mix(paint * 0.62, paint, blade);
      col = mix(col, vec3(0.12), accent * 0.9);
      col = mix(col, paint * 0.5, smoothstep(0.216, 0.222, r));
      col = mix(col, paint * 0.45, 1.0 - smoothstep(0.038, 0.044, r));
    } else if (r < 0.345) {
      float band = smoothstep(0.284, 0.289, r) * (1.0 - smoothstep(0.315, 0.320, r));
      col = mix(col, paint * 0.45, band * wall);
    } else {
      col = mix(col, col * 0.7, tread);
    }
    return col;
  }
`;

function makeWheelMaterial() {
  const material = new THREE.MeshStandardMaterial({ ...MATERIALS.wheels, side: THREE.DoubleSide });
  material.userData.blur = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWheelBlur = material.userData.blur;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', 'varying vec3 vWheelPos;\n#include <common>')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWheelPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `varying vec3 vWheelPos;\n${WHEEL_PAINT}\n#include <common>`)
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = wheelPaint(vWheelPos, diffuseColor.rgb);');
  };
  return material;
}

// Cuts the combined wheel mesh into [front-left, front-right, rear-left, rear-right].
// Left is +z (the car's nose points down −x).
function splitWheels(mesh, material) {
  const src = mesh.geometry;
  const pos = src.attributes.position;
  const index = src.index;
  src.computeBoundingBox();
  const midX = (src.boundingBox.min.x + src.boundingBox.max.x) / 2;

  const buckets = [[], [], [], []];
  const triCount = index ? index.count / 3 : pos.count / 3;
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    const b = (pos.getX(i0) < midX ? 0 : 2) + (pos.getZ(i0) > 0 ? 0 : 1);
    buckets[b].push(i0, i1, i2);
  }

  return buckets.map((tris, b) => {
    const remap = new Map();
    const pts = [];
    const idx = new Uint32Array(tris.length);
    tris.forEach((old, k) => {
      let now = remap.get(old);
      if (now === undefined) {
        now = pts.length / 3;
        remap.set(old, now);
        pts.push(pos.getX(old), pos.getY(old), pos.getZ(old));
      }
      idx[k] = now;
    });
    const arr = new Float32Array(pts);
    const { centre, tilt, radius } = fitWheel(arr);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    geometry.setIndex(new THREE.BufferAttribute(idx, 1));
    geometry.computeVertexNormals();

    // pivot (steer, ride) → tilt (camber) → spin (rolling) → mesh
    const pivot = new THREE.Group();
    pivot.position.copy(centre);
    const camber = new THREE.Group();
    camber.quaternion.copy(tilt);
    const spin = new THREE.Group();
    spin.add(new THREE.Mesh(geometry, material));
    camber.add(spin);
    pivot.add(camber);

    return { pivot, spin, geometry, radius, angle: 0, baseY: centre.y, front: b < 2, left: b % 2 === 0 };
  });
}

export function buildCar(scene) {
  const body = new THREE.Group();
  const wheelMaterial = makeWheelMaterial();
  let wheels = [];
  const owned = [wheelMaterial];

  scene.traverse((o) => {
    if (!o.isMesh) return;
    const key = Object.keys(MATERIALS).find((k) => o.name.startsWith(k)) || 'body';
    if (key === 'wheels') {
      wheels = splitWheels(o, wheelMaterial);
      wheels.forEach((w) => owned.push(w.geometry));
      return;
    }
    o.geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ ...MATERIALS[key], side: THREE.DoubleSide });
    owned.push(material);
    body.add(new THREE.Mesh(o.geometry, material));
  });

  const wheelbase = wheels.length === 4
    ? { front: wheels[0].pivot.position.x, rear: wheels[2].pivot.position.x }
    : { front: -1.35, rear: 2.1 };

  return { body, wheels, wheelbase, wheelBlur: wheelMaterial.userData.blur, dispose: () => owned.forEach((o) => o.dispose()) };
}
