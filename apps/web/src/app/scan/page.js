"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Camera, RotateCcw, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

// Visual Styling Configuration
const MESH_COLOR = "#a855f7";       // Purple-500 for 478 points
const CONTOUR_COLOR = "rgba(168, 85, 247, 0.75)";  // Purple-500 with opacity for contour line
const BRACKET_COLOR = "#a855f7";     // Purple-500 for dynamic bounding box corners

// Indices for the silhouette/contour of the face
const CONTOUR_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

export default function ScanPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedImg, setCapturedImg] = useState(null);
  const [flash, setFlash] = useState(false);
  const [hideUI, setHideUI] = useState(false);

  // Flicker tracking state for console logs
  const isTrackingRef = useRef(false);

  const initializingRef = useRef(false);

  // Dynamic initialization of MediaPipe Landmarker
  const initMediaPipe = useCallback(async () => {
    if (initializingRef.current || landmarkerRef.current) return;
    initializingRef.current = true;
    try {
      setLoading(true);
      setErrorMsg("");

      const vision = await import("@mediapipe/tasks-vision");
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      // Temporarily suppress console.info and console.error to hide XNNPACK logs
      const originalInfo = console.info;
      const originalError = console.error;
      console.info = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('XNNPACK')) return;
        originalInfo(...args);
      };
      console.error = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('XNNPACK')) return;
        originalError(...args);
      };

      const landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1 // Keep it strictly 1 face
      });

      // Restore console logs
      console.info = originalInfo;
      console.error = originalError;

      landmarkerRef.current = landmarker;
      setLoading(false);
      await startCamera();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load face detection model. Please check connection.");
      setLoading(false);
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const startCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((playErr) => {
          console.log("Play request interrupted or handled safely:", playErr.message);
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Camera access denied or unavailable.");
    }
  };

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
  }, []);

  // Frame processing loop
  useEffect(() => {
    if (loading || errorMsg || capturedImg) return;

    let lastVideoTime = -1;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (video && canvas && landmarker && video.readyState >= 2) {
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let timestamp = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const result = landmarker.detectForVideo(video, timestamp);

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            
            if (!isTrackingRef.current) {
              isTrackingRef.current = true;
              console.info("[DEBUG] Face Tracking: STABLE");
            }

            // Only process the first face (since numFaces is 1)
            const landmarksToDraw = result.faceLandmarks[0];
            
            // 1. Calculate dynamic bounding box from landmarks
            let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
            landmarksToDraw.forEach((pt) => {
              const x = pt.x * canvas.width;
              const y = pt.y * canvas.height;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            });

            // Add margin to bounding box
            const marginX = (maxX - minX) * 0.15;
            const marginY = (maxY - minY) * 0.15;
            minX = Math.max(0, minX - marginX);
            maxX = Math.min(canvas.width, maxX + marginX);
            minY = Math.max(0, minY - marginY);
            maxY = Math.min(canvas.height, maxY + marginY);

            const w = maxX - minX;
            const h = maxY - minY;

            // 2. Draw dynamic bounding box (with curved corner brackets)
            ctx.strokeStyle = BRACKET_COLOR;
            ctx.lineWidth = 3.5;
            const len = Math.min(w, h) * 0.18;
            const r = 12; // corner radius for the curve
            
            ctx.beginPath();
            // Top-left
            ctx.moveTo(minX + len, minY);
            ctx.arcTo(minX, minY, minX, minY + len, r);
            ctx.lineTo(minX, minY + len);
            
            // Bottom-left
            ctx.moveTo(minX, maxY - len);
            ctx.arcTo(minX, maxY, minX + len, maxY, r);
            ctx.lineTo(minX + len, maxY);
            
            // Bottom-right
            ctx.moveTo(maxX - len, maxY);
            ctx.arcTo(maxX, maxY, maxX, maxY - len, r);
            ctx.lineTo(maxX, maxY - len);
            
            // Top-right
            ctx.moveTo(maxX, minY + len);
            ctx.arcTo(maxX, minY, maxX - len, minY, r);
            ctx.lineTo(maxX - len, minY);
            ctx.stroke();

            // 3. Draw dynamic oval outline enclosing the face landmarks (smooth path)
            ctx.strokeStyle = CONTOUR_COLOR;
            ctx.lineWidth = 3;
            ctx.beginPath();
            CONTOUR_INDICES.forEach((index, i) => {
              const pt = landmarksToDraw[index];
              if (pt) {
                const x = pt.x * canvas.width;
                const y = pt.y * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
            });
            ctx.closePath();
            ctx.stroke();

            // 4. Draw all 478 landmarks as small glowing dots
            ctx.fillStyle = MESH_COLOR;
            landmarksToDraw.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 1.8, 0, 2 * Math.PI);
              ctx.fill();
            });
          } else {
            if (isTrackingRef.current) {
              isTrackingRef.current = false;
              console.warn(`[DEBUG - FLICKER DETECTED] Face tracking lost at frame timestamp: ${timestamp.toFixed(2)}ms`);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(processFrame);
    };

    rafRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading, errorMsg, capturedImg]);

  // Start initialization
  useEffect(() => {
    initMediaPipe();
    return () => {
      stopCamera();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [initMediaPipe, stopCamera]);

  // Click Selfie action
  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImg(dataUrl);
    stopCamera();
  };

  const retakeSelfie = () => {
    setCapturedImg(null);
    setHideUI(false);
    startCamera();
  };

  return (
    <div className="relative w-full h-screen bg-white dark:bg-zinc-950 overflow-hidden flex flex-col justify-between">
      {/* Camera Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-fade-out pointer-events-none" />}

      {/* Back Link */}
      {(!capturedImg || !hideUI) && (
        <div className="absolute top-6 left-6 z-30">
          <Link href="/" className="flex items-center gap-2 bg-black/20 hover:bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all border border-white/10">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      )}

      {/* Toggle UI Button (Only in Captured Preview) */}
      {capturedImg && (
        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={() => setHideUI(!hideUI)}
            className="flex items-center justify-center w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
          >
            {hideUI ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      )}

      {capturedImg ? (
        /* Captured Preview Mode - full bleed */
        <div className="absolute inset-0 w-full h-full z-20 bg-black flex flex-col justify-between">
          <div className="absolute inset-0 w-full h-full">
            <img src={capturedImg} alt="Selfie capture" className="w-full h-full object-cover" />
            {!hideUI && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />}
          </div>

          {!hideUI && (
            <div className="absolute bottom-6 left-0 right-0 z-30 flex flex-row gap-3 w-full max-w-md mx-auto px-6">
              <button
                onClick={retakeSelfie}
                className="flex flex-1 items-center justify-center gap-2 py-3.5 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white font-medium rounded-full transition-all border border-white/20 text-sm"
              >
                <RotateCcw size={16} /> Retake
              </button>
              <Link
                href="/"
                className="flex flex-1 items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full shadow-xl transition-all text-center text-sm"
              >
                <Check size={16} /> Use Photo
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Live Camera Scan Mode - full bleed */
        <>
          {/* Loader / Initialization state */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-white dark:bg-zinc-950 gap-5">
              <div className="w-14 h-14 border-[5px] border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-900 dark:text-zinc-100 text-base font-semibold tracking-wide">Initializing Face Scan...</p>
            </div>
          )}

          {/* Error state */}
          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-white dark:bg-zinc-950 p-6 text-center gap-4">
              <p className="text-red-400 font-semibold text-sm">{errorMsg}</p>
              <button
                onClick={initMediaPipe}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-all"
              >
                <RotateCcw size={16} /> Try Again
              </button>
            </div>
          )}

          {/* Video element - full bleed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Dynamic canvas drawing - full bleed */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Subtle Screen Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none z-10" />

          {/* Spacer to push button to the bottom */}
          <div />

          {/* Floating Single Action Button at bottom */}
          <div className="relative z-30 w-full max-w-xs mx-auto px-6 pb-4">
            <button
              onClick={captureSelfie}
              disabled={loading || !!errorMsg}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-full shadow-[0_8px_30px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98] text-sm"
            >
              <Camera size={18} />
              <span>Tap to click selfie</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
