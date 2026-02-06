import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, CameraOff } from "lucide-react";

interface WebcamCaptureProps {
  onResult: (result: "real" | "fake", confidence: number) => void;
  apiUrl: string;
}

const WebcamCapture = ({ onResult, apiUrl }: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>("Click to start webcam");
  const [lastResult, setLastResult] = useState<{ label: string; confidence: number } | null>(null);

  // Start webcam stream
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setStatus("Webcam active — analyzing frames...");
      }
    } catch {
      setStatus("Could not access webcam. Check permissions.");
    }
  }, []);

  // Stop webcam stream
  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setStatus("Webcam stopped");
    setLastResult(null);
  }, []);

  // Capture a frame and send to backend
  const captureAndPredict = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("frame", blob, "frame.jpg");

      try {
        const res = await fetch(`${apiUrl}/predict/frame`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.result && data.result !== "no_face") {
          setLastResult({ label: data.result, confidence: data.confidence });
          onResult(data.result as "real" | "fake", data.confidence);
          setStatus(`Detected: ${data.result.toUpperCase()} (${data.confidence}%)`);
        } else {
          setStatus("No face detected — point camera at a face");
          setLastResult(null);
        }
      } catch {
        setStatus("Backend not reachable — is Flask running?");
      }
    }, "image/jpeg", 0.8);
  }, [apiUrl, onResult]);

  // Start/stop frame capture interval when webcam is active
  useEffect(() => {
    if (isActive) {
      // Send a frame every 1.5 seconds
      intervalRef.current = setInterval(captureAndPredict, 1500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, captureAndPredict]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopWebcam();
  }, [stopWebcam]);

  return (
    <div className="w-full">
      <div className="relative w-full rounded-xl overflow-hidden bg-card border border-border">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full aspect-video object-cover ${!isActive ? "hidden" : ""}`}
        />
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay when active */}
        {isActive && lastResult && (
          <div
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
              lastResult.label === "real"
                ? "bg-success/90 text-success-foreground"
                : "bg-destructive/90 text-destructive-foreground"
            }`}
          >
            {lastResult.label.toUpperCase()} {lastResult.confidence}%
          </div>
        )}

        {/* Placeholder when not active */}
        {!isActive && (
          <div className="w-full aspect-video flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={isActive ? stopWebcam : startWebcam}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-medium transition-colors ${
            isActive
              ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
              : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
          }`}
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4" /> Stop Webcam
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" /> Start Webcam
            </>
          )}
        </button>
        <span className="text-xs text-muted-foreground font-mono">{status}</span>
      </div>
    </div>
  );
};

export default WebcamCapture;
