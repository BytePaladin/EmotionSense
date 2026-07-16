from fastapi import FastAPI
from auth import create_access_token
app = FastAPI()

@app.get("/api/hello_auth")
def hello():
    return {"message": "Hello from Auth"}
