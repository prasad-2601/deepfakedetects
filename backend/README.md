# Deepfake Face Detection — Backend

## How to Run Locally

### 1. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Train the CNN model (first time only)
```bash
# Create dataset folders and add face images:
mkdir -p dataset/real dataset/fake
# Add real face images to dataset/real/
# Add fake face images to dataset/fake/
# Suggested datasets: FaceForensics++, Celeb-DF

python train_model.py
```

### 3. Start the Flask server
```bash
python app.py
# Server runs at http://localhost:5000
```

### 4. Open the React frontend
The React app (running on http://localhost:5173) will connect to the Flask API.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/predict/image` | POST | Upload image, returns real/fake |
| `/predict/video` | POST | Upload video, analyzes frames |
| `/predict/frame` | POST | Single webcam frame analysis |

## Project Structure
```
backend/
├── app.py              ← Flask server (main entry point)
├── train_model.py      ← CNN model training script
├── requirements.txt    ← Python dependencies
├── model/
│   └── deepfake_cnn.h5 ← Trained model (after training)
├── dataset/            ← Training data (you provide this)
│   ├── real/
│   └── fake/
└── utils/
    ├── face_detection.py  ← Haar Cascade face detector
    ├── preprocess.py      ← Image preprocessing
    └── video_handler.py   ← Video frame extraction
```
