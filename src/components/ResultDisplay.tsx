import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Activity } from "lucide-react";

interface ResultDisplayProps {
  result: "real" | "fake" | null;
  confidence: number;
  isAnalyzing: boolean;
}

const ResultDisplay = ({ result, confidence, isAnalyzing }: ResultDisplayProps) => {
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full p-6 rounded-xl bg-card border border-border"
      >
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-mono text-sm text-primary">ANALYZING...</span>
        </div>
        <div className="space-y-3">
          {["Extracting frames", "Detecting faces", "Running CNN model", "Computing confidence"].map(
            (step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.6 }}
                className="flex items-center gap-2 text-sm"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                />
                <span className="text-muted-foreground font-mono">{step}...</span>
              </motion.div>
            )
          )}
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const isReal = result === "real";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20 }}
      className={`w-full p-6 rounded-xl border ${
        isReal
          ? "bg-success/5 border-success/30"
          : "bg-destructive/5 border-destructive/30"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-xl ${
            isReal ? "bg-success/10" : "bg-destructive/10"
          }`}
        >
          {isReal ? (
            <ShieldCheck className="w-8 h-8 text-success" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-destructive" />
          )}
        </div>
        <div className="flex-1">
          <h3
            className={`text-2xl font-mono font-bold ${
              isReal ? "text-success" : "text-destructive"
            }`}
          >
            {isReal ? "REAL" : "FAKE"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Detection complete
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold text-foreground">
            {confidence}%
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            CONFIDENCE
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-4 w-full h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            isReal ? "bg-success" : "bg-destructive"
          }`}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground font-mono">
        ⚠ Simulated result — connect a real CNN backend for actual detection
      </p>
    </motion.div>
  );
};

export default ResultDisplay;
