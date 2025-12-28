import { Vector3 } from 'three';

export enum ShapeType {
  SPHERE = 'SPHERE',
  CUBE = 'CUBE',
  TORUS = 'TORUS',
  HEART = 'HEART',
  DNA = 'DNA',
  GALAXY = 'GALAXY',
  TEXT = 'TEXT',
  NOISE = 'NOISE'
}

export enum ColorMode {
  MONO = 'MONO',
  HEAT = 'HEAT',     // Velocity based
  SPECTRUM = 'SPECTRUM', // Y-level based
  CYBER = 'CYBER',    // Depth based
  PINK = 'PINK',      // Pink gradient
  RAINBOW = 'RAINBOW', // Full rainbow
  FIRE = 'FIRE',      // Fire-like colors
  OCEAN = 'OCEAN'     // Ocean-like colors
}

export interface HandData {
  isActive: boolean;
  landmarks: {x: number, y: number, z: number}[];
  // Normalized 0-1 World Position
  position: { x: number; y: number; z: number }; 
  // 0.0 (Open Hand) to 1.0 (Closed Fist/Pinch)
  pinchStrength: number;
  // New gesture for rotation
  isRotationGesture: boolean;
  // New gesture for zoom
  isZoomGesture: boolean;
}

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
}

export type PointGenerator = (count: number, params?: any) => Float32Array;