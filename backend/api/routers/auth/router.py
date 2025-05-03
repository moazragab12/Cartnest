from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import sys
import os
from pathlib import Path
from datetime import datetime

# Get the absolute path to the project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(ROOT_DIR))

from api.dependencies import (
    get_db, 
    get_password_hash, 
    authenticate_user, 
    create_access_token, 
    get_current_user, 
    refresh_user_token, 
    get_valid_token,
    is_token_about_to_expire
)
from api.models.user.model import User, UserRole
from api.models.user_token.model import UserToken

# Request/Response Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: UserRole
    cash_balance: float

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime

class TokenRefreshRequest(BaseModel):
    current_token: str

auth_router = APIRouter()

# Endpoints
@auth_router.post("/register", response_model=Token, tags=["Authentication"])
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account and generate an authentication token
    """
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role=UserRole.user,
        cash_balance=0.00
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token for the new user
    token, expires_at = create_access_token(data={"sub": new_user.username})
    
    # Store token in database
    user_token = UserToken(
        user_id=new_user.user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(user_token)
    db.commit()
    
    return {"access_token": token, "token_type": "bearer", "expires_at": expires_at}

@auth_router.post("/login", response_model=Token, tags=["Authentication"])
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate and obtain an access token for a user
    """
    auth_result = authenticate_user(db, form_data.username, form_data.password)
    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user, token = auth_result
    
    # Get token expiration time from database
    stored_token = get_valid_token(db, user.user_id)
    if not stored_token:
        raise HTTPException(status_code=500, detail="Failed to create token")
    
    return {"access_token": token, "token_type": "bearer", "expires_at": stored_token.expires_at}

@auth_router.post("/refresh-token", response_model=Token, tags=["Authentication"])
def refresh_token(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generate a new authentication token, refreshing the existing one
    """
    token = refresh_user_token(db, current_user)
    
    # Get updated token from database
    stored_token = get_valid_token(db, current_user.user_id)
    if not stored_token:
        raise HTTPException(status_code=500, detail="Failed to refresh token")
    
    return {"access_token": token, "token_type": "bearer", "expires_at": stored_token.expires_at}

@auth_router.get("/profile", response_model=UserOut, tags=["Authentication"])
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile information
    """
    return current_user

@auth_router.get("/token-status", tags=["Authentication"])
def check_token_status(current_user: User = Depends(get_current_user), token: str = Depends(OAuth2PasswordRequestForm), db: Session = Depends(get_db)):
    """
    Check if the current token is about to expire and needs to be refreshed
    """
    about_to_expire = is_token_about_to_expire(token)
    return {
        "valid": True,
        "about_to_expire": about_to_expire,
        "user_id": current_user.user_id
    }
