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
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from the .env file in the project root
dotenv_path = os.path.join(ROOT_DIR, '.env')
load_dotenv(dotenv_path)

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM), expire

def store_token(db: Session, user_id: int, token: str, expires_at: datetime):
    # Delete any existing tokens for this user
    db.query(UserToken).filter(UserToken.user_id == user_id).delete()
    
    # Create new token
    new_token = UserToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    return new_token

def get_valid_token(db: Session, user_id: int):
    token = db.query(UserToken).filter(
        UserToken.user_id == user_id,
        UserToken.expires_at > datetime.utcnow()
    ).first()
    return token

def authenticate_user(db: Session, username: str, password: str):
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None

        # Check for existing valid token
        existing_token = get_valid_token(db, user.user_id)
        if existing_token:
            return user, existing_token.token

        # Create new token
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
