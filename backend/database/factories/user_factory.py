from faker import Faker
from api.models.user.model import User, UserRole
import random
from passlib.context import CryptContext
from datetime import datetime, timedelta

fake = Faker()

def create_fake_user(created_at=None, updated_at=None):
    """
    Create a fake user for seeding the database.
    
    Args:
        created_at: Optional timestamp for account creation. If None, a random timestamp will be generated.
        updated_at: Optional timestamp for last update. If None, will default to created_at.
    
    Returns:
        User: A new User object with fake data
    """
    # Generate a username that's relatively realistic
    username = fake.user_name()
    
    # Generate a realistic email
    email = fake.email()
    
    # Hash a fake password
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash("123")
    
    # Assign role with weight (70% normal users, 30% admins)
    role = random.choices([UserRole.user, UserRole.admin], weights=[0.7, 0.3])[0]
    
    # Generate a starting cash balance between $10 and $1000
    cash_balance = round(random.uniform(10, 1000), 2)
    
    # Generate a random timestamp within the last 180 days if not provided
    if created_at is None:
        days_ago = random.randint(30, 180)  # Users should be older than items
        created_at = datetime.now() - timedelta(days=days_ago, 
                                             hours=random.randint(0, 23), 
                                             minutes=random.randint(0, 59),
                                             seconds=random.randint(0, 59))
    
    # By default, updated_at is the same as created_at
    if updated_at is None:
        # 20% chance the user profile was updated after creation
        if random.random() < 0.2:
            update_days_later = random.randint(1, min(30, days_ago))
            updated_at = created_at + timedelta(days=update_days_later,
                                              hours=random.randint(0, 23),
                                              minutes=random.randint(0, 59),
                                              seconds=random.randint(0, 59))
        else:
            updated_at = created_at
    
    return User(
        username=username,
        email=email,
        password_hash=password_hash,
        role=role,
        cash_balance=cash_balance,
        created_at=created_at,
        updated_at=updated_at
    )
