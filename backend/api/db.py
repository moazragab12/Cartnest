import os
import time
import logging
import subprocess
import sys
import importlib.util
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

# Setup logging with custom configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s"
)
logger = logging.getLogger("db")

# Silence SQLAlchemy engine logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.dialects").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.orm").setLevel(logging.WARNING)

# Get the absolute path to the project root directory
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from absolute path
dotenv_path = os.path.join(ROOT_DIR, '.env')
load_dotenv(dotenv_path)

# Database configuration
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

# Check if we're running in Docker or locally
def is_running_in_docker():
    """More reliable method to check if we're running in a Docker container"""
    # Method 1: Check for .dockerenv file
    if os.path.exists('/.dockerenv'):
        return True
    
    # Method 2: Check for docker in cgroup
    try:
        with open('/proc/self/cgroup', 'r') as f:
            return 'docker' in f.read()
    except:
        pass
    
    # Method 3: Check for container-specific environment variables
    if os.environ.get('DOCKER_CONTAINER', ''):
        return True
    
    # Method 4: Use explicit override from environment
    if os.environ.get('DB_IN_DOCKER', '').lower() in ('true', '1', 'yes'):
        return True
    
    # Default: use the hostname to check if it's a docker-generated name
    # Most Docker containers have random hex string hostnames
    import socket
    hostname = socket.gethostname()
    if len(hostname) == 12 and all(c in '0123456789abcdef' for c in hostname):
        return True
    
    return False

# Set the database host based on environment
if is_running_in_docker():
    # In Docker, use the service name from docker-compose.yml
    EFFECTIVE_DB_HOST = "postgres_primary"
    logger.info(f"Running in Docker - using host: {EFFECTIVE_DB_HOST}")
else:
    # Locally, use localhost
    EFFECTIVE_DB_HOST = "localhost" 
    logger.info(f"Running locally - using host: {EFFECTIVE_DB_HOST}")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{EFFECTIVE_DB_HOST}:{DB_PORT}/{DB_NAME}"

# Global engine and base
engine = None
Base = declarative_base()  # Needed for SQLAlchemy models like User, UserToken

def create_db_engine(max_retries=5, retry_interval=5):
    global engine

    if importlib.util.find_spec("psycopg2") is None:
        logger.warning("psycopg2 not found. Installing psycopg2-binary...")
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "psycopg2-binary"],
                check=True, capture_output=True, text=True
            )
            importlib.invalidate_caches()
            logger.info("Successfully installed psycopg2-binary.")
        except Exception as e:
            logger.error(f"Error installing psycopg2-binary: {e}")
            raise RuntimeError("psycopg2-binary installation failed.") from e

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to database at {EFFECTIVE_DB_HOST} (Attempt {attempt}/{max_retries})")
            temp_engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                echo=False,  # Turn off SQL statement logging
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 10}
            )
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine = temp_engine
            logger.info(f"Database connection successful to {EFFECTIVE_DB_HOST}.")
            return engine
        except Exception as e:
            logger.warning(f"Attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(retry_interval)
            else:
                raise RuntimeError(f"Failed to connect after {max_retries} attempts.") from e

# Initialize engine at module load
create_db_engine()

def get_db() -> Generator[Session, None, None]:
    if engine is None:
        raise RuntimeError("Database engine is not initialized.")
    db = Session(engine)
    try:
        yield db
    except Exception as e:
        logger.error(f"Session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()