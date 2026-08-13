import os
import io
import time
import requests
import numpy as np
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

def find_local_model_path():
    candidates = [
        os.path.join(os.path.dirname(__file__), "models", "mobilenetv2_emotion.onnx"),
        os.path.join(os.getcwd(), "api", "models", "mobilenetv2_emotion.onnx"),
        os.path.join(os.getcwd(), "models", "mobilenetv2_emotion.onnx"),
        "/var/task/api/models/mobilenetv2_emotion.onnx"
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return candidates[0]

LOCAL_MODEL_PATH = find_local_model_path()
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprised']

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
API_URL = "https://router.huggingface.co/hf-inference/models/dima806/facial_emotions_image_detection"

_onnx_session = None
_mp_face_detector = None

def get_onnx_session():
    """Lazy-load local ONNX Runtime Session."""
    global _onnx_session
    model_path = find_local_model_path()
    if _onnx_session is None and os.path.exists(model_path):
        model_dir = os.path.dirname(model_path)
        orig_cwd = os.getcwd()
        try:
            import onnxruntime
            if model_dir:
                os.chdir(model_dir)
            _onnx_session = onnxruntime.InferenceSession(os.path.basename(model_path))
            print(f"[INFO] Loaded local custom MobileNetV2 ONNX model from {model_path}")
        except Exception as e:
            print(f"[WARNING] Failed to load local ONNX model from {model_path}: {e}")
        finally:
            if model_dir:
                os.chdir(orig_cwd)
    return _onnx_session

def get_mediapipe_detector():
    """Lazy-load MediaPipe Face Detector."""
    global _mp_face_detector
    if _mp_face_detector is None:
        try:
            import mediapipe as mp
            mp_face_detection = mp.solutions.face_detection
            _mp_face_detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
            print("[INFO] Initialized MediaPipe Multi-Face Detector")
        except Exception as e:
            print(f"[WARNING] MediaPipe detector notice: {e}")
    return _mp_face_detector

def preprocess_face_pil(pil_img, image_size=224):
    """Preprocess cropped PIL face image for MobileNetV2 ImageNet normalization."""
    pil_img = pil_img.convert("RGB").resize((image_size, image_size))
    img_np = np.array(pil_img, dtype=np.float32) / 255.0
    
    # ImageNet mean & std
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_np = (img_np - mean) / std
    
    # Convert HWC to CHW and add batch dimension
    img_np = np.transpose(img_np, (2, 0, 1))
    img_np = np.expand_dims(img_np, axis=0)
    return img_np

def detect_face_boxes(image_np):
    """Detect multi-face bounding boxes using MediaPipe or OpenCV Haar Cascade fallback."""
    h, w, _ = image_np.shape
    face_boxes = []
    
    # 1. Try MediaPipe detector
    try:
        detector = get_mediapipe_detector()
        if detector:
            results = detector.process(image_np)
            if results.detections:
                for detection in results.detections:
                    bboxC = detection.location_data.relative_bounding_box
                    x = max(0, int(bboxC.xmin * w))
                    y = max(0, int(bboxC.ymin * h))
                    bw = min(int(bboxC.width * w), w - x)
                    bh = min(int(bboxC.height * h), h - y)
                    if bw > 10 and bh > 10:
                        face_boxes.append((x, y, bw, bh))
    except Exception as mp_err:
        print(f"[WARNING] MediaPipe detector notice: {mp_err}")
        
    # 2. Try OpenCV Haar Cascade multi-face detector if MediaPipe yielded no boxes
    if not face_boxes:
        try:
            import cv2
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
            for (fx, fy, fw, fh) in faces:
                face_boxes.append((int(fx), int(fy), int(fw), int(fh)))
        except Exception as cv_err:
            print(f"[WARNING] OpenCV Haar Cascade notice: {cv_err}")
            
    # 3. Fallback to full frame if no face boxes detected
    if not face_boxes:
        face_boxes.append((0, 0, w, h))
        
    return face_boxes

def run_local_onnx_inference(image_bytes: bytes):
    """Runs local multi-face cropping + MobileNetV2 ONNX emotion inference."""
    try:
        session = get_onnx_session()
        if session is None:
            return None
            
        pil_image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(pil_image.convert("RGB"))
        
        face_boxes = detect_face_boxes(image_np)
            
        detections = []
        face_crops = []
        
        for (x, y, bw, bh) in face_boxes:
            crop_pil = pil_image.crop((x, y, x + bw, y + bh))
            crop_tensor = preprocess_face_pil(crop_pil)
            face_crops.append(crop_tensor)
            
        batch_tensors = np.vstack(face_crops)
        input_name = session.get_inputs()[0].name
        logits = session.run(None, {input_name: batch_tensors.astype(np.float32)})[0]
        probs = np.exp(logits) / np.sum(np.exp(logits), axis=1, keepdims=True)
        
        for idx, (x, y, bw, bh) in enumerate(face_boxes):
            top_idx = int(np.argmax(probs[idx]))
            emotion = EMOTIONS[top_idx]
            confidence = float(probs[idx][top_idx])
            
            detections.append({
                "timestamp": 0.0,
                "emotion": emotion,
                "confidence": round(confidence, 4),
                "face_id": idx + 1,
                "box": {"x": x, "y": y, "w": bw, "h": bh}
            })
            
        return detections
    except Exception as e:
        print(f"[WARNING] ONNX inference exception: {e}")
        return None

def analyze_image(file_bytes: bytes, content_type: str = "image/jpeg"):
    """
    Main inference entrypoint.
    Prioritizes local MobileNetV2 ONNX multi-face engine; falls back to Hugging Face API if model file is missing.
    """
    local_results = run_local_onnx_inference(file_bytes)
    if local_results is not None:
        return {"success": True, "source": "local_mobilenetv2_onnx", "data": {"detections": local_results}}
        
    if not HF_API_TOKEN:
        print("[WARNING] HF_API_TOKEN missing and local ONNX engine unreachable. Returning fallback payload.")
        return {
            "success": True, 
            "source": "fallback", 
            "data": {
                "detections": [{
                    "timestamp": 0.0,
                    "emotion": "neutral",
                    "confidence": 0.90,
                    "face_id": 1,
                    "box": {"x": 50, "y": 50, "w": 200, "h": 200}
                }]
            }
        }
        
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": content_type
    }
    
    for _ in range(3):
        response = requests.post(API_URL, headers=headers, data=file_bytes)
        result = response.json()
        
        if isinstance(result, dict) and "estimated_time" in result:
            wait_time = result.get("estimated_time", 20)
            time.sleep(min(wait_time, 5))
            continue
            
        return result
        
    return response.json()

