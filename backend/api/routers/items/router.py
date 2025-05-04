from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from typing import List, Optional
import logging
import sys
from pathlib import Path

# Get the absolute path to the project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(ROOT_DIR))

from api.db import get_db
from api.models.item.model import Item, item_status

# Import schemas
from .schemas import ItemResponse, CategoryResponse

# Import CRUD operations
from .crud import (
    get_all_items,
    get_featured_items,
    get_recent_items,
    get_unique_categories,
    get_items_by_category
)

logger = logging.getLogger("items_router")

router = APIRouter(
    tags=["Items"],
    responses={404: {"description": "Not found"}}
)

@router.get("/", response_model=List[ItemResponse])
async def list_all_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, gt=1, le=100),  # Max 100 items per request
    db: Session = Depends(get_db)
):
    """Get all items that are for sale"""
    items = get_all_items(db, skip=skip, limit=limit)
    return items

@router.get("/featured", response_model=List[ItemResponse])
async def list_featured_items(
    limit: int = Query(100, gt=1, le=100),  # Max 100 featured items
    db: Session = Depends(get_db)
):
    """Get featured items (currently highest priced)"""
    items = get_featured_items(db, limit=limit)
    return items

@router.get("/recent", response_model=List[ItemResponse])
async def list_recent_items(
    days: int = Query(7, ge=1),  # No maximum limit on days
    limit: int = Query(100, gt=1, le=100),  # Max 100 recent items
    db: Session = Depends(get_db)
):
    """Get recently listed items"""
    items = get_recent_items(db, days=days, limit=limit)
    return items

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    db: Session = Depends(get_db)
):
    """Get all unique categories with item counts"""
    categories = get_unique_categories(db)
    return categories

@router.get("/categories/{category}", response_model=List[ItemResponse])
async def list_items_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, gt=1, le=100),  # Max 100 items per category query
    db: Session = Depends(get_db)
):
    """Get items by category"""
    items = get_items_by_category(db, category=category, skip=skip, limit=limit)
    return items