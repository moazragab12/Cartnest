from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from api.models.item.model import item_status


class UserOut(BaseModel):
    """Schema for user output in search results"""
    user_id: int
    username: str
    email: str
    role: str
    cash_balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class ItemOut(BaseModel):
    """Schema for item output in search results"""
    item_id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    price: float
    quantity: int
    status: item_status
    seller_user_id: int
    listed_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SellerItemOut(BaseModel):
    """Schema for item with seller details in search results"""
    item_id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    price: float
    quantity: int
    status: item_status
    seller_user_id: int
    listed_at: datetime
    updated_at: datetime
    seller: Optional[UserOut] = None

    class Config:
        from_attributes = True


class DepositOut(BaseModel):
    """Schema for deposit output in search results"""
    deposit_id: int
    user_id: int
    amount: float
    deposit_time: datetime

    class Config:
        from_attributes = True


class EnhancedDepositOut(BaseModel):
    """Schema for deposit output with full user details"""
    deposit_id: int
    user_id: int
    amount: float
    deposit_time: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


class TransactionOut(BaseModel):
    """Schema for transaction output in search results"""
    transaction_id: int
    item_id: int
    seller_user_id: int
    buyer_user_id: int
    quantity_purchased: int
    purchase_price: float  # Fixed: Changed from price_per_unit to purchase_price
    total_amount: float
    transaction_time: datetime  # Fixed: Changed from transaction_date to transaction_time

    class Config:
        from_attributes = True


class EnhancedTransactionOut(BaseModel):
    """Schema for transaction with full user and item details"""
    transaction_id: int
    item_id: int
    seller_user_id: int
    buyer_user_id: int
    quantity_purchased: int
    purchase_price: float  # Fixed: Changed from price_per_unit to purchase_price
    total_amount: float
    transaction_time: datetime  # Fixed: Changed from transaction_date to transaction_time
    seller: Optional[UserOut] = None
    buyer: Optional[UserOut] = None
    item: Optional[ItemOut] = None

    class Config:
        from_attributes = True