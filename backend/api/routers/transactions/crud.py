from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime

from api.models.transaction.model import Transaction
from api.models.item.model import Item, item_status
from api.models.user.model import User
from .schemas import TransactionCreate, BalanceTransfer


def create_transaction(
    db: Session, 
    transaction_data: TransactionCreate, 
    buyer_id: int
) -> Transaction:
    """
    Create a transaction to purchase an item.
    
    Args:
        db: Database session
        transaction_data: Transaction creation data
        buyer_id: ID of the user making the purchase
        
    Returns:
        Created transaction
        
    Raises:
        HTTPException: If item doesn't exist, isn't for sale, insufficient quantity,
                      buyer doesn't have enough funds, or buyer is the seller
    """
    # Get the item
    item = db.query(Item).filter(Item.item_id == transaction_data.item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {transaction_data.item_id} not found"
        )
    
    # Check item status
    if item.status != item_status.for_sale:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item with ID {transaction_data.item_id} is not available for sale"
        )
    
    # Check quantity
    if transaction_data.quantity > item.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({transaction_data.quantity}) exceeds available quantity ({item.quantity})"
        )
    
    # Check if buyer is the seller
    if buyer_id == item.seller_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot purchase your own items"
        )
    
    # Get buyer
    buyer = db.query(User).filter(User.user_id == buyer_id).first()
    
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer with ID {buyer_id} not found"
        )
    
    # Get seller
    seller = db.query(User).filter(User.user_id == item.seller_user_id).first()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Seller with ID {item.seller_user_id} not found"
        )
    
    # Calculate total amount
    total_amount = item.price * transaction_data.quantity
    
    # Check if buyer has enough funds
    if buyer.cash_balance < total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient funds. Required: {total_amount}, Available: {buyer.cash_balance}"
        )
    
    # Create transaction
    transaction = Transaction(
        item_id=item.item_id,
        buyer_user_id=buyer_id,
        seller_user_id=item.seller_user_id,
        quantity_purchased=transaction_data.quantity,
        purchase_price=item.price,
        total_amount=total_amount
    )
    
    # Update buyer's balance
    buyer.cash_balance -= total_amount
    
    # Update seller's balance
    seller.cash_balance += total_amount
    
    # Update item quantity or status
    if transaction_data.quantity == item.quantity:
        item.status = item_status.sold
        item.quantity = 0
    else:
        item.quantity -= transaction_data.quantity
    
    # Save all changes
    db.add(transaction)
    db.add(buyer)
    db.add(seller)
    db.add(item)
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def get_user_transactions(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[Transaction]:
    """
    Get all transactions where the user is either buyer or seller.
    
    Args:
        db: Database session
        user_id: ID of the user
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        
    Returns:
        List of transactions
    """
    transactions = db.query(Transaction).filter(
        or_(
            Transaction.buyer_user_id == user_id,
            Transaction.seller_user_id == user_id
        )
    ).order_by(Transaction.transaction_time.desc()).offset(skip).limit(limit).all()
    
    return transactions


def get_transaction_by_id(
    db: Session, 
    transaction_id: int,
    user_id: int
) -> Dict[str, Any]:
    """
    Get a transaction by its ID if the user is either buyer or seller,
    including detailed information about the buyer, seller, and item.
    
    Args:
        db: Database session
        transaction_id: ID of the transaction
        user_id: ID of the user requesting the transaction
        
    Returns:
        Transaction with detailed buyer, seller, and item information
        
    Raises:
        HTTPException: If transaction doesn't exist or user isn't involved in it
    """
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found"
        )
    
    # Check if user is either buyer or seller
    if user_id != transaction.buyer_user_id and user_id != transaction.seller_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this transaction"
        )
    
    # Get buyer information
    buyer = db.query(User).filter(User.user_id == transaction.buyer_user_id).first()
    
    # Get seller information
    seller = db.query(User).filter(User.user_id == transaction.seller_user_id).first()
    
    # Get item information
    item = db.query(Item).filter(Item.item_id == transaction.item_id).first()
    
    # Create the enhanced response
    transaction_dict = {
        "transaction_id": transaction.transaction_id,
        "item_id": transaction.item_id,
        "buyer_user_id": transaction.buyer_user_id,
        "seller_user_id": transaction.seller_user_id,
        "quantity_purchased": transaction.quantity_purchased,
        "purchase_price": transaction.purchase_price,
        "total_amount": transaction.total_amount,
        "transaction_time": transaction.transaction_time,
        "buyer": {
            "user_id": buyer.user_id,
            "username": buyer.username,
            "email": buyer.email
        } if buyer else None,
        "seller": {
            "user_id": seller.user_id,
            "username": seller.username,
            "email": seller.email
        } if seller else None,
        "item": {
            "item_id": item.item_id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": item.category
        } if item else None
    }
    
    return transaction_dict


def transfer_balance(
    db: Session,
    transfer_data: BalanceTransfer,
    sender_id: int
) -> dict:
    """
    Transfer balance from one user to another.
    
    Args:
        db: Database session
        transfer_data: Transfer data containing receiver_id and amount
        sender_id: ID of the user sending the money
        
    Returns:
        Dictionary with updated sender balance
        
    Raises:
        HTTPException: If sender or receiver doesn't exist, insufficient funds,
                      or trying to transfer to self
    """
    # Check if sender exists
    sender = db.query(User).filter(User.user_id == sender_id).first()
    
    if not sender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sender with ID {sender_id} not found"
        )
    
    # Check if receiver exists
    receiver = db.query(User).filter(User.user_id == transfer_data.receiver_id).first()
    
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receiver with ID {transfer_data.receiver_id} not found"
        )
    
    # Check if sender has enough balance
    if sender.cash_balance < transfer_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient funds. Required: {transfer_data.amount}, Available: {sender.cash_balance}"
        )
    
    # Check if sender is trying to transfer to themselves
    if sender_id == transfer_data.receiver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot transfer money to yourself"
        )
    
    # Update sender's balance
    sender.cash_balance -= transfer_data.amount
    
    # Update receiver's balance
    receiver.cash_balance += transfer_data.amount
    
    # Save changes
    db.add(sender)
    db.add(receiver)
    db.commit()
    db.refresh(sender)
    
    return {
        "user_id": sender_id,
        "cash_balance": sender.cash_balance,
        "message": f"Successfully transferred {transfer_data.amount} to user {transfer_data.receiver_id}"
    }