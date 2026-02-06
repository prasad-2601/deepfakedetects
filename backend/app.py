"""
app.py - Main Flask server for Deepfake Face Detection
=====================================================
This is the entry point of our backend. It handles:
  1. Image upload & prediction
  2. Video upload, frame extraction & prediction
  3. Webcam frame prediction (single frame via POST)

Run with: python app.py
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import cv2
import os
import tempfile
from tensorflow.keras.models import load_model

# Import our utility modules
from utils.face_detection import detect_faces
from utils.preprocess import preprocess_face
from utils.video_handler import extract_frames_from_video

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from the React frontend

# ─── Load the trained CNN model ────────────────────────────────────
MODEL_PATH = os.path.join("model", "deepfake_cnn.h5")

if os.path.exists(MODEL_PATH):
    model = load_model(MODEL_PATH)
    print(f"✅ Model loaded from {MODEL_PATH}")
else:
    model = None
    print(f"⚠️  Model not found at {MODEL_PATH}. Train it first with train_model.py")


def predict_face(face_img):
    """
    Takes a cropped face image (numpy array), preprocesses it,
    and returns the prediction label and confidence.
    """
    if model is None:
        return "error", 0.0

    # Preprocess: resize to 128x128, normalize pixel values
    processed = preprocess_face(face_img)

    # Add batch dimension: (128, 128, 3) → (1, 128, 128, 3)
    processed = np.expand_dims(processed, axis=0)

    # Get prediction from CNN
    prediction = model.predict(processed, verbose=0)
    confidence = float(prediction[0][0])

    # Model outputs sigmoid: >0.5 = Fake, <0.5 = Real
    if confidence > 0.5:
        return "fake", round(confidence * 100, 2)
    else:
        return "real", round((1 - confidence) * 100, 2)


# ─── Route: Home page ──────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("index.html")


# ─── Route: Predict on a single image ──────────────────────────────
@app.route("/predict/image", methods=["POST"])
def predict_image():
    """
    Accepts an image file, detects face(s), and returns prediction.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    
    # Read the image from the uploaded file
    file_bytes = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({"error": "Could not read image"}), 400

    # Detect faces in the image
    faces = detect_faces(image)

    if len(faces) == 0:
        return jsonify({"error": "No face detected in the image"}), 400

    # Use the first detected face
    x, y, w, h = faces[0]
    face_crop = image[y:y+h, x:x+w]

    # Predict
    label, confidence = predict_face(face_crop)

    return jsonify({
        "result": label,
        "confidence": confidence,
        "faces_found": len(faces)
    })


# ─── Route: Predict on a video ─────────────────────────────────────
@app.route("/predict/video", methods=["POST"])
def predict_video():
    """
    Accepts a video file, extracts frames, detects faces in each,
    runs CNN on each face, and aggregates results.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # Save video to a temporary file (OpenCV needs a file path)
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        # Extract frames from video (every Nth frame to save time)
        frames = extract_frames_from_video(tmp_path, frame_interval=10)

        if len(frames) == 0:
            return jsonify({"error": "Could not extract frames from video"}), 400

        # Analyze each frame
        results = []  # List of (label, confidence) tuples

        for frame in frames:
            faces = detect_faces(frame)
            if len(faces) > 0:
                x, y, w, h = faces[0]
                face_crop = frame[y:y+h, x:x+w]
                label, conf = predict_face(face_crop)
                results.append((label, conf))

        if len(results) == 0:
            return jsonify({"error": "No faces detected in any frame"}), 400

        # Aggregate: majority vote
        fake_count = sum(1 for r in results if r[0] == "fake")
        real_count = len(results) - fake_count

        final_label = "fake" if fake_count > real_count else "real"
        avg_confidence = round(sum(r[1] for r in results) / len(results), 2)

        return jsonify({
            "result": final_label,
            "confidence": avg_confidence,
            "frames_analyzed": len(results),
            "fake_frames": fake_count,
            "real_frames": real_count
        })

    finally:
        # Clean up temporary file
        os.unlink(tmp_path)


# ─── Route: Predict on a webcam frame ──────────────────────────────
@app.route("/predict/frame", methods=["POST"])
def predict_frame():
    """
    Accepts a single frame (as image bytes) from webcam stream.
    Used for real-time detection from the frontend.
    """
    if "frame" not in request.files:
        return jsonify({"error": "No frame data received"}), 400

    file = request.files["frame"]
    file_bytes = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"error": "Could not decode frame"}), 400

    faces = detect_faces(frame)

    if len(faces) == 0:
        return jsonify({"result": "no_face", "confidence": 0})

    x, y, w, h = faces[0]
    face_crop = frame[y:y+h, x:x+w]
    label, confidence = predict_face(face_crop)

    return jsonify({
        "result": label,
        "confidence": confidence,
        "face_box": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
    })


# ─── Run the server ────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🚀 Starting Deepfake Detection Server...")
    print("   Open http://localhost:5000 in your browser\n")
    app.run(debug=True, port=5000)
