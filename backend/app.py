# app.py
from fastapi import FastAPI
from api.routers.auth import auth_router
app = FastAPI(title="Market Place", version="0.0")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the API!"}

@app.post("/login")
async def login(user: dict):
    # Implement your authentication logic here
    return {"message": "Login successful"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {"message": "No favicon available"}

app.include_router(auth_router, prefix="/auth")