from pathlib import Path
import sys
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from typing import List, Optional

# Get the absolute path to the project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(ROOT_DIR))

from api.dependencies import get_current_user
from api.dependencies import get_db, get_password_hash, authenticate_user, create_access_token, get_current_user
from api.models.user.model import User, UserRole

from api.dependencies import get_db, get_current_user
from api.models.item.model import Item, item_status


from pydantic import BaseModel

search_router = APIRouter(
    prefix="/api/v0/search",  # e.g., /api/v0/search
    tags=["Search"],  # Tags for OpenAPI documentation  
)

 

class ItemOut(BaseModel):
    item_id: int
    name: str
    description: str
    category: str
    price: float
    seller_user_id: int

    class Config:
        from_attributes = True




@search_router.get("/items/search_item", response_model=List[ItemOut])
def search_items(
    name: Optional[str] = Query(None, description="Search by item name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    status: Optional[item_status] = Query(item_status.for_sale, description="Filter by status"),
    seller_id: Optional[int] = Query(None, description="Filter by seller ID"),
    db: Session = Depends(get_db)
):
    """
    Search and filter items based on various criteria.
    """
    query = db.query(Item)  
    
    if status:
        query = query.filter(Item.status == status)
    if name:
        query = query.filter(Item.name.ilike(f"%{name.lower()}%"))
    if category:
        query = query.filter(Item.category.ilike(f"%{category.lower()}%"))
    if min_price is not None:
        query = query.filter(Item.price >= min_price)
    if max_price is not None:
        query = query.filter(Item.price <= max_price)
    if seller_id:
        query = query.filter(Item.seller_user_id == seller_id)
    
    items = query.all()
    return items



@search_router.get("/items/{item_id}", response_model=ItemOut)
def get_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific item by ID"""
    item = db.query(Item).filter(Item.item_id == item_id).first()  # ✅ ORM style
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
