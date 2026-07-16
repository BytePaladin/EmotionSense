import os
import uuid
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

from database import init_db, get_db
from auth import verify_password, get_password_hash, create_access_token, get_current_user
from utils import validate_password, calculate_emotion_stats
from inference import analyze_image, process_detections

app = FastAPI(title="EmotionSense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

startup_error = None

@app.on_event("startup")
def startup_event():
    global startup_error
    try:
        init_db()
    except Exception as e:
        startup_error = str(e)

@app.get("/api/v1/ping")
def ping():
    return {"status": "ok", "startup_error": startup_error}

# --- Schemas ---
class RegisterUser(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str

class LoginUser(BaseModel):
    email: EmailStr
    password: str

class UpdateProfile(BaseModel):
    full_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

# --- Auth Routes ---
@app.post("/api/v1/register")
def register(user: RegisterUser):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    is_valid, errors = validate_password(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=". ".join(errors))
    
    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", [user.email.lower()])
    if len(existing.rows) > 0:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
        
    user_id = str(uuid.uuid4())
    password_hash = get_password_hash(user.password)
    db.execute(
        "INSERT INTO users (id, full_name, email, password_hash) VALUES (?, ?, ?, ?)",
        [user_id, user.full_name.strip(), user.email.lower().strip(), password_hash]
    )
    return {"success": True, "message": "Registration successful", "data": {"id": user_id, "full_name": user.full_name, "email": user.email}}

@app.post("/api/v1/login")
def login(user: LoginUser):
    db = get_db()
    result = db.execute("SELECT * FROM users WHERE email = ?", [user.email.lower()])
    if len(result.rows) == 0:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    db_user = result.rows[0]
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    token = create_access_token(data={"id": db_user.id, "email": db_user.email})
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "token": token,
            "user": {"id": db_user.id, "full_name": db_user.full_name, "email": db_user.email, "created_at": db_user.created_at}
        }
    }

@app.post("/api/v1/logout")
def logout():
    return {"success": True, "message": "Logged out successfully"}

