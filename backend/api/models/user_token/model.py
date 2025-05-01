from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, func
from typing import Optional
from datetime import datetime

class UserToken(SQLModel, table=True):
    """ Represents a user token in the database

    Attributes:
        token_id (int): Primary key of the token (Serial)
        user_id (int): Foreign key of the user this token belongs to
        token (str): The token string itself
        expires_at (datetime): Timestamp when the token expires
        created_at (datetime): Timestamp of token creation
        updated_at (datetime): Timestamp of last update
    """
    __tablename__ = "user_tokens"

    token_id: Optional[int] = Field(
        primary_key=True,
        default=None
    )

    user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("users.user_id", ondelete="CASCADE"),
            nullable=False
        )
    )

    token: str = Field(
        sa_column=Column(Text, nullable=False)
    )

    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now()
        ),
        default_factory=datetime.utcnow
    )

    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now()
        ),
        default_factory=datetime.utcnow
    )
