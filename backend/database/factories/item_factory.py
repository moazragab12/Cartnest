from faker import Faker
from api.models.item.model import Item, item_status
import random
from datetime import datetime, timedelta

fake = Faker()

# List of common product categories
CATEGORIES = [
    "Electronics", "Clothing", "Home & Kitchen", "Books", "Beauty", 
    "Toys & Games", "Sports", "Grocery", "Automotive", "Health",
    "Garden", "Jewelry", "Art", "Office Supplies", "Musical Instruments"
]

def create_fake_item(seller_user_id=None, listed_at=None, updated_at=None):
    """
    Create a fake item for seeding the database.
    
    Args:
        seller_user_id: Optional user ID to assign as the seller. If None, this must be set later.
        listed_at: Optional timestamp for when the item was listed. If None, a random timestamp will be generated.
        updated_at: Optional timestamp for when the item was updated. If None, will be same as listed_at or slightly later.
    
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
        [item_status.for_sale, item_status.sold, item_status.removed, item_status.draft], 
        weights=status_weights
    )[0]
    
    # Generate a random timestamp within the last 90 days if not provided
    if listed_at is None:
        days_ago = random.randint(0, 90)
        listed_at = datetime.now() - timedelta(days=days_ago, 
                                            hours=random.randint(0, 23), 
                                            minutes=random.randint(0, 59),
                                            seconds=random.randint(0, 59))
    
    # Updated time should be either the same as listing time or slightly later
    if updated_at is None:
        # 30% chance the item was updated after listing
        if random.random() < 0.3:
            update_days_later = random.randint(0, min(30, days_ago))
            updated_at = listed_at + timedelta(days=update_days_later,
                                             hours=random.randint(0, 23),
                                             minutes=random.randint(0, 59),
                                             seconds=random.randint(0, 59))
        else:
            updated_at = listed_at
    
    return Item(
        seller_user_id=seller_user_id,
        name=name,
        description=description,
        category=category,
        price=price,
        quantity=quantity,
        status=status,
        listed_at=listed_at,
        updated_at=updated_at
    )