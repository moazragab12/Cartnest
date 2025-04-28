from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import traceback

# Load environment variables from .env file
load_dotenv()
print("Environment variables loaded")

# PostgreSQL connection settings from environment variables
DB_USER = os.getenv("POSTGRES_USER", "user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "marketplace_db")

print(f"Database connection parameters:")
print(f"- User: {DB_USER}")
print(f"- Host: {DB_HOST}")
print(f"- Port: {DB_PORT}")
print(f"- Database: {DB_NAME}")

# PostgreSQL connection string
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def test_connection():
    """Test the database connection and print some info if successful."""
    try:
        print(f"Connecting to: {SQLALCHEMY_DATABASE_URL.replace(DB_PASSWORD, '****')}")
        
        # Create engine and connect
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        with engine.connect() as connection:
            # Try running a simple query
            result = connection.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"Successfully connected to PostgreSQL!")
            print(f"PostgreSQL version: {version}")
            
            # Check if tables exist
            result = connection.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public'"
            ))
            tables = [row[0] for row in result]
            print(f"\nAvailable tables in '{DB_NAME}' database:")
            if tables:
                for table in tables:
                    print(f"  - {table}")
            else:
                print("  No tables found. Did you run the SQL script to create them?")
            
            # Try to query the users table if it exists
            if 'users' in tables:
                print("\nTesting 'users' table:")
                try:
                    result = connection.execute(text("SELECT COUNT(*) FROM users"))
                    user_count = result.scalar()
                    print(f"  Found {user_count} users in the database")
                    
                    # If there are users, show the first one
                    if user_count > 0:
                        result = connection.execute(text("SELECT user_id, username, email FROM users LIMIT 1"))
                        user = result.fetchone()
                        print(f"  First user: ID={user[0]}, Username={user[1]}, Email={user[2]}")
                except Exception as e:
                    print(f"  Error querying users table: {e}")
                
        return True
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("\nDetailed error:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Testing PostgreSQL Database Connection ===\n")
    success = test_connection()
    print("\n=== Test Complete ===")
    print("Connection successful" if success else "Connection failed")