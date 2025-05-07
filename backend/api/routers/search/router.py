from pathlib import Path
import sys
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Union

# Get the absolute path to the project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(ROOT_DIR))

from api.dependencies import get_db, get_current_user
from api.models.user.model import UserRole
from api.models.item.model import item_status
from api.models.transaction.model import Transaction
from datetime import datetime

# Import schemas from the schemas.py file
from api.routers.search.schemas import (
    ItemOut, 
    SellerItemOut, 
    UserOut, 
    DepositOut,
    EnhancedDepositOut,
    TransactionOut,
    EnhancedTransactionOut
)

# Import CRUD functions
from api.routers.search.crud import (
    search_items,
    enhanced_search_items,
    get_item_by_id,
    enhanced_search_item_by_id,
    search_users,
    get_user_by_id,
    search_deposits,
    enhanced_search_deposits,
    get_deposit_by_id,
    enhanced_get_deposit_by_id,
    search_transactions,
    enhanced_search_transactions,
    get_transaction_by_id,
    enhanced_get_transaction_by_id
)


search_router = APIRouter(
    tags=["Search"],  # Tags for OpenAPI documentation  
    responses={404: {"description": "Not found"}}  # Default response for 404 errors
)

# Helper function to convert database results to SellerItemOut format
def _format_seller_item(item, seller):
    """Helper function to convert database results to schema format"""
    seller_data = UserOut(
        user_id=seller.user_id,
        username=seller.username,
        email=seller.email,
        role=seller.role,
        cash_balance=seller.cash_balance,
        created_at=seller.created_at
    )
    
    return SellerItemOut(
        item_id=item.item_id,
        name=item.name,
        description=item.description,
        category=item.category,
        price=item.price,
        quantity=item.quantity,
        status=item.status,
        seller_user_id=item.seller_user_id,
        listed_at=item.listed_at,
        updated_at=item.updated_at,
        seller=seller_data
    )

# Helper function to convert database results to EnhancedDepositOut format
def _format_enhanced_deposit(deposit, user):
    """Helper function to format deposit with user details"""
    user_data = UserOut(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        role=user.role,
        cash_balance=user.cash_balance,
        created_at=user.created_at
    )
    
    return EnhancedDepositOut(
        deposit_id=deposit.deposit_id,
        user_id=deposit.user_id,
        amount=deposit.amount,
        deposit_time=deposit.deposit_time,
        user=user_data
    )

# Helper function to convert database results to EnhancedTransactionOut format
def _format_enhanced_transaction(transaction, seller, buyer, item=None):
    """Helper function to format transaction with user and item details"""
    seller_data = UserOut(
        user_id=seller.user_id,
        username=seller.username,
        email=seller.email,
        role=seller.role,
        cash_balance=seller.cash_balance,
        created_at=seller.created_at
    )
    
    buyer_data = UserOut(
        user_id=buyer.user_id,
        username=buyer.username,
        email=buyer.email,
        role=buyer.role,
        cash_balance=buyer.cash_balance,
        created_at=buyer.created_at
    )
    
    item_data = None
    if item:
        item_data = ItemOut(
            item_id=item.item_id,
            name=item.name,
            description=item.description,
            category=item.category,
            price=item.price,
            quantity=item.quantity,
            status=item.status,
            seller_user_id=item.seller_user_id,
            listed_at=item.listed_at,
            updated_at=item.updated_at
        )
    
    return EnhancedTransactionOut(
        transaction_id=transaction.transaction_id,
        item_id=transaction.item_id,
        seller_user_id=transaction.seller_user_id,
        buyer_user_id=transaction.buyer_user_id,
        quantity_purchased=transaction.quantity_purchased,
        purchase_price=transaction.purchase_price,
        total_amount=transaction.total_amount,
        transaction_time=transaction.transaction_time,
        seller=seller_data,
        buyer=buyer_data,
        item=item_data
    )

# ==================
# ITEM ENDPOINTS
# ==================

