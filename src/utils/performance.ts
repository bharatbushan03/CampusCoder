'use client';

import { useState, useEffect } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>('medium');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computeTier = () => {
      const cores = navigator.hardwareConcurrency ?? 4;
      const memory = (navigator as any).deviceMemory ?? 4;
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

      if (isMobile || cores <= 4 || memory <= 2) return 'low';
      if (cores <= 6 || memory <= 4) return 'medium';
      return 'high';
    };

    setTier(computeTier());

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setTier('low');

    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setTier('low');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isWebGLAvailable());
  }, []);

  return supported;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
