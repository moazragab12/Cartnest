from pathlib import Path
import sys
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

# Get the absolute path to the project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(ROOT_DIR))

from api.db import get_db
from api.routers.products.schemas import ProductOut, ProductsResponse, CategoryResponse, CategoryProductsResponse, BestSellerResponse, ProductWithSales
from api.routers.products.productsHelper import ProductsHelper

# Create a router for products
products_router = APIRouter(
    prefix="/api/v0/products",
    tags=["Products"],
)

@products_router.get("/", response_model=ProductsResponse)
def get_all_products(
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(100, description="Maximum number of items to return"),
    category: str = Query(None, description="Filter by category"),
    sort_by: str = Query("listed_at", description="Sort by field (listed_at, price, name)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db)
):
    """
    Get all available products in the marketplace.
    By default, only returns products with status 'for_sale'.
    """
    products, total = ProductsHelper.get_all_products(
        db=db, 
        skip=skip, 
        limit=limit, 
        category=category, 
        sort_by=sort_by, 
        sort_order=sort_order
    )
    
    return {
        "items": products,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@products_router.get("/category/{category}", response_model=CategoryProductsResponse)
def get_products_by_category(
    category: str,
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(100, description="Maximum number of items to return"),
    sort_by: str = Query("listed_at", description="Sort by field (listed_at, price, name)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db)
):
    """
    Get all available products in a specific category.
    By default, only returns products with status 'for_sale'.
    """
    products, total, category_name = ProductsHelper.get_products_by_category(
        db=db, 
        category=category,
        skip=skip, 
        limit=limit, 
        sort_by=sort_by, 
        sort_order=sort_order
    )
    
    if total == 0:
        raise HTTPException(status_code=404, detail=f"No products found in category: {category}")
    
    return {
        "items": products,
        "total": total,
        "skip": skip,
        "limit": limit,
        "category": category_name
    }

@products_router.get("/best-sellers", response_model=BestSellerResponse)
def get_best_sellers(
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(10, description="Maximum number of items to return"),
    days: int = Query(30, description="Number of days to consider for sales data"),
    db: Session = Depends(get_db)
):
    """
    Get best-selling products based on sales volume.
    Returns products sorted by number of units sold.
    """
    products, total = ProductsHelper.get_best_sellers(
        db=db,
        skip=skip,
        limit=limit,
        days=days
    )
    
    return {
        "items": products,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@products_router.get("/featured", response_model=ProductsResponse)
def get_featured_products(
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(10, description="Maximum number of items to return"),
    db: Session = Depends(get_db)
):
    """
    Get featured products.
    Returns newest available products.
    """
    products, total = ProductsHelper.get_featured_products(
        db=db,
        skip=skip,
        limit=limit
    )
    
    return {
        "items": products,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@products_router.get("/{item_id}", response_model=ProductOut)
def get_product_by_id(
    item_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific product by ID.
    Returns 404 if the product doesn't exist or isn't for sale.
    """
    product = ProductsHelper.get_product_by_id(db=db, item_id=item_id)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not available")
    
    return product

@products_router.get("/categories", response_model=CategoryResponse)
def get_product_categories(db: Session = Depends(get_db)):
    """
    Get all distinct product categories in the marketplace.
    """
    categories = ProductsHelper.get_product_categories(db=db)
    
    return {"categories": categories}