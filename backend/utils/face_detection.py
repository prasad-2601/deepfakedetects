"""
face_detection.py - Face Detection using OpenCV
================================================
Uses OpenCV's Haar Cascade classifier to detect faces in an image.
This is simple and fast, suitable for a college project.

For better accuracy, you could use dlib or MTCNN, but Haar Cascade
works well enough for demonstration purposes.
"""

import cv2
import os

# Load the pre-trained Haar Cascade face detector
# This XML file comes with OpenCV installation
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)


def detect_faces(image):
    """
    Detect faces in an image using Haar Cascade.
    
    Args:
        image: BGR image (numpy array from OpenCV)
    
    Returns:
        List of face bounding boxes as (x, y, width, height)
    """
    # Convert to grayscale (Haar Cascade works on grayscale)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Detect faces
    # Parameters explained:
    #   scaleFactor=1.1  → how much the image size is reduced at each scale
    #   minNeighbors=5   → minimum number of neighbors for a detection to be valid
    #   minSize=(30, 30) → minimum face size to detect
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    # Convert from numpy array to list of tuples
    if len(faces) == 0:
        return []

    return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
