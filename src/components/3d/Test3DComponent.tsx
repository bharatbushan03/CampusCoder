'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';

function SpinningTorus() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Rotate the torus on every frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1, 0.3, 16, 100]} />
      <meshStandardMaterial color="#10b981" roughness={0.3} metalness={0.8} />
    </mesh>
  );
}

export default function Test3DComponent() {
  return (
    <div className="w-full h-[400px] md:h-[500px] bg-slate-950/50 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
      {/* Absolute overlay instructions */}
      <div className="absolute top-4 left-4 z-10 font-mono text-[10px] text-slate-500 uppercase tracking-widest pointer-events-none">
        React Three Fiber Active • Click & Drag to Orbit
      </div>

      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-5, 5, 5]} intensity={1} color="#34d399" />
        <Center>
          <SpinningTorus />
        </Center>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
