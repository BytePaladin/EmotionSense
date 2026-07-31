import os
import requests
from dotenv import load_dotenv

load_dotenv()

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

if TURSO_URL and TURSO_URL.startswith("libsql://"):
    TURSO_URL = TURSO_URL.replace("libsql://", "https://", 1)

class DummyRow:
    def __init__(self, data, cols):
        self.data = data
        self.cols = cols
    def __getitem__(self, idx):
        if isinstance(idx, int):
            return self.data[idx]
        if isinstance(idx, str):
            return self.data[self.cols.index(idx)]
        raise KeyError(idx)
    def __getattr__(self, name):
        if name in self.cols:
            return self.data[self.cols.index(name)]
        raise AttributeError(name)
    def __len__(self):
        return len(self.data)
    def __iter__(self):
        return iter(self.data)

class DummyResult:
    def __init__(self, rows, columns):
        self.rows = [DummyRow(r, columns) for r in rows]
        self.columns = columns

class SimpleDbClient:
    def __init__(self, url, token):
        self.url = url.rstrip("/")
        self.token = token
        
    def execute(self, sql, args=None):
        if args is None:
            args = []
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        formatted_args = []
        for arg in args:
            if isinstance(arg, int):
                formatted_args.append({"type": "integer", "value": str(arg)})
            elif isinstance(arg, float):
                formatted_args.append({"type": "float", "value": arg})
            elif arg is None:
                formatted_args.append({"type": "null"})
            else:
                formatted_args.append({"type": "text", "value": str(arg)})
                
        body = {
            "requests": [
                {
                    "type": "execute",
                    "stmt": {
                        "sql": sql,
                        "args": formatted_args
                    }
                },
                {"type": "close"}
            ]
        }
        
        res = requests.post(f"{self.url}/v2/pipeline", json=body, headers=headers)
        if res.status_code != 200:
            raise Exception(f"Database error: {res.text}")
            
        data = res.json()
        results = data.get("results", [])
        if not results:
            return DummyResult([], [])
            
        execute_result = results[0]
        if execute_result["type"] == "error":
            raise Exception(f"SQL Error: {execute_result['error']['message']}")
            
        response = execute_result.get("response", {}).get("result", {})
        cols = [c["name"] for c in response.get("cols", [])]
        rows = response.get("rows", [])
        
        parsed_rows = []
        for r in rows:
            parsed_row = []
            for val in r:
                t = val["type"]
                v = val.get("value")
                if t == "integer":
                    parsed_row.append(int(v))
                elif t == "float":
                    parsed_row.append(float(v))
                elif t == "null":
                    parsed_row.append(None)
                else:
                    parsed_row.append(v)
            parsed_rows.append(parsed_row)
            
        return DummyResult(parsed_rows, cols)

    def execute_pipeline(self, stmts_with_args):
        if not stmts_with_args:
            return
            
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        requests_payload = []
        for sql, args in stmts_with_args:
            formatted_args = []
            for arg in (args or []):
                if isinstance(arg, int):
                    formatted_args.append({"type": "integer", "value": str(arg)})
                elif isinstance(arg, float):
                    formatted_args.append({"type": "float", "value": arg})
                elif arg is None:
                    formatted_args.append({"type": "null"})
                else:
                    formatted_args.append({"type": "text", "value": str(arg)})
                    
            requests_payload.append({
                "type": "execute",
                "stmt": {
                    "sql": sql,
                    "args": formatted_args
                }
            })
            
        requests_payload.append({"type": "close"})
        
        body = {"requests": requests_payload}
        res = requests.post(f"{self.url}/v2/pipeline", json=body, headers=headers)
        if res.status_code != 200:
            raise Exception(f"Database error: {res.text}")
            
        data = res.json()
        for execute_result in data.get("results", []):
            if execute_result.get("type") == "error":
                raise Exception(f"SQL Error: {execute_result['error']['message']}")

client = None

def get_db():
    global client
    if client is None:
        if not TURSO_URL:
            raise ValueError("TURSO_DATABASE_URL environment variable is not set")
        client = SimpleDbClient(TURSO_URL, TURSO_TOKEN)
    return client

def init_db():
    db = get_db()
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
