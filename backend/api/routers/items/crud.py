from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime, timedelta
from api.models.item.model import Item, item_status


def get_all_items(db: Session, skip: int = 0, limit: Optional[int] = None):
    """
    Get all active items that are for sale
    """
    statement = select(Item).where(
        Item.status == item_status.for_sale,
        Item.quantity > 0
    ).offset(skip)
    
    if limit is not None:
        statement = statement.limit(limit)
    
    return db.exec(statement).all()


def get_featured_items(db: Session, limit: Optional[int] = None):
    """
    Get featured items - currently implements as highest priced items
    """
    statement = select(Item).where(
        Item.status == item_status.for_sale,
        Item.quantity > 0
    ).order_by(Item.price.desc())
    
    if limit is not None:
        statement = statement.limit(limit)
    
    return db.exec(statement).all()


def get_recent_items(db: Session, days: int = 7, limit: Optional[int] = None):
    """
    Get items listed within the last specified days
    """
    recent_date = datetime.now() - timedelta(days=days)
    
    statement = select(Item).where(
        Item.status == item_status.for_sale,
        Item.quantity > 0,
        Item.listed_at >= recent_date
    ).order_by(Item.listed_at.desc())
    
    if limit is not None:
        statement = statement.limit(limit)
    
    return db.exec(statement).all()


def get_unique_categories(db: Session):
    """
    Get all unique categories with item count
    """
    statement = select(
        Item.category,
        func.count(Item.item_id).label("item_count")
    ).where(
        Item.status == item_status.for_sale,
        Item.quantity > 0,
        Item.category != None
    ).group_by(Item.category)
    
    results = db.exec(statement).all()
    return [{"name": category, "item_count": count} for category, count in results]


def get_items_by_category(db: Session, category: str, skip: int = 0, limit: Optional[int] = None):
    """
    Get items by category
    """
    statement = select(Item).where(
        Item.status == item_status.for_sale,
        Item.quantity > 0,
        Item.category == category
    ).offset(skip)
    
    if limit is not None:
        statement = statement.limit(limit)
    
    return db.exec(statement).all()