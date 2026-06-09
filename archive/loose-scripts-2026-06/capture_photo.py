"""
Simple webcam capture script
This needs to run from Windows PowerShell with opencv-python installed
"""
import cv2
import sys

def capture_photo(output_path="webcam-photo.jpg"):
    print("Opening webcam...")
    cap = cv2.VideoCapture(0)  # 0 is usually the default webcam

    if not cap.isOpened():
        print("Error: Could not open webcam")
        return False

    print("Warming up camera...")
    # Let camera warm up
    for i in range(5):
        ret, frame = cap.read()

    # Capture frame
    ret, frame = cap.read()

    if ret:
        cv2.imwrite(output_path, frame)
        print(f"Photo saved to: {output_path}")
        success = True
    else:
        print("Error: Could not capture frame")
        success = False

    cap.release()
    return success

if __name__ == "__main__":
    output = r"\\wsl$\Ubuntu\home\alton\vayu-learning-project\webcam-photo.jpg"
    capture_photo(output)
