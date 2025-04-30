import asyncio
from database.factories.user_factory import create_fake_user
from database.factories.item_factory import create_fake_item
from database.factories.transaction_factory import create_fake_transaction
from database.factories.deposit_factory import create_fake_deposit
import random
from sqlalchemy.orm import Session
from api.db import engine, Base
from .user_seeder import seed_users

user_seed_count = 10
item_seed_count = 30
deposit_seed_count = 20
transaction_seed_count = 15

async def seed_users(count=user_seed_count):
    """Seed the database with fake users"""
    # We're importing async_session locally to avoid circular imports
    from database.seeders.run_seeders import async_session
    
    async with async_session() as session:
        async with session.begin():
            print(f"Creating {count} fake users...")
            users = []
            for i in range(count):
                user = create_fake_user()
                session.add(user)
                users.append(user)
                if i % 10 == 0 and i > 0:
                    print(f"Added {i} users...")
            await session.flush()  # Flush to get the IDs populated
            print(f"Successfully created {count} users!")
            return users

async def seed_items(count=item_seed_count, users=None):
    """Seed the database with fake items"""
    from database.seeders.run_seeders import async_session
    
    if not users:
        # If no users provided, we'll need to get existing users from the database
        async with async_session() as session:
            from api.models.user.model import User
            result = await session.execute("SELECT user_id FROM users")
            user_ids = [row[0] for row in result]
            if not user_ids:
                print("No users found in database. Please seed users first.")
                return []
    else:
        user_ids = [user.user_id for user in users]
    
    async with async_session() as session:
        async with session.begin():
            print(f"Creating {count} fake items...")
            items = []
            for i in range(count):
                # Randomly select a user to be the seller
                seller_id = random.choice(user_ids)
                item = create_fake_item(seller_user_id=seller_id)
                session.add(item)
                items.append(item)
                if i % 10 == 0 and i > 0:
                    print(f"Added {i} items...")
            await session.flush()  # Flush to get the IDs populated
            print(f"Successfully created {count} items!")
            return items

async def seed_deposits(count=deposit_seed_count, users=None):
    """Seed the database with fake deposits"""
    from database.seeders.run_seeders import async_session
    
    if not users:
        # If no users provided, we'll need to get existing users from the database
        async with async_session() as session:
            from api.models.user.model import User
            result = await session.execute("SELECT user_id FROM users")
            user_ids = [row[0] for row in result]
            if not user_ids:
                print("No users found in database. Please seed users first.")
                return []
    else:
        user_ids = [user.user_id for user in users]
    
    async with async_session() as session:
        async with session.begin():
            print(f"Creating {count} fake deposits...")
            deposits = []
            for i in range(count):
                # Randomly select a user to make the deposit
                user_id = random.choice(user_ids)
                deposit = create_fake_deposit(user_id=user_id)
                session.add(deposit)
                deposits.append(deposit)
                if i % 10 == 0 and i > 0:
                    print(f"Added {i} deposits...")
            
            print(f"Successfully created {count} deposits!")
            return deposits

async def seed_transactions(count=transaction_seed_count, users=None, items=None):
    """Seed the database with fake transactions"""
    from database.seeders.run_seeders import async_session
    
    # Get user IDs if not provided
    if not users:
        async with async_session() as session:
            from api.models.user.model import User
            result = await session.execute("SELECT user_id FROM users")
            user_ids = [row[0] for row in result]
            if not user_ids:
                print("No users found in database. Please seed users first.")
                return []
    else:
        user_ids = [user.user_id for user in users]
    
    # Get item IDs if not provided
    if not items:
        async with async_session() as session:
            from api.models.item.model import Item
            result = await session.execute("SELECT item_id, seller_user_id, price FROM items")
            item_data = [(row[0], row[1], row[2]) for row in result]  # item_id, seller_id, price
            if not item_data:
                print("No items found in database. Please seed items first.")
                return []
    else:
        item_data = [(item.item_id, item.seller_user_id, item.price) for item in items]
    
    async with async_session() as session:
        async with session.begin():
            print(f"Creating {count} fake transactions...")
            transactions = []
            for i in range(count):
                # Randomly select an item
                item_id, seller_user_id, price = random.choice(item_data)
                
                # Select buyer (not the same as seller)
                available_buyers = [uid for uid in user_ids if uid != seller_user_id]
                if not available_buyers:
                    continue  # Skip if no valid buyers
                    
                buyer_user_id = random.choice(available_buyers)
                
                transaction = create_fake_transaction(
                    item_id=item_id,
                    buyer_user_id=buyer_user_id,
                    seller_user_id=seller_user_id,
                    item_price=price
                )
                session.add(transaction)
                transactions.append(transaction)
                if i % 5 == 0 and i > 0:
                    print(f"Added {i} transactions...")
            
            print(f"Successfully created {count} transactions!")
            return transactions

def seed_all():
    """Seed all data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a new session
    db = Session(engine)
    
    try:
        # Seed users
        seed_users(db)
        
        # Add other seeders here as needed
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

def refresh_db():
    """Drop all tables and recreate them with seed data"""
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    
    # Seed all data
    seed_all()