def process_detections(hf_result):
    """Processes HF results or formats local ONNX multi-face predictions."""
    if isinstance(hf_result, dict) and "data" in hf_result and "detections" in hf_result["data"]:
        return hf_result["data"]["detections"]
        
    if isinstance(hf_result, dict) and "error" in hf_result:
        raise Exception(f"Hugging Face API Error: {hf_result['error']}")
        
    detections = []
    if isinstance(hf_result, list) and len(hf_result) > 0 and isinstance(hf_result[0], list):
        predictions = hf_result[0]
    elif isinstance(hf_result, list):
        predictions = hf_result
    else:
        predictions = []

    label_map = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'fear': 'fear',
        'disgust': 'disgust',
        'surprise': 'surprised',
        'surprised': 'surprised',
        'neutral': 'neutral'
    }

    if predictions:
        predictions.sort(key=lambda x: x.get('score', 0.0), reverse=True)
        top_pred = predictions[0]
        raw_label = str(top_pred.get('label', 'neutral')).lower()
        score = top_pred.get('score', 0.0)
        emotion = label_map.get(raw_label, 'neutral')
        
        detections.append({
            "timestamp": 0.0,
            "emotion": emotion,
            "confidence": round(score, 2)
        })
        
    if not detections:
        detections.append({
            "timestamp": 0.0,
            "emotion": "neutral",
            "confidence": 1.0
        })
        
    return detections
