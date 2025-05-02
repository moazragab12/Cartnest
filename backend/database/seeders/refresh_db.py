import asyncio
import argparse
import sys
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Simple color palette
PRIMARY = Fore.BLUE        # Main text color
SUCCESS = Fore.GREEN       # Success messages
WARNING = Fore.YELLOW      # Warning messages
ACTION = Fore.MAGENTA      # Action messages (Creating...)
RESET = Style.RESET_ALL    # Reset to default

# Get the absolute path to the backend directory 
backend_path = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_path))

# Load environment variables from the root .env file using absolute path
dotenv_path = os.path.join(backend_path, '.env')
load_dotenv(dotenv_path)

# Import modules for database management
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlmodel import SQLModel

# Import all models to ensure they're registered with SQLAlchemy/SQLModel
from api.models.user.model import User
from api.models.user_token.model import UserToken
from api.models.item.model import Item
from api.models.deposit.model import Deposit
from api.models.transaction.model import Transaction

# Import seeder functions
from database.seeders.seeder import seed_users, seed_items, seed_deposits, seed_transactions, seed_user_tokens

# Get database credentials from environment variables
DB_USER = os.getenv("POSTGRES_USER", "user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "marketplace_db")

# Create async engine and session
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Animation characters
spinner_chars = ['/', '-', '\\', '|']

def divider_line():
    """Return a simple divider line"""
    return f"{PRIMARY}→ {'─' * 30}{RESET}"

async def show_spinner(message, duration=1.0, action=None):
    """Show a simple spinning line animation"""
    # Action in magenta
    print(f"{ACTION}{message}...{RESET}")
    
    if action:
        await action()
        # Show a little animation after the action completes
        duration = 0.5
    
    end_time = time.time() + duration
    i = 0
    while time.time() < end_time:
        i = (i + 1) % len(spinner_chars)
        sys.stdout.write(f"\r{spinner_chars[i]} ")
        sys.stdout.flush()
        await asyncio.sleep(0.1)
    
    sys.stdout.write(f"\r{SUCCESS}✓ {message} complete{RESET}\n")
    sys.stdout.flush()

async def migrate():
    """Create database tables based on the models"""
    print(f"\n{PRIMARY}DATABASE MIGRATION{RESET}")
    print(divider_line())
    
    async def create_tables():
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    
    await show_spinner("Setting up database structure", 1.5, create_tables)

async def drop_all_tables():
    """Drop all tables from the database"""
    print(divider_line())
    
    async def drop_tables():
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
    
    await show_spinner("Dropping all tables", 1.5, drop_tables)

async def truncate_tables():
    """Truncate (empty) all tables but keep the structure"""
    print(divider_line())
    
    async def truncate():
        async with async_session() as session:
            async with session.begin():
                # Disable foreign key checks temporarily
                await session.execute(text("SET CONSTRAINTS ALL DEFERRED"))
                
                # Truncate all tables in the right order to avoid foreign key violations
                await session.execute(text("TRUNCATE TABLE user_tokens CASCADE"))
                await session.execute(text("TRUNCATE TABLE transactions CASCADE"))
                await session.execute(text("TRUNCATE TABLE deposits CASCADE"))
                await session.execute(text("TRUNCATE TABLE items CASCADE"))
                await session.execute(text("TRUNCATE TABLE users CASCADE"))
                
                # Re-enable foreign key checks
                await session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
    
    await show_spinner("Emptying all tables", 1.5, truncate)

async def run_seeders():
    """Populate the database with seed data"""
    print(f"\n{PRIMARY}SEEDING DATABASE{RESET}")
    
    # 1. First, create users (required for all other entities)
    users = await seed_users(15)
    
    # 2. Create tokens for all users (one token per user)
    tokens = await seed_user_tokens(users)
    
    # 3. Create items (requires users as sellers)
    items = await seed_items(40, users)
    
    # 4. Create deposits (requires users) - Fix: pass count and users separately
    deposits = await seed_deposits(count=20, users=users)
    
    # 5. Finally, create transactions (requires users and items)
    transactions = await seed_transactions(20, users, items)
    
    # Summary of what was created
    print(divider_line())
    print(f"{SUCCESS}✓ DATABASE SEEDED SUCCESSFULLY{RESET}")
    print(f"{PRIMARY}Summary:{RESET}")
    print(f"- {len(users) if users else 0} users")
    print(f"- {len(tokens) if tokens else 0} user tokens")
    print(f"- {len(items) if items else 0} items")
    print(f"- {len(deposits) if deposits else 0} deposits ")
    print(f"- {len(transactions) if transactions else 0} transactions")
    print()

async def refresh():
    """Drop all tables, recreate them, and run seeds"""
    print(f"\n{PRIMARY}DATABASE REFRESH{RESET}")
    await drop_all_tables()
    await migrate()
    await run_seeders()
    print(f"{SUCCESS}✓ DATABASE REFRESH COMPLETE{RESET}\n")

async def fresh():
    """Truncate all tables and run seeds"""
    print(f"\n{PRIMARY}DATABASE FRESH SEEDING{RESET}")
    await truncate_tables()
    await run_seeders()
    print(f"{SUCCESS}✓ DATABASE FRESH SEEDING COMPLETE{RESET}\n")

async def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Database management commands")
    parser.add_argument('command', choices=['migrate', 'seed', 'refresh', 'fresh', 'truncate'], 
                        help='Command to execute')
    args = parser.parse_args()

    # Execute the appropriate command
    if args.command == 'migrate':
        await migrate()
    elif args.command == 'seed':
        await run_seeders()
    elif args.command == 'refresh':
        await refresh()
    elif args.command == 'fresh':
        await fresh()
    elif args.command == 'truncate':
        await truncate_tables()

if __name__ == "__main__":
    asyncio.run(main())