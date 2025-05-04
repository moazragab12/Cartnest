from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Tuple, Dict, Any
from api.models.item.model import Item, item_status
from api.models.transaction.model import Transaction

class ProductsHelper:
    """Helper for product-related queries and operations"""
    
    @staticmethod
    def get_all_products(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        sort_by: str = "listed_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Item], int]:
        """
        Get all available products with filtering and sorting options
        Returns a tuple of (list of items, total count)
        """
        # Base query for available products
        query = db.query(Item).filter(Item.status == item_status.for_sale)
        
        # Get total count for pagination before applying skip/limit
        total_count = query.count()
        
        # Apply category filter if provided
        if category:
            query = query.filter(Item.category.ilike(f"%{category}%"))
            # Update total count after filtering
            total_count = query.count()
        
        # Apply sorting
        if sort_by == "price":
            query = query.order_by(Item.price.desc() if sort_order == "desc" else Item.price)
        elif sort_by == "name":
            query = query.order_by(Item.name.desc() if sort_order == "desc" else Item.name)
        else:  # default to listed_at
            query = query.order_by(Item.listed_at.desc() if sort_order == "desc" else Item.listed_at)
        
        # Apply pagination
        products = query.offset(skip).limit(limit).all()
        
        return products, total_count

    @staticmethod
    def get_product_by_id(
        db: Session,
        item_id: int
    ) -> Optional[Item]:
        """
        Get a specific product by ID
        Only returns products with status 'for_sale'
        """
        return db.query(Item).filter(
            Item.item_id == item_id, 
            Item.status == item_status.for_sale
        ).first()
        
    @staticmethod
    def get_product_categories(
        db: Session
    ) -> List[str]:
        """
        Get all distinct product categories in the marketplace
        Only considers categories from products with status 'for_sale'
        """
        result = db.query(Item.category).distinct().filter(
            Item.category.isnot(None),
            Item.status == item_status.for_sale
        ).all()
        
        # Extract category strings from result
        categories = [category[0] for category in result if category[0]]
        
        return categories
        
    @staticmethod
    def get_products_by_category(
        db: Session,
        category: str,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "listed_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Item], int, str]:
        """
        Get all available products in a specific category
        Returns a tuple of (list of items, total count, category)
        """
        # Base query for available products in the specified category
        query = db.query(Item).filter(
            Item.status == item_status.for_sale,
            Item.category.ilike(f"%{category}%")
        )
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply sorting
        if sort_by == "price":
            query = query.order_by(Item.price.desc() if sort_order == "desc" else Item.price)
        elif sort_by == "name":
            query = query.order_by(Item.name.desc() if sort_order == "desc" else Item.name)
        else:  # default to listed_at
            query = query.order_by(Item.listed_at.desc() if sort_order == "desc" else Item.listed_at)
        
        # Apply pagination
        products = query.offset(skip).limit(limit).all()
        
        return products, total_count, category
    
    @staticmethod
    def get_best_sellers(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        days: int = 30  # Default to last 30 days
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Get best-selling products based on transaction volume
        Returns a tuple of (list of items with sales data, total count)
        """
        # Use a subquery to get the total sales for each item
        sales_subquery = (
            db.query(
                Transaction.item_id,
                func.sum(Transaction.quantity_purchased).label("total_sales")
            )
            .group_by(Transaction.item_id)
            .subquery()
        )
        
        # Query to join items with their sales data and filter by status
        query = (
            db.query(Item, func.coalesce(sales_subquery.c.total_sales, 0).label("total_sales"))
            .outerjoin(sales_subquery, Item.item_id == sales_subquery.c.item_id)
            .filter(Item.status == item_status.for_sale)
            .order_by(desc("total_sales"), desc(Item.listed_at))
        )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        results = query.offset(skip).limit(limit).all()
        
        # Format results as dictionaries with sales data
        products_with_sales = []
        for item, total_sales in results:
            item_dict = {
                column.name: getattr(item, column.name) 
                for column in item.__table__.columns
            }
            item_dict["total_sales"] = total_sales or 0
            products_with_sales.append(item_dict)
            
        return products_with_sales, total_count
    
    @staticmethod
    def get_featured_products(
        db: Session,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Item], int]:
        """
        Get featured products (newest and with a good price)
        Returns a tuple of (list of items, total count)
        """
        # Base query for available products, sorted by newest first
        query = (
            db.query(Item)
            .filter(Item.status == item_status.for_sale)
            .order_by(desc(Item.listed_at))
        )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        products = query.offset(skip).limit(limit).all()
        
        return products, total_count