from pathlib import Path
import sys
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from typing import List, Optional
from api.models.user.model import User
# Get the absolute path to the project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(ROOT_DIR))

from api.dependencies import get_current_user
from api.dependencies import get_db, get_password_hash, authenticate_user, create_access_token, get_current_user
from api.models.user.model import User, UserRole

from api.dependencies import get_db, get_current_user
from api.models.item.model import Item, item_status
from api.models.transaction.model import Transaction
from api.models.deposit.model import Deposit
from pydantic import BaseModel
from datetime import datetime


search_router = APIRouter(
    tags=["Search"],  # Tags for OpenAPI documentation  
    responses={404: {"description": "Not found"}}  # Default response for 404 errors
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


class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    cash_balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class DepositOut(BaseModel):
    deposit_id: int
    user_id: int
    amount: float
    deposit_time: datetime

    class Config:
        from_attributes = True


@search_router.get("/deposits/search", response_model=List[DepositOut])
def search_deposits(
    user_id: Optional[int] = Query(None, description="Search by user ID"),
    min_amount: Optional[float] = Query(None, description="Minimum deposit amount"),
    max_amount: Optional[float] = Query(None, description="Maximum deposit amount"),
    db: Session = Depends(get_db)
):
    """
    Search deposits based on user_id and amount range.
    """
    query = db.query(Deposit)

    if user_id:
        query = query.filter(Deposit.user_id == user_id)
    if min_amount is not None:
        query = query.filter(Deposit.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Deposit.amount <= max_amount)

    deposits = query.all()
    return deposits        



@search_router.get("/transactions/search", response_model=List[Transaction])
def search_transactions(
    item_id: Optional[int] = Query(None, description="Search by item ID"),
    buyer_user_id: Optional[int] = Query(None, description="Search by buyer user ID"),
    seller_user_id: Optional[int] = Query(None, description="Search by seller user ID"),
    min_quantity: Optional[int] = Query(None, description="Minimum quantity purchased"),
    max_quantity: Optional[int] = Query(None, description="Maximum quantity purchased"),
    min_total_amount: Optional[float] = Query(None, description="Minimum total amount"),
    max_total_amount: Optional[float] = Query(None, description="Maximum total amount"),
    db: Session = Depends(get_db)
):
    """
    Search transactions based on various criteria.
    """
    query = db.query(Transaction)

    if item_id:
        query = query.filter(Transaction.item_id == item_id)
    if buyer_user_id:
        query = query.filter(Transaction.buyer_user_id == buyer_user_id)
    if seller_user_id:
        query = query.filter(Transaction.seller_user_id == seller_user_id)
    if min_quantity is not None:
        query = query.filter(Transaction.quantity_purchased >= min_quantity)
    if max_quantity is not None:
        query = query.filter(Transaction.quantity_purchased <= max_quantity)
    if min_total_amount is not None:
        query = query.filter(Transaction.total_amount >= min_total_amount)
    if max_total_amount is not None:
        query = query.filter(Transaction.total_amount <= max_total_amount)

    transactions = query.all()
    return transactions 

@search_router.get("/users/search", response_model=List[UserOut])
def search_users(
    username: Optional[str] = Query(None, description="Search by username"),
    email: Optional[str] = Query(None, description="Search by email"),
    role: Optional[str] = Query(None, description="Search by role"),
    min_cash_balance: Optional[float] = Query(None, description="Minimum cash balance"),
    max_cash_balance: Optional[float] = Query(None, description="Maximum cash balance"),
    db: Session = Depends(get_db)
):
    """
    Search users based on username, email, role, and cash balance range.
    """
    query = db.query(User)

    if username:
        query = query.filter(User.username.ilike(f"%{username.lower()}%"))
    if email:
        query = query.filter(User.email.ilike(f"%{email.lower()}%"))
    if min_cash_balance is not None:
        query = query.filter(User.cash_balance >= min_cash_balance)
    if max_cash_balance is not None:
        query = query.filter(User.cash_balance <= max_cash_balance)

    users = query.all()
    return users

@search_router.get("/users/{user_id}", response_model=UserOut)
def get_user(  
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific user by ID"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user     


@search_router.get("/deposits/{deposit_id}", response_model=DepositOut)
def get_deposit(
    deposit_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific deposit by ID"""
    deposit = db.query(Deposit).filter(Deposit.deposit_id == deposit_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return deposit


@search_router.get("/transactions/{transaction_id}", response_model=Transaction)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID"""
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

     



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
