from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv
from api.models.user_token.model import UserToken

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Make tokens valid for 30 days in test data

def create_fake_token(user_id, username):
    """
    Create a fake token for a user
    
    Args:
        user_id (int): The user ID to create the token for
        username (str): The username for the JWT payload
    
    Returns:
        UserToken: A UserToken object with fake data
    """
    # Create token expiration date (30 days from now for testing)
    expires_at = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    # Create the JWT payload
    to_encode = {"sub": username}
    
    # Generate the JWT token
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Create and return the UserToken object
    return UserToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )