from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from enum import Enum
from typing import Optional
from datetime import datetime


class ItemStatus(str, Enum):
    for_sale = "for_sale"
    sold = "sold"
    removed = "removed"
    draft = "draft"

class Item(SQLModel, table=True):
    """ Represents an item inside the database

    Attributes:
        item_id (int): Primary key of the item (Serial)
        seller_user_id (int): Foreign key of the user who is selling the item 
        name (str): Name of the item (max length 255)
        description (str): Description of the item (nullable)
        category (str): Category of the item (max length 100)
        price (float): Price of the item (10, 2)
        quantity (int): Quantity of the item in stock (default 1, quantity >= 0)
        status (ItemStatus): Status of the item (not null)
        listed_at (datetime): Timestamp of when the item was listed (timestamp)
        updated_at (datetime): Timestamp of when the item was last updated (timestamp)
    """
    __tablename__ = "items"
    
    # Item_id, Serial, Primary Key
    item_id: Optional[int] = Field(
        primary_key = True,
        default = None
    )
    
    # Seller_user_id, Foreign Key, not null
    seller_user_id: int = Field(
        sa_column = Column(
            Integer,
            ForeignKey("users.user_id", ondelete="CASCADE"),
            nullable=False
        )
    )
    
    # Name, 255 chars max, not null
    name: str = Field(
        index = True,
        max_length = 255,
        nullable = False
    )
    
    # Description, nullable
    description: Optional[str] = Field(
        default = None,
        nullable = True
    )
    
    # Category, 100 chars max, nullable
    category: Optional[str] = Field(
        max_length = 100,
        nullable = True
    )
    
    # Price, (10, 2), price > 0, not null
    price: float = Field(
        max_digits = 10,
        decimal_places = 2,
        gt = 0,
        nullable = False
    )
    
    # Quantity, default 1, quantity >= 0, not null
    quantity: int = Field(
        default = 1,
        gt = 0,
        nullable = False
    )
    
    # Status, not null
    status: ItemStatus = Field(
        default = ItemStatus.for_sale,
        nullable = False
    )
    
    # Listed_at, timestamp
    listed_at: datetime = Field(
        sa_column = Column(
            DateTime(timezone = True),
            server_default = func.now()
        )
    )
    
    # Updated_at, timestamp
    updated_at: datetime = Field(
        sa_column = Column(
            DateTime(timezone = True),
            server_default = func.now(),
            onupdate = func.now()
        )
    )