from faker import Faker
from api.models.item.model import Item, ItemStatus
import random

fake = Faker()

# List of common product categories
CATEGORIES = [
    "Electronics", "Clothing", "Home & Kitchen", "Books", "Beauty", 
    "Toys & Games", "Sports", "Grocery", "Automotive", "Health",
    "Garden", "Jewelry", "Art", "Office Supplies", "Musical Instruments"
]

def create_fake_item(seller_user_id=None):
    """
    Create a fake item for seeding the database.
    
    Args:
        seller_user_id: Optional user ID to assign as the seller. If None, this must be set later.
    
    Returns:
        Item: A new Item object with fake data
    """
    # Create a realistic product name
    name = fake.catch_phrase()
    
    # Generate a longer product description
    description = fake.paragraph(nb_sentences=5)
    
    # Randomly select a category
    category = random.choice(CATEGORIES)
    
    # Generate a realistic price between $5 and $1000
    price = round(random.uniform(5, 1000), 2)
    
    # Generate quantity between 1 and 50
    quantity = random.randint(1, 50)
    
    # Usually items start as "for_sale", but occasionally might be in other states
    status_weights = [0.85, 0.05, 0.05, 0.05]  # for_sale, sold, removed, draft
    status = random.choices(
        [ItemStatus.for_sale, ItemStatus.sold, ItemStatus.removed, ItemStatus.draft], 
        weights=status_weights
    )[0]
    
    return Item(
        seller_user_id=seller_user_id,
        name=name,
        description=description,
        category=category,
        price=price,
        quantity=quantity,
        status=status
    )