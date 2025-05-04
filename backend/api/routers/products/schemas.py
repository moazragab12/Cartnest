from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from api.models.item.model import item_status

class ProductBase(BaseModel):
    """Base schema for product data"""
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    quantity: int
    status: item_status

class ProductOut(ProductBase):
    """Schema for product output data"""
    item_id: int
    seller_user_id: int
    listed_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductWithSales(ProductOut):
    """Schema for product with sales information"""
    total_sales: int = 0
    
    class Config:
        from_attributes = True

class ProductsResponse(BaseModel):
    """Schema for paginated products response"""
    items: List[ProductOut]
    total: int
    skip: int
    limit: int

class CategoryProductsResponse(ProductsResponse):
    """Schema for category-specific products response"""
    category: str

class BestSellerResponse(BaseModel):
    """Schema for best seller products response"""
    items: List[ProductWithSales]
    total: int
    skip: int
    limit: int

class CategoryResponse(BaseModel):
    """Schema for categories response"""
    categories: List[str]