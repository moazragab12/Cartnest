from faker import Faker
from api.models.deposit.model import Deposit
import random
from datetime import datetime, timedelta

fake = Faker()

def create_fake_deposit(user_id=None, deposit_time=None, custom_amount=None):
    """
    Create a fake deposit for seeding the database.
    Users can have multiple deposits.
    
    Args:
        user_id: The user ID to assign as the depositor. Required.
        deposit_time: Optional timestamp. If None, a random recent timestamp will be generated.
        custom_amount: Optional specific amount for the deposit. If None, a random amount will be generated.
    
    Returns:
        Deposit: A new Deposit object with fake data linked to the specified user
    """
    if user_id is None:
        raise ValueError("User ID must be provided to create a deposit")
    
    # Generate a realistic deposit amount between $10 and $1000 if not specified
    amount = custom_amount if custom_amount is not None else round(random.uniform(10, 1000), 2)
    
    # Generate a random timestamp within the last 60 days if not provided
    if deposit_time is None:
        days_ago = random.randint(0, 60)
        deposit_time = datetime.now() - timedelta(days=days_ago, 
                                              hours=random.randint(0, 23), 
                                              minutes=random.randint(0, 59),
                                              seconds=random.randint(0, 59))
    
    return Deposit(
        user_id=user_id,
        amount=amount,
        deposit_time=deposit_time
    )