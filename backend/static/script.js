// ===== Configuration =====
const API_URL = "";  // Same origin when served by Flask

// ===== State =====
let currentMode = "image";
let selectedFile = null;
let webcamStream = null;
let webcamInterval = null;

// ===== DOM Elements =====
const fileInput    = document.getElementById("file-input");
const dropZone     = document.getElementById("drop-zone");
const uploadArea   = document.getElementById("upload-area");
const webcamArea   = document.getElementById("webcam-area");
const resultArea   = document.getElementById("result-area");
const loadingArea  = document.getElementById("loading-area");
const analyzeBtn   = document.getElementById("analyze-btn");
const previewContainer = document.getElementById("preview-container");
const imagePreview = document.getElementById("image-preview");
const videoPreview = document.getElementById("video-preview");

// ===== Mode Switching =====
function switchMode(mode) {
  currentMode = mode;
  selectedFile = null;

  // Update active button
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  // Hide everything, then show relevant area
  uploadArea.style.display   = "none";
  webcamArea.style.display   = "none";
  resultArea.style.display   = "none";
  loadingArea.style.display  = "none";
  hidePreview();

  if (mode === "webcam") {
    webcamArea.style.display = "block";
    stopWebcam(); // reset state
  } else {
    uploadArea.style.display = "block";
    // Update accepted file types
    fileInput.accept = mode === "video" ? "video/*" : "image/*";
  }
}

// ===== File Upload Handling =====

// Click to open file picker
dropZone.addEventListener("click", () => fileInput.click());

// Drag & drop events
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// File input change
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  selectedFile = file;
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) return;

  // Show preview
  previewContainer.style.display = "block";
  const url = URL.createObjectURL(file);

  if (isImage) {
    imagePreview.src = url;
    imagePreview.style.display = "block";
    videoPreview.style.display = "none";
  } else {
    videoPreview.src = url;
    videoPreview.style.display = "block";
    imagePreview.style.display = "none";
  }

  analyzeBtn.style.display = "block";
  resultArea.style.display = "none";
}

function hidePreview() {
  previewContainer.style.display = "none";
  imagePreview.style.display = "none";
  videoPreview.style.display = "none";
  analyzeBtn.style.display = "none";
}

// ===== Analyze File (Image or Video) =====
async function analyzeFile() {
  if (!selectedFile) return;

  const isVideo = selectedFile.type.startsWith("video/");
  const endpoint = isVideo ? "/predict/video" : "/predict/image";

  // Show loading, hide result
  loadingArea.style.display = "block";
  resultArea.style.display  = "none";

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.error) {
      showResult(null, 0, data.error);
    } else {
      let extra = "";
      if (data.frames_analyzed) {
        extra = `Analyzed ${data.frames_analyzed} frames — ${data.real_frames} real, ${data.fake_frames} fake`;
      }
      showResult(data.result, data.confidence, extra);
    }
  } catch (err) {
    showResult(null, 0, "Error: Could not connect to Flask backend. Is app.py running?");
  } finally {
    loadingArea.style.display = "none";
  }
}

// ===== Webcam =====
async function startWebcam() {
  const webcamFeed = document.getElementById("webcam-feed");
  const statusEl   = document.getElementById("webcam-status");

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamFeed.srcObject = webcamStream;

    document.getElementById("webcam-start").style.display = "none";
    document.getElementById("webcam-stop").style.display  = "inline-block";
    statusEl.textContent = "Camera active — sending frames for analysis...";

    // Send a frame every 1.5 seconds
    webcamInterval = setInterval(() => captureAndSendFrame(webcamFeed, statusEl), 1500);
  } catch (err) {
    statusEl.textContent = "Could not access camera. Please allow camera permissions.";
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
  if (webcamInterval) {
    clearInterval(webcamInterval);
    webcamInterval = null;
  }
  document.getElementById("webcam-start").style.display = "inline-block";
  document.getElementById("webcam-stop").style.display  = "none";
  document.getElementById("webcam-status").textContent  = "";
}

async function captureAndSendFrame(video, statusEl) {
  // Draw current frame to a canvas
  const canvas = document.createElement("canvas");
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);

  // Convert to blob and send
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("frame", blob, "frame.jpg");

    try {
      const res  = await fetch(`${API_URL}/predict/frame`, { method: "POST", body: formData });
      const data = await res.json();

      if (data.error) {
        statusEl.textContent = data.error;
      } else {
        statusEl.textContent = `${data.result.toUpperCase()} — ${data.confidence}% confidence`;
        statusEl.style.color = data.result === "real" ? "var(--green)" : "var(--red)";
        showResult(data.result, data.confidence, "Live webcam detection");
      }
    } catch {
      statusEl.textContent = "Backend not reachable. Is app.py running?";
      statusEl.style.color = "var(--red)";
    }
  }, "image/jpeg", 0.8);
}

// ===== Display Result =====
function showResult(result, confidence, extraText) {
  resultArea.style.display = "block";

  const card     = document.getElementById("result-card");
  const icon     = document.getElementById("result-icon");
  const label    = document.getElementById("result-label");
  const confVal  = document.getElementById("confidence-value");
  const confBar  = document.getElementById("confidence-bar");
  const extraEl  = document.getElementById("extra-info");

  if (!result) {
    // Error state
    card.className = "result-card";
    icon.textContent  = "⚠️";
    label.textContent = "Error";
    label.style.color = "var(--text-muted)";
    confVal.textContent = "—";
    confBar.style.width = "0%";
    extraEl.textContent = extraText || "";
    return;
  }

  const isReal = result === "real";
  card.className = `result-card ${isReal ? "real" : "fake"}`;
  icon.textContent  = isReal ? "🛡️" : "⚠️";
  label.textContent = isReal ? "REAL" : "FAKE";
  confVal.textContent = `${confidence}%`;
  confBar.style.width = `${confidence}%`;
  confBar.style.background = isReal ? "var(--green)" : "var(--red)";
  extraEl.textContent = extraText || "";
}
