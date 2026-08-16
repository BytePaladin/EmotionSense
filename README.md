# EmotionSense

EmotionSense is a comprehensive, real-time emotion detection and analysis platform built to process and interpret human facial expressions. Using advanced machine learning techniques, EmotionSense can analyze live camera feeds, recorded videos, and static images to provide granular insights into emotional states.

## 🚀 Key Features

- **Real-Time Emotion Detection:** Analyzes live webcam streams with high-performance, client-side machine learning using MediaPipe and ONNX Runtime.
- **Media Upload Analysis:** Upload and analyze pre-recorded videos and static images for historical emotion tracking.
- **Side-by-Side Comparison:** Compare two separate analysis sessions side-by-side to track changes in emotional stability, stress levels, and composure over time.
- **Interview Coach Mode:** Provides live feedback on emotional composure and warmth, ideal for practicing for interviews or public speaking.
- **Model Evaluation Feedback Loop:** Users can seamlessly submit ground-truth corrections to AI misclassifications in real-time, creating a continuous dataset for future model improvement.
- **Admin Dashboard:** A secured portal for administrators to manage user accounts, view live system activity feeds, and review user-submitted model corrections.
- **Data Export:** Export detailed analysis session data—including exact frame timestamps, detected emotions, and confidence scores—into CSV format for external analysis.

## 🛠️ Technology Stack

**Frontend:**
- **React.js (Vite):** Lightning-fast modern frontend build tool.
- **Material UI (MUI):** Fully responsive, highly accessible, and polished UI components supporting both light and dark themes.
- **Chart.js:** For rendering interactive emotional distribution and confidence charts.
- **Client-Side ML:** 
  - `@mediapipe/tasks-vision` for ultra-fast face detection and bounding box tracking.
  - `onnxruntime-web` for executing the deep-learning emotion classification model directly in the browser via WebAssembly (WASM).

**Backend:**
- **FastAPI (Python):** High-performance backend framework for API routing, user authentication, and data aggregation.
- **Turso (libsql):** Edge-hosted SQLite database for lightning-fast, globally distributed, and low-latency data storage.

## ⚙️ Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/BytePaladin/EmotionSense.git
cd EmotionSense
```

### 2. Frontend Setup
```bash
# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will typically run at `http://localhost:5173`.*

### 3. Backend Setup
```bash
# Navigate to the backend directory
cd api

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `api/` directory and configure your database and authentication secrets:
```env
TURSO_DATABASE_URL=libsql://your-turso-database-url.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=your_secure_jwt_secret_key
```

**Run the Server:**
```bash
# Start the FastAPI development server
uvicorn index:app --reload
```
*The backend API will run at `http://localhost:8000`.*

## 🔒 Security & Privacy Architecture

EmotionSense respects user privacy by performing live camera inference **entirely on the client-side** inside the browser. Raw video streams and facial images from the live camera are never transmitted to, recorded by, or stored on the backend servers. Only the resulting telemetry metadata (timestamps, dominant emotions, and confidence scores) is securely synchronized to the database for rendering your historical analysis charts.

## 🎓 Academic Context
This project was initially developed as a software engineering project (CSE 327).
