import * as THREE from 'three';

export const generateSphere = (count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 2.8 * Math.cbrt(Math.random());
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
};

export const generateCube = (count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  const size = 4.0; 
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * size;
    positions[i * 3 + 1] = (Math.random() - 0.5) * size;
    positions[i * 3 + 2] = (Math.random() - 0.5) * size;
  }
  return positions;
};

export const generateTorus = (count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  const R = 2.2; 
  const tubeR = 0.9; 
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const r = tubeR * Math.sqrt(Math.random());
    const x = (R + r * Math.cos(v)) * Math.cos(u);
    const y = (R + r * Math.cos(v)) * Math.sin(u);
    const z = r * Math.sin(v);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

export const generateHeart = (count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  let i = 0;
  const maxIter = count * 200; 
  let iter = 0;
  while (i < count && iter < maxIter) {
    iter++;
    const x = (Math.random() - 0.5) * 3;
    const y = (Math.random() - 0.5) * 3;
    const z = (Math.random() - 0.5) * 3;
    const x2 = x * x;
    const y2 = y * y;
    const z2 = z * z;
    const a = x2 + (9/4) * y2 + z2 - 1;
    const term = a * a * a - x2 * z2 * z - (9/80) * y2 * z2 * z;
    if (term <= 0) {
      positions[i * 3] = x * 1.5;
      positions[i * 3 + 1] = z * 1.5 + 0.5; 
      positions[i * 3 + 2] = y * 0.5; 
      i++;
    }
  }
  while (i < count) {
      positions[i * 3] = (Math.random() - 0.5);
      positions[i * 3 + 1] = (Math.random() - 0.5);
      positions[i * 3 + 2] = (Math.random() - 0.5);
      i++;
  }
  return positions;
};

export const generateDNA = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Two strands
        const strand = Math.random() > 0.5 ? 0 : Math.PI;
        const t = (Math.random() - 0.5) * 10; // Height
        const radius = 1.5;
        const twist = 1.5; // Twist factor
        
        // Add some thickness to the strands
        const thickness = (Math.random() - 0.5) * 0.4;
        
        positions[i * 3] = Math.cos(t * twist + strand) * radius + thickness;
        positions[i * 3 + 1] = t;
        positions[i * 3 + 2] = Math.sin(t * twist + strand) * radius + thickness;
    }
    return positions;
}

export const generateGalaxy = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    const arms = 3;
    const armWidth = 0.5;
    
    for (let i = 0; i < count; i++) {
        // Choose an arm
        const armIndex = Math.floor(Math.random() * arms);
        const armOffset = (Math.PI * 2 * armIndex) / arms;
        
        // Distance from center (non-uniform distribution)
        const r = Math.pow(Math.random(), 2) * 5; 
        
        // Spiral angle
        const spiral = r * 1.5;
        
        // Random spread inside arm
        const spreadX = (Math.random() - 0.5) * armWidth * (1 + r*0.2);
        const spreadY = (Math.random() - 0.5) * 0.2 * (1 + r*0.1); // Flattened galaxy
        const spreadZ = (Math.random() - 0.5) * armWidth * (1 + r*0.2);
        
        const angle = spiral + armOffset;
        
        positions[i * 3] = Math.cos(angle) * r + spreadX;
        positions[i * 3 + 1] = spreadY;
        positions[i * 3 + 2] = Math.sin(angle) * r + spreadZ;
    }
    return positions;
}

export const generateText = (count: number, text: string): Float32Array => {
  const positions = new Float32Array(count * 3);
  
  const canvas = document.createElement('canvas');
  const width = 250;
  const height = 100;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return generateSphere(count);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const validPixels: number[] = [];
  
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4] > 128) {
      validPixels.push(i);
    }
  }
  
  if (validPixels.length === 0) return generateSphere(count);

  for (let i = 0; i < count; i++) {
    const pixelIndex = validPixels[Math.floor(Math.random() * validPixels.length)];
    const px = pixelIndex % width;
    const py = Math.floor(pixelIndex / width);
    
    const x = (px / width - 0.5) * 9;
    const y = -(py / height - 0.5) * 4; 
    const z = (Math.random() - 0.5) * 1.0; 
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  return positions;
}

export const generateNoise = (count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  return positions;
};