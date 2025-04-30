import asyncio
import argparse
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path so imports work correctly
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

# Load environment variables from .env file
load_dotenv(os.path.join(backend_path, '.env'))

# Import modules for database management
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlmodel import SQLModel

# Import all models to ensure they're registered with SQLAlchemy/SQLModel
from api.models.user.model import User
from api.models.item.model import Item
from api.models.deposit.model import Deposit
from api.models.transaction.model import Transaction

# Import seeder functions
from database.seeders.seeder import seed_users, seed_items, seed_deposits, seed_transactions

# Get database credentials from environment variables
DB_USER = os.getenv("DB_USER", "user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "marketplace_db")

# Create async engine and session
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def migrate():
    """Create database tables based on the models"""
    print("Running migrations...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Migrations completed successfully!")


async def drop_all_tables():
    """Drop all tables from the database"""
    print("Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    print("All tables dropped successfully!")


async def truncate_tables():
    """Truncate (empty) all tables but keep the structure"""
    print("Truncating all tables...")
    async with async_session() as session:
        async with session.begin():
            # Disable foreign key checks temporarily
            await session.execute(text("SET CONSTRAINTS ALL DEFERRED"))
            
            # Truncate all tables in the right order to avoid foreign key violations
            await session.execute(text("TRUNCATE TABLE transactions CASCADE"))
            await session.execute(text("TRUNCATE TABLE deposits CASCADE"))
            await session.execute(text("TRUNCATE TABLE items CASCADE"))
            await session.execute(text("TRUNCATE TABLE users CASCADE"))
            
            # Re-enable foreign key checks
            await session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
    print("All tables truncated successfully!")


async def run_seeders():
    """Populate the database with seed data"""
    print("\n=== SEEDING DATABASE ===\n")
    
    # 1. First, create users (required for all other entities)
    print("\n=== SEEDING USERS ===\n")
    users = await seed_users(15)
    
    # 2. Create items (requires users as sellers)
    print("\n=== SEEDING ITEMS ===\n")
    items = await seed_items(40, users)
    
    # 3. Create deposits (requires users)
    print("\n=== SEEDING DEPOSITS ===\n")
    deposits = await seed_deposits(25, users)
    
    # 4. Finally, create transactions (requires users and items)
    print("\n=== SEEDING TRANSACTIONS ===\n")
    transactions = await seed_transactions(20, users, items)
    
    print("\n=== SEEDING COMPLETE ===\n")
    print(f"Created:")
    print(f"- {len(users) if users else 0} users")
    print(f"- {len(items) if items else 0} items")
    print(f"- {len(deposits) if deposits else 0} deposits")
    print(f"- {len(transactions) if transactions else 0} transactions")


async def refresh():
    """Drop all tables, recreate them, and run seeds"""
    await drop_all_tables()
    await migrate()
    await run_seeders()
    print("\n=== DATABASE REFRESH COMPLETE ===\n")


async def fresh():
    """Truncate all tables and run seeds"""
    await truncate_tables()
    await run_seeders()
    print("\n=== DATABASE FRESH SEEDING COMPLETE ===\n")


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