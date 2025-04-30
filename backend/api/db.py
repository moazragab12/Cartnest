from sqlmodel import Session, SQLModel, create_engine, text
import os
from typing import Generator
from dotenv import load_dotenv
import logging
import time
import subprocess
import sys
import importlib.util

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")

# Load environment variables from .env file
load_dotenv()

# PostgreSQL connection settings from environment variables
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

# Log connection parameters (except password)
logger.info(f"Database connection parameters:")
logger.info(f"User: {DB_USER}")
logger.info(f"Host: {DB_HOST}")
logger.info(f"Port: {DB_PORT}")
logger.info(f"Database: {DB_NAME}")

# PostgreSQL connection string using psycopg2 dialect
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Initialize engine variable
engine = None

# Function to create engine with retry logic
def create_db_engine(max_retries=5, retry_interval=5):
    """Create database engine with retry logic, attempting to install driver if missing."""
    global engine

    # Check if psycopg2 is installed, try to install if not
    # This is a workaround because modifying requirements.txt/Dockerfile is restricted.
    if importlib.util.find_spec("psycopg2") is None:
        logger.warning("psycopg2 module not found. Attempting to install psycopg2-binary dynamically...")
        try:
            # Ensure pip is available and attempt installation
            # Using sys.executable ensures we use the pip associated with the current Python interpreter
            command = [sys.executable, "-m", "pip", "install", "psycopg2-binary"]
            logger.info(f"Running command: {' '.join(command)}")
            # Use check_output to capture output for logging, or check_call to just check for errors
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            logger.info("Successfully installed psycopg2-binary dynamically.")
            logger.debug(f"pip install output:\n{result.stdout}")
            # Invalidate import caches to ensure the newly installed module can be found
            importlib.invalidate_caches()
        except subprocess.CalledProcessError as install_error:
            logger.error(f"Failed to install psycopg2-binary: {install_error}")
            logger.error(f"pip install stderr:\n{install_error.stderr}")
            # If installation fails, we cannot proceed with this driver.
            raise RuntimeError(f"Failed to dynamically install required database driver 'psycopg2-binary'. Error: {install_error.stderr}. Cannot initialize database engine.") from install_error
        except FileNotFoundError:
             logger.error("Failed to install psycopg2-binary: 'pip' command or Python executable not found.")
             raise RuntimeError("Failed to dynamically install required database driver 'psycopg2-binary': pip/python not found. Cannot initialize database engine.")
        except Exception as e:
            logger.error(f"An unexpected error occurred during dynamic installation of psycopg2-binary: {e}")
            raise RuntimeError(f"Failed to dynamically install required database driver 'psycopg2-binary'. Error: {e}. Cannot initialize database engine.") from e

    retry_count = 0
    last_exception = None # Keep track of the last exception

    while retry_count < max_retries:
        try:
            logger.info(f"Creating database engine for: postgresql://{DB_USER}:****@{DB_HOST}:{DB_PORT}/{DB_NAME} (Attempt {retry_count + 1}/{max_retries})")

            # Create engine - SQLModel/SQLAlchemy uses psycopg2 by default for postgresql://
            temp_engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                echo=True,  # Log SQL queries for debugging
                pool_pre_ping=True,  # Check connection before using from pool
                pool_recycle=3600,   # Recycle connections after 1 hour
                connect_args={"connect_timeout": 10}  # 10 second connection timeout
            )

            # Test the connection immediately
            with temp_engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                logger.info("Database connection test successful!")

            # Connection successful, assign to global engine
            engine = temp_engine
            logger.info("Database engine created successfully.")
            return engine # Exit function successfully

        except Exception as e:
            last_exception = e # Store the exception
            retry_count += 1
            current_error_str = str(e)
            logger.warning(f"Database connection attempt {retry_count} failed: {current_error_str}")

            # If the error is specifically about the driver again, log it prominently
            if "psycopg2" in current_error_str or "driver" in current_error_str.lower():
                 logger.error(f"Database connection failed due to driver issue even after dynamic install attempt: {current_error_str}")

            if retry_count < max_retries:
                logger.info(f"Retrying in {retry_interval} seconds...")
                time.sleep(retry_interval)
            else:
                logger.error(f"All {max_retries} connection attempts failed. Last error: {current_error_str}")
                # Raise the final exception
                raise RuntimeError(f"Could not connect to the database after {max_retries} attempts. Last error: {current_error_str}") from last_exception

    # This part should ideally not be reached if max_retries > 0,
    # but added for completeness.
    # If the loop finishes without returning or raising, something is wrong.
    raise RuntimeError("Database engine initialization failed unexpectedly.") from last_exception

# Try to create the engine during module import
# The application will fail to start if this raises an exception
create_db_engine()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get a PostgreSQL database session.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            # Use db session here
    """
    # Engine should be initialized at startup. If it's None here, something went wrong.
    if engine is None:
        # Log the error and raise a more informative exception for the request handler
        logger.critical("Database engine is not initialized. Application startup likely failed.")
        raise RuntimeError("Database engine is not available. Check application logs for connection errors during startup.")
        
    db = Session(engine)
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        # Rollback in case of session error? Depends on application logic.
        db.rollback() 
        raise
    finally:
        db.close()