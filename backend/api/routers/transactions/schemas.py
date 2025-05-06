from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class TransactionBase(BaseModel):
    """Base transaction model"""
    item_id: int
    quantity: int = Field(gt=0, default=1, description="Quantity of items to purchase")
    
    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than zero')
        return v


class TransactionCreate(TransactionBase):
    """Request schema for creating a transaction"""
    pass


class TransactionResponse(BaseModel):
    """Response schema for transaction details"""
    transaction_id: int
    item_id: int
    buyer_user_id: int
    seller_user_id: int
    quantity_purchased: int
    purchase_price: float
    total_amount: float
    transaction_time: Optional[datetime] = None
    item_name: Optional[str] = None
    seller_name: Optional[str] = None
    
    class Config:
        orm_mode = True
        from_attributes = True


class TransactionDetailedResponse(TransactionResponse):
    """Enhanced response schema with detailed information about users and item"""
    buyer: Optional['UserInfo'] = None
    seller: Optional['UserInfo'] = None
    item: Optional['ItemInfo'] = None
    
    class Config:
        orm_mode = True
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Response schema for multiple transactions"""
    transactions: List[TransactionResponse]
    total: int


class UserInfo(BaseModel):
    """Basic user information for transaction details"""
    user_id: int
    username: str
    email: str
    
    class Config:
        orm_mode = True
        from_attributes = True


class ItemInfo(BaseModel):
    """Item information for transaction details"""
    item_id: int
    name: str
    description: Optional[str]
    price: float
    category: Optional[str]
    
    class Config:
        orm_mode = True
        from_attributes = True


class BalanceTransfer(BaseModel):
    """Request schema for transferring balance between users"""
    receiver_id: int
    amount: float = Field(gt=0, description="Amount to transfer")
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Transfer amount must be greater than zero')
        return v


class BalanceResponse(BaseModel):
    """Response schema for balance operations"""
    user_id: int
    cash_balance: float
    message: str
    
    class Config:
        orm_mode = True
        from_attributes = True