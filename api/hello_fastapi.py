from fastapi import FastAPI
app = FastAPI()

@app.get("/api/hello_fastapi")
def hello():
    return {"message": "Hello from FastAPI"}
