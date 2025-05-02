import asyncio
import random
import time
import sys
import os
from pathlib import Path
from colorama import Fore, Style, init
from sqlalchemy.orm import Session

# Get the absolute path to the project root directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from api.db import engine, Base
from database.factories.user_factory import create_fake_user
from database.factories.item_factory import create_fake_item
from database.factories.transaction_factory import create_fake_transaction
from database.factories.deposit_factory import create_fake_deposit
from database.factories.user_token_factory import create_fake_token

# Initialize colorama
init(autoreset=True)

# Seeding configuration
user_seed_count = 10
item_seed_count = 30
deposit_seed_count = 20
transaction_seed_count = 15

# Simple color palette
PRIMARY = Fore.BLUE        # Main text color
SUCCESS = Fore.GREEN       # Success messages
WARNING = Fore.YELLOW      # Warning messages
ACTION = Fore.MAGENTA      # Action messages (Creating...)
RESET = Style.RESET_ALL    # Reset to default

# Simple animation characters
spinner_chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

def divider_line():
    """Return a simple divider line"""
    return f"{PRIMARY}→ {'─' * 30}{RESET}"

# Simple spinner animation function
async def show_spinner(message, count, steps=None):
    """Display a simple spinner with message and counter"""
    total = count
    
    # Show action message in magenta
    print(f"{ACTION}Creating {message}...{RESET}")
    
    for i in range(count):
        spinner_idx = i % len(spinner_chars)
        
        if steps:
            # If steps is provided, perform the action
            await steps()
        
        sys.stdout.write(f"\r{spinner_chars[spinner_idx]} {i+1}/{total} ")
        sys.stdout.flush()
        await asyncio.sleep(0.02)
    
    sys.stdout.write(f"\r{SUCCESS}✓ Created {count} {message}{RESET}\n")
    sys.stdout.flush()
    await asyncio.sleep(0.1)

async def seed_users(count=user_seed_count):
    """Seed the database with fake users"""
    # We're importing async_session locally to avoid circular imports
    from database.seeders.run_seeders import async_session
    
    print(divider_line())
    
    async with async_session() as session:
        async with session.begin():
            users = []
            
            async def create_user():
                user = create_fake_user()
                session.add(user)
                users.append(user)
            
            # Use simple spinner animation
            await show_spinner("users", count, create_user)
                
            await session.flush()  # Flush to get the IDs populated
            return users

async def seed_items(count=item_seed_count, users=None):
    """Seed the database with fake items"""
    from database.seeders.run_seeders import async_session
    from sqlalchemy import text
    
    print(divider_line())
    
    if not users:
        # If no users provided, we'll need to get existing users from the database
        async with async_session() as session:
            from api.models.user.model import User
            result = await session.execute(text("SELECT user_id FROM users"))
            user_ids = [row[0] for row in result]
            if not user_ids:
                print(f"{WARNING}⚠ No users found in database. Please seed users first.{RESET}")
                return []
    else:
        user_ids = [user.user_id for user in users]
    
    async with async_session() as session:
        async with session.begin():
            items = []
            
            async def create_item():
                # Randomly select a user to be the seller
                seller_id = random.choice(user_ids)
                item = create_fake_item(seller_user_id=seller_id)
                session.add(item)
                items.append(item)
            
            # Use simple spinner animation
            await show_spinner("items", count, create_item)
                
            await session.flush()  # Flush to get the IDs populated
            return items

async def seed_deposits(count=deposit_seed_count, users=None):
    """
    Seed the database with fake deposits - multiple deposits per user are allowed
    
    Args:
        count: Number of deposits to create (integer)
        users: Optional list of user objects to assign deposits to
    """
    from database.seeders.run_seeders import async_session
    from sqlalchemy import text
    
    print(divider_line())
    
    if not users:
        # If no users provided, we'll need to get existing users from the database
        async with async_session() as session:
            from api.models.user.model import User
            result = await session.execute(text("SELECT user_id FROM users"))
            user_ids = [row[0] for row in result]
            if not user_ids:
                print(f"{WARNING}⚠ No users found in database. Please seed users first.{RESET}")
                return []
    else:
        user_ids = [user.user_id for user in users]
    
    if not user_ids:
        print(f"{WARNING}⚠ No users available for deposits.{RESET}")
        return []
    
    async with async_session() as session:
        async with session.begin():
            deposits = []
            
            async def create_deposit():
                # Randomly select a user to make a deposit
                user_id = random.choice(user_ids)
                deposit = create_fake_deposit(user_id=user_id)
                session.add(deposit)
                deposits.append(deposit)
            
            # Use simple spinner animation with the integer count
            await show_spinner("deposits", count, create_deposit)
            
            return deposits

