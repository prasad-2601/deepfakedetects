import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, Github, BookOpen } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ResultDisplay from "@/components/ResultDisplay";

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<"real" | "fake" | null>(null);
  const [confidence, setConfidence] = useState(0);

  const handleFileSelect = useCallback((file: File) => {
    setResult(null);
    setIsAnalyzing(true);

    // Simulate CNN analysis (replace with real API call)
    const duration = file.type.startsWith("video/") ? 4000 : 2500;
    setTimeout(() => {
      const isFake = Math.random() > 0.5;
      const conf = Math.floor(Math.random() * 15) + 85; // 85-99%
      setResult(isFake ? "fake" : "real");
      setConfidence(conf);
      setIsAnalyzing(false);
    }, duration);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-primary">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono text-sm font-semibold text-foreground tracking-tight">
              DeepFake Detector
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-secondary">
              CNN v1.0
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">
            Deepfake Face Detection
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Upload an image or video to detect whether the face is{" "}
            <span className="text-success font-medium">real</span> or{" "}
            <span className="text-destructive font-medium">fake</span>{" "}
            using a Convolutional Neural Network.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <FileUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
          <ResultDisplay
            result={result}
            confidence={confidence}
            isAnalyzing={isAnalyzing}
          />
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              step: "01",
              title: "Upload",
              desc: "Drop an image or video containing a face",
            },
            {
              step: "02",
              title: "Process",
              desc: "Frames extracted, faces detected & preprocessed",
            },
            {
              step: "03",
              title: "Classify",
              desc: "CNN model outputs Real/Fake with confidence",
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
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            College Project — Classroom Demo Only
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-mono">CNN + TensorFlow/Keras</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
