import sys
import os
import asyncio
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

# Now we can import our modules
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from database.seeders.seeder import seed_users, seed_items, seed_deposits, seed_transactions, seed_user_tokens

# Import all models to ensure they're registered with SQLAlchemy/SQLModel
from api.models.user.model import User
from api.models.item.model import Item
from api.models.deposit.model import Deposit
from api.models.transaction.model import Transaction
from api.models.user_token.model import UserToken

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

async def show_spinner(message, duration=1.0):
    """Show a simple spinning line animation"""
    end_time = time.time() + duration
    i = 0
    
    # Action in magenta
    print(f"{ACTION}{message}...{RESET}")
    
    while time.time() < end_time:
        i = (i + 1) % len(spinner_chars)
        sys.stdout.write(f"\r{spinner_chars[i]} ")
        sys.stdout.flush()
        await asyncio.sleep(0.1)
    
    sys.stdout.write(f"\r{SUCCESS}✓ {message} complete{RESET}\n")
    sys.stdout.flush()

async def init_db():
    """Initialize the database schema"""
    print(divider_line())
    await show_spinner("Connecting to database")
    
    # Create all tables if they don't exist
    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(SQLModel.metadata.create_all)

async def main():
    """Main function to seed the database"""
    print(f"\n{PRIMARY}-- MARKETPLACE DATABASE SEEDER --{RESET}")
    
    # Initialize the database
    await init_db()
    
    print(f"\n{PRIMARY}SEEDING DATABASE{RESET}")
    
    # 1. First, create users (required for all other entities)
    users = await seed_users(15)
    
    # 2. Create tokens for all users (one token per user)
    tokens = await seed_user_tokens(users)
    
    # 3. Create items (requires users as sellers)
    items = await seed_items(40, users)
    
    # 4. Create deposits (requires users) - one deposit per user
    deposits = await seed_deposits(users)
    
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

if __name__ == "__main__":
    asyncio.run(main())