async def seed_transactions(count=transaction_seed_count, users=None, items=None):
    """Seed the database with fake transactions"""
    from database.seeders.run_seeders import async_session
    from sqlalchemy import text
    
    print(divider_line())
    
    # Get user IDs if not provided
    if not users:
        async with async_session() as session:
            from api.models.user.model import User
            result = await session.execute(text("SELECT user_id FROM users"))
            user_ids = [row[0] for row in result]
            if not user_ids:
                print(f"{WARNING}⚠ No users found in database. Please seed users first.{RESET}")
                return []
    else:
        user_ids = [user.user_id for user in users]
    
    # Get item IDs if not provided
    if not items:
        async with async_session() as session:
            from api.models.item.model import Item
            result = await session.execute(text("SELECT item_id, seller_user_id, price FROM items"))
            item_data = [(row[0], row[1], row[2]) for row in result]  # item_id, seller_id, price
            if not item_data:
                print(f"{WARNING}⚠ No items found in database. Please seed items first.{RESET}")
                return []
    else:
        item_data = [(item.item_id, item.seller_user_id, item.price) for item in items]
    
    async with async_session() as session:
        async with session.begin():
            transactions = []
            transactions_created = 0
            max_attempts = count * 2
            attempts = 0
            
            async def create_transaction():
                nonlocal transactions_created, attempts
                attempts += 1
                if transactions_created >= count or attempts >= max_attempts:
                    return
                
                # Randomly select an item
                item_id, seller_user_id, price = random.choice(item_data)
                
                # Select buyer (not the same as seller)
                available_buyers = [uid for uid in user_ids if uid != seller_user_id]
                if not available_buyers:
                    return
                    
                buyer_user_id = random.choice(available_buyers)
                
                transaction = create_fake_transaction(
                    item_id=item_id,
                    buyer_user_id=buyer_user_id,
                    seller_user_id=seller_user_id,
                    item_price=price
                )
                session.add(transaction)
                transactions.append(transaction)
                transactions_created += 1
            
            # Use simple spinner animation - we'll try more times than needed to ensure we get enough transactions
            await show_spinner("transactions", count, create_transaction)
            
            return transactions

async def seed_user_tokens(users=None):
    """Seed the database with tokens for each user (one token per user)"""
    from database.seeders.run_seeders import async_session
    from sqlalchemy import text
    
    print(divider_line())
    
    if not users:
        # If no users provided, we'll need to get existing users from the database
        async with async_session() as session:
            from api.models.user.model import User
            result = await session.execute(text("SELECT user_id, username FROM users"))
            users_data = [(row[0], row[1]) for row in result]  # user_id, username
            if not users_data:
                print(f"{WARNING}⚠ No users found in database. Please seed users first.{RESET}")
                return []
    else:
        users_data = [(user.user_id, user.username) for user in users]
    
    async with async_session() as session:
        async with session.begin():
            # First, delete any existing tokens to ensure we don't create duplicates
            # Use text() function to wrap the SQL
            await session.execute(text("DELETE FROM user_tokens"))
            
            tokens = []
            count = len(users_data)
            
            # Create a closure to add one token at a time for the spinner
            token_index = 0
            
            async def create_token():
                nonlocal token_index
                if token_index < count:
                    user_id, username = users_data[token_index]
                    token = create_fake_token(user_id=user_id, username=username)
                    session.add(token)
                    tokens.append(token)
                    token_index += 1
            
            # Use simple spinner animation
            await show_spinner("user tokens", count, create_token)
            
            return tokens

async def seed_all():
    """Seed all data asynchronously with the specified counts"""
    print(f"{PRIMARY}⚡ Starting database seeding process...{RESET}")
    print(divider_line())
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    try:
        # Seed users first
        users = await seed_users(user_seed_count)
        
        # Seed multiple deposits (allowing multiple deposits per user)
        deposits = await seed_deposits(count=deposit_seed_count, users=users)
        
        # Seed items
        items = await seed_items(item_seed_count, users=users)
        
        # Seed transactions
        transactions = await seed_transactions(transaction_seed_count, users=users, items=items)
        
        # Seed user tokens
        tokens = await seed_user_tokens(users=users)
        
        print(divider_line())
        print(f"{SUCCESS}✅ Seeding completed successfully!{RESET}")
        print(f"{PRIMARY}→ Created:{RESET}")
        print(f"   {PRIMARY}•{RESET} {len(users)} users")
        print(f"   {PRIMARY}•{RESET} {len(deposits)} deposits (randomly distributed among users)")
        print(f"   {PRIMARY}•{RESET} {len(items)} items")
        print(f"   {PRIMARY}•{RESET} {len(transactions)} transactions")
        print(f"   {PRIMARY}•{RESET} {len(tokens)} user tokens")
        
    except Exception as e:
        print(f"{WARNING}⚠ Error during seeding: {str(e)}{RESET}")
        raise

async def refresh_db():
    """Drop all tables and recreate them with seed data"""
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    print(f"{WARNING}🗑️  All tables dropped{RESET}")
    
    # Seed all data
    await seed_all()
