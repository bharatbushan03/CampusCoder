'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion, useAdaptiveDPR } from '@/utils/performance';

interface NetworkNode {
  pos: THREE.Vector3;
  label?: string;
}

function createLabelTexture(label: string) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
  ctx.lineWidth = 3;

  const radius = 26;
  const x = 12;
  const y = 18;
  const width = canvas.width - 24;
  const height = canvas.height - 36;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = '700 34px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillStyle = '#34d399';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

const GlobeLabel = React.memo(function GlobeLabel({ label }: { label: string }) {
  const texture = useMemo(() => createLabelTexture(label), [label]);

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  if (!texture) return null;

  return (
    <sprite position={[0, 0.24, 0]} scale={[Math.max(0.62, label.length * 0.065), 0.16, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
});

const GlobeNetwork = React.memo(function GlobeNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  const { nodes, linePairs, labelElements } = useMemo(() => {
    const tempNodes: NetworkNode[] = [];
    const count = 32;
    const labels = [
      'Events',
      'Workshops',
      'Coding Challenges',
      'Placement Prep',
      'Peer Learning'
    ];
    let labelIndex = 0;

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 1.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      let label: string | undefined;
      if (i % 6 === 0 && labelIndex < labels.length) {
        label = labels[labelIndex++];
      }

      tempNodes.push({
        pos: new THREE.Vector3(x, y, z),
        label
      });
    }

    const tempPairs: THREE.Vector3[] = [];
    for (let i = 0; i < tempNodes.length; i++) {
      for (let j = i + 1; j < tempNodes.length; j++) {
        const dist = tempNodes[i].pos.distanceTo(tempNodes[j].pos);
        if (dist < 1.1) {
          tempPairs.push(tempNodes[i].pos, tempNodes[j].pos);
        }
      }
    }

    const labelsJSX = tempNodes.map((node) => {
      if (!node.label) return null;
      return (
        <group key={node.label} position={node.pos}>
          <GlobeLabel label={node.label} />
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
        </group>
      );
    });

    return { nodes: tempNodes, linePairs: tempPairs, labelElements: labelsJSX };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (!reducedMotion) {
        groupRef.current.rotation.y += delta * 0.15;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.12, 0.05);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.48, 18, 18]} />
        <meshBasicMaterial color="#065f46" wireframe transparent opacity={0.12} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.25} />
      </mesh>

      <lineSegments>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array(linePairs.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#059669" transparent opacity={0.3} linewidth={1} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array(nodes.flatMap(n => [n.pos.x, n.pos.y, n.pos.z])), 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#34d399" size={0.065} sizeAttenuation transparent opacity={0.8} />
      </points>

      {labelElements}
    </group>
  );
});

export default function CommunityGlobe() {
  const dpr = useAdaptiveDPR();

  return (
    <div className="w-full h-full relative select-none will-change-transform" aria-label="3D community network globe visualization">
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#34d399" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#065f46" />

        <GlobeNetwork />

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
