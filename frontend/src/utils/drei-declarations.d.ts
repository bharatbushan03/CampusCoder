declare module '@react-three/drei' {
  import * as React from 'react';
  import * as THREE from 'three';
  
  export interface SparklesProps extends React.ComponentProps<'points'> {
    count?: number;
    scale?: number;
    size?: number;
    speed?: number;
    color?: string | THREE.Color;
    opacity?: number;
  }
  
  export const Sparkles: React.ForwardRefExoticComponent<
    SparklesProps & React.RefAttributes<THREE.Points>
  >;

  export interface OrbitControlsProps {
    enableZoom?: boolean;
    enablePan?: boolean;
    enableDamping?: boolean;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    makeDefault?: boolean;
    target?: THREE.Vector3;
    keyEvents?: boolean | HTMLElement;
    regress?: boolean;
    onStart?: (event: Event) => void;
    onEnd?: (event: Event) => void;
    onChange?: (event: Event) => void;
  }
  
  export const OrbitControls: React.ForwardRefExoticComponent<
    OrbitControlsProps & React.RefAttributes<THREE.OrbitControls>
  >;

  export interface FloatProps {
    speed?: number;
    rotationIntensity?: number;
    floatIntensity?: number;
    children: React.ReactNode;
  }
  
  export const Float: React.ForwardRefExoticComponent<
    FloatProps & React.RefAttributes<THREE.Group>
  >;

  export interface LineProps {
    points: THREE.Vector3[];
    color?: string | THREE.Color;
    lineWidth?: number;
    transparent?: boolean;
    opacity?: number;
  }
  
  export const Line: React.ForwardRefExoticComponent<
    LineProps & React.RefAttributes<THREE.Line>
  >;

  export interface PresentationControlsProps {
    global?: boolean;
    snap?: boolean;
    rotation?: [number, number, number];
    polar?: [number, number];
    azimuth?: [number, number];
    children: React.ReactNode;
  }
  
  export const PresentationControls: React.ForwardRefExoticComponent<
    PresentationControlsProps & React.RefAttributes<THREE.Group>
  >;

  export interface CenterProps {
    children: React.ReactNode;
    disableX?: boolean;
    disableY?: boolean;
    disableZ?: boolean;
    min?: number;
    max?: number;
  }
  
  export const Center: React.ForwardRefExoticComponent<
    CenterProps & React.RefAttributes<THREE.Group>
  >;
}