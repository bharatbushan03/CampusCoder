'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNode {
  pos: THREE.Vector3;
  label?: string;
}

function GlobeNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleQueryChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleQueryChange);
    return () => {
      mediaQuery.removeEventListener('change', handleQueryChange);
    };
  }, []);
  
  // Distribute 32 nodes on a sphere using Fibonacci lattice
  const { nodes, linePairs } = useMemo(() => {
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
      
      // Assign label to some nodes
      let label: string | undefined;
      if (i % 6 === 0 && labelIndex < labels.length) {
        label = labels[labelIndex++];
      }

      tempNodes.push({
        pos: new THREE.Vector3(x, y, z),
        label
      });
    }

    // Connect close neighbors
    const tempPairs: THREE.Vector3[] = [];
    for (let i = 0; i < tempNodes.length; i++) {
      for (let j = i + 1; j < tempNodes.length; j++) {
        const dist = tempNodes[i].pos.distanceTo(tempNodes[j].pos);
        if (dist < 1.1) {
          tempPairs.push(tempNodes[i].pos, tempNodes[j].pos);
        }
      }
    }

    return { nodes: tempNodes, linePairs: tempPairs };
  }, []);

  // Animate slow rotation & mouse parallax
  useFrame((state, delta) => {
    if (reducedMotion) return;
    if (groupRef.current) {
      // Slow idle rotation
      groupRef.current.rotation.y += delta * 0.12;
      
      // Mouse Parallax
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.15, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Wireframe Outer Sphere */}
      <mesh>
        <sphereGeometry args={[1.48, 18, 18]} />
        <meshBasicMaterial
          color="#065f46"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* 2. Central Core Glow Sphere */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* 3. Connecting Network Lines */}
      <lineSegments>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array(linePairs.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#059669"
          transparent
          opacity={0.3}
          linewidth={1}
        />
      </lineSegments>

      {/* 4. Glowing Nodes */}
      <points>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array(nodes.flatMap(n => [n.pos.x, n.pos.y, n.pos.z])), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#34d399"
          size={0.065}
          sizeAttenuation
          transparent
          opacity={0.8}
        />
      </points>

      {/* 5. Floating Labels */}
      {nodes.map((node) => {
        if (!node.label) return null;
        return (
          <group key={node.label} position={node.pos}>
            <Text
              position={[0, 0.2, 0]}
              fontSize={0.14}
              color="#34d399"
              anchorX="center"
              anchorY="middle"
              fillOpacity={0.85}
            >
              {node.label}
            </Text>
            {/* Direct connector dot for the label */}
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function CommunityGlobe() {
  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
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
