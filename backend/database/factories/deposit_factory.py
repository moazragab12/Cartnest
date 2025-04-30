from faker import Faker
from api.models.deposit.model import Deposit
import random

fake = Faker()

def create_fake_deposit(user_id=None):
    """
    Create a fake deposit for seeding the database.
    
    Args:
        user_id: Optional user ID to assign as the depositor. If None, this must be set later.
    
    Returns:
        Deposit: A new Deposit object with fake data
    """
    # Generate a realistic deposit amount between $10 and $1000
    amount = round(random.uniform(10, 1000), 2)
    
    return Deposit(
        user_id=user_id,
        amount=amount
    )