from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session
from typing import List, Optional
import logging

logger = logging.getLogger("profile_management")

# ==================== TEMPORARY AUTHENTICATION CODE - DELETE WHEN REAL AUTH IS IMPLEMENTED ====================
# This section contains temporary authentication code that should be replaced
# with the real authentication from dependencies.py when it's implemented by the team

# Very simple temporary auth without token validation - just for testing
async def get_current_user_temporary():
    """
    Temporary placeholder for authentication that bypasses token validation.
    This will be replaced with the actual authentication from dependencies.py.
    
    Returns a mock user for testing purposes.
    """
    # For testing, just return a mock user with ID=1
    # Use relative imports
    from ...models.user.model import User, UserRole
    return User(
        user_id=23, 
        username="temp_user", 
        password_hash="not_a_real_hash", 
        email="temp@example.com", 
        role=UserRole.user,
        cash_balance=1000.0
    )
# ==================== END TEMPORARY AUTHENTICATION CODE ====================

# ==================== FUTURE AUTHENTICATION IMPLEMENTATION - UNCOMMENT WHEN AVAILABLE ====================
# from ...dependencies import get_current_user
# ==================== END FUTURE AUTHENTICATION IMPLEMENTATION ====================

# Import database dependency
from ...db import get_db
# Import models from the central api.models directory using relative paths
from ...models.user.model import User
from ...models.item.model import Item, ItemStatus
from ...models.transaction.model import Transaction

# Import schemas
from .schemas import (
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    WalletDeposit,
    TransactionResponse,
    ProfileOverview
)

# Import CRUD operations
from .crud import (
    create_item,
    get_item,
    get_items_by_seller,
    update_item,
    delete_item,
    deposit_to_wallet,
    get_wallet_balance,
    get_user_transactions,
    get_profile_overview
)

router = APIRouter(
    prefix="/profile",
    tags=["profile"]
)

# Item Management (CRUD) Endpoints

@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item_endpoint(
    item_data: ItemCreate,
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new item for sale."""
    db_item = create_item(db, item_data, current_user.user_id)
    return db_item


@router.get("/items", response_model=List[ItemResponse])
async def get_user_items(
    skip: int = 0,
    limit: int = 100,
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all items by current user."""
    items = get_items_by_seller(db, current_user.user_id, skip, limit)
    return items


@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item_endpoint(
    item_id: int,
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific item by ID."""
    try:
        logger.debug(f"Attempting to retrieve item with ID: {item_id} for user: {current_user.user_id}")
        db_item = get_item(db, item_id)
        
        if not db_item:
            logger.info(f"Item with ID {item_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        logger.debug(f"Item found. Seller ID: {db_item.seller_user_id}, Current user ID: {current_user.user_id}")
        
        # Comment out the authorization check for now, for testing purposes
        # If the item exists but belongs to another user, we'll still allow access for testing
        # Once authentication is properly implemented, uncomment this block
        """
        if db_item.seller_user_id != current_user.user_id:
            logger.warning(f"Authorization failed: User {current_user.user_id} attempted to access item {item_id} owned by user {db_item.seller_user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this item"
            )
        """
        
        logger.info(f"Successfully retrieved item: {item_id}")
        return db_item
        
    except HTTPException:
        # Re-raise HTTP exceptions as they're already properly formatted
        raise
    except Exception as e:
        # Log unexpected errors but don't expose details to client
        logger.error(f"Unexpected error retrieving item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving the item"
        )


@router.put("/items/{item_id}", response_model=ItemResponse)
async def update_item_endpoint(
    item_id: int,
    item_data: ItemUpdate,
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an item."""
    # Check if the item exists and belongs to the current user
    db_item = get_item(db, item_id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
        
    if db_item.seller_user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this item"
        )
        
    # Check if the item is already sold
    if db_item.status == ItemStatus.sold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a sold item"
        )
        
    updated_item = update_item(db, item_id, item_data)
    return updated_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_endpoint(
    item_id: int,
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete (mark as removed) an item."""
    # Check if the item exists
    db_item = get_item(db, item_id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
        
    # Check if the user is authorized to delete the item
    if db_item.seller_user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )
        
    # Check if the item is already sold
    if db_item.status == ItemStatus.sold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a sold item"
        )
        
    deleted = delete_item(db, item_id, current_user.user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item could not be deleted"
        )
        
    return None


# Wallet Management Endpoints

@router.post("/wallet/deposit", response_model=TransactionResponse)
async def deposit_to_wallet_endpoint(
    deposit_data: WalletDeposit,
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deposit cash to user wallet."""
    deposit = deposit_to_wallet(db, current_user.user_id, deposit_data)
    
    # Convert Deposit to TransactionResponse for consistency in API
    transaction = TransactionResponse(
        id=deposit.deposit_id,
        user_id=deposit.user_id,
        amount=deposit.amount,
        transaction_type="deposit",
        description=f"Deposit of {deposit.amount}",
        timestamp=deposit.deposit_time
    )
    
    return transaction


@router.get("/wallet/balance", response_model=float)
async def get_wallet_balance_endpoint(
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's wallet balance."""
    balance = get_wallet_balance(db, current_user.user_id)
    return balance


@router.get("/wallet/transactions", response_model=List[TransactionResponse])
async def get_user_transactions_endpoint(
    skip: int = 0,
    limit: int = 100,
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's transactions."""
    transactions = get_user_transactions(db, current_user.user_id, skip, limit)
    return transactions


# Profile Overview Endpoint

@router.get("/overview", response_model=ProfileOverview)
async def get_profile_overview_endpoint(
    # TEMPORARY - Replace with real auth when available
    current_user: User = Depends(get_current_user_temporary),
    # FUTURE - Uncomment when real auth is available
    # current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile overview."""
    profile_data = get_profile_overview(db, current_user.user_id)
    return profile_data