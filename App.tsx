import React, { useState, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ParticleSystem from './components/ParticleSystem';
import WebcamHandler from './components/WebcamHandler';
import { HandData, ShapeType, ColorMode } from './types';

// Icons
const CubeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const CircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
  </svg>
);
const TorusIcon = () => (
   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" />
   </svg>
)
const HeartIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
)
const DnaIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3M4 18c0 1.657 3.582 3 8 3s8-1.343 8-3" />
    </svg>
)
const GalaxyIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 7l-10 10M17 17L7 7" />
    </svg>
)
const TextIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);
const GithubIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
)

const App: React.FC = () => {
  const [shape, setShape] = useState<ShapeType>(ShapeType.SPHERE);
  const [colorMode, setColorMode] = useState<ColorMode>(ColorMode.MONO);
  const [particleCount] = useState<number>(15000);
  const [objectScale, setObjectScale] = useState<number>(1.0);
  const [interactionRadius, setInteractionRadius] = useState<number>(3.5);
  const [inputText, setInputText] = useState("VOX");
  const [interactionStatus, setInteractionStatus] = useState<string | null>(null);
  const [uiVisible, setUiVisible] = useState<boolean>(true);
  const [webcamVisible, setWebcamVisible] = useState<boolean>(false);
  
  const handDataRef = useRef<HandData>({
    isActive: false,
    landmarks: [],
    position: { x: 0.5, y: 0.5, z: 0 },
    pinchStrength: 0,
    isRotationGesture: false,
    isZoomGesture: false
  });

  const controlsRef = useRef<any>(null);

  const handleHandUpdate = useCallback((data: HandData) => {
    handDataRef.current = data;
  }, []);

  const handleInteractionChange = useCallback((state: string | null) => {
    setInteractionStatus(state);
  }, []);

  const cycleShape = useCallback(() => {
    setShape((prevShape) => {
        const shapes = [
            ShapeType.SPHERE,
            ShapeType.CUBE,
            ShapeType.GALAXY,
            ShapeType.DNA,
            ShapeType.TORUS,
            ShapeType.HEART,
            ShapeType.TEXT
        ];
        const currentIndex = shapes.indexOf(prevShape);
        const nextIndex = (currentIndex + 1) % shapes.length;
        return shapes[nextIndex];
    });
  }, []);

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const toggleUI = useCallback(() => {
    setUiVisible(prev => !prev);
  }, []);

  const toggleWebcam = useCallback(() => {
    setWebcamVisible(prev => !prev);
  }, []);

  // Camera Controller Component
  const CameraController = () => {
    const { controls } = useThree();
    React.useEffect(() => {
      if (controls) {
        controlsRef.current = controls;
      }
    }, [controls]);
    return null;
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        toggleUI();
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetCamera();
      } else if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        toggleWebcam();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleUI, resetCamera, toggleWebcam]);

  return (
    <div className="relative w-full h-full bg-white selection:bg-black selection:text-white overflow-hidden font-sans">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0 bg-white">
        <Canvas camera={{ position: [0, 0, 14], fov: 45 }}>
          <CameraController />
          <ambientLight intensity={0.6} />
          <ParticleSystem 
            handData={handDataRef} 
            shapeType={shape} 
            colorMode={colorMode}
            particleCount={particleCount}
            objectScale={objectScale}
            interactionRadius={interactionRadius}
            textInput={inputText}
            isMirrored={true}
            onInteractionStateChange={handleInteractionChange}
          />
          <OrbitControls 
            ref={controlsRef}
            enableZoom={true} 
            enablePan={false} 
            minDistance={5} 
            maxDistance={25} 
            autoRotate={false}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* Header */}
      <div className={`absolute top-0 left-0 p-8 z-10 pointer-events-none text-black transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="pointer-events-auto">
          <h1 className="text-4xl font-light tracking-tighter mb-2">
            Vox<span className="font-bold">Space</span>
          </h1>
          <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed">
            Volumetric Particle Engine.<br/>
          </p>
        </div>
      </div>

      {/* Interaction Status Indicator */}
      {interactionStatus && (
          <div className={`absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg animate-pulse">
                  {interactionStatus}
              </div>
          </div>
      )}

      {/* Settings Panel - Middle Right */}
      <div className={`absolute top-1/2 right-8 -translate-y-1/2 z-10 flex flex-col gap-3 items-end pointer-events-none transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
         <div className="pointer-events-auto bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-200 shadow-xl flex flex-col gap-5 w-60">
            
            {/* Visuals Section */}
            <div>
                 <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-wider">Color Mode</span>
                 <select
                   value={colorMode}
                   onChange={(e) => setColorMode(e.target.value as ColorMode)}
                   className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 focus:border-black focus:outline-none transition-colors"
                 >
                   {Object.values(ColorMode).map(mode => (
                     <option key={mode} value={mode}>
                       {mode}
                     </option>
                   ))}
                 </select>
            </div>

            {/* Object Scale Slider */}
            <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-2 font-medium">
                    <span>Object Size</span>
                    <span>{objectScale.toFixed(1)}x</span>
                </div>
                <input 
                    type="range" 
                    min="0.5" 
                    max="2.5" 
                    step="0.1"
                    value={objectScale}
                    onChange={(e) => setObjectScale(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
            </div>

             {/* Interaction Radius Slider */}
             <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-2 font-medium">
                    <span>Interact Sphere</span>
                    <span>{interactionRadius.toFixed(1)}</span>
                </div>
                <input 
                    type="range" 
                    min="1.0" 
                    max="8.0" 
                    step="0.5"
                    value={interactionRadius}
                    onChange={(e) => setInteractionRadius(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
            </div>

         </div>
      </div>

      {/* Left Shape Selector */}
      <div className={`absolute left-8 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3 pointer-events-none transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="pointer-events-auto flex flex-col gap-2">
             {[
                { type: ShapeType.SPHERE, Icon: CircleIcon, label: 'Sphere' },
                { type: ShapeType.CUBE, Icon: CubeIcon, label: 'Cube' },
                { type: ShapeType.GALAXY, Icon: GalaxyIcon, label: 'Galaxy' },
                { type: ShapeType.DNA, Icon: DnaIcon, label: 'DNA' },
                { type: ShapeType.TORUS, Icon: TorusIcon, label: 'Torus' },
                { type: ShapeType.HEART, Icon: HeartIcon, label: 'Heart' },
             ].map((item) => (
                <button 
                    key={item.type}
                    onClick={() => setShape(item.type)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 w-40 group backdrop-blur-sm shadow-sm ${shape === item.type ? 'bg-black text-white border-black translate-x-2 shadow-lg' : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:translate-x-1'}`}
                >
                    <item.Icon />
                    <span className="text-xs font-medium tracking-wide">{item.label}</span>
                </button>
             ))}

            <div className={`flex flex-col gap-2 p-3 rounded-xl border transition-all duration-300 w-40 backdrop-blur-sm shadow-sm ${shape === ShapeType.TEXT ? 'border-black bg-gray-50 translate-x-2' : 'border-gray-200 bg-white hover:border-black'}`}
                >
                <button 
                    onClick={() => setShape(ShapeType.TEXT)}
                    className={`flex items-center gap-3 w-full mb-1 ${shape === ShapeType.TEXT ? 'text-black' : 'text-gray-500'}`}
                >
                    <TextIcon />
                    <span className="text-xs font-medium">Text</span>
                </button>
                <input 
                    type="text" 
                    maxLength={8}
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value.toUpperCase());
                        if(shape !== ShapeType.TEXT) setShape(ShapeType.TEXT);
                    }}
                    className={`w-full bg-transparent border-b outline-none py-1 text-xs font-mono tracking-widest text-center pointer-events-auto ${shape === ShapeType.TEXT ? 'border-black text-black placeholder-black/30' : 'border-gray-200 text-gray-500 placeholder-gray-300 focus:border-black'}`}
                    placeholder="TYPE"
                />
            </div>
          </div>
      </div>

      {/* Guide - Bottom Right */}
      <div className={`absolute bottom-6 right-8 z-10 pointer-events-none text-right transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2 w-56">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
             <span className="text-[10px] uppercase font-bold text-gray-400">Gesture Control</span>
          </div>
          <div className="space-y-1.5 mt-1">
            <div className="flex justify-between text-[10px] text-gray-500">
               <span>Open Hand</span> <span className="text-black font-medium">Repel</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
               <span>Pinch</span> <span className="text-black font-medium">Gravity Well</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
               <span>Closed Fist / Claw</span> <span className="text-black font-medium">Swirling</span>
            </div>
             <div className="flex justify-between text-[10px] text-gray-500">
               <span>Pinky+Thumb</span> <span className="text-black font-medium">Rotate</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
               <span>Middle+Thumb</span> <span className="text-black font-medium">Pull Down to Zoom In / Push Up to Zoom Out</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
               <span>Ring+Thumb</span> <span className="text-black font-medium">Change Shape</span>
            </div>
          </div>
        </div>
      </div>

      {/* Webcam (Top Right) */}
      <div className="absolute top-6 right-8 z-40">
        <WebcamHandler 
            onHandUpdate={handleHandUpdate} 
            onShapeChangeTrigger={cycleShape}
            isMirrored={true} 
            showPreview={webcamVisible} 
        />
      </div>
      
      {/* Bottom Controls */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex gap-3">
          <button
            onClick={resetCamera}
            className="px-4 py-2 bg-white/90 backdrop-blur-md text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-white transition-all shadow-sm"
            title="Reset Camera (R)"
          >
            Reset Camera (R)
          </button>
          <button
            onClick={toggleWebcam}
            className="px-4 py-2 bg-white/90 backdrop-blur-md text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-white transition-all shadow-sm"
            title="Toggle Webcam (C)"
          >
            {webcamVisible ? 'Hide Webcam (C)' : 'Show Webcam (C)'}
          </button>
          <button
            onClick={toggleUI}
            className="px-4 py-2 bg-white/90 backdrop-blur-md text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-white transition-all shadow-sm"
            title="Hide UI (H)"
          >
            {uiVisible ? 'Hide UI (H)' : 'Show UI (H)'}
          </button>
        </div>
      </div>
      
      {/* Footer Credits */}
      <div className={`absolute bottom-6 left-8 z-10 pointer-events-auto transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <a 
            href="https://github.com/VoxDroid" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col gap-1 text-[10px] text-gray-400 hover:text-black transition-colors"
        >
           <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 group-hover:underline">Made by VoxDroid</span>
              <GithubIcon />
           </div>
        </a>
      </div>

    </div>
  );
};

export default App;