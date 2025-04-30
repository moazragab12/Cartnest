from sqlmodel import SQLModel, Field
from typing import Optional
from sqlalchemy import Column, DateTime, func, Enum as SQLAlchemyEnum
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    user = "user"


# Create SQLAlchemy Enum type with the same name as in the database
UserRoleEnum = SQLAlchemyEnum(UserRole, name="user_role", create_constraint=False, native_enum=True)


class User(SQLModel, table=True):
    """
    Represents a User in the system.

    Attributes:
        user_id (int): Primary key for the user.
        username (str): User's username, must be unique (max length 50).
        password_hash (str): Hashed password, max length 255.
        email (str): User's email, must be unique (max length 100).
        role (UserRole): User's role, defaults to 'user'.
        cash_balance (float): User's cash balance (default 0.00).
        created_at (datetime): Timestamp of account creation.
        updated_at (datetime): Timestamp of last update.
    """
    __tablename__ = "users"
    
    # User_id, Primary Key. 
    user_id: Optional[int] = Field(
        default=None,
        primary_key=True
    )
    
    # username, indexable, 50 chars max, not null.
    username: str = Field(
        index = True,
        max_length = 50,
        nullable = False
    )
    
    # password_hash, 255 chars max, not null.
    password_hash: str = Field(
        max_length = 255,
        nullable = False
    )
    
    # email, indexable, 100 chars max, not null.
    email: str = Field(
        index = True,
        max_length = 100,
        nullable = False
    )
    
    # role, (user, admin), not null
    role: UserRole = Field(
        default=UserRole.user,
        sa_column=Column(UserRoleEnum, nullable=False, default=UserRole.user)
    )
    
    # cash_balance, (12,2), cash_balance >= 0, not null
    cash_balance: float = Field(
        default = 0.00,
        max_digits = 12,
        decimal_places = 2,
        ge = 0,
        nullable = False
    ) 
    
    # created_at, nullable, timestamp.
    created_at: datetime = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    
    
    # updated_at, nullable, timestamp.
    updated_at: datetime = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    )