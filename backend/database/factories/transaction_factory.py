from faker import Faker
from api.models.transaction.model import Transaction
import random

fake = Faker()

def create_fake_transaction(item_id=None, buyer_user_id=None, seller_user_id=None, item_price=None):
    """
    Create a fake transaction for seeding the database.
    
    Args:
        item_id: Optional item ID for the transaction. If None, must be set later.
        buyer_user_id: Optional buyer user ID. If None, must be set later.
        seller_user_id: Optional seller user ID. If None, must be set later.
        item_price: Optional item price. If None, a random price will be generated.
    
    Returns:
        Transaction: A new Transaction object with fake data
    """
    # Generate quantity purchased between 1 and 5
    quantity_purchased = random.randint(1, 5)
    
    # If item_price is not provided, generate a random price
    if item_price is None:
        purchase_price = round(random.uniform(5, 500), 2)
    else:
        purchase_price = item_price
    
    # Calculate total amount
    total_amount = round(purchase_price * quantity_purchased, 2)
    
    return Transaction(
        item_id=item_id,
        buyer_user_id=buyer_user_id,
        seller_user_id=seller_user_id,
        quantity_purchased=quantity_purchased,
        purchase_price=purchase_price,
        total_amount=total_amount
    )