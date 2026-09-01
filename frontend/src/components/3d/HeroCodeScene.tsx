'use client';

import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion, useAdaptiveDPR } from '@/utils/performance';

type CodeGlyph = 'angle' | 'braces' | 'brackets' | 'hash';

interface GlyphStrokeConfig {
  position: [number, number, number];
  rotationZ?: number;
  scale: [number, number, number];
}

const glyphs: Record<CodeGlyph, GlyphStrokeConfig[]> = {
  angle: [
    { position: [-0.28, 0.11, 0], rotationZ: 0.75, scale: [0.05, 0.3, 0.05] },
    { position: [-0.28, -0.11, 0], rotationZ: -0.75, scale: [0.05, 0.3, 0.05] },
    { position: [0, 0, 0], rotationZ: -0.28, scale: [0.05, 0.56, 0.05] },
    { position: [0.28, 0.11, 0], rotationZ: -0.75, scale: [0.05, 0.3, 0.05] },
    { position: [0.28, -0.11, 0], rotationZ: 0.75, scale: [0.05, 0.3, 0.05] },
  ],
  braces: [
    { position: [-0.18, 0.22, 0], scale: [0.18, 0.045, 0.05] },
    { position: [-0.29, 0.11, 0], scale: [0.045, 0.2, 0.05] },
    { position: [-0.19, 0, 0], scale: [0.16, 0.045, 0.05] },
    { position: [-0.29, -0.11, 0], scale: [0.045, 0.2, 0.05] },
    { position: [-0.18, -0.22, 0], scale: [0.18, 0.045, 0.05] },
    { position: [0.18, 0.22, 0], scale: [0.18, 0.045, 0.05] },
    { position: [0.29, 0.11, 0], scale: [0.045, 0.2, 0.05] },
    { position: [0.19, 0, 0], scale: [0.16, 0.045, 0.05] },
    { position: [0.29, -0.11, 0], scale: [0.045, 0.2, 0.05] },
    { position: [0.18, -0.22, 0], scale: [0.18, 0.045, 0.05] },
  ],
  brackets: [
    { position: [-0.27, 0, 0], scale: [0.045, 0.5, 0.05] },
    { position: [-0.17, 0.22, 0], scale: [0.22, 0.045, 0.05] },
    { position: [-0.17, -0.22, 0], scale: [0.22, 0.045, 0.05] },
    { position: [0.27, 0, 0], scale: [0.045, 0.5, 0.05] },
    { position: [0.17, 0.22, 0], scale: [0.22, 0.045, 0.05] },
    { position: [0.17, -0.22, 0], scale: [0.22, 0.045, 0.05] },
  ],
  hash: [
    { position: [-0.12, 0, 0], rotationZ: -0.08, scale: [0.045, 0.55, 0.05] },
    { position: [0.12, 0, 0], rotationZ: -0.08, scale: [0.045, 0.55, 0.05] },
    { position: [0, 0.12, 0], rotationZ: -0.08, scale: [0.52, 0.045, 0.05] },
    { position: [0, -0.12, 0], rotationZ: -0.08, scale: [0.52, 0.045, 0.05] },
  ],
};

function getStrokeKey(stroke: GlyphStrokeConfig) {
  return `${stroke.position.join(',')}:${stroke.scale.join(',')}:${stroke.rotationZ ?? 0}`;
}

