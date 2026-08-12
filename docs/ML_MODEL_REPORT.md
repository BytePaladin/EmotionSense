# 📊 EmotionSense — ML Model Performance & Technical Report

**Course**: CSE327 Software Engineering  
**Project**: EmotionSense (Facial Emotion Recognition System)  
**Model Architecture**: Fine-Tuned MobileNetV2 + MediaPipe Multi-Face Detection  
**Export Engine**: ONNX Runtime (`mobilenetv2_emotion.onnx`)  

---

## 1. Executive Summary

EmotionSense utilizes a decoupled, high-performance facial emotion recognition pipeline:
- **Stage A (Face Detection)**: MediaPipe Face Detection (`model_selection=1` full-range detector, operating up to 5 meters).
- **Stage B (Emotion Classification)**: Fine-tuned MobileNetV2 trained on the **FER-2013** dataset ($224 \times 224$ RGB input, 7 emotion classes: *Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise*).
- **Inference Engine**: Exported to ONNX Runtime format for lightweight, sub-50ms CPU/GPU inference serving within our FastAPI backend.

---

## 2. Experimental Methodology & Rigor

### Data Splitting & Leakage Prevention
- **Total Dataset Size**: 35,887 FER-2013 images.
- **Stratified Split**: 
  - **Training Subset (85%)**: Used for parameter updates.
  - **Validation Subset (15%)**: Used for hyperparameter tuning, learning rate scheduling (`ReduceLROnPlateau`), and model checkpointing (`best_mobilenetv2.pth`).
  - **Untouched Test Set**: 100% official FER-2013 test set, strictly isolated until final reporting.
- **Class Balancing**: Balanced class loss weights were calculated **strictly from the 85% training subset**, eliminating validation label distribution leakage.

### Two-Stage Transfer Learning Strategy
1. **Stage 1 (Classifier Warmup - 10 Epochs)**:
   - Backbone feature parameters (`features`) frozen (`requires_grad = False`).
   - BatchNorm running statistics locked in `eval()` mode (`freeze_batchnorm_stats`).
   - Custom classifier head (`Dropout(0.3) -> Linear(128) -> ReLU -> Dropout(0.2) -> Linear(7)`) trained at $\text{LR} = 10^{-3}$.
2. **Stage 2 (Partial Backbone Fine-Tuning - 20 Epochs with Early Stopping)**:
   - Top feature blocks (`features[-4:]`) unfrozen at $\text{LR} = 10^{-4}$, classifier head at $\text{LR} = 3 \times 10^{-4}$.
   - Lower feature blocks (`features[:-4]`) remained frozen with BatchNorm stats locked in `eval()` mode.

---

## 3. Deployment & Backend Integration (`api/inference.py`)

1. **Model Storage Location**: `api/models/mobilenetv2_emotion.onnx`
2. **FastAPI Route**: The backend automatically loads the local ONNX session on startup.
3. **Multi-Face Batch Processing**:
   - Accepts multi-person image uploads and webcam frames.
   - Extracts all face bounding boxes $(x, y, w, h)$ via MediaPipe.
   - Normalizes and batches cropped face tensors into ONNX Runtime in **a single forward pass**, achieving sub-50ms inference latency.
4. **CSV Export Support**: Added `/api/v1/analysis/{file_id}/export/csv` endpoint for exporting session metrics in raw tabular format.

---

## 4. Summary of Deliverable Artifacts

- **Notebook**: `ml/EmotionSense_MobileNetV2_Training.ipynb` (20-Step complete Colab training pipeline)
- **Model Engine**: `api/models/mobilenetv2_emotion.onnx`
- **Plots**: `ml/reports/training_curves.png` & `ml/reports/confusion_matrix.png`
- **Backend Serving**: `api/inference.py` & `api/index.py`
