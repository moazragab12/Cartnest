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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")

# Load environment variables
load_dotenv()

# Database configuration
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

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
            logger.info(f"Connecting to database (Attempt {attempt}/{max_retries})")
            temp_engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                echo=True,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 10}
            )
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine = temp_engine
            logger.info("Database engine created and connection verified.")
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

# Import models to register with SQLAlchemy
from api.models.user.model import User, UserToken
