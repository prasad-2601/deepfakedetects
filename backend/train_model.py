"""
train_model.py - Train the CNN Model for Deepfake Detection
============================================================

This script builds and trains a Convolutional Neural Network (CNN)
to classify faces as REAL or FAKE.

Why CNN for Deepfake Detection?
-------------------------------
CNNs are ideal for image classification because they:
  1. Automatically learn spatial features (edges, textures, patterns)
  2. Can detect subtle artifacts that deepfakes leave behind
  3. Work well with limited compute resources

What features does the CNN learn?
---------------------------------
  - Layer 1: Low-level features (edges, color boundaries)
  - Layer 2: Mid-level features (textures, skin patterns)
  - Layer 3: High-level features (facial inconsistencies, blending artifacts)
  - Dense layers: Combine features to make final real/fake decision

Dataset Structure:
-----------------
dataset/
├── real/     ← Real face images (from CelebA, FFHQ, etc.)
│   ├── img001.jpg
│   └── ...
└── fake/     ← Deepfake images (from FaceForensics++, etc.)
    ├── img001.jpg
    └── ...

Usage:
------
  1. Place your dataset in the 'dataset/' folder
  2. Run: python train_model.py
  3. The trained model will be saved to model/deepfake_cnn.h5
"""

import os
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

# ─── Configuration ──────────────────────────────────────────────────
IMG_SIZE = 128          # Input image size (128x128 pixels)
BATCH_SIZE = 32         # Number of images per training batch
EPOCHS = 20             # Maximum number of training epochs
DATASET_DIR = "dataset" # Path to dataset folder
MODEL_SAVE_PATH = os.path.join("model", "deepfake_cnn.h5")


def load_dataset():
    """
    Load images from the dataset directory.
    Real faces → label 0
    Fake faces → label 1
    """
    images = []
    labels = []

    # Load REAL faces (label = 0)
    real_dir = os.path.join(DATASET_DIR, "real")
    if os.path.exists(real_dir):
        for filename in os.listdir(real_dir):
            filepath = os.path.join(real_dir, filename)
            img = cv2.imread(filepath)
            if img is not None:
                img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                images.append(img)
                labels.append(0)  # 0 = Real
        print(f"✅ Loaded {labels.count(0)} real images")

    # Load FAKE faces (label = 1)
    fake_dir = os.path.join(DATASET_DIR, "fake")
    if os.path.exists(fake_dir):
        for filename in os.listdir(fake_dir):
            filepath = os.path.join(fake_dir, filename)
            img = cv2.imread(filepath)
            if img is not None:
                img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                images.append(img)
                labels.append(1)  # 1 = Fake
        print(f"✅ Loaded {labels.count(1)} fake images")

    # Convert to numpy arrays and normalize
    images = np.array(images, dtype=np.float32) / 255.0
    labels = np.array(labels, dtype=np.float32)

    return images, labels


def build_cnn_model():
    """
    Build the CNN architecture.
    
    Architecture: Conv → ReLU → Pool → Conv → ReLU → Pool → 
                  Conv → ReLU → Pool → Flatten → Dense → Dropout → Output
    """
    model = Sequential([
        # ── Block 1: First Convolutional Layer ──
        # 32 filters of size 3x3, learns basic edges and textures
        Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_SIZE, IMG_SIZE, 3)),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2)),  # Reduce spatial dimensions by half

        # ── Block 2: Second Convolutional Layer ──
        # 64 filters, learns more complex patterns
        Conv2D(64, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2)),

        # ── Block 3: Third Convolutional Layer ──
        # 128 filters, learns high-level facial features
        Conv2D(128, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2)),

        # ── Flatten: Convert 2D feature maps to 1D ──
        Flatten(),

        # ── Dense Layer: Classification ──
        Dense(128, activation='relu'),
        Dropout(0.5),  # Prevent overfitting by randomly dropping 50% of neurons

        # ── Output Layer: Binary classification (Real/Fake) ──
        # Sigmoid activation outputs a value between 0 and 1
        # < 0.5 → Real, > 0.5 → Fake
        Dense(1, activation='sigmoid')
    ])

    # Compile the model
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='binary_crossentropy',  # Binary classification loss
        metrics=['accuracy']
    )

    return model


def train():
    """Main training function."""
    print("\n" + "=" * 50)
    print("  Deepfake CNN Model Training")
    print("=" * 50 + "\n")

    # Step 1: Load dataset
    print("📂 Loading dataset...")
    images, labels = load_dataset()

    if len(images) == 0:
        print("\n❌ No images found! Please add images to:")
        print(f"   {DATASET_DIR}/real/   ← Put real face images here")
        print(f"   {DATASET_DIR}/fake/   ← Put fake face images here")
        print("\nYou can use datasets like:")
        print("   - FaceForensics++ (https://github.com/ondyari/FaceForensics)")
        print("   - Celeb-DF (https://github.com/yuezunli/celeb-deepfakeforensics)")
        return

    print(f"\n📊 Total images: {len(images)}")
    print(f"   Real: {int(sum(labels == 0))}")
    print(f"   Fake: {int(sum(labels == 1))}")

    # Step 2: Split into training and testing sets (80/20 split)
    X_train, X_test, y_train, y_test = train_test_split(
        images, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"\n   Training samples: {len(X_train)}")
    print(f"   Testing samples:  {len(X_test)}")

    # Step 3: Build the CNN model
    print("\n🏗️  Building CNN model...")
    model = build_cnn_model()
    model.summary()

    # Step 4: Train the model
    print("\n🚀 Training started...\n")

    # Early stopping: stop if validation loss doesn't improve for 5 epochs
    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True
    )

    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_data=(X_test, y_test),
        callbacks=[early_stop],
        verbose=1
    )

    # Step 5: Evaluate the model
    print("\n📈 Evaluating model...")
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"   Test Loss:     {loss:.4f}")
    print(f"   Test Accuracy: {accuracy * 100:.2f}%")

    # Step 6: Save the trained model
    os.makedirs("model", exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    print(f"\n💾 Model saved to: {MODEL_SAVE_PATH}")
    print("\n✅ Training complete! You can now run app.py to start the server.\n")


if __name__ == "__main__":
    train()
