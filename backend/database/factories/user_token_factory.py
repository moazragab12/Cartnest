from datetime import datetime, timedelta
from jose import jwt
import os
import random
from dotenv import load_dotenv
from api.models.user_token.model import UserToken

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Make tokens valid for 30 days in test data

def create_fake_token(user_id, username, created_at=None, expires_at=None):
    """
    Create a fake token for a user
    
    Args:
        user_id (int): The user ID to create the token for
        username (str): The username for the JWT payload
        created_at (datetime): Optional creation timestamp. If None, current time is used.
        expires_at (datetime): Optional expiration timestamp. If None, created_at + ACCESS_TOKEN_EXPIRE_DAYS.
    
    Returns:
        UserToken: A UserToken object with fake data
    """
    # Set created_at timestamp if not provided
    if created_at is None:
        # Generate a random timestamp within the last 7 days for more realistic token timestamps
        days_ago = random.randint(0, 7)
        created_at = datetime.utcnow() - timedelta(days=days_ago,
                                                hours=random.randint(0, 23),
                                                minutes=random.randint(0, 59),
                                                seconds=random.randint(0, 59))
    
    # Create token expiration date (30 days from creation by default)
    if expires_at is None:
        expires_at = created_at + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    # Create the JWT payload
    to_encode = {"sub": username, "created": created_at.isoformat()}
    
    # Generate the JWT token
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Create and return the UserToken object
    return UserToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )