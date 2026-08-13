import base64
import io
import numpy as np
import onnxruntime as ort
from PIL import Image
from typing import Dict, Any

class EndpointHandler():
    def __init__(self, path=""):
        # Load the ONNX model from the repository
        # 'path' is automatically populated by Hugging Face to point to your repo files
        self.session = ort.InferenceSession(f"{path}/mobilenetv2_emotion.onnx")
        self.input_name = self.session.get_inputs()[0].name
        
        # The 7 emotions that EmotionSense uses
        self.expressions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

    def __call__(self, data: Dict[str, Any]) -> Any:
        """
        Args:
            data (:obj:`dict`): Dictionary containing the input data
        Return:
            A list of dicts with 'label' and 'score' to match the HF pipeline standard
        """
        # HF API passes the image bytes in the 'inputs' key
        inputs = data.pop("inputs", data)
        
        # Parse the incoming image bytes
        if isinstance(inputs, bytes):
            img = Image.open(io.BytesIO(inputs)).convert('RGB')
        elif isinstance(inputs, str):
            image_data = base64.b64decode(inputs)
            img = Image.open(io.BytesIO(image_data)).convert('RGB')
        elif isinstance(inputs, Image.Image):
            img = inputs.convert('RGB')
        else:
            raise ValueError(f"Unsupported input type: {type(inputs)}")

        # -------------------------------
        # Preprocessing (matches EmotionSense)
        # -------------------------------
        img = img.resize((224, 224))
        img_array = np.array(img).astype(np.float32)
        
        if len(img_array.shape) == 2:
            img_array = np.stack((img_array,)*3, axis=-1)
            
        # Convert from HWC to CHW format
        img_array = np.transpose(img_array, (2, 0, 1))
        
        # Normalize with ImageNet stats
        mean = np.array([0.485, 0.456, 0.406]).reshape(3, 1, 1)
        std = np.array([0.229, 0.224, 0.225]).reshape(3, 1, 1)
        img_array = (img_array / 255.0 - mean) / std
        
        # Add batch dimension
        input_tensor = np.expand_dims(img_array, axis=0)

        # -------------------------------
        # Inference
        # -------------------------------
        ort_outs = self.session.run(None, {self.input_name: input_tensor})
        
        # Apply Softmax to get confidence scores
        scores = np.exp(ort_outs[0][0]) / np.sum(np.exp(ort_outs[0][0]))
        
        # -------------------------------
        # Format the Output
        # -------------------------------
        results = []
        for idx, score in enumerate(scores):
            results.append({
                "label": self.expressions[idx],
                "score": float(score)
            })
            
        # Sort by score descending (highest confidence first)
        results.sort(key=lambda x: x["score"], reverse=True)
        return results
