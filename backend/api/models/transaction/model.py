from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, DateTime, func


class Transaction(SQLModel, table = True):
    """ Represents a transaction inside the database

    Attributes:
        transaction_id (int): Primary key of the transaction (Serial)
        item_id (int): Foreign key of the item (Serial)
        buyer_user_id (int): Foreign key of the buyer (Serial)
        seller_user_id (int): Foreign key of the seller (Serial)
        quantity_purchased (int): Quantity of the item purchased (default 1, quantity_purchased > 0)
        purchase_price (float): Price of the item purchased (10, 2)
        total_amount (float): Total amount of the transaction (10, 2)
        transaction_time (datetime): Timestamp of the transaction (timestamp)
    """
    __tablename__ = "transactions"
    
    
    # Transaction_id, Primary_key
    transaction_id: Optional[int] = Field(
        default = None,
        primary_key = True
    )
    
    # Item_id, foreign_key items(item_id), not null
    item_id: int = Field(
        foreign_key = "items.item_id",
        nullable = False
    )
    
    # Buyer_user_id, foreign_key users(user_id), not null
    buyer_user_id: int = Field(
        foreign_key = "users.user_id",
        nullable = False
    )
    
    # Seller_user_id, foreign_key users(user_id), not null
    seller_user_id: int = Field(
        foreign_key = "users.user_id",
        nullable = False
    )
    
    # Quantity_purchased, default 1, quantity_purchased > 0, not null
    quantity_purchased: int = Field(
        default = 1,
        gt = 0,
        nullable = False
    )
    
    # Purchase_price, (10, 2), not null
    purchase_price: float = Field(
        max_digits = 10,
        decimal_places = 2,
        nullable = False
    )
    
    # Total_amount, (10, 2), not null
    total_amount: float = Field(
        max_digits = 12,
        decimal_places = 2,
        nullable = False
    )
    
    # Transaction_time, timestamp, default now()
    transaction_time: datetime = Field(
        sql_column = Column(
            DateTime(timezone = True),
            default_server = func.now()
        )
    )