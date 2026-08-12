import os
import uuid
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

from api.database import init_db, get_db
from api.auth import verify_password, get_password_hash, create_access_token, get_current_user, get_current_admin
from api.utils import validate_password, calculate_emotion_stats
from api.inference import analyze_image, process_detections

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
        "INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
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
        
    user_role = getattr(db_user, 'role', 'user') if hasattr(db_user, 'role') else 'user'
    token = create_access_token(data={"id": db_user.id, "email": db_user.email, "role": user_role})
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "token": token,
            "user": {
                "id": db_user.id,
                "full_name": db_user.full_name,
                "email": db_user.email,
                "role": user_role,
                "created_at": db_user.created_at
            }
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
        hf_result = analyze_image(file_bytes, content_type=file.content_type or "image/jpeg")
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
    stmts = []

    stmts.append((
        "INSERT INTO uploaded_files (id, user_id, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?)",
        [file_id, current_user["id"], meta.file_name, meta.file_type, meta.file_size]
    ))
    
    for d in detections:
        det_id = str(uuid.uuid4())
        stmts.append((
            "INSERT INTO detection_results (id, file_id, timestamp, emotion, confidence) VALUES (?, ?, ?, ?, ?)",
            [det_id, file_id, d["timestamp"], d["emotion"].lower(), d["confidence"]]
        ))
        
    stats = calculate_emotion_stats(detections)
    stats_id = str(uuid.uuid4())
    stmts.append((
        "INSERT INTO emotion_statistics (id, file_id, happy_percentage, sad_percentage, angry_percentage, fear_percentage, surprised_percentage, disgust_percentage, neutral_percentage, dominant_emotion, average_confidence, stability_score, total_detections) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [stats_id, file_id, stats["happy_percentage"], stats["sad_percentage"], stats["angry_percentage"], stats["fear_percentage"], stats["surprised_percentage"], stats["disgust_percentage"], stats["neutral_percentage"], stats["dominant_emotion"], stats["average_confidence"], stats["stability_score"], stats["total_detections"]]
    ))
    
    db.execute_pipeline(stmts)
    
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
    
    # Fetch user corrections / ground-truth feedback for each session in current page
    file_ids = [item["id"] for item in history]
    feedback_map = {}
    if file_ids:
        placeholders = ",".join(["?"] * len(file_ids))
        fb_sql = f"SELECT id, file_id, frame_timestamp, predicted_emotion, corrected_emotion, comments, created_at FROM model_feedback WHERE user_id = ? AND file_id IN ({placeholders}) ORDER BY created_at DESC"
        fb_res = db.execute(fb_sql, [user_id] + file_ids)
        for row in fb_res.rows:
            fb_dict = dict(zip([col for col in fb_res.columns], row))
            fid = fb_dict["file_id"]
            if fid not in feedback_map:
                feedback_map[fid] = []
            feedback_map[fid].append(fb_dict)
            
    for item in history:
        item_fb = feedback_map.get(item["id"], [])
        item["feedback"] = item_fb
        item["feedback_count"] = len(item_fb)
        item["has_correction"] = len(item_fb) > 0
    
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

