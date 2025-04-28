from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from typing import Optional
from datetime import datetime


class Deposit(SQLModel, table = True):
    """ Represents a deposit inside the database

    Attributes:
        deposit_id (int): Primary key of the deposit (Serial)
        user_id (int): Foreign key of the user (Serial)
        amount (float): Amount of the deposit (10, 2)
        deposit_time (datetime): Timestamp of the deposit (timestamp)
    """
    __tablename__ = "deposits"
    
    # Deposit_id, Primary_key
    deposit_id: Optional[int] = Field(
        default = None,
        primary_key = True
    )
    
    # User_id, foreign_key users(user_id), not null
    user_id: int = Field(
        sql_column = Column(
            Integer,
            ForeignKey("users.user_id", ondelete="CASCADE"),
            nullable = False
        )
    )
    
    # Amount, (10, 2), amount > 0, not null
    amount: float = Field(
        max_digits = 10,
        decimal_places = 2,
        gt = 0,
        nullable = False
    )
    
    # Deposit_time, timestamp, default now()
    deposit_time: datetime = Field(
        sql_column = Column(
            DateTime(timezone = True),
            default_server = func.now()
        )
    )
