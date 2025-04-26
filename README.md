# MarketPlace

A marketplace application with FastAPI backend.

## Project Structure

```
MarketPlace/
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
git clone https://github.com/yourusername/MarketPlace.git
cd MarketPlace
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

## Contributing

### Adding a New Feature

When adding a new feature to the MarketPlace project, follow these steps:

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