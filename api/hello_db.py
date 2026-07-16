from fastapi import FastAPI
from database import init_db
app = FastAPI()

@app.get("/api/hello_db")
def hello():
    return {"message": "Hello from DB"}
