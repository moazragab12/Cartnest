from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from api.models.item.model import item_status


class ItemBase(BaseModel):
    """Base schema for Item operations"""
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(gt=0)
    quantity: int = Field(gt=0, default=1)
    status: Optional[item_status] = item_status.for_sale


class ItemResponse(ItemBase):
    """Response schema for Items"""
    item_id: int
    seller_user_id: int
    listed_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


class CategoryResponse(BaseModel):
    """Response schema for Categories"""
    name: str
    item_count: int
    
    class Config:
        orm_mode = True