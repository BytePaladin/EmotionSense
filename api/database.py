import os
from dotenv import load_dotenv
import libsql_client

load_dotenv()

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

# Global connection object
client = None

def get_db():
    global client
    if client is None:
        if not TURSO_URL:
            raise ValueError("TURSO_DATABASE_URL environment variable is not set")
        client = libsql_client.create_client_sync(
            url=TURSO_URL,
            auth_token=TURSO_TOKEN
        )
    return client

def init_db():
    db = get_db()
    # Users Table
    db.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    ''')
    # Uploaded Files Table
    db.execute('''
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            upload_time TEXT DEFAULT (datetime('now')),
            processing_status TEXT DEFAULT 'completed',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    # Detection Results Table
    db.execute('''
        CREATE TABLE IF NOT EXISTS detection_results (
            id TEXT PRIMARY KEY,
            file_id TEXT NOT NULL,
            timestamp REAL NOT NULL,
            emotion TEXT NOT NULL,
            confidence REAL NOT NULL,
            FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE
        )
    ''')
    # Emotion Statistics Table
    db.execute('''
        CREATE TABLE IF NOT EXISTS emotion_statistics (
            id TEXT PRIMARY KEY,
            file_id TEXT NOT NULL UNIQUE,
            happy_percentage REAL DEFAULT 0,
            sad_percentage REAL DEFAULT 0,
            angry_percentage REAL DEFAULT 0,
            fear_percentage REAL DEFAULT 0,
            surprised_percentage REAL DEFAULT 0,
            disgust_percentage REAL DEFAULT 0,
            neutral_percentage REAL DEFAULT 0,
            dominant_emotion TEXT,
            average_confidence REAL DEFAULT 0,
            stability_score REAL DEFAULT 0,
            total_detections INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE
        )
    ''')
