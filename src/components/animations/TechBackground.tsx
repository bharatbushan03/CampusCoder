'use client';

import React, { useEffect, useRef, useState } from 'react';

export const TechBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const detectMotion = () => {
      setReducedMotion(mediaQuery.matches);
    };
    requestAnimationFrame(detectMotion);

    const handleQueryChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleQueryChange);
    return () => {
      mediaQuery.removeEventListener('change', handleQueryChange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    interface CircuitLine {
      x: number;
      y: number;
      dx: number;
      dy: number;
      length: number;
      maxLength: number;
      color: string;
      speed: number;
    }

    const lines: CircuitLine[] = [];
    const maxLines = 12;

    const createLine = (): CircuitLine => {
      const isHorizontal = Math.random() > 0.5;
      const dx = isHorizontal ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const dy = isHorizontal ? 0 : (Math.random() > 0.5 ? 1 : -1);

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        dx,
        dy,
        length: 0,
        maxLength: 40 + Math.random() * 120,
        color: `rgba(16, 185, 129, ${0.03 + Math.random() * 0.08})`,
        speed: 0.3 + Math.random() * 0.8,
      };
    };

    for (let i = 0; i < maxLines; i++) {
      lines.push(createLine());
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    const targetMouse = { x: width / 2, y: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      targetMouse.x = e.clientX - rect.left;
      targetMouse.y = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse tracking
      mouseX += (targetMouse.x - mouseX) * 0.05;
      mouseY += (targetMouse.y - mouseY) * 0.05;

      // 1. Draw subtle grid
      const gridSize = 50;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.015)';
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw soft radial glow behind mouse (parallax)
      const gradient = ctx.createRadialGradient(mouseX, mouseY, 5, mouseX, mouseY, 250);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.035)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw and update circuit lines
      lines.forEach((line, index) => {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);

        const endX = line.x + line.dx * line.length;
        const endY = line.y + line.dy * line.length;
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw small dot at the head of the circuit
        ctx.fillStyle = 'rgba(52, 211, 153, 0.1)';
        ctx.beginPath();
        ctx.arc(endX, endY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        line.length += line.speed;

        if (line.length >= line.maxLength) {
          const turn = Math.random() > 0.4;
          const nextX = endX;
          const nextY = endY;
          
          if (turn && nextX > 0 && nextX < width && nextY > 0 && nextY < height) {
            line.x = nextX;
            line.y = nextY;
            line.length = 0;
            line.maxLength = 30 + Math.random() * 80;

            const isHorizontal = line.dx === 0;
            line.dx = isHorizontal ? (Math.random() > 0.5 ? 1 : -1) : 0;
            line.dy = isHorizontal ? 0 : (Math.random() > 0.5 ? 1 : -1);
          } else {
            lines[index] = createLine();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none -z-20"
    >
      {/* Static grid background for reduced motion */}
      {reducedMotion ? (
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      )}
    </div>
  );
};

export default TechBackground;
