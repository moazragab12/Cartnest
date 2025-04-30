from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from dotenv import load_dotenv

from api.db import Base, engine, get_db
from api.dependencies import get_current_user
from api.models.user.model import User
from api.routers.auth import auth_router
from api.routers.profile_management import router as profile_router

# Load .env variables
load_dotenv()

# Create all tables at startup
Base.metadata.create_all(bind=engine)

# API metadata
version = "0.0"
app = FastAPI(
    title="Market Place",
    version=version,
    description="API for the Market Place application with authentication and profile management",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 token scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# Root route
@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to the Market Place API!",
        "auth_endpoints": {
            "register": "/auth/register",
            "login": "/auth/token",
            "get_user": "/auth/me"
        }
    }

# Favicon fallback
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {"message": "No favicon available"}

# Protected example route
@app.get("/protected", tags=["Protected"])
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.username}! This is a protected route."}

# Routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(
    profile_router,
    prefix=f"/api/v{version[0]}",  # e.g., /api/v0
    tags=["Profile Management"],
    responses={404: {"description": "Not found"}}
)
