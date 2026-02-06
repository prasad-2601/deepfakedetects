import { useCallback, useState } from "react";
import { Upload, Image, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  acceptType?: "image" | "video";
}

const FileUpload = ({ onFileSelect, isAnalyzing, acceptType }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) return;
      if (acceptType === "image" && !isImage) return;
      if (acceptType === "video" && !isVideo) return;

      setFileType(isImage ? "image" : "video");
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <motion.label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full min-h-[280px]
          rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300
          ${isDragging ? "border-primary bg-primary/5 glow-primary" : "border-border hover:border-primary/50 bg-card"}
          ${isAnalyzing ? "pointer-events-none opacity-60" : ""}
        `}
        whileHover={{ scale: isAnalyzing ? 1 : 1.01 }}
        whileTap={{ scale: isAnalyzing ? 1 : 0.99 }}
      >
        <input
          type="file"
          accept={acceptType === "video" ? "video/*" : acceptType === "image" ? "image/*" : "image/*,video/*"}
          onChange={handleChange}
          className="hidden"
          disabled={isAnalyzing}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full flex items-center justify-center p-4"
            >
              {fileType === "image" ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-[240px] rounded-lg object-contain"
                />
              ) : (
                <video
                  src={preview}
                  className="max-h-[240px] rounded-lg object-contain"
                  controls={false}
                  muted
                  autoPlay
                  loop
                />
              )}
              {isAnalyzing && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="scan-line absolute inset-0" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 p-8"
            >
              <div className="flex gap-3">
                <div className="p-3 rounded-lg bg-secondary">
                  <Image className="w-6 h-6 text-primary" />
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <Film className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium mb-1">
                  Drop an image or video here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="w-3 h-3" />
                <span>JPG, PNG, MP4, AVI supported</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>
    </div>
  );
};

export default FileUpload;
