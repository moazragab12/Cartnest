from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
import logging
import traceback
from sqlmodel import Session, select
from .api.db import get_db
from .api.routers.profile_management.models import Item
from .api.routers.profile_management import router as profile_router
import os

# Configure logging with both console and file output
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "api.log")

# Set up logging handlers
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("marketplace-api")
logger.info(f"Starting API server, logging to: {log_file}")

# Create the FastAPI application with metadata
app = FastAPI(
    title="Market Place",
    version="0.0",
    description="API for the Market Place application",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Include the profile_management router with explicit documentation settings
app.include_router(
    profile_router,
    prefix="/api/v1",
    tags=["profile"],
    responses={404: {"description": "Not found"}}
)

@app.get("/", tags=["root"])
async def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Welcome to the Market Place API"}

@app.get("/debug/database", tags=["debug"])
async def debug_database(db: Session = Depends(get_db)):
    """
    Debug endpoint to check database connectivity and available items.
    This helps diagnose database connection issues.
    """
    try:
        # Check database connection
        db_info = {}
        
        # Check if items table exists and get all items
        try:
            items_query = select(Item)
            items = db.exec(items_query).all()
            items_data = []
            for item in items:
                items_data.append({
                    "id": item.item_id,
                    "name": item.name,
                    "price": item.price,
                    "seller_id": item.seller_user_id,
                    "status": item.status
                })
            db_info["items_count"] = len(items_data)
            db_info["items"] = items_data
        except Exception as e:
            db_info["items_error"] = str(e)
            logger.error(f"Error querying items: {e}")
        
        return {
            "database_status": "connected",
            "db_info": db_info
        }
    except Exception as e:
        logger.error(f"Database debug endpoint error: {str(e)}", exc_info=True)
        return {
            "database_status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@app.get("/debug/item/{item_id}", tags=["debug"])
async def debug_get_item(item_id: int, db: Session = Depends(get_db)):
    """
    Debug endpoint to directly access a specific item without going through
    the regular endpoint logic (avoiding authentication checks).
    """
    try:
        # Try to get the item directly
        item = db.get(Item, item_id)
        
        if item:
            return {
                "found": True,
                "item_id": item.item_id,
                "name": item.name,
                "description": item.description,
                "price": item.price,
                "seller_id": item.seller_user_id,
                "status": item.status
            }
        else:
            return {
                "found": False,
                "message": f"No item with ID {item_id} exists in the database"
            }
    except Exception as e:
        logger.error(f"Error in debug item endpoint: {str(e)}", exc_info=True)
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to log detailed error information"""
    error_msg = f"Unhandled error: {str(exc)}"
    logger.error(f"{error_msg}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please check the logs for details."}
    )