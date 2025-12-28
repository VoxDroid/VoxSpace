import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult
} from "@mediapipe/tasks-vision";

export class VisionService {
  private static instance: VisionService;
  private handLandmarker: HandLandmarker | null = null;
  private runningMode: "IMAGE" | "VIDEO" = "VIDEO";
  
  private constructor() {}

  public static getInstance(): VisionService {
    if (!VisionService.instance) {
      VisionService.instance = new VisionService();
    }
    return VisionService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.handLandmarker) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: this.runningMode,
        numHands: 1
      });
      console.log("Vision Service Initialized");
    } catch (error) {
      console.error("Failed to initialize vision service:", error);
      throw error;
    }
  }

  public detect(videoElement: HTMLVideoElement): HandLandmarkerResult | null {
    if (!this.handLandmarker) return null;
    
    // Only detect if video has enough data
    if (videoElement.readyState < 2) return null;

    // Use current time for video frame timestamp
    const startTimeMs = performance.now();
    return this.handLandmarker.detectForVideo(videoElement, startTimeMs);
  }
}