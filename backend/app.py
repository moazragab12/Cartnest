from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
import sys

# Get the absolute path to the project root directory
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(ROOT_DIR)

# Load environment variables from absolute path
dotenv_path = os.path.join(ROOT_DIR, '.env')
load_dotenv(dotenv_path)

# Change from relative imports to absolute imports
from api.db import Base, engine, get_db
from api.dependencies import get_current_user
from api.models.user.model import User
# Import the correctly named auth_router directly
from api.routers.auth.router import auth_router
from api.routers.profile_management.router import router as profile_router
from api.routers.transactions.router import router as transaction_router
from api.routers.search.router import search_router

# Create all tables at startup
Base.metadata.create_all(bind=engine)

# API metadata
version = "0.0"
app = FastAPI(
    title="Market Place",
    version=version,
    description="API for the Market Place application",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API prefix
api_prefix = f"/api/v{version[0]}"

# OAuth2 token scheme - Fix to use the correct tokenUrl that matches actual endpoint path
oauth2_scheme = OAuth2PasswordBearer(
    # This is the endpoint path WITHOUT the api prefix, as FastAPI will prepend the API path automatically
    tokenUrl=f"{api_prefix}/auth/login"
)

# Favicon fallback
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {"message": "No favicon available"}

# Root route - Keeping this as it provides a helpful API overview
@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to the Market Place API!",
        "api_version": f"v{version[0]}",
        "endpoints": {
            "auth": {
                "register": "/api/v0/auth/register",
                "login": "/api/v0/auth/login",
                "refresh_token": "/api/v0/auth/refresh-token",
                "profile": "/api/v0/auth/profile",
                "token_status": "/api/v0/auth/token-status"
            },
            "profile": {
                "overview": "/api/v0/overview",
                "items": {
                    "create_item": "/api/v0/items",
                    "get_items": "/api/v0/items",
                    "get_item": "/api/v0/items/{item_id}",
                    "update_item": "/api/v0/items/{item_id}",
                    "delete_item": "/api/v0/items/{item_id}"
                },
                "wallet": {
                    "deposit": "/api/v0/wallet/deposit",
                    "balance": "/api/v0/wallet/balance",
                    "transactions": "/api/v0/wallet/transactions"
                }
            },
            "transactions": {
                "purchase": "/api/v0/transactions/purchase",
                "list_transactions": "/api/v0/transactions/",
                "get_transaction": "/api/v0/transactions/{transaction_id}",
                "transfer_balance": "/api/v0/transactions/transfer"
            }
        }
    }

# Routers with consistent prefix
app.include_router(search_router)
app.include_router(auth_router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(profile_router, prefix=f"{api_prefix}", tags=["Profile"])
app.include_router(transaction_router, prefix=f"{api_prefix}/transactions", tags=["Transactions"])