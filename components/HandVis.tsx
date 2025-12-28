import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandData } from '../types';

interface HandVisProps {
  handData: React.MutableRefObject<HandData>;
  isMirrored: boolean;
}

// MediaPipe Hands Connections for Skeleton
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17]             // Palm Edges
];

const HandVis: React.FC<HandVisProps> = ({ handData, isMirrored }) => {
  const jointsRef = useRef<THREE.InstancedMesh>(null);
  const bonesRef = useRef<THREE.InstancedMesh>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Reusable objects to avoid GC
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempVecB = useMemo(() => new THREE.Vector3(), []);

  // Configure Palm Mesh Geometry
  const palmGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array(6 * 3); 
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // Indices to form triangles for the palm mesh
    const indices = [
       0, 2, 3, // Wrist-Index-Mid
       0, 3, 4, // Wrist-Mid-Ring
       0, 4, 5, // Wrist-Ring-Pinky
       0, 1, 2  // Wrist-Thumb-Index (Thumb web)
    ];
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(() => {
    const { isActive, landmarks } = handData.current;

    if (!isActive || landmarks.length === 0) {
       if (jointsRef.current) jointsRef.current.visible = false;
       if (bonesRef.current) bonesRef.current.visible = false;
       if (meshRef.current) meshRef.current.visible = false;
       return;
    }

    if (jointsRef.current) jointsRef.current.visible = true;
    if (bonesRef.current) bonesRef.current.visible = true;
    if (meshRef.current) meshRef.current.visible = true;

    // Helper to map coordinate into target vector
    const setWorldPos = (target: THREE.Vector3, index: number) => {
        const lm = landmarks[index];
        let x = (lm.x - 0.5) * 20;
        const y = -(lm.y - 0.5) * 16;
        const z = -lm.z * 10;
        if (isMirrored) x = -x;
        target.set(x, y, z);
    };

    // 1. Update Skeleton Joints
    if (jointsRef.current) {
        landmarks.forEach((_, i) => {
            setWorldPos(tempVec, i);
            dummy.position.copy(tempVec);
            dummy.scale.setScalar(1);
            dummy.rotation.set(0,0,0);
            dummy.updateMatrix();
            jointsRef.current.setMatrixAt(i, dummy.matrix);
        });
        jointsRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Skeleton Bones
    if (bonesRef.current) {
        CONNECTIONS.forEach((pair, i) => {
            setWorldPos(tempVec, pair[0]);
            setWorldPos(tempVecB, pair[1]);
            
            const dist = tempVec.distanceTo(tempVecB);
            
            // Midpoint
            dummy.position.copy(tempVec).add(tempVecB).multiplyScalar(0.5);
            dummy.lookAt(tempVecB);
            dummy.rotateX(Math.PI / 2);
            dummy.scale.set(1, 1, dist);
            dummy.updateMatrix();
            
            bonesRef.current.setMatrixAt(i, dummy.matrix);
        });
        bonesRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Palm Mesh Vertices
    if (meshRef.current) {
        const posAttr = meshRef.current.geometry.attributes.position;
        // Mapping local palm indices [0..5] to landmark IDs
        const indices = [0, 1, 5, 9, 13, 17]; 
        
        for(let i=0; i<indices.length; i++) {
            setWorldPos(tempVec, indices[i]);
            // Pull palm slightly back
            tempVec.z -= 0.2; 
            posAttr.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
        }
        posAttr.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group>
        {/* Palm Mesh Surface */}
        <mesh ref={meshRef} geometry={palmGeometry}>
            <meshStandardMaterial color="#222" side={THREE.DoubleSide} transparent opacity={0.9} roughness={0.3} />
        </mesh>

        {/* Joints */}
        <instancedMesh ref={jointsRef} args={[undefined, undefined, 21]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#000" roughness={0.1} />
        </instancedMesh>
        
        {/* Bones */}
        <instancedMesh ref={bonesRef} args={[undefined, undefined, CONNECTIONS.length]}>
            <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
            <meshStandardMaterial color="#333" transparent opacity={0.8} />
        </instancedMesh>
    </group>
  );
};

export default HandVis;