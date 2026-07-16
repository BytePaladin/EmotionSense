import os
import requests
from dotenv import load_dotenv

load_dotenv()

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# We use an emotion detection model from HuggingFace
# Note: For images, a common model is 'dima806/facial_emotions_image_detection'
API_URL = "https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection"

def analyze_image(file_bytes: bytes):
    if not HF_API_TOKEN:
        raise ValueError("HF_API_TOKEN environment variable is missing.")
        
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    
    # Retry mechanism in case model is loading
    import time
    for _ in range(3):
        response = requests.post(API_URL, headers=headers, data=file_bytes)
        result = response.json()
        
        # If the model is currently loading, wait and retry
        if isinstance(result, dict) and "estimated_time" in result:
            wait_time = result.get("estimated_time", 20)
            time.sleep(min(wait_time, 5))
            continue
            
        return result
        
    return response.json()

def process_detections(hf_result):
    # HF usually returns a list of dictionaries with 'label' and 'score'
    # Or an error dict
    if isinstance(hf_result, dict) and "error" in hf_result:
        raise Exception(f"Hugging Face API Error: {hf_result['error']}")
        
    detections = []
    # If it's a list of lists, take the first one
    if isinstance(hf_result, list) and len(hf_result) > 0 and isinstance(hf_result[0], list):
        predictions = hf_result[0]
    elif isinstance(hf_result, list):
        predictions = hf_result
    else:
        predictions = []

    # Map labels to our standard emotions (happy, sad, angry, fear, disgust, surprised, neutral)
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

    # Since it's a single image, we simulate a timestamp of 0.0
    for pred in predictions:
        raw_label = str(pred.get('label', 'neutral')).lower()
        score = pred.get('score', 0.0)
        
        emotion = label_map.get(raw_label, 'neutral')
        
        detections.append({
            "timestamp": 0.0,
            "emotion": emotion,
            "confidence": round(score, 2)
        })
        
    # If no predictions, fallback to neutral
    if not detections:
        detections.append({
            "timestamp": 0.0,
            "emotion": "neutral",
            "confidence": 1.0
        })
        
    return detections