const MeshGlyph = React.memo(function MeshGlyph({ symbol }: { symbol: CodeGlyph }) {
  return (
    <group scale={0.82}>
      {glyphs[symbol].map((stroke) => (
        <mesh
          key={`${symbol}-${getStrokeKey(stroke)}`}
          position={stroke.position}
          rotation={[0, 0, stroke.rotationZ ?? 0]}
          scale={stroke.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.65}
            roughness={0.2}
            metalness={0.4}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
});

const FloatingSymbol = React.memo(function FloatingSymbol({
  symbol,
  position,
  speed = 1,
}: {
  symbol: CodeGlyph;
  position: [number, number, number];
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const initialY = position[1];
  const elapsedRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useFrame((state, delta) => {
    if (!ref.current) return;
    elapsedRef.current += delta;
    if (!reducedMotion) {
      ref.current.position.y = initialY + Math.sin(elapsedRef.current * speed + position[0]) * 0.18;
      ref.current.rotation.y += delta * 1.8;
      ref.current.rotation.x += delta * 0.8;
    }
  });

  return (
    <group ref={ref} position={position}>
      <MeshGlyph symbol={symbol} />
    </group>
  );
});

const WebGLContextGuard = React.memo(function WebGLContextGuard() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    gl.setClearColor(0x000000, 0);

    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost);
  }, [gl]);

  return null;
});

function CanvasFallback() {
  return (
    <div className="absolute inset-0 rounded-3xl border border-slate-800/80 bg-slate-950/70 flex items-center justify-center">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">3D unavailable</span>
    </div>
  );
}

const CodeCore = React.memo(function CodeCore() {
  const groupRef = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useFrame((state, delta) => {
    elapsedRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
      groupRef.current.rotation.x += delta * 0.12;
    }
    if (cubeRef.current && !reducedMotion) {
      const scale = 1 + Math.sin(elapsedRef.current * 1.8) * 0.08;
      cubeRef.current.scale.set(scale, scale, scale);
    }
    if (innerRef.current && !reducedMotion) {
      innerRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Solid Glowing Core */}
      <mesh ref={cubeRef}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial
          color="#059669"
          emissive="#10b981"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* Middle Octahedron Pulse */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#14b8a6"
          emissive="#2dd4bf"
          emissiveIntensity={0.4}
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Outer Wireframe Bounds */}
      <mesh>
        <boxGeometry args={[1.15, 1.15, 1.15]} />
        <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
});

const OrbitalRings = React.memo(function OrbitalRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.15;
      ring1Ref.current.rotation.y += delta * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.12;
      ring2Ref.current.rotation.z += delta * 0.18;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.0, 0.015, 16, 64]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[2.2, 0.012, 16, 64]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>
    </group>
  );
});

const TechSphere = React.memo(function TechSphere() {
  const outerSphereRef = useRef<THREE.Mesh>(null);
  const innerSphereRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();

  useFrame((state, delta) => {
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
        <icosahedronGeometry args={[1.75, 0]} />
        <meshBasicMaterial color="#065f46" wireframe transparent opacity={0.2} />
      </mesh>
      <mesh ref={innerSphereRef}>
        <dodecahedronGeometry args={[1.4, 0]} />
        <meshBasicMaterial color="#047857" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
});

const SceneContent = React.memo(function SceneContent() {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  useFrame((state) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.3, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.25, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <OrbitalRings />
      <TechSphere />
      <CodeCore />
      <FloatingSymbol symbol="angle" position={[-1.35, 0.75, 0.3]} speed={1.1} />
      <FloatingSymbol symbol="braces" position={[1.45, -0.55, -0.3]} speed={0.9} />
      <FloatingSymbol symbol="brackets" position={[-1.05, -0.75, -0.5]} speed={0.7} />
      <FloatingSymbol symbol="hash" position={[1.15, 0.85, 0.5]} speed={1.3} />
    </group>
  );
});

export default function HeroCodeScene() {
  const dpr = useAdaptiveDPR();

  return (
    <div className="w-full h-full relative select-none will-change-transform" aria-label="3D coding symbols and geometric shapes animation">
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        dpr={dpr}
        fallback={<CanvasFallback />}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <WebGLContextGuard />
        <ambientLight intensity={0.45} />
        <pointLight position={[10, 10, 10]} intensity={1.8} color="#34d399" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#065f46" />
        <pointLight position={[0, 0, 5]} intensity={0.8} color="#10b981" />
        <directionalLight position={[0, 5, 2]} intensity={1.3} color="#10b981" />

        <Sparkles count={45} scale={4.5} size={2.2} speed={0.4} color="#10b981" opacity={0.6} />

        <SceneContent />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
          autoRotate
          autoRotateSpeed={0.35}
        />
      </Canvas>
    </div>
  );
}
