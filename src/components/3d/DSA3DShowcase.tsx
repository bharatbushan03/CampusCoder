'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Sphere, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, useReducedMotion } from 'framer-motion';
import { Terminal, Code2, Trophy } from 'lucide-react';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';

// ─── 3D GRAPH VISUALIZATION ───

function GraphNodes({ isMobile }: { isMobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const numNodes = isMobile ? 8 : 15;

  // Generate random positions for nodes
  const nodes = useMemo(() => {
    const temp = [];
    for (let i = 0; i < numNodes; i++) {
      temp.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4
        )
      );
    }
    return temp;
  }, [numNodes]);

  // Generate edges between close nodes
  const edges = useMemo(() => {
    const temp = [];
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 3.5) {
          temp.push([nodes[i], nodes[j]]);
        }
      }
    }
    return temp;
  }, [nodes, numNodes]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.05;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={group}>
      {/* Edges */}
      {edges.map((edge, i) => (
        <Line 
          key={`edge-${i}`} 
          points={edge} 
          color="#10b981" 
          lineWidth={1} 
          transparent 
          opacity={0.15} 
        />
      ))}
      
      {/* Nodes */}
      {nodes.map((pos, i) => (
        <Float key={`node-${i}`} speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Sphere position={pos} args={[0.08, 16, 16]}>
            <meshStandardMaterial 
              color={i % 3 === 0 ? "#10b981" : "#34d399"} 
              emissive="#10b981"
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
}

// ─── TERMINAL COMPONENT ───

function AnimatedTerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();
  
  const terminalSequence = useMemo(() => [
    "> Loading Challenge: Arrays & Strings...",
    "> Compiling solution.cpp...",
    "> Running 42 hidden test cases...",
    "[OK] Test Case 1 passed (0.002s)",
    "[OK] Test Case 2 passed (0.001s)",
    "[OK] All 42 test cases passed!",
    "> Memory usage: 12.4 MB (Beats 98%)",
    "> Time complexity: O(N) (Optimal)"
  ], []);

  useEffect(() => {
    if (shouldReduceMotion) {
      setLines(terminalSequence);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < terminalSequence.length) {
        setLines(prev => [...prev, terminalSequence[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800); // Type out a line every 800ms

    return () => clearInterval(interval);
  }, [terminalSequence, shouldReduceMotion]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="absolute bottom-10 left-4 md:left-10 w-[calc(100%-2rem)] md:w-96 bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md z-20"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900">
        <Terminal className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-mono text-slate-400">Terminal - bash</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
      </div>
      <div className="p-4 font-mono text-xs text-slate-300 min-h-[200px] flex flex-col gap-2">
        {lines.map((line, i) => (
          <motion.div 
            key={i}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={line.includes('[OK]') ? 'text-emerald-400' : line.includes('Beats') ? 'text-indigo-400' : 'text-slate-300'}
          >
            {line}
          </motion.div>
        ))}
        {lines.length < terminalSequence.length && !shouldReduceMotion && (
          <motion.div 
            animate={{ opacity: [1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2 h-4 bg-emerald-500"
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── LEADERBOARD CARD COMPONENT ───

function FloatingLeaderboard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="hidden md:block absolute top-20 right-10 w-72 bg-slate-900/80 border border-slate-700/50 rounded-xl p-5 shadow-2xl backdrop-blur-md z-20"
    >
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Live Global Rank</h4>
      </div>
      
      <div className="space-y-3">
        {[
          { rank: 1, name: 'AlexChen_Dev', score: 2400, color: 'text-yellow-400' },
          { rank: 2, name: 'S_Gupta99', score: 2350, color: 'text-slate-300' },
          { rank: 3, name: 'You (Current)', score: 2100, color: 'text-emerald-400', isUser: true },
        ].map((user) => (
          <motion.div 
            key={user.rank}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02, x: 5 }}
            className={`flex items-center justify-between p-2.5 rounded-lg border ${user.isUser ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold font-mono ${user.color}`}>#{user.rank}</span>
              <span className="text-sm text-slate-200 font-medium">{user.name}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">{user.score}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── MAIN SHOWCASE SECTION ───

export default function DSA3DShowcase() {
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="relative w-full h-[600px] md:h-[700px] bg-slate-950 border-b border-slate-800/40 overflow-hidden flex items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950 pointer-events-none z-10" />
      
      {/* Overlay Content */}
      <div className="absolute top-10 left-0 w-full text-center z-20 pointer-events-none px-4">
        <AnimatedSection direction="up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 mb-4 shadow-xl">
            <Code2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Real Interview Environment</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Write code, run test cases, and climb the leaderboard on HackerRank.
          </p>
        </AnimatedSection>
      </div>

      <AnimatedTerminal />
      <FloatingLeaderboard />

      {/* 3D Canvas Context */}
      <div className="absolute inset-0 z-0">
        {!shouldReduceMotion ? (
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#10b981" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />
            
            <PresentationControls
              global
              snap={true}
              rotation={[0, 0.3, 0]}
              polar={[-Math.PI / 3, Math.PI / 3]}
              azimuth={[-Math.PI / 1.4, Math.PI / 2]}
            >
              <GraphNodes isMobile={isMobile} />
            </PresentationControls>
          </Canvas>
        ) : (
          /* Fallback for reduced motion preference */
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-[300px] h-[300px] rounded-full border border-emerald-500/30" />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-emerald-500/10" />
          </div>
        )}
      </div>
    </section>
  );
}
