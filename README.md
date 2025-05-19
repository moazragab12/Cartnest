# Cartnset

[![FastAPI](https://img.shields.io/badge/FastAPI-0.95.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13-blue.svg?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.24-red.svg?style=flat&logo=sqlmodel&logoColor=white)](https://sqlmodel.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-24.0+-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A Cartnset application with FastAPI backend.

## Table of Contents
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone the repository](#clone-the-repository)
  - [Backend Setup](#backend-setup)
- [Running the Application](#running-the-application)
- [Project Architecture](#project-architecture)
- [Coding Conventions](#coding-conventions)
- [Database](#database)
- [Database Management Commands](#database-management-commands)
- [Contributing](#contributing)
  - [Adding a New Feature](#adding-a-new-feature)
  - [Testing](#testing)
- [License](#license)

## Project Structure

```
Cartnset/
├── README.md                  # Project documentation
├── backend/                   # Backend service directory
│   ├── __init__.py            # Python package indicator
│   ├── app.py                 # Main application entry point
│   ├── Dockerfile             # Container definition for backend
│   ├── LICENSE                # MIT License
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Example environment variables
│   ├── .env                   # Actual environment variables (not tracked in git)
│   ├── api/                   # API module directory
│   │   ├── __init__.py        # API package indicator
│   │   ├── db.py              # Database connection handling
│   │   ├── dependencies.py    # Shared dependencies (auth, etc.) used by routers
│   │   ├── models/            # Database models
│   │   │   └── __init__.py    # Models package indicator
│   │   └── routers/           # API endpoints
│   │       ├── __init__.py    # Routers package indicator
│   │       └── auth/          # Authentication endpoints
│   │           ├── __init__.py # Auth package indicator
│   │           ├── model.py   # Auth-specific models
│   │           └── router.py  # Auth routes definition
│   └── tests/                 # Backend tests
└── frontend/                  # Frontend application
```

## Getting Started

### Prerequisites

- Python 3.13

### Clone the repository

```bash
git clone https://github.com/moazragab12/Cartnset.git
cd Cartnset
```

### Backend Setup

1. Change to the backend directory

```bash
cd backend
```

2. Create and activate a virtual environment

```bash
# On Windows
python -m venv .venv
.venv\Scripts\activate

# On macOS/Linux
python -m venv .venv
source .venv/bin/activate
```

3. Install the requirements

```bash
pip install -r requirements.txt
```

4. Set up environment variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file and fill in the required values:
# - uri: Your database connection string
# - secret_key: A secure random string for JWT encoding
# - expiration_time: Token expiration time in minutes
# - algorithm: JWT encoding algorithm (e.g., HS256)
```


### Running the Application

1. Start the FastAPI development server

```bash
fastapi dev ./app.py
```

2. The application will be available at:
   - API: [http://localhost:8000](http://localhost:8000)
   - Interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Alternative API documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Architecture

- **Dependencies**: The `dependencies.py` module provides authentication resolving functions that are used as dependencies in each router.
- **Routers**: Each router is organized in its own directory with its specific models and routes.
- **Models**: The application uses SQLModel ORM to define database models in the `models` directory.
- **Main Application**: The `app.py` includes and configures all routers to create the complete API.

## Coding Conventions

To maintain consistency across the project, please follow these conventions:

- **Naming Conventions**:
  - Use `snake_case` for variable names and function names
  - Use `PascalCase` for class names and model definitions
  - Use descriptive names for all identifiers

- **Type Hints**:
  - Always use type hints for function parameters and return values
  - Use appropriate types from `typing` module when needed

```python
# Example of proper type hinting
from typing import List, Optional
from backend.api.models.user import User

def get_user_by_id(user_id: int) -> Optional[User]:
    # Function implementation
    pass
    
class UserModel:
    user_id: int
    username: str
    email: Optional[str] = None
```

- **Docstrings**:
  - Include docstrings for all functions, classes, and methods
  - Follow Google-style docstring format
## Database

The Cartnset application uses a PostgreSQL database with a primary-replica setup for high availability. The database schema includes several key tables:

### Database Structure

1. **Users Table**
   - Stores user information including username, password hash, email, role, and cash balance
   - Supports two user roles: regular users and administrators
   - Tracks created and updated timestamps

2. **Items Table**
   - Contains products listed for sale with details like name, description, price, quantity
   - Linked to sellers through a foreign key relationship
   - Includes status tracking (for_sale, sold, removed, draft)
   - Records when items were listed and updated

3. **Transactions Table**
   - Records purchases between buyers and sellers
   - Tracks which items were bought, quantities, and prices
   - Maintains relationships to both buyer and seller accounts
   - Includes timestamps for when transactions occurred

4. **Deposits Table**
   - Records cash deposits made by users
   - Tracks deposit amounts and timestamps
   - Connected to user accounts through foreign keys

### High Availability Setup

The database uses a PostgreSQL primary-replica architecture:
- **Primary Node**: Handles write operations and serves as the source of truth
- **Replica Node**: Provides read scalability and failover capability

This setup is configured in the docker-compose.yml file, with both database instances running as separate containers.

## Database Management Commands

The project includes Laravel-style database management commands to make development easier:

### On Windows (PowerShell)

Navigate to the backend directory and run the following commands:

```powershell
# Create all database tables based on the models
.\scripts\db.ps1 migrate

# Seed the database with test data
.\scripts\db.ps1 seed

# Drop all tables, recreate them, and seed with fresh data
.\scripts\db.ps1 refresh

# Empty all tables (without dropping them) and seed with fresh data
.\scripts\db.ps1 fresh

# Just empty all tables without adding any data
.\scripts\db.ps1 truncate
```

### On Unix/Linux/Mac

```bash
# Create all database tables based on the models
./scripts/db.sh migrate

# Seed the database with test data
./scripts/db.sh seed

# Drop all tables, recreate them, and seed with fresh data
./scripts/db.sh refresh

# Empty all tables (without dropping them) and seed with fresh data
./scripts/db.sh fresh

# Just empty all tables without adding any data
./scripts/db.sh truncate
```

These commands simplify database management during development and will automatically:

- Create database tables using SQLModel definitions
- Populate the database with test data. You can configure seeding size in seeder.py:
    ```python
    # Configure seed counts in backend/seeds/seeder.py
    user_seed_count = 10      # Number of test users to create
    item_seed_count = 30      # Number of items to generate
    deposit_seed_count = 20   # Number of deposit records
    transaction_seed_count = 15 # Number of transactions
    ```

Default seeding will create:
    - Test users with realistic usernames and emails
    - Items with descriptions and prices
    - Deposit records with varying amounts
    - Transaction records between users

## Contributing

### Adding a New Feature

When adding a new feature to the Cartnset project, follow these steps:

1. Create a new directory in `backend/api/routers/` for your feature:

```
backend/api/routers/products/
├── __init__.py
├── model.py      # If you need feature-specific models
└── router.py     # Define your API endpoints here
```

2. Define your models in `model.py` if needed

3. Create your router in `router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from backend.api.dependencies import get_current_user, get_db
from backend.api.models.user import User
from backend.api.routers.products.model import Product

router = APIRouter(
    prefix="/products",
    tags=["products"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Product])
def get_products(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all products.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of products
    """
    products = db.exec(select(Product).offset(skip).limit(limit)).all()
    return products
```

4. Register your router in `app.py`:

```python
from backend.api.routers.products.router import router as products_router

# Later in the file
app.include_router(products_router)
```

### Testing

Always write tests for your new features in the `tests` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