@app.get("/api/v1/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = db.execute("SELECT id, full_name, email, created_at, updated_at FROM users WHERE id = ?", [current_user["id"]])
    if len(result.rows) == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    uploads_res = db.execute("SELECT COUNT(*) as total FROM uploaded_files WHERE user_id = ?", [current_user["id"]])
    total_uploads = uploads_res.rows[0].total
    
    user_data = dict(zip([col for col in result.columns], result.rows[0]))
    user_data["total_uploads"] = total_uploads
    
    return {"success": True, "data": user_data}

@app.put("/api/v1/profile")
def update_profile(data: UpdateProfile, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        user_res = db.execute("SELECT password_hash FROM users WHERE id = ?", [current_user["id"]])
        if len(user_res.rows) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_password(data.current_password, user_res.rows[0].password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
            
        is_valid, errors = validate_password(data.new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=". ".join(errors))
            
        new_hash = get_password_hash(data.new_password)
        db.execute("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [new_hash, current_user["id"]])
        
    if data.full_name:
        db.execute("UPDATE users SET full_name = ?, updated_at = datetime('now') WHERE id = ?", [data.full_name.strip(), current_user["id"]])
        
    return get_profile(current_user)

# --- Upload & Inference Routes ---
@app.post("/api/v1/mock-inference")
async def analyze_file(file: UploadFile = File(...)):
    # Read file bytes
    file_bytes = await file.read()
    
    # Send to Hugging Face
    try:
        hf_result = analyze_image(file_bytes)
        detections = process_detections(hf_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"success": True, "data": {"detections": detections}}

class FileMetadata(BaseModel):
    file_name: str
    file_type: str
    file_size: int

class UploadResultPayload(BaseModel):
    file_metadata: FileMetadata
    detections: List[Dict[str, Any]]

@app.post("/api/v1/upload-result")
def save_upload_result(payload: UploadResultPayload, current_user: dict = Depends(get_current_user)):
    meta = payload.file_metadata
    detections = payload.detections
    
    if not meta.file_name or not meta.file_type or meta.file_size is None:
        raise HTTPException(status_code=400, detail="File metadata is incomplete")
    if not detections or len(detections) == 0:
        raise HTTPException(status_code=400, detail="Detection results are required")
        
    db = get_db()
    file_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO uploaded_files (id, user_id, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?)",
        [file_id, current_user["id"], meta.file_name, meta.file_type, meta.file_size]
    )
    
    for d in detections:
        det_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO detection_results (id, file_id, timestamp, emotion, confidence) VALUES (?, ?, ?, ?, ?)",
            [det_id, file_id, d["timestamp"], d["emotion"].lower(), d["confidence"]]
        )
        
    stats = calculate_emotion_stats(detections)
    stats_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO emotion_statistics (id, file_id, happy_percentage, sad_percentage, angry_percentage, fear_percentage, surprised_percentage, disgust_percentage, neutral_percentage, dominant_emotion, average_confidence, stability_score, total_detections) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [stats_id, file_id, stats["happy_percentage"], stats["sad_percentage"], stats["angry_percentage"], stats["fear_percentage"], stats["surprised_percentage"], stats["disgust_percentage"], stats["neutral_percentage"], stats["dominant_emotion"], stats["average_confidence"], stats["stability_score"], stats["total_detections"]]
    )
    
    return {"success": True, "message": "Upload result saved", "data": {"file_id": file_id, **stats}}

# --- Analytics Routes ---
@app.get("/api/v1/statistics")
def get_statistics(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    
    up_res = db.execute("SELECT COUNT(*) as total_uploads FROM uploaded_files WHERE user_id = ?", [user_id])
    det_res = db.execute("SELECT COALESCE(SUM(es.total_detections), 0) as total_detections FROM emotion_statistics es JOIN uploaded_files uf ON es.file_id = uf.id WHERE uf.user_id = ?", [user_id])
    avg_conf_res = db.execute("SELECT COALESCE(AVG(es.average_confidence), 0) as avg_confidence FROM emotion_statistics es JOIN uploaded_files uf ON es.file_id = uf.id WHERE uf.user_id = ?", [user_id])
    emo_dist_res = db.execute("SELECT COALESCE(AVG(es.happy_percentage), 0) as happy_percentage, COALESCE(AVG(es.sad_percentage), 0) as sad_percentage, COALESCE(AVG(es.angry_percentage), 0) as angry_percentage, COALESCE(AVG(es.fear_percentage), 0) as fear_percentage, COALESCE(AVG(es.surprised_percentage), 0) as surprised_percentage, COALESCE(AVG(es.disgust_percentage), 0) as disgust_percentage, COALESCE(AVG(es.neutral_percentage), 0) as neutral_percentage FROM emotion_statistics es JOIN uploaded_files uf ON es.file_id = uf.id WHERE uf.user_id = ?", [user_id])
    latest_res = db.execute("SELECT uf.file_name, uf.upload_time, es.dominant_emotion FROM uploaded_files uf LEFT JOIN emotion_statistics es ON uf.id = es.file_id WHERE uf.user_id = ? ORDER BY uf.upload_time DESC LIMIT 1", [user_id])
    dom_res = db.execute("SELECT dominant_emotion, COUNT(*) as cnt FROM emotion_statistics es JOIN uploaded_files uf ON es.file_id = uf.id WHERE uf.user_id = ? GROUP BY dominant_emotion ORDER BY cnt DESC LIMIT 1", [user_id])
    
    return {
        "success": True,
        "data": {
            "total_uploads": up_res.rows[0].total_uploads,
            "total_detections": det_res.rows[0].total_detections,
            "average_confidence": round(avg_conf_res.rows[0].avg_confidence, 2),
            "emotion_distribution": dict(zip([col for col in emo_dist_res.columns], emo_dist_res.rows[0])) if len(emo_dist_res.rows) > 0 else {},
            "latest_upload": dict(zip([col for col in latest_res.columns], latest_res.rows[0])) if len(latest_res.rows) > 0 else None,
            "dominant_emotion": dom_res.rows[0].dominant_emotion if len(dom_res.rows) > 0 else 'N/A'
        }
    }

@app.get("/api/v1/history")
def get_history(page: int = 1, limit: int = 10, search: str = "", current_user: dict = Depends(get_current_user)):
    db = get_db()
    offset = (page - 1) * limit
    user_id = current_user["id"]
    
    count_sql = "SELECT COUNT(*) as total FROM uploaded_files WHERE user_id = ?"
    data_sql = "SELECT uf.id, uf.file_name, uf.file_type, uf.file_size, uf.upload_time, uf.processing_status, es.dominant_emotion, es.average_confidence, es.total_detections FROM uploaded_files uf LEFT JOIN emotion_statistics es ON uf.id = es.file_id WHERE uf.user_id = ?"
    args = [user_id]
    
    if search:
        count_sql += " AND file_name LIKE ?"
        data_sql += " AND uf.file_name LIKE ?"
        args.append(f"%{search}%")
        
    data_sql += " ORDER BY uf.upload_time DESC LIMIT ? OFFSET ?"
    
    count_res = db.execute(count_sql, args)
    total = count_res.rows[0].total
    
    data_res = db.execute(data_sql, args + [limit, offset])
    history = [dict(zip([col for col in data_res.columns], row)) for row in data_res.rows]
    
    import math
    return {
        "success": True,
        "data": {
            "history": history,
            "pagination": {"page": page, "limit": limit, "total": total, "totalPages": math.ceil(total / limit) if total > 0 else 1}
        }
    }

@app.delete("/api/v1/uploads/{file_id}")
def delete_upload(file_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    
    file_res = db.execute("SELECT id FROM uploaded_files WHERE id = ? AND user_id = ?", [file_id, user_id])
    if len(file_res.rows) == 0:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    db.execute("DELETE FROM detection_results WHERE file_id = ?", [file_id])
    db.execute("DELETE FROM emotion_statistics WHERE file_id = ?", [file_id])
    db.execute("DELETE FROM uploaded_files WHERE id = ?", [file_id])
    return {"success": True, "message": "Upload deleted successfully"}

@app.get("/api/v1/analysis/{file_id}")
def get_analysis(file_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    
    file_res = db.execute("SELECT uf.*, es.happy_percentage, es.sad_percentage, es.angry_percentage, es.fear_percentage, es.surprised_percentage, es.disgust_percentage, es.neutral_percentage, es.dominant_emotion, es.average_confidence, es.stability_score, es.total_detections FROM uploaded_files uf LEFT JOIN emotion_statistics es ON uf.id = es.file_id WHERE uf.id = ? AND uf.user_id = ?", [file_id, user_id])
    if len(file_res.rows) == 0:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    det_res = db.execute("SELECT timestamp, emotion, confidence FROM detection_results WHERE file_id = ? ORDER BY timestamp ASC", [file_id])
    
    file_data = dict(zip([col for col in file_res.columns], file_res.rows[0]))
    detections = [dict(zip([col for col in det_res.columns], row)) for row in det_res.rows]
    
    return {"success": True, "data": {"file": file_data, "detections": detections}}