@app.get("/api/v1/analysis/compare")
def compare_analysis(id1: str, id2: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    
    def fetch_single(fid):
        f_res = db.execute("SELECT uf.*, es.happy_percentage, es.sad_percentage, es.angry_percentage, es.fear_percentage, es.surprised_percentage, es.disgust_percentage, es.neutral_percentage, es.dominant_emotion, es.average_confidence, es.stability_score, es.total_detections FROM uploaded_files uf LEFT JOIN emotion_statistics es ON uf.id = es.file_id WHERE uf.id = ? AND uf.user_id = ?", [fid, user_id])
        if len(f_res.rows) == 0:
            raise HTTPException(status_code=404, detail=f"Upload {fid} not found")
        d_res = db.execute("SELECT timestamp, emotion, confidence FROM detection_results WHERE file_id = ? ORDER BY timestamp ASC", [fid])
        fb_res = db.execute("SELECT id, frame_timestamp, predicted_emotion, corrected_emotion, comments, created_at FROM model_feedback WHERE file_id = ? AND user_id = ? ORDER BY created_at DESC", [fid, user_id])
        return {
            "file": dict(zip([col for col in f_res.columns], f_res.rows[0])),
            "detections": [dict(zip([col for col in d_res.columns], row)) for row in d_res.rows],
            "feedback": [dict(zip([col for col in fb_res.columns], row)) for row in fb_res.rows]
        }
        
    session_a = fetch_single(id1)
    session_b = fetch_single(id2)
    
    fa = session_a["file"]
    fb = session_b["file"]
    
    stab_diff = round((fb.get("stability_score") or 0) - (fa.get("stability_score") or 0), 2)
    conf_diff = round((fb.get("average_confidence") or 0) - (fa.get("average_confidence") or 0), 2)
    
    stress_a = (fa.get("fear_percentage") or 0) + (fa.get("angry_percentage") or 0) + (fa.get("disgust_percentage") or 0)
    stress_b = (fb.get("fear_percentage") or 0) + (fb.get("angry_percentage") or 0) + (fb.get("disgust_percentage") or 0)
    stress_diff = round(stress_b - stress_a, 2)
    
    comp_a = (fa.get("neutral_percentage") or 0) + (fa.get("happy_percentage") or 0)
    comp_b = (fb.get("neutral_percentage") or 0) + (fb.get("happy_percentage") or 0)
    comp_diff = round(comp_b - comp_a, 2)
    
    deltas = {
        "stability_score_diff": stab_diff,
        "average_confidence_diff": conf_diff,
        "stress_diff": stress_diff,
        "composure_diff": comp_diff,
        "dominant_emotion_a": fa.get("dominant_emotion"),
        "dominant_emotion_b": fb.get("dominant_emotion")
    }
    
    return {
        "success": True,
        "data": {
            "session_a": session_a,
            "session_b": session_b,
            "deltas": deltas
        }
    }

@app.get("/api/v1/analysis/{file_id}")
def get_analysis(file_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    
    file_res = db.execute("SELECT uf.*, es.happy_percentage, es.sad_percentage, es.angry_percentage, es.fear_percentage, es.surprised_percentage, es.disgust_percentage, es.neutral_percentage, es.dominant_emotion, es.average_confidence, es.stability_score, es.total_detections FROM uploaded_files uf LEFT JOIN emotion_statistics es ON uf.id = es.file_id WHERE uf.id = ? AND uf.user_id = ?", [file_id, user_id])
    if len(file_res.rows) == 0:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    det_res = db.execute("SELECT timestamp, emotion, confidence FROM detection_results WHERE file_id = ? ORDER BY timestamp ASC", [file_id])
    
    fb_res = db.execute("SELECT id, frame_timestamp, predicted_emotion, corrected_emotion, comments, created_at FROM model_feedback WHERE file_id = ? AND user_id = ? ORDER BY created_at DESC", [file_id, user_id])
    
    file_data = dict(zip([col for col in file_res.columns], file_res.rows[0]))
    detections = [dict(zip([col for col in det_res.columns], row)) for row in det_res.rows]
    feedback = [dict(zip([col for col in fb_res.columns], row)) for row in fb_res.rows]
    
    return {"success": True, "data": {"file": file_data, "detections": detections, "feedback": feedback}}

@app.get("/api/v1/analysis/{file_id}/export/csv")
def export_analysis_csv(file_id: str, current_user: dict = Depends(get_current_user)):
    from fastapi.responses import Response
    db = get_db()
    user_id = current_user["id"]
    
    file_res = db.execute("SELECT file_name, upload_time FROM uploaded_files WHERE id = ? AND user_id = ?", [file_id, user_id])
    if len(file_res.rows) == 0:
        raise HTTPException(status_code=404, detail="Upload session not found")
        
    det_res = db.execute("SELECT timestamp, emotion, confidence FROM detection_results WHERE file_id = ? ORDER BY timestamp ASC", [file_id])
    
    csv_lines = ["Timestamp (s),Emotion,Confidence"]
    for row in det_res.rows:
        csv_lines.append(f"{row.timestamp},{row.emotion},{row.confidence}")
        
    csv_content = "\n".join(csv_lines)
    headers = {
        "Content-Disposition": f'attachment; filename="emotionsense_{file_id[:8]}.csv"'
    }
    return Response(content=csv_content, media_type="text/csv", headers=headers)

# ==========================================
# --- ADMIN PORTAL ENDPOINTS ---
# ==========================================

class AdminLoginPayload(BaseModel):
    email: EmailStr
    password: str

class AdminActionPayload(BaseModel):
    confirmation: str

@app.post("/api/v1/admin/login")
def admin_login(payload: AdminLoginPayload):
    db = get_db()
    result = db.execute("SELECT * FROM users WHERE email = ?", [payload.email.lower().strip()])
    if len(result.rows) == 0:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    db_user = result.rows[0]
    if not verify_password(payload.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
    user_role = getattr(db_user, 'role', 'user') if hasattr(db_user, 'role') else 'user'
    if user_role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied: This account does not have administrator privileges")
        
    token = create_access_token(data={"id": db_user.id, "email": db_user.email, "role": "admin"})
    return {
        "success": True,
        "message": "Admin login successful",
        "data": {
            "token": token,
            "admin": {
                "id": db_user.id,
                "full_name": db_user.full_name,
                "email": db_user.email,
                "role": "admin"
            }
        }
    }

@app.get("/api/v1/admin/stats")
def get_admin_stats(current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    
    # User counts
    total_users_res = db.execute("SELECT COUNT(*) as total FROM users WHERE role != 'admin'")
    total_all_users_res = db.execute("SELECT COUNT(*) as total FROM users")
    active_users_res = db.execute("SELECT COUNT(DISTINCT user_id) as active_count FROM uploaded_files")
    
    total_users = total_users_res.rows[0].total if len(total_users_res.rows) > 0 else 0
    total_all_users = total_all_users_res.rows[0].total if len(total_all_users_res.rows) > 0 else 0
    active_users = active_users_res.rows[0].active_count if len(active_users_res.rows) > 0 else 0
    
    # Uploads and frame detection metrics
    uploads_res = db.execute("SELECT COUNT(*) as total_uploads, COALESCE(SUM(file_size), 0) as total_size FROM uploaded_files")
    total_uploads = uploads_res.rows[0].total_uploads if len(uploads_res.rows) > 0 else 0
    total_size_bytes = uploads_res.rows[0].total_size if len(uploads_res.rows) > 0 else 0
    
    det_sum_res = db.execute("SELECT COALESCE(SUM(total_detections), 0) as total_detections, COALESCE(AVG(average_confidence), 0) as avg_confidence FROM emotion_statistics")
    total_detections = det_sum_res.rows[0].total_detections if len(det_sum_res.rows) > 0 else 0
    overall_confidence = round(det_sum_res.rows[0].avg_confidence, 2) if len(det_sum_res.rows) > 0 else 0
    
    # Format distribution breakdown
    files_res = db.execute("SELECT file_name, file_type FROM uploaded_files")
    format_counts = {"live_camera": 0, "image": 0, "video": 0, "other": 0}
    for row in files_res.rows:
        ft = str(row.file_type or "").lower()
        fn = str(row.file_name or "").lower()
        if "live" in ft or "live" in fn or ft == "live_camera":
            format_counts["live_camera"] += 1
        elif "video" in ft or fn.endswith(".mp4") or fn.endswith(".mov") or fn.endswith(".avi"):
            format_counts["video"] += 1
        elif "image" in ft or fn.endswith(".jpg") or fn.endswith(".jpeg") or fn.endswith(".png") or fn.endswith(".webp"):
            format_counts["image"] += 1
        else:
            format_counts["other"] += 1
            
    # Determine most popular format
    popular_format = "None"
    max_format_cnt = 0
    format_labels = {"live_camera": "Live Camera", "image": "Image Uploads", "video": "Video Uploads", "other": "Other"}
    for k, v in format_counts.items():
        if v > max_format_cnt:
            max_format_cnt = v
            popular_format = format_labels[k]
            
    # Per-Emotion confidence breakdown
    conf_by_emotion_res = db.execute("SELECT emotion, AVG(confidence) as avg_conf, COUNT(*) as count FROM detection_results GROUP BY emotion")
    emotion_confidence = {}
    default_emotions = ["happy", "sad", "angry", "fear", "surprised", "disgust", "neutral"]
    for e in default_emotions:
        emotion_confidence[e] = {"avg_confidence": 0, "count": 0}
        
    for row in conf_by_emotion_res.rows:
        emo = str(row.emotion).lower()
        if emo in emotion_confidence:
            emotion_confidence[emo] = {
                "avg_confidence": round(float(row.avg_conf) * (100 if float(row.avg_conf) <= 1.0 else 1), 2),
                "count": row.count
            }
            
    # Dominant emotion distribution
    dom_res = db.execute("SELECT dominant_emotion, COUNT(*) as cnt FROM emotion_statistics WHERE dominant_emotion IS NOT NULL GROUP BY dominant_emotion")
    dominant_distribution = {e: 0 for e in default_emotions}
    for row in dom_res.rows:
        emo = str(row.dominant_emotion).lower()
        if emo in dominant_distribution:
            dominant_distribution[emo] = row.cnt

    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "total_all_users": total_all_users,
            "active_users": active_users,
            "total_uploads": total_uploads,
            "total_detections": total_detections,
            "overall_confidence": overall_confidence,
            "total_storage_bytes": total_size_bytes,
            "format_distribution": format_counts,
            "popular_format": popular_format,
            "emotion_confidence": emotion_confidence,
            "dominant_distribution": dominant_distribution
        }
    }

@app.get("/api/v1/admin/activity")
def get_admin_activity(limit: int = 50, current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    sql = """
        SELECT uf.id, uf.user_id, u.full_name, u.email, uf.file_name, uf.file_type, uf.file_size, uf.upload_time, uf.processing_status, es.dominant_emotion, es.average_confidence, es.total_detections 
        FROM uploaded_files uf 
        LEFT JOIN users u ON uf.user_id = u.id 
        LEFT JOIN emotion_statistics es ON uf.id = es.file_id 
        ORDER BY uf.upload_time DESC 
        LIMIT ?
    """
    res = db.execute(sql, [limit])
    activities = [dict(zip([col for col in res.columns], row)) for row in res.rows]
    return {"success": True, "data": {"activities": activities}}

@app.get("/api/v1/admin/users")
def get_admin_users(search: str = "", current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    sql = """
        SELECT u.id, u.full_name, u.email, u.role, u.created_at, 
               COUNT(DISTINCT uf.id) as total_uploads, 
               COALESCE(SUM(es.total_detections), 0) as total_detections, 
               COALESCE(AVG(es.average_confidence), 0) as average_confidence
        FROM users u 
        LEFT JOIN uploaded_files uf ON u.id = uf.user_id 
        LEFT JOIN emotion_statistics es ON uf.id = es.file_id 
    """
    args = []
    if search:
        sql += " WHERE u.full_name LIKE ? OR u.email LIKE ? "
        args.extend([f"%{search}%", f"%{search}%"])
    sql += " GROUP BY u.id ORDER BY u.created_at DESC"
    
    res = db.execute(sql, args)
    users_list = []
    for row in res.rows:
        u_dict = dict(zip([col for col in res.columns], row))
        u_dict["average_confidence"] = round(float(u_dict.get("average_confidence") or 0), 2)
        users_list.append(u_dict)
        
    return {"success": True, "data": {"users": users_list}}

# Option 1: Delete Single User & Associated Data
@app.delete("/api/v1/admin/users/{user_id}")
def admin_delete_user(user_id: str, current_admin: dict = Depends(get_current_admin)):
    if user_id == current_admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own active admin account")
        
    db = get_db()
    user_check = db.execute("SELECT id, email, role FROM users WHERE id = ?", [user_id])
    if len(user_check.rows) == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get all file IDs for cascading deletion
    files_res = db.execute("SELECT id FROM uploaded_files WHERE user_id = ?", [user_id])
    for f in files_res.rows:
        db.execute("DELETE FROM detection_results WHERE file_id = ?", [f.id])
        db.execute("DELETE FROM emotion_statistics WHERE file_id = ?", [f.id])
        db.execute("DELETE FROM model_feedback WHERE file_id = ?", [f.id])
        
    db.execute("DELETE FROM model_feedback WHERE user_id = ?", [user_id])
    db.execute("DELETE FROM uploaded_files WHERE user_id = ?", [user_id])
    db.execute("DELETE FROM users WHERE id = ?", [user_id])
    
    return {"success": True, "message": "User and all associated activity data deleted successfully"}

# Option 2: Erase All Analysis & Detection Data (Preserve User Logins)
@app.post("/api/v1/admin/purge-activity")
def admin_purge_activity(payload: AdminActionPayload, current_admin: dict = Depends(get_current_admin)):
    if payload.confirmation != "PURGE_ACTIVITY":
        raise HTTPException(status_code=400, detail="Invalid confirmation phrase. Please type 'PURGE_ACTIVITY'")
        
    db = get_db()
    db.execute("DELETE FROM detection_results")
    db.execute("DELETE FROM emotion_statistics")
    db.execute("DELETE FROM model_feedback")
    db.execute("DELETE FROM uploaded_files")
    
    return {"success": True, "message": "All activity, detection logs, and session statistics have been erased. User accounts preserved."}

# Option 3: Full Platform Reset (Wipe All Data + Non-Admin Users)
@app.post("/api/v1/admin/reset-platform")
def admin_reset_platform(payload: AdminActionPayload, current_admin: dict = Depends(get_current_admin)):
    if payload.confirmation != "RESET_ALL_DATA":
        raise HTTPException(status_code=400, detail="Invalid confirmation phrase. Please type 'RESET_ALL_DATA'")
        
    db = get_db()
    db.execute("DELETE FROM detection_results")
    db.execute("DELETE FROM emotion_statistics")
    db.execute("DELETE FROM model_feedback")
    db.execute("DELETE FROM uploaded_files")
    db.execute("DELETE FROM users WHERE role != 'admin'")
    
    return {"success": True, "message": "Full platform reset complete. All non-admin user accounts and analytics records have been cleared."}

# --- Model Feedback & Quality Evaluation ---
class FeedbackPayload(BaseModel):
    file_id: str
    frame_timestamp: Optional[float] = None
    predicted_emotion: str
    corrected_emotion: str
    comments: Optional[str] = None

@app.post("/api/v1/feedback")
def submit_feedback(payload: FeedbackPayload, current_user: dict = Depends(get_current_user)):
    db = get_db()
    feedback_id = str(uuid.uuid4())
    
    db.execute(
        "INSERT INTO model_feedback (id, user_id, file_id, frame_timestamp, predicted_emotion, corrected_emotion, comments) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            feedback_id,
            current_user["id"],
            payload.file_id,
            payload.frame_timestamp,
            payload.predicted_emotion.lower().strip(),
            payload.corrected_emotion.lower().strip(),
            (payload.comments or "").strip()
        ]
    )
    return {"success": True, "message": "Feedback submitted successfully. Thank you for helping improve AI model accuracy!", "data": {"id": feedback_id}}

@app.get("/api/v1/admin/feedback")
def admin_get_feedback(current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    
    sql = """
        SELECT mf.id, mf.file_id, mf.frame_timestamp, mf.predicted_emotion, mf.corrected_emotion, 
               mf.comments, mf.created_at, u.full_name as user_name, u.email as user_email, uf.file_name
        FROM model_feedback mf
        LEFT JOIN users u ON mf.user_id = u.id
        LEFT JOIN uploaded_files uf ON mf.file_id = uf.id
        ORDER BY mf.created_at DESC
    """
    res = db.execute(sql)
    feedback_list = [dict(zip([col for col in res.columns], row)) for row in res.rows]
    
    confusion_map = {}
    for item in feedback_list:
        pair = f"{item['predicted_emotion']} -> {item['corrected_emotion']}"
        confusion_map[pair] = confusion_map.get(pair, 0) + 1
        
    top_confusions = sorted([{"pair": k, "count": v} for k, v in confusion_map.items()], key=lambda x: x["count"], reverse=True)

    stats_data = {
        "total_reports": len(feedback_list),
        "top_confusions": top_confusions
    }
    
    return {
        "success": True,
        "data": {
            "total_reports": len(feedback_list),
            "feedback": feedback_list,
            "top_confusions": top_confusions,
            "stats": stats_data
        }
    }

@app.delete("/api/v1/admin/feedback/{feedback_id}")
def admin_delete_feedback(feedback_id: str, current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    db.execute("DELETE FROM model_feedback WHERE id = ?", [feedback_id])
    return {"success": True, "message": "Feedback record dismissed"}


