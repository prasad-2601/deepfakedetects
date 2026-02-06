"""
preprocess.py - Face Preprocessing for CNN Input
=================================================
Prepares detected face images for the CNN model.

Steps:
  1. Resize to 128x128 pixels (matching our model's input size)
  2. Normalize pixel values from [0, 255] to [0, 1]
  
This ensures all faces fed to the CNN are the same size
and have consistent pixel value ranges.
"""

import cv2
import numpy as np

# Input size expected by our CNN model
IMG_SIZE = 128


def preprocess_face(face_image):
    """
    Preprocess a cropped face image for CNN prediction.
    
    Args:
        face_image: Cropped face region (BGR, numpy array)
    
    Returns:
        Preprocessed image ready for model input (128x128x3, float32)
    """
    # Step 1: Resize to 128x128
    # Using INTER_AREA for shrinking (better quality)
    resized = cv2.resize(face_image, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)

    # Step 2: Convert BGR to RGB (OpenCV uses BGR, but our model expects RGB)
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

    # Step 3: Normalize pixel values to [0, 1] range
    # Neural networks work better with small input values
    normalized = rgb.astype(np.float32) / 255.0

    return normalized
