from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
import sys
import os

# Get the absolute path to the project root directory
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

from api.db import get_db
from api.models.user.model import User
from api.models.user_token.model import UserToken
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Load environment variables from the .env file in the project root
dotenv_path = os.path.join(ROOT_DIR, '.env')
load_dotenv(dotenv_path)

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 7 * 24 * 60))  # Default to 1 week (7 days * 24 hours * 60 minutes)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Update tokenUrl to match the app.py configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v0/auth/login")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    current_time = datetime.now(timezone.utc)
    if expires_delta:
        expire = current_time + expires_delta
    else:
        # Use ACCESS_TOKEN_EXPIRE_MINUTES from environment variable
        expire = current_time + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # Store expiration as a UTC timestamp to avoid timezone confusion
    to_encode.update({"exp": expire.timestamp()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM), expire

def store_token(db: Session, user_id: int, token: str, expires_at: datetime):
    """Store or update a user token with proper timezone handling"""
    # Check if a token already exists for this user
    existing_token = db.query(UserToken).filter(UserToken.user_id == user_id).first()
    
    # Ensure the datetime objects include timezone info
    expires_at = expires_at.replace(tzinfo=timezone.utc) if expires_at.tzinfo is None else expires_at
    
    if existing_token:
        # Update existing token and expiration time, but preserve created_at
        existing_token.token = token
        existing_token.expires_at = expires_at
        # updated_at will be automatically set by SQLAlchemy's onupdate trigger
    else:
        # Create new token
        existing_token = UserToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
            # created_at and updated_at will be automatically set
        )
        db.add(existing_token)
        
    db.commit()
    db.refresh(existing_token)
    return existing_token

def get_valid_token(db: Session, user_id: int):
    """Get a valid token for a user with proper timezone handling"""
    current_time = datetime.now(timezone.utc)
    token = db.query(UserToken).filter(
        UserToken.user_id == user_id,
        UserToken.expires_at > current_time
    ).first()
    return token

def refresh_user_token(db: Session, user: User):
    """Creates a new token for an existing user and updates it in the database"""
    token, expires_at = create_access_token(data={"sub": user.username})
    
    # Update directly in the database to ensure changes are saved
    existing_token = db.query(UserToken).filter(UserToken.user_id == user.user_id).first()
    
    # Ensure timezone awareness
    current_time = datetime.now(timezone.utc)
    expires_at = expires_at.replace(tzinfo=timezone.utc) if expires_at.tzinfo is None else expires_at
    
    if existing_token:
        existing_token.token = token
        existing_token.expires_at = expires_at
        existing_token.updated_at = current_time
    else:
        # Create new token if it doesn't exist
        existing_token = UserToken(
            user_id=user.user_id,
            token=token,
            expires_at=expires_at,
            created_at=current_time,
            updated_at=current_time
        )
        db.add(existing_token)
    
    db.commit()
    db.refresh(existing_token)
    return token

def authenticate_user(db: Session, username: str, password: str):
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None

        # Always create a new token on login
        token, expires_at = create_access_token(data={"sub": user.username})
        store_token(db, user.user_id, token, expires_at)
        return user, token
    except Exception as e:
        return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    # Verify token exists in the database and is not expired
    stored_token = get_valid_token(db, user.user_id)
    if not stored_token or stored_token.token != token:
        raise credentials_exception
    
    return user

def is_token_about_to_expire(token: str, threshold_minutes: int = 5):
    """Check if token is about to expire within the threshold minutes"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        if exp:
            # Convert timestamp to timezone-aware datetime
            expiration = datetime.fromtimestamp(exp, tz=timezone.utc)
            current_time = datetime.now(timezone.utc)
            about_to_expire = (expiration - current_time).total_seconds() < (threshold_minutes * 60)
            return about_to_expire
        return True
    except JWTError:
        return True
