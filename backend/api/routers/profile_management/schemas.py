from typing import List, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal
from ...models.item.model import item_status


class TransactionType(str):
    DEPOSIT = "deposit"
    PURCHASE = "purchase"
    ITEM_SOLD_PAYMENT = "sold_payment"
    WITHDRAWAL = "withdrawal"


# Item schemas
class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    category: Optional[str] = None
    quantity: int = 1
    status: item_status = item_status.for_sale


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    status: Optional[item_status] = None

# For when we want to return an item to the user
class ItemResponse(ItemCreate):
    item_id: int
    seller_user_id: int
    listed_at: datetime
    updated_at: datetime
    price: Decimal

    class Config:
        orm_mode = True


# Transaction schemas
class TransactionCreate(BaseModel):
    amount: Decimal
    transaction_type: str
    description: str
    item_id: Optional[int] = None


class TransactionResponse(BaseModel):
    id: int 
    user_id: int
    amount: Decimal
    transaction_type: str
    description: str
    timestamp: datetime
    item_id: Optional[int] = None

    class Config:
        orm_mode = True


# Wallet schemas
class WalletDeposit(BaseModel):
    amount: Decimal = Field(..., gt=Decimal('0'), description="Amount to deposit. Must be greater than 0.")
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= Decimal('0'):
            raise ValueError('Amount must be positive')
        return v


# Profile schemas
class ProfileOverview(BaseModel):
    user_id: int
    username: str
    wallet_balance: Decimal
    items_for_sale: List[ItemResponse]
    sold_items: List[ItemResponse]
    purchased_items: List[ItemResponse]

    class Config:
        orm_mode = True