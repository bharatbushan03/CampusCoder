'use client';

import { useState, useEffect } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

function getPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as any).deviceMemory ?? 4;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
  if (isMobile || cores <= 4 || memory <= 2) return 'low';
  if (cores <= 6 || memory <= 4) return 'medium';
  return 'high';
}

export function usePerformanceTier(): PerformanceTier {
  const [tier] = useState<PerformanceTier>(getPerformanceTier);
  return tier;
}

export function useAdaptiveDPR(): [number, number] {
  const tier = usePerformanceTier();

  switch (tier) {
    case 'low':
      return [0.5, 1];
    case 'medium':
      return [1, 1.5];
    case 'high':
      return [1, 2];
  }
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') || canvas.getContext('webgl2')
    );
  } catch {
    return false;
  }
}

export function useWebGLSupport(): boolean {
  const [supported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return isWebGLAvailable();
  });
  return supported;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
