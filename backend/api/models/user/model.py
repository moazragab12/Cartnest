from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from sqlalchemy import Column, DateTime, func, Enum as SQLAlchemyEnum
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    user = "user"


# Create SQLAlchemy Enum type with the same name as in the database
UserRoleEnum = SQLAlchemyEnum(UserRole, name="user_role", create_constraint=False, native_enum=True)


class User(SQLModel, table=True):
    __tablename__ = "users"
    
    user_id: Optional[int] = Field(default=None, primary_key=True)
    
    username: str = Field(index=True, max_length=50, nullable=False, unique=True)
    
    password_hash: str = Field(max_length=255, nullable=False)
    
    email: str = Field(index=True, max_length=100, nullable=False, unique=True)
    
    role: UserRole = Field(
        default=UserRole.user,
        sa_column=Column(UserRoleEnum, nullable=False, default=UserRole.user)
    )
    
    cash_balance: float = Field(
        default=0.00,
        max_digits=12,
        decimal_places=2,
        ge=0,
        nullable=False
    ) 
    
    created_at: datetime = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    
    updated_at: datetime = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    )

    # ✅ Add relationship to user_tokens
    tokens: List["UserToken"] = Relationship(back_populates="user")


class UserToken(SQLModel, table=True):
    __tablename__ = "user_tokens"
    
    token_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.user_id")
    token: str
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: datetime = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    )

    # ✅ Add reverse relationship to User
    user: Optional[User] = Relationship(back_populates="tokens")
