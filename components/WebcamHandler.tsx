import React, { useEffect, useRef, useState } from 'react';
import { VisionService } from '../services/visionService';
import { HandData } from '../types';

interface WebcamHandlerProps {
  onHandUpdate: (data: HandData) => void;
  onShapeChangeTrigger?: () => void;
  isMirrored: boolean;
  showPreview?: boolean;
}

const WebcamHandler: React.FC<WebcamHandlerProps> = ({ 
    onHandUpdate, 
    onShapeChangeTrigger,
    isMirrored, 
    showPreview = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const visionService = useRef(VisionService.getInstance());
  
  // Tracking State
  const smoothPos = useRef({ x: 0.5, y: 0.5, z: 0 });
  const smoothPinch = useRef(0);
  
  // Hysteresis State Refs (Sticky gestures)
  const isZoomingRef = useRef(false);
  const isRotatingRef = useRef(false);
  
  // Debounce for shape switching
  const lastShapeSwitchTime = useRef(0);
  
  const SMOOTHING = 0.2; 

  useEffect(() => {
    const startCamera = async () => {
      try {
        await visionService.current.initialize();
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 320, 
            height: 240,
            frameRate: { ideal: 30 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
             setIsCameraActive(true);
             videoRef.current?.play();
          };
        }
      } catch (err) {
        console.error("Camera access denied or failed:", err);
      }
    };

    startCamera();

    return () => {
       if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
       }
    };
  }, []);

  useEffect(() => {
    if (!isCameraActive) return;

    const detectLoop = () => {
      if (videoRef.current) {
        const result = visionService.current.detect(videoRef.current);
        
        if (result && result.landmarks && result.landmarks.length > 0) {
          const hand = result.landmarks[0];
          
          const wrist = hand[0];
          const thumbTip = hand[4];
          const indexTip = hand[8];
          const midMCP = hand[9];
          const middleTip = hand[12];
          const ringTip = hand[16];
          const pinkyTip = hand[20];

          // 1. Hand Size / Normalization
          const handSize = Math.sqrt(
             Math.pow(wrist.x - midMCP.x, 2) + 
             Math.pow(wrist.y - midMCP.y, 2)
          ) || 0.1;

          // 2. Index Pinch (Interaction Strength)
          const pinchDist = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) + 
            Math.pow(indexTip.y - thumbTip.y, 2)
          );
          const normalizedPinch = pinchDist / handSize;
          let rawStrength = 1 - ((normalizedPinch - 0.2) / 0.8);
          rawStrength = Math.max(0, Math.min(1, rawStrength));

          // 3. Zoom Gesture (Middle + Thumb) with Hysteresis
          const zoomDist = Math.sqrt(
            Math.pow(middleTip.x - thumbTip.x, 2) + 
            Math.pow(middleTip.y - thumbTip.y, 2)
          );
          const zoomRatio = zoomDist / handSize;
          
          // Enter zoom if pinch is tight (<0.5), Exit if wide (>0.7)
          if (isZoomingRef.current) {
             if (zoomRatio > 0.7) isZoomingRef.current = false;
          } else {
             if (zoomRatio < 0.45) isZoomingRef.current = true;
          }

          // 4. Rotation Gesture (Pinky + Thumb) with Hysteresis
          const rotationDist = Math.sqrt(
            Math.pow(pinkyTip.x - thumbTip.x, 2) + 
            Math.pow(pinkyTip.y - thumbTip.y, 2)
          );
          const rotationRatio = rotationDist / handSize;

          if (isRotatingRef.current) {
              if (rotationRatio > 0.7) isRotatingRef.current = false;
          } else {
              if (rotationRatio < 0.45) isRotatingRef.current = true;
          }

          // 5. Shape Switch (Ring + Thumb)
          if (onShapeChangeTrigger) {
              const shapeDist = Math.sqrt(
                Math.pow(ringTip.x - thumbTip.x, 2) + 
                Math.pow(ringTip.y - thumbTip.y, 2)
              );
              if ((shapeDist / handSize) < 0.45) {
                  const now = Date.now();
                  if (now - lastShapeSwitchTime.current > 1500) {
                      onShapeChangeTrigger();
                      lastShapeSwitchTime.current = now;
                  }
              }
          }

          // 6. Smoothing
          const rawX = (wrist.x + midMCP.x) / 2;
          const rawY = (wrist.y + midMCP.y) / 2;
          const rawZ = midMCP.z;

          smoothPos.current.x += (rawX - smoothPos.current.x) * SMOOTHING;
          smoothPos.current.y += (rawY - smoothPos.current.y) * SMOOTHING;
          smoothPos.current.z += (rawZ - smoothPos.current.z) * SMOOTHING;
          smoothPinch.current += (rawStrength - smoothPinch.current) * (SMOOTHING * 0.5);

          onHandUpdate({
            isActive: true,
            landmarks: hand,
            position: { 
                x: smoothPos.current.x, 
                y: smoothPos.current.y,
                z: smoothPos.current.z 
            }, 
            pinchStrength: smoothPinch.current,
            isRotationGesture: isRotatingRef.current,
            isZoomGesture: isZoomingRef.current
          });

        } else {
           // Reset sticky states on loss of tracking
           isZoomingRef.current = false;
           isRotatingRef.current = false;

           onHandUpdate({
            isActive: false,
            landmarks: [],
            position: { x: 0.5, y: 0.5, z: 0 },
            pinchStrength: 0,
            isRotationGesture: false,
            isZoomGesture: false
           });
        }
      }
      requestRef.current = requestAnimationFrame(detectLoop);
    };

    requestRef.current = requestAnimationFrame(detectLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraActive, onHandUpdate, onShapeChangeTrigger]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white transition-all duration-300 ${showPreview ? 'opacity-100' : 'opacity-0 scale-0'}`}>
      <video
        ref={videoRef}
        className={`w-32 h-24 object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        playsInline
        muted
      />
      {!isCameraActive && showPreview && (
         <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-xs text-gray-400">
           Starting...
         </div>
      )}
      {showPreview && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-black text-[9px] p-1 text-center border-t border-gray-100 font-medium">
           Tracking Active
        </div>
      )}
    </div>
  );
};

export default WebcamHandler;