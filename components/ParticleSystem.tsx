import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HandData, ShapeType, ColorMode } from '../types';
import { 
  generateSphere, 
  generateCube, 
  generateTorus, 
  generateHeart,
  generateDNA,
  generateGalaxy,
  generateNoise, 
  generateText 
} from '../utils/geometryGenerators';

interface ParticleSystemProps {
  handData: React.MutableRefObject<HandData>;
  shapeType: ShapeType;
  colorMode: ColorMode;
  particleCount: number;
  objectScale: number;
  interactionRadius: number;
  textInput: string;
  isMirrored: boolean;
  onInteractionStateChange?: (state: string | null) => void;
}

const RETURN_SPEED = 0.08; 
const FRICTION = 0.90; 

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  handData, 
  shapeType, 
  colorMode,
  particleCount,
  objectScale,
  interactionRadius,
  textInput, 
  isMirrored,
  onInteractionStateChange
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const lastStateRef = useRef<string | null>(null);
  
  // Cooldown to prevent accidental repel after zoom/rotate
  const cooldownRef = useRef<number>(0);
  
  // Re-allocate buffers when particle count changes
  const { positions, velocities, targets, colors } = useMemo(() => {
    return {
        positions: new Float32Array(particleCount * 3),
        velocities: new Float32Array(particleCount * 3),
        targets: new Float32Array(particleCount * 3),
        colors: new Float32Array(particleCount * 3)
    };
  }, [particleCount]);
  
  // Initial random scatter
  useEffect(() => {
    const initPos = generateNoise(particleCount);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = initPos[i];
      velocities[i] = 0;
      colors[i] = 0;
    }
  }, [particleCount, positions, velocities, colors]);

  // Update Shape Targets
  useEffect(() => {
    let newTargets: Float32Array;
    switch (shapeType) {
      case ShapeType.SPHERE: newTargets = generateSphere(particleCount); break;
      case ShapeType.CUBE: newTargets = generateCube(particleCount); break;
      case ShapeType.TORUS: newTargets = generateTorus(particleCount); break;
      case ShapeType.HEART: newTargets = generateHeart(particleCount); break;
      case ShapeType.DNA: newTargets = generateDNA(particleCount); break;
      case ShapeType.GALAXY: newTargets = generateGalaxy(particleCount); break;
      case ShapeType.TEXT: newTargets = generateText(particleCount, textInput); break;
      default: newTargets = generateNoise(particleCount);
    }
    for (let i = 0; i < particleCount * 3; i++) targets[i] = newTargets[i];
  }, [shapeType, textInput, particleCount, targets]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const hand = handData.current;

    // --- 1. Determine Interactor Position (Hand Only) ---
    let ix = 0, iy = 0, iz = 0;
    let isActive = false;
    let isAttracting = false; 
    let isSwirling = false;
    let currentState: string | null = null;
    let isInteracting = false;

    if (hand.isActive) {
        // --- 1. ROTATION LOGIC ---
        if (hand.isRotationGesture) {
            currentState = "ROTATING";
            cooldownRef.current = time + 0.4; // Set cooldown
            
            const deadzone = 0.15;
            let inputX = (hand.position.y - 0.5);
            if (Math.abs(inputX) < deadzone) inputX = 0;
            else inputX = inputX > 0 ? inputX - deadzone : inputX + deadzone;
            
            let inputY = (hand.position.x - 0.5);
            if (Math.abs(inputY) < deadzone) inputY = 0;
            else inputY = inputY > 0 ? inputY - deadzone : inputY + deadzone;

            const rotSpeed = 0.12;
            const dir = isMirrored ? -1 : 1;
            
            pointsRef.current.rotation.x += inputX * rotSpeed * 2.0;
            pointsRef.current.rotation.y += inputY * rotSpeed * 2.0 * dir;

        } 
        // --- 2. ZOOM LOGIC ---
        else if (hand.isZoomGesture) {
            cooldownRef.current = time + 0.4; // Set cooldown
            
            // INVERTED LOGIC: 
            // Pull Down (y > 0.5) = Zoom In
            // Push Up (y < 0.5) = Zoom Out
            const deadzone = 0.08;
            let val = (hand.position.y - 0.5); 
            
            if (Math.abs(val) > deadzone) {
                 val = val > 0 ? val - deadzone : val + deadzone;
                 currentState = val > 0 ? "ZOOMING IN" : "ZOOMING OUT";
                 const zoomSpeed = val * 0.5;
                 
                 const currentDist = camera.position.length();
                 const newDist = currentDist - zoomSpeed;
                 const clampedDist = Math.max(5, Math.min(35, newDist));
                 camera.position.setLength(clampedDist);
            } else {
                currentState = "ZOOM READY";
            }
        }
        // --- 3. PHYSICS INTERACTION (Attract/Repel/Swirl) ---
        else {
            // Check Cooldown to prevent accidental repel after gestures
            if (time < cooldownRef.current) {
                currentState = "STABILIZING";
                isInteracting = false;
            } else {
                // Active Physics
                isActive = true;
                isInteracting = true;
                
                let x = (hand.position.x - 0.5) * 25;
                const y = -(hand.position.y - 0.5) * 20;
                const z = -hand.position.z * 20; 
                if (isMirrored) x = -x;
                ix = x; iy = y; iz = z;
                
                if (hand.pinchStrength > 0.8) {
                    isAttracting = true;
                    currentState = "GRAVITY WELL";
                } else if (hand.pinchStrength > 0.4) {
                    isSwirling = true;
                    currentState = "SWIRLING";
                } else {
                    currentState = "REPELLING";
                }
            }
        }
    } 

    // Update Status Callback
    if (onInteractionStateChange && currentState !== lastStateRef.current) {
        lastStateRef.current = currentState;
        onInteractionStateChange(currentState);
    }

    const geom = pointsRef.current.geometry;
    const positionAttribute = geom.attributes.position;
    const colorAttribute = geom.attributes.color;
    const tmpColor = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];
      
      const tx = targets[idx] * objectScale;
      const ty = targets[idx + 1] * objectScale;
      const tz = targets[idx + 2] * objectScale;

      const hx = (tx - px) * RETURN_SPEED;
      const hy = (ty - py) * RETURN_SPEED;
      const hz = (tz - pz) * RETURN_SPEED;

      let fx = 0, fy = 0, fz = 0;

      if (isInteracting) {
          const dx = px - ix;
          const dy = py - iy;
          const dz = pz - iz;
          const distSq = dx*dx + dy*dy + dz*dz;
          
          if (distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            
            if (isAttracting) {
               const attractRadiusSq = (interactionRadius * 4.0) ** 2;
               if (distSq < attractRadiusSq) { 
                   const force = 0.6 * (attractRadiusSq - distSq) / attractRadiusSq; 
                   fx -= (dx / dist) * force;
                   fy -= (dy / dist) * force;
                   fz -= (dz / dist) * force;
               }
            } else if (isSwirling) {
               const swirlRadiusSq = (interactionRadius * 3.0) ** 2;
               if (distSq < swirlRadiusSq) {
                   const tx_tan = dz;  
                   const ty_tan = 0;   
                   const tz_tan = -dx; 
                   let len = Math.sqrt(tx_tan*tx_tan + ty_tan*ty_tan + tz_tan*tz_tan);
                   if (len < 0.0001) len = 1.0; 
                   const force = 0.8; 
                   fx += (tx_tan / len) * force;
                   fy += (ty_tan / len) * force;
                   fz += (tz_tan / len) * force;
                   const pull = 0.05;
                   fx -= dx * pull;
                   fy -= dy * pull;
                   fz -= dz * pull;
               }
            } else {
               const repelRadiusSq = interactionRadius ** 2; 
               if (distSq < repelRadiusSq) {
                   const force = 1.2 * (1 - dist / Math.sqrt(repelRadiusSq)); 
                   fx += (dx / dist) * force;
                   fy += (dy / dist) * force;
                   fz += (dz / dist) * force;
               }
            }
          }
      }

      velocities[idx] += hx + fx;
      velocities[idx + 1] += hy + fy;
      velocities[idx + 2] += hz + fz;

      velocities[idx] *= FRICTION;
      velocities[idx + 1] *= FRICTION;
      velocities[idx + 2] *= FRICTION;

      positions[idx] += velocities[idx];
      positions[idx + 1] += velocities[idx + 1];
      positions[idx + 2] += velocities[idx + 2];

      if (colorMode === ColorMode.MONO) {
          colors[idx] = 0.1; colors[idx+1] = 0.1; colors[idx+2] = 0.1; 
      } else if (colorMode === ColorMode.HEAT) {
          const speedSq = velocities[idx]**2 + velocities[idx+1]**2 + velocities[idx+2]**2;
          const speed = Math.min(speedSq * 50, 1.0);
          tmpColor.setHSL(0.7 - speed * 0.7, 1.0, 0.4); 
          colors[idx] = tmpColor.r; colors[idx+1] = tmpColor.g; colors[idx+2] = tmpColor.b;
      } else if (colorMode === ColorMode.SPECTRUM) {
          const yNorm = (positions[idx+1] + 4) / 8;
          tmpColor.setHSL(yNorm + time * 0.1, 0.8, 0.45);
          colors[idx] = tmpColor.r; colors[idx+1] = tmpColor.g; colors[idx+2] = tmpColor.b;
      } else if (colorMode === ColorMode.CYBER) {
          const d = Math.sqrt(positions[idx]**2 + positions[idx+1]**2 + positions[idx+2]**2);
          const tVal = (d / 8) - time * 0.2;
          tmpColor.setHSL(0.5 + Math.sin(tVal) * 0.15, 1.0, 0.4); 
          colors[idx] = tmpColor.r; colors[idx+1] = tmpColor.g; colors[idx+2] = tmpColor.b;
      } else if (colorMode === ColorMode.PINK) {
          const yNorm = (positions[idx+1] + 4) / 8;
          tmpColor.setHSL(0.9, 0.8, 0.3 + yNorm * 0.4);
          colors[idx] = tmpColor.r; colors[idx+1] = tmpColor.g; colors[idx+2] = tmpColor.b;
      } else if (colorMode === ColorMode.RAINBOW) {
          const angle = Math.atan2(positions[idx+2], positions[idx]) / (Math.PI * 2) + 0.5;
          const height = (positions[idx+1] + 4) / 8;
          tmpColor.setHSL(angle + time * 0.05, 0.8, 0.4 + height * 0.3);
          colors[idx] = tmpColor.r; colors[idx+1] = tmpColor.g; colors[idx+2] = tmpColor.b;
      } else if (colorMode === ColorMode.FIRE) {
          const speedSq = velocities[idx]**2 + velocities[idx+1]**2 + velocities[idx+2]**2;
          const intensity = Math.min(speedSq * 30 + 0.2, 1.0);
          tmpColor.setHSL(0.05 + intensity * 0.1, 1.0, 0.2 + intensity * 0.3);
          colors[idx] = tmpColor.r; colors[idx+1] = tmpColor.g; colors[idx+2] = tmpColor.b;
      } else if (colorMode === ColorMode.OCEAN) {
          const depth = Math.abs(positions[idx+1]) / 4;
          const wave = Math.sin(positions[idx] * 0.5 + time) * 0.1;
          tmpColor.setHSL(0.55 + wave, 0.7, 0.3 + depth * 0.4);
          colors[idx] = tmpColor.r; colors[idx+1] = tmpColor.g; colors[idx+2] = tmpColor.b;
      }
    }

    positionAttribute.needsUpdate = true;
    if (colorAttribute) colorAttribute.needsUpdate = true;
  });

  return (
    <group>
        <points ref={pointsRef} key={particleCount} frustumCulled={false}>
        <bufferGeometry>
            <bufferAttribute
                attach="attributes-position"
                count={particleCount}
                array={positions}
                itemSize={3}
            />
            <bufferAttribute
                attach="attributes-color"
                count={particleCount}
                array={colors}
                itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial
            vertexColors={true}
            size={0.055} 
            sizeAttenuation={true}
            transparent={true}
            opacity={0.9}
            blending={THREE.NormalBlending} 
            depthWrite={false}
        />
        </points>
    </group>
  );
};

export default ParticleSystem;