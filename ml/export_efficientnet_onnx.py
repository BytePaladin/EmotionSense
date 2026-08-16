import os
from huggingface_hub import hf_hub_download
import shutil

MODEL_ID = "dwest1507/emotion-detection-model"
FILE_NAME = "emotion_classifier.onnx"
OUTPUT_DIR = "public/models"
ONNX_FILE_NAME = "efficientnet_b0_emotion.onnx"

def download_model():
    print(f"Downloading {FILE_NAME} from Hugging Face model {MODEL_ID}...")
    file_path = hf_hub_download(repo_id=MODEL_ID, filename=FILE_NAME)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    dest_path = os.path.join(OUTPUT_DIR, ONNX_FILE_NAME)
    
    shutil.copy(file_path, dest_path)
    
    # Check if there is a .data file (for external tensor data)
    try:
        data_file_path = hf_hub_download(repo_id=MODEL_ID, filename=FILE_NAME + ".data")
        shutil.copy(data_file_path, dest_path + ".data")
        print("Downloaded external tensor data file as well.")
    except Exception as e:
        pass # No external data file, which is normal for smaller models

    file_size = os.path.getsize(dest_path) / (1024 * 1024)
    print(f"Successfully downloaded and copied to {dest_path}")
    print(f"File Size: {file_size:.2f} MB")

if __name__ == "__main__":
    download_model()
