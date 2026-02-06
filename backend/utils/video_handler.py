"""
video_handler.py - Video Frame Extraction
==========================================
Extracts frames from uploaded video files using OpenCV.

Instead of processing every frame (which would be slow),
we sample every Nth frame to speed up analysis while still
getting a representative result.
"""

import cv2


def extract_frames_from_video(video_path, frame_interval=10, max_frames=30):
    """
    Extract frames from a video file at regular intervals.
    
    Args:
        video_path: Path to the video file
        frame_interval: Extract every Nth frame (default: every 10th)
        max_frames: Maximum number of frames to extract (default: 30)
    
    Returns:
        List of frames as numpy arrays (BGR format)
    """
    frames = []
    
    # Open the video file
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video file: {video_path}")
        return frames

    frame_count = 0
    
    while len(frames) < max_frames:
        ret, frame = cap.read()
        
        # ret is False when video ends
        if not ret:
            break
        
        # Only keep every Nth frame
        if frame_count % frame_interval == 0:
            frames.append(frame)
        
        frame_count += 1
    
    # Release the video capture object
    cap.release()
    
    print(f"Extracted {len(frames)} frames from {frame_count} total frames")
    return frames
