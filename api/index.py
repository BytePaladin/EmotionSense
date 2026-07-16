import sys
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="EmotionSense API", version="1.0.0")

try:
    import os
    import uuid
    from fastapi import Depends, HTTPException, status, File, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, EmailStr
    from typing import Optional, List, Dict, Any

    from database import init_db, get_db
    from auth import verify_password, get_password_hash, create_access_token, get_current_user
    from utils import validate_password, calculate_emotion_stats
    from inference import analyze_image, process_detections

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

except Exception as e:
    error_details = traceback.format_exc()
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def catch_all(request: Request, path_name: str):
        return JSONResponse(
            status_code=500,
            content={"error": "Fatal Initialization Error", "details": error_details}
        )
