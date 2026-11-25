import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RAINBOW_GLSL, VOLUME_GLSL, setVolumeUniforms, volumeGrid } from './f1Volume';

// ─────────────────────────────────────────────────────────────
// Velocity field of the DES snapshot on two cutting planes, in the car's
// frame: one across the car that sweeps from nose to wake, and one lying
// flat just above the ground. Coloured by speed with the same rainbow and
// range as the streak lines. Lives in the car's model coordinates, like
// the streak lines and the smoke.
// ─────────────────────────────────────────────────────────────

const SLICE = {
  from: -2.6,     // where the sweeping plane starts [m]: the front wing's leading edge
  to: 5,          // and where it ends, in the wake
  ground: 0.12,   // height of the flat plane [m]
  alpha: 0.8,
  edge: 0.3,      // metres over which the planes fade out towards the edge of the data
};

const vertexShader = /* glsl */ `
  uniform float uShift;   // how far the plane has been moved along the car [m]
  out vec3 vModel;
  void main() {
    vModel = position + vec3(uShift, 0.0, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vModel, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uFade;
  uniform float uVMax;
  uniform float uAlpha;
  uniform float uEdge;
  uniform vec3 uBoxMin;
  uniform vec3 uBoxMax;
  in vec3 vModel;
  out vec4 outColor;
  ${RAINBOW_GLSL}
  ${VOLUME_GLSL}

  void main() {
    vec3 p = vec3(vModel.x, vModel.y, abs(vModel.z));
    if (any(lessThan(p, uBoxMin)) || any(greaterThan(p, uBoxMax))) discard;
    vec4 v = velAt(vModel);
    if (v.a > 0.5) discard;   // inside the car
    // fade towards the edges of the data (there is no edge at the ground or on the centreline)
    float edge = smoothstep(0.0, uEdge, p.x - uBoxMin.x) * smoothstep(0.0, uEdge, uBoxMax.x - p.x)
               * smoothstep(0.0, uEdge, uBoxMax.y - p.y) * smoothstep(0.0, uEdge, uBoxMax.z - p.z);
    outColor = vec4(rainbow(speedOf(v) / uVMax), uAlpha * edge * uFade);
  }
`;

function makeMaterial(vol, vMax) {
  const g = volumeGrid(vol);
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uVel: { value: null },
      uGrid: { value: new THREE.Vector3() },
      uGridN: { value: new THREE.Vector3(1, 1, 1) },
      uShift: { value: 0 },
      uFade: { value: 0 },
      uVMax: { value: vMax },
      uAlpha: { value: SLICE.alpha },
      uEdge: { value: SLICE.edge },
      uBoxMin: { value: new THREE.Vector3(g.xMin, 0, 0) },
      uBoxMax: { value: new THREE.Vector3(g.xMax, g.yMax, g.zMax) },
    },
  });
  setVolumeUniforms(material.uniforms, vol);
  return material;
}

function quad(corners) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(corners.flat()), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  return geometry;
}

// vol: what loadVortex() returns. weight / time: refs from the scene timeline
// (0..1 fade, and seconds since the scene came on). The sweep starts after
// `sweep.delay` seconds and takes `sweep.seconds`.
export function VelocitySlices({ vol, weight, time, sweep, vMax }) {
  const across = useRef();
  const flat = useRef();

  const built = useMemo(() => {
    const g = volumeGrid(vol);
    return {
      acrossMaterial: makeMaterial(vol, vMax),
      flatMaterial: makeMaterial(vol, vMax),
      // built at x = 0 and moved by uShift
      acrossGeometry: quad([[0, 0, -g.zMax], [0, 0, g.zMax], [0, g.yMax, g.zMax], [0, g.yMax, -g.zMax]]),
      flatGeometry: quad([[g.xMin, SLICE.ground, -g.zMax], [g.xMax, SLICE.ground, -g.zMax], [g.xMax, SLICE.ground, g.zMax], [g.xMin, SLICE.ground, g.zMax]]),
    };
  }, [vol, vMax]);
  useEffect(() => () => { Object.values(built).forEach((o) => o.dispose()); }, [built]);

  useFrame(() => {
    const w = weight.current;
    const on = w > 0.002;
    if (across.current) across.current.visible = on;
    if (flat.current) flat.current.visible = on;
    if (!on) return;
    const u = Math.min(Math.max((time.current - sweep.delay) / sweep.seconds, 0), 1);
    built.acrossMaterial.uniforms.uShift.value = SLICE.from + (SLICE.to - SLICE.from) * u;
    built.acrossMaterial.uniforms.uFade.value = w;
    built.flatMaterial.uniforms.uFade.value = w;
  });

  return (
    <>
      <mesh ref={flat} geometry={built.flatGeometry} material={built.flatMaterial} frustumCulled={false} visible={false} renderOrder={2} />
      <mesh ref={across} geometry={built.acrossGeometry} material={built.acrossMaterial} frustumCulled={false} visible={false} renderOrder={3} />
    </>
  );
}
