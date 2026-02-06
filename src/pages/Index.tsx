import { useState, useCallback } from "react";
import { Brain, Upload, Film, Camera, Monitor } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ResultDisplay from "@/components/ResultDisplay";
import WebcamCapture from "@/components/WebcamCapture";

// Change this to your Flask backend URL when running locally
const API_URL = "http://localhost:5000";

type InputMode = "image" | "video" | "webcam";

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<"real" | "fake" | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [mode, setMode] = useState<InputMode>("image");
  const [extraInfo, setExtraInfo] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setResult(null);
    setExtraInfo(null);
    setIsAnalyzing(true);

    const isVideo = file.type.startsWith("video/");
    const endpoint = isVideo ? "/predict/video" : "/predict/image";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setExtraInfo(data.error);
        setResult(null);
      } else {
        setResult(data.result as "real" | "fake");
        setConfidence(data.confidence);
        if (data.frames_analyzed) {
          setExtraInfo(
            `Analyzed ${data.frames_analyzed} frames — ${data.real_frames} real, ${data.fake_frames} fake`
          );
        }
      }
    } catch {
      // If backend is not running, fall back to simulated result
      const duration = isVideo ? 3000 : 2000;
      await new Promise((r) => setTimeout(r, duration));
      const isFake = Math.random() > 0.5;
      setResult(isFake ? "fake" : "real");
      setConfidence(Math.floor(Math.random() * 15) + 85);
      setExtraInfo("⚠ Simulated — Flask backend not running");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleWebcamResult = useCallback((res: "real" | "fake", conf: number) => {
    setResult(res);
    setConfidence(conf);
  }, []);

  const modes: { key: InputMode; label: string; icon: React.ReactNode }[] = [
    { key: "image", label: "Image", icon: <Upload className="w-4 h-4" /> },
    { key: "video", label: "Video", icon: <Film className="w-4 h-4" /> },
    { key: "webcam", label: "Webcam", icon: <Camera className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono text-sm font-semibold text-foreground tracking-tight">
              DeepFake Detector
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-secondary">
            CNN v1.0
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">
            Deepfake Face Detection
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Upload an image, video, or use your webcam to detect whether a face is{" "}
            <span className="text-success font-medium">real</span> or{" "}
            <span className="text-destructive font-medium">fake</span>{" "}
            using a Convolutional Neural Network.
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setResult(null);
                setExtraInfo(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-colors border ${
                mode === m.key
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:border-primary/20"
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Input area based on mode */}
        <div className="space-y-6">
          {mode === "webcam" ? (
            <WebcamCapture onResult={handleWebcamResult} apiUrl={API_URL} />
          ) : (
            <FileUpload
              onFileSelect={handleFileSelect}
              isAnalyzing={isAnalyzing}
              acceptType={mode === "video" ? "video" : "image"}
            />
          )}

          {mode !== "webcam" && (
            <ResultDisplay
              result={result}
              confidence={confidence}
              isAnalyzing={isAnalyzing}
            />
          )}

          {extraInfo && (
            <p className="text-xs text-muted-foreground font-mono text-center">{extraInfo}</p>
          )}
        </div>

        {/* How it works */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "Upload",
              desc: "Drop an image/video or use webcam for live detection",
            },
            {
              step: "02",
              title: "Process",
              desc: "Frames extracted, faces detected with OpenCV & preprocessed",
            },
            {
              step: "03",
              title: "Classify",
              desc: "CNN model (Conv→ReLU→Pool→Dense→Sigmoid) outputs Real/Fake",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <span className="text-xs font-mono text-primary">{item.step}</span>
              <h3 className="font-mono font-semibold text-foreground mt-1 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CNN Architecture info */}
        <div className="mt-10 p-5 rounded-xl bg-card border border-border">
          <h3 className="font-mono font-semibold text-foreground mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            CNN Architecture
          </h3>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {[
              "Input 128×128×3",
              "Conv2D(32)",
              "ReLU",
              "MaxPool",
              "Conv2D(64)",
              "ReLU",
              "MaxPool",
              "Conv2D(128)",
              "ReLU",
              "MaxPool",
              "Flatten",
              "Dense(128)",
              "Dropout(0.5)",
              "Sigmoid",
            ].map((layer) => (
              <span
                key={layer}
                className="px-2 py-1 rounded bg-secondary text-secondary-foreground"
              >
                {layer}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            The CNN learns hierarchical features: edges → textures → facial artifacts.
            Deepfakes often have subtle blending boundaries and inconsistent skin textures
            that the network learns to detect.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            College Project — CNN + TensorFlow/Keras + Flask + OpenCV
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
