from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from .api.db import get_db
from .api.models.item.model import Item
from .api.routers.profile_management import router as profile_router

version = "0.0"  # Define the API version
# Create the FastAPI application with metadata
app = FastAPI(
    title="Market Place",
    version=version,
    description="API for the Market Place application",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Include the profile_management router with explicit documentation settings
app.include_router(
    profile_router,
    prefix="/api/v"+ version[0],
    tags=["profile"],
    responses={404: {"description": "Not found"}}
)

@app.get("/", tags=["root"])
async def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Welcome to the Market Place API"}