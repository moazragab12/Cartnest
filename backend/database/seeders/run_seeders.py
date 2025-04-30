import sys
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path so imports work correctly
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

# Load environment variables from .env file
load_dotenv(os.path.join(backend_path, '.env'))

# Now we can import our modules
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from database.seeders.seeder import seed_users, seed_items, seed_deposits, seed_transactions

# Import all models to ensure they're registered with SQLAlchemy/SQLModel
from api.models.user.model import User
from api.models.item.model import Item
from api.models.deposit.model import Deposit
from api.models.transaction.model import Transaction

# Get database credentials from environment variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# Create async engine and session
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    """Initialize the database schema"""
    # Create all tables if they don't exist
    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(SQLModel.metadata.create_all)
        print("Database schema created or updated successfully")

async def main():
    """Main function to seed the database"""
    # Initialize the database
    await init_db()
    
    # Run the seeders in order (respecting dependencies)
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

if __name__ == "__main__":
    asyncio.run(main())