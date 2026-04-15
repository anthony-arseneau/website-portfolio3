import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function GearShape(teethCount, outerRadius, innerRadius, toothDepth) {
  const shape = new THREE.Shape();
  const anglePerTooth = (Math.PI * 2) / teethCount;
  const toothWidth = anglePerTooth * 0.35;

  for (let i = 0; i < teethCount; i++) {
    const angle = i * anglePerTooth;
    const a1 = angle - toothWidth / 2;
    const a2 = angle + toothWidth / 2;
    const a3 = angle + anglePerTooth / 2 - toothWidth / 4;
    const a4 = angle + anglePerTooth / 2 + toothWidth / 4;

    const r1 = innerRadius;
    const r2 = outerRadius + toothDepth;

    if (i === 0) {
      shape.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
    }
    shape.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
    shape.lineTo(Math.cos(a1) * r2, Math.sin(a1) * r2);
    shape.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
    shape.lineTo(Math.cos(a2) * r1, Math.sin(a2) * r1);

    shape.lineTo(Math.cos(a3) * r1, Math.sin(a3) * r1);
    shape.lineTo(Math.cos(a4) * r1, Math.sin(a4) * r1);
  }
  shape.closePath();
  return shape;
}

function Gear({ teethCount, outerRadius, innerRadius, toothDepth, thickness, position, rotationSpeed, color, wireframe = false }) {
  const meshRef = useRef();
  const shape = useMemo(
    () => GearShape(teethCount, outerRadius, innerRadius, toothDepth),
    [teethCount, outerRadius, innerRadius, toothDepth]
  );

  const extrudeSettings = useMemo(() => ({
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 1,
  }), [thickness]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.3}
        wireframe={wireframe}
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

function RingGear({ teethCount, ringOuterRadius, ringInnerRadius, toothDepth, thickness, rotationSpeed }) {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    const outerShape = new THREE.Shape();
    outerShape.absarc(0, 0, ringOuterRadius, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, ringInnerRadius, 0, Math.PI * 2, true);
    outerShape.holes.push(holePath);

    return new THREE.ExtrudeGeometry(outerShape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1,
    });
  }, [ringOuterRadius, ringInnerRadius, thickness]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color="#ffffff"
        metalness={0.9}
        roughness={0.2}
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function PlanetaryGear() {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
    }
  });

  const sunTeeth = 16;
  const planetTeeth = 10;
  const sunRadius = 0.8;
  const planetRadius = 0.5;
  const planetOrbitRadius = sunRadius + planetRadius + 0.15;
  const planetCount = 4;
  const ringInner = planetOrbitRadius + planetRadius + 0.2;
  const ringOuter = ringInner + 0.3;

  const sunSpeed = 0.15;
  const planetSpeed = -(sunTeeth / planetTeeth) * sunSpeed;
  const ringSpeed = -sunSpeed * (sunTeeth / (sunTeeth + 2 * planetTeeth)) * 0.3;

  const planets = useMemo(() => {
    const items = [];
    for (let i = 0; i < planetCount; i++) {
      const angle = (i / planetCount) * Math.PI * 2;
      items.push({
        x: Math.cos(angle) * planetOrbitRadius,
        y: Math.sin(angle) * planetOrbitRadius,
        angle,
      });
    }
    return items;
  }, [planetCount, planetOrbitRadius]);

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={1.6}>
      {/* Sun gear */}
      <Gear
        teethCount={sunTeeth}
        outerRadius={sunRadius}
        innerRadius={sunRadius * 0.6}
        toothDepth={0.12}
        thickness={0.15}
        position={[0, 0, 0]}
        rotationSpeed={sunSpeed}
        color="#ffffff"
      />

      {/* Planet gears */}
      {planets.map((p, i) => (
        <Gear
          key={i}
          teethCount={planetTeeth}
          outerRadius={planetRadius}
          innerRadius={planetRadius * 0.5}
          toothDepth={0.1}
          thickness={0.15}
          position={[p.x, p.y, 0]}
          rotationSpeed={planetSpeed}
          color="#cccccc"
        />
      ))}

      {/* Ring gear */}
      <RingGear
        teethCount={30}
        ringOuterRadius={ringOuter}
        ringInnerRadius={ringInner}
        toothDepth={0.1}
        thickness={0.15}
        rotationSpeed={ringSpeed}
      />

      {/* Carrier arms */}
      {planets.map((p, i) => {
        const len = Math.sqrt(p.x * p.x + p.y * p.y);
        return (
          <mesh
            key={`arm-${i}`}
            position={[p.x / 2, p.y / 2, 0]}
            rotation={[Math.PI / 2, 0, p.angle]}
          >
            <boxGeometry args={[len, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.8}
              roughness={0.3}
              transparent
              opacity={0.06}
            />
          </mesh>
        );
      })}
    </group>
  );
}
