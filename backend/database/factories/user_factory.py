from faker import Faker
from api.models.user.model import User, UserRole
import random
import hashlib

fake = Faker()

def create_fake_user():
    """
    Create a fake user for seeding the database.
    
    Returns:
        User: A new User object with fake data
    """
    # Generate a username that's relatively realistic
    username = fake.user_name()
    
    # Generate a realistic email
    email = fake.email()
    
    # Hash a fake password
    password_hash = hashlib.sha256(fake.password().encode()).hexdigest()
    
    # Assign role with weight (70% normal users, 30% admins)
    role = random.choices([UserRole.user, UserRole.admin], weights=[0.7, 0.3])[0]
    
    # Generate a starting cash balance between $10 and $1000
    cash_balance = round(random.uniform(10, 1000), 2)
    
    return User(
        username=username,
        email=email,
        password_hash=password_hash,
        role=role,
        cash_balance=cash_balance
    )