@search_router.get("/items/search", response_model=Union[List[SellerItemOut], SellerItemOut])
async def search_items_endpoint(
    item_id: Optional[int] = Query(None, description="Get a specific item by ID"),
    name: Optional[str] = Query(None, description="Search by item name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    status: Optional[item_status] = Query(item_status.for_sale, description="Filter by status"),
    seller_id: Optional[int] = Query(None, description="Filter by seller ID"),
    min_quantity: Optional[int] = Query(None, description="Minimum available quantity"),
    db: Session = Depends(get_db)
):
    """
    Enhanced search for items with comprehensive information including seller details.
    
    This endpoint allows flexible searching:
    - If item_id is provided: returns a single item with complete seller details
    - Without item_id: returns a list of items matching the search criteria
    
    All items include full seller information.
    """
    # Single item search by ID
    if item_id is not None:
        result = enhanced_search_item_by_id(db=db, item_id=item_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Item not found")
            
        item, seller = result
        return _format_seller_item(item, seller)
    
    # Handle the case where no parameters are provided - return all items
    if all(param is None for param in [name, category, min_price, max_price, seller_id, min_quantity]) and status == item_status.for_sale:
        # Default behavior when no filters specified: return all for_sale items
        results = enhanced_search_items(db=db, status=item_status.for_sale)
        if not results:
            return []
    else:
        # Multi-item search by criteria
        results = enhanced_search_items(
            db=db,
            name=name,
            category=category,
            min_price=min_price,
            max_price=max_price,
            status=status,
            seller_id=seller_id,
            min_quantity=min_quantity
        )
    
    # Convert the results to our response model format
    return [_format_seller_item(item, seller) for item, seller in results]

@search_router.get("/items/{item_id}", response_model=SellerItemOut)
def get_item_endpoint(
    item_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific item by ID, including seller details.
    """
    result = enhanced_search_item_by_id(db=db, item_id=item_id)
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
        
    item, seller = result
    return _format_seller_item(item, seller)

# ==================
# USER ENDPOINTS
# ==================

@search_router.get("/users/search", response_model=List[UserOut])
def search_users_endpoint(
    username: Optional[str] = Query(None, description="Search by username"),
    email: Optional[str] = Query(None, description="Search by email"),
    min_cash_balance: Optional[float] = Query(None, description="Minimum cash balance"),
    max_cash_balance: Optional[float] = Query(None, description="Maximum cash balance"),
    user_id: Optional[int] = Query(None, description="Search by user ID"),
    db: Session = Depends(get_db)
):
    """
    Search users by various criteria, including by ID.
    
    Returns a list of users matching the provided filters.
    If user_id is provided, returns just that user.
    """
    # First handle specific user ID search
    if user_id is not None:
        user = get_user_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return [user]  # Return as a single-item list for consistency
    
    # Handle the case where no parameters are provided - return all users
    if all(param is None for param in [username, email, min_cash_balance, max_cash_balance]):
        users = search_users(db=db)
        if not users:
            return []
    else:
        # Otherwise, perform search by criteria
        users = search_users(
            db=db,
            username=username,
            email=email,
            min_cash_balance=min_cash_balance,
            max_cash_balance=max_cash_balance
        )
    
    return users

@search_router.get("/users/{user_id}", response_model=UserOut)
def get_user_endpoint(  
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific user by ID"""
    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================
# DEPOSIT ENDPOINTS
# ==================

@search_router.get("/deposits/search", response_model=List[EnhancedDepositOut])
def search_deposits_endpoint(
    user_id: Optional[int] = Query(None, description="Search by user ID"),
    min_amount: Optional[float] = Query(None, description="Minimum deposit amount"),
    max_amount: Optional[float] = Query(None, description="Maximum deposit amount"),
    deposit_id: Optional[int] = Query(None, description="Search by deposit ID"),
    db: Session = Depends(get_db)
):
    """
    Search deposits by user ID, amount range, or specific ID.
    
    Returns deposits with full user details.
    If deposit_id is provided, returns just that deposit.
    """
    # First handle specific deposit ID search
    if deposit_id is not None:
        result = enhanced_get_deposit_by_id(db=db, deposit_id=deposit_id)
        if not result:
            raise HTTPException(status_code=404, detail="Deposit not found")
        deposit, user = result
        return [_format_enhanced_deposit(deposit, user)]  # Return as a single-item list for consistency
    
    # Handle the case where no parameters are provided - return all deposits
    if all(param is None for param in [user_id, min_amount, max_amount]):
        results = enhanced_search_deposits(db=db)
        if not results:
            return []
    else:
        # Otherwise, perform search by criteria
        results = enhanced_search_deposits(
            db=db, 
            user_id=user_id, 
            min_amount=min_amount, 
            max_amount=max_amount
        )
    
    return [_format_enhanced_deposit(deposit, user) for deposit, user in results]

@search_router.get("/deposits/{deposit_id}", response_model=EnhancedDepositOut)
def get_deposit_endpoint(
    deposit_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific deposit by ID with user details"""
    result = enhanced_get_deposit_by_id(db=db, deposit_id=deposit_id)
    if not result:
        raise HTTPException(status_code=404, detail="Deposit not found")
    deposit, user = result
    return _format_enhanced_deposit(deposit, user)

# ==================
# TRANSACTION ENDPOINTS
# ==================

@search_router.get("/transactions/search", response_model=List[EnhancedTransactionOut])
def search_transactions_endpoint(
    item_id: Optional[int] = Query(None, description="Search by item ID"),
    buyer_user_id: Optional[int] = Query(None, description="Search by buyer user ID"),
    seller_user_id: Optional[int] = Query(None, description="Search by seller user ID"),
    min_quantity: Optional[int] = Query(None, description="Minimum quantity purchased"),
    max_quantity: Optional[int] = Query(None, description="Maximum quantity purchased"),
    min_total_amount: Optional[float] = Query(None, description="Minimum total amount"),
    max_total_amount: Optional[float] = Query(None, description="Maximum total amount"),
    transaction_id: Optional[int] = Query(None, description="Search by transaction ID"),
    db: Session = Depends(get_db)
):
    """
    Search transactions by various criteria, including by ID.
    
    Returns transactions with full user and item details.
    If transaction_id is provided, returns just that transaction.
    """
    # First handle specific transaction ID search
    if transaction_id is not None:
        result = enhanced_get_transaction_by_id(db=db, transaction_id=transaction_id)
        if not result:
            raise HTTPException(status_code=404, detail="Transaction not found")
        transaction, seller, buyer, item = result
        return [_format_enhanced_transaction(transaction, seller, buyer, item)]  # Return as a single-item list for consistency
    
    # Handle the case where no parameters are provided - return all transactions
    if all(param is None for param in [item_id, buyer_user_id, seller_user_id, min_quantity, max_quantity, min_total_amount, max_total_amount]):
        results = enhanced_search_transactions(db=db)
        if not results:
            return []
    else:
        # Otherwise, perform search by criteria
        results = enhanced_search_transactions(
            db=db,
            item_id=item_id,
            buyer_user_id=buyer_user_id,
            seller_user_id=seller_user_id,
            min_quantity=min_quantity,
            max_quantity=max_quantity,
            min_total_amount=min_total_amount,
            max_total_amount=max_total_amount
        )
    
    return [_format_enhanced_transaction(t, s, b, i) for t, s, b, i in results]

@search_router.get("/transactions/{transaction_id}", response_model=EnhancedTransactionOut)
def get_transaction_endpoint(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID with full user and item details"""
    result = enhanced_get_transaction_by_id(db=db, transaction_id=transaction_id)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    transaction, seller, buyer, item = result
    return _format_enhanced_transaction(transaction, seller, buyer, item)
