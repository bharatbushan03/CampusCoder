'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion, useAdaptiveDPR } from '@/utils/performance';

const FloatingSymbol = React.memo(function FloatingSymbol({ symbol, position, speed = 1 }: { symbol: string; position: [number, number, number]; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const initialY = position[1];
  const reducedMotion = useReducedMotion();

  useFrame((state) => {
    if (!ref.current) return;
    if (!reducedMotion) {
      ref.current.position.y = initialY + Math.sin(state.clock.getElapsedTime() * speed + position[0]) * 0.15;
      ref.current.rotation.y += 0.005;
      ref.current.rotation.x += 0.002;
    }
  });

  return (
    <group ref={ref} position={position}>
      <Text fontSize={0.4} color="#10b981" anchorX="center" anchorY="middle" fillOpacity={0.7}>
        {symbol}
      </Text>
    </group>
  );
});

const CodeCore = React.memo(function CodeCore() {
  const groupRef = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.rotation.x += delta * 0.1;
    }
    if (cubeRef.current && !reducedMotion) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.06;
      cubeRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={cubeRef}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#059669" emissive="#10b981" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
});

const TechSphere = React.memo(function TechSphere() {
  const outerSphereRef = useRef<THREE.Mesh>(null);
  const innerSphereRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();

  useFrame((_state, delta) => {
    if (reducedMotion) return;
    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.y -= delta * 0.08;
      outerSphereRef.current.rotation.z += delta * 0.04;
    }
    if (innerSphereRef.current) {
      innerSphereRef.current.rotation.y += delta * 0.12;
      innerSphereRef.current.rotation.x -= delta * 0.06;
    }
  });

  return (
    <group>
      <mesh ref={outerSphereRef}>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshBasicMaterial color="#065f46" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh ref={innerSphereRef}>
        <dodecahedronGeometry args={[1.4, 0]} />
        <meshBasicMaterial color="#047857" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
});

const SceneContent = React.memo(function SceneContent() {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  useFrame((state) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.25, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.2, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <TechSphere />
      <CodeCore />
      <FloatingSymbol symbol="</>" position={[-1.3, 0.7, 0.3]} speed={1.1} />
      <FloatingSymbol symbol="{}" position={[1.4, -0.5, -0.3]} speed={0.9} />
      <FloatingSymbol symbol="[]" position={[-1.0, -0.7, -0.5]} speed={0.7} />
      <FloatingSymbol symbol="#" position={[1.1, 0.8, 0.5]} speed={1.3} />
    </group>
  );
});

export default function HeroCodeScene() {
  const dpr = useAdaptiveDPR();

  return (
    <div className="w-full h-full relative select-none will-change-transform" aria-label="3D coding symbols and geometric shapes animation">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#34d399" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#065f46" />
        <directionalLight position={[0, 5, 2]} intensity={1.2} color="#10b981" />

        <Sparkles count={35} scale={4} size={2} speed={0.4} color="#10b981" opacity={0.5} />

        <SceneContent />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
}
