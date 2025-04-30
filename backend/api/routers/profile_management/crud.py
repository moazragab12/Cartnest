import logging
from sqlmodel import Session, select, or_, and_
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...models.user.model import User
from ...models.item.model import Item, ItemStatus
from ...models.transaction.model import Transaction
from ...models.deposit.model import Deposit

from .schemas import ItemCreate, ItemUpdate, WalletDeposit

logger = logging.getLogger(__name__)

# Item CRUD operations
def create_item(db: Session, item_data: ItemCreate, seller_id: int) -> Item:
    """
    Create a new item for sale.
    
    Args:
        db: Database session
        item_data: Item data
        seller_id: ID of the seller
        
    Returns:
        Item: Created item
    """
    db_item = Item(
        name=item_data.name,
        description=item_data.description,
        category=item_data.category,
        price=item_data.price,
        quantity=item_data.quantity if item_data.quantity is not None else 1,
        seller_user_id=seller_id,
        status=ItemStatus.for_sale
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_item(db: Session, item_id: int) -> Optional[Item]:
    """
    Get item by ID.
    
    Args:
        db: Database session
        item_id: ID of the item
        
    Returns:
        Optional[Item]: Item if found, None otherwise
    """
    return db.get(Item, item_id)


def get_items_by_seller(db: Session, seller_id: int, skip: int = 0, limit: int = 100) -> List[Item]:
    """
    Get all items by seller.
    
    Args:
        db: Database session
        seller_id: ID of the seller
        skip: Number of items to skip
        limit: Maximum number of items to return
        
    Returns:
        List[Item]: List of items
    """
    return db.exec(
        select(Item)
        .where(Item.seller_user_id == seller_id)
        .offset(skip)
        .limit(limit)
    ).all()


def get_items_for_sale_by_seller(db: Session, seller_id: int) -> List[Item]:
    """
    Get items for sale by seller.
    
    Args:
        db: Database session
        seller_id: ID of the seller
        
    Returns:
        List[Item]: List of items for sale
    """
    return db.exec(
        select(Item)
        .where(and_(Item.seller_user_id == seller_id, Item.status == ItemStatus.for_sale))
    ).all()


def get_sold_items_by_seller(db: Session, seller_id: int) -> List[Item]:
    """
    Get sold items by seller.
    
    Args:
        db: Database session
        seller_id: ID of the seller
        
    Returns:
        List[Item]: List of sold items
    """
    return db.exec(
        select(Item)
        .where(and_(Item.seller_user_id == seller_id, Item.status == ItemStatus.sold))
    ).all()


def get_purchased_items_by_user(db: Session, user_id: int) -> List[Item]:
    """
    Get purchased items by user.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        List[Item]: List of purchased items
    """
    return db.exec(
        select(Item)
        .join(Transaction, Item.item_id == Transaction.item_id)
        .where(Transaction.buyer_user_id == user_id)
    ).all()


def update_item(db: Session, item_id: int, item_data: ItemUpdate) -> Optional[Item]:
    """
    Update item.
    
    Args:
        db: Database session
        item_id: ID of the item
        item_data: Updated item data
        
    Returns:
        Optional[Item]: Updated item if found, None otherwise
    """
    db_item = get_item(db, item_id)
    if not db_item:
        return None
        
    update_data = item_data.dict(exclude_unset=True)
    
    if update_data:
        # Update item fields
        for field, value in update_data.items():
            setattr(db_item, field, value)
            
        # Update the updated_at timestamp
        db_item.updated_at = datetime.utcnow()
        
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
    
    return db_item


def delete_item(db: Session, item_id: int, seller_id: int) -> bool:
    """
    Delete item (mark as removed).
    
    Args:
        db: Database session
        item_id: ID of the item
        seller_id: ID of the seller
        
    Returns:
        bool: True if deleted, False otherwise
    """
    db_item = db.exec(
        select(Item)
        .where(and_(Item.item_id == item_id, Item.seller_user_id == seller_id))
    ).first()
    
    if not db_item or db_item.status == ItemStatus.sold:
        return False
        
    db_item.status = ItemStatus.removed
    db_item.updated_at = datetime.utcnow()
    
    db.add(db_item)
    db.commit()
    
    return True


# Wallet CRUD operations
def deposit_to_wallet(db: Session, user_id: int, deposit_data: WalletDeposit) -> Deposit:
    """
    Deposit cash to user wallet.
    
    Args:
        db: Database session
        user_id: ID of the user
        deposit_data: Deposit amount
        
    Returns:
        Deposit: Deposit record
    """
    logger.info(f"Attempting deposit for user_id: {user_id}, amount: {deposit_data.amount}")
    try:
        # Get user
        logger.debug(f"Fetching user with ID: {user_id}")
        user = db.get(User, user_id)
        if not user:
            logger.error(f"User not found for ID: {user_id}")
            raise ValueError("User not found")
        logger.debug(f"User found: {user.username}. Current balance: {user.cash_balance}")
            
        # Update user wallet balance
        new_balance = user.cash_balance + float(deposit_data.amount)
        logger.debug(f"Updating balance from {user.cash_balance} to {new_balance}")
        user.cash_balance = new_balance
        
        # Create deposit record
        logger.debug("Creating deposit record")
        deposit = Deposit(
            user_id=user_id,
            amount=deposit_data.amount
        )
        
        logger.debug("Adding user and deposit objects to session")
        db.add(user)
        db.add(deposit)
        
        logger.debug("Committing transaction")
        db.commit()
        logger.info(f"Deposit successful for user_id: {user_id}. New balance: {user.cash_balance}")
        
        logger.debug("Refreshing deposit object")
        db.refresh(deposit)
        
        return deposit
    except Exception as e:
        logger.error(f"Error during deposit for user_id {user_id}: {str(e)}", exc_info=True)
        # Rollback the transaction in case of error
        logger.warning("Rolling back transaction due to error.")
        db.rollback()
        raise  # Re-raise the exception to be caught by FastAPI's handler


def get_wallet_balance(db: Session, user_id: int) -> float:
    """
    Get user wallet balance.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        float: Wallet balance
    """
    user = db.get(User, user_id)
    if not user:
        raise ValueError("User not found")
        
    return user.cash_balance


def get_user_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Transaction]:
    """
    Get user transactions.
    
    Args:
        db: Database session
        user_id: ID of the user
        skip: Number of transactions to skip
        limit: Maximum number of transactions to return
        
    Returns:
        List[Transaction]: List of transactions
    """
    return db.exec(
        select(Transaction)
        .where(or_(Transaction.buyer_user_id == user_id, Transaction.seller_user_id == user_id))
        .order_by(Transaction.transaction_time.desc())
        .offset(skip)
        .limit(limit)
    ).all()


# Profile overview operations
def get_profile_overview(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Get user profile overview.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        Dict[str, Any]: Profile overview data
    """
    user = db.get(User, user_id)
    if not user:
        raise ValueError("User not found")
        
    items_for_sale = get_items_for_sale_by_seller(db, user_id)
    sold_items = get_sold_items_by_seller(db, user_id)
    purchased_items = get_purchased_items_by_user(db, user_id)
    
    return {
        "user_id": user.user_id,
        "username": user.username,
        "wallet_balance": user.cash_balance,
        "items_for_sale": items_for_sale,
        "sold_items": sold_items,
        "purchased_items": purchased_items
    }