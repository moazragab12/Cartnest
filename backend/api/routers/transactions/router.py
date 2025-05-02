from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import logging

from api.db import get_db
from api.dependencies import get_current_user
from api.models.user.model import User
from .schemas import (
    TransactionCreate, 
    TransactionResponse, 
    TransactionListResponse,
    TransactionDetailedResponse,
    BalanceTransfer,
    BalanceResponse
)
from . import crud

# Removing prefix here as it will be applied in app.py
router = APIRouter(
    tags=["Transactions"],
    responses={404: {"description": "Not found"}}
)

logger = logging.getLogger(__name__)


@router.post(
    "/purchase",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Purchase an item"
)
def purchase_item(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Purchase an item from the marketplace.
    
    - **item_id**: ID of the item to purchase
    - **quantity**: Number of units to purchase (default: 1)
    """
    try:
        result = crud.create_transaction(
            db=db, 
            transaction_data=transaction, 
            buyer_id=current_user.user_id
        )
        return result
    except Exception as e:
        logger.error(f"Error during purchase: {str(e)}")
        raise


@router.get(
    "/",
    response_model=TransactionListResponse,
    summary="Get user transactions"
)
def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all transactions where the current user is either buyer or seller.
    
    - **skip**: Number of records to skip for pagination
    - **limit**: Maximum number of records to return
    """
    transactions = crud.get_user_transactions(
        db=db, 
        user_id=current_user.user_id, 
        skip=skip, 
        limit=limit
    )
    return {
        "transactions": transactions,
        "total": len(transactions)
    }


@router.get(
    "/{transaction_id}",
    response_model=TransactionDetailedResponse,
    summary="Get detailed transaction information by ID"
)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific transaction by its ID.
    Includes information about buyer, seller, and item details.
    The user must be either the buyer or seller of the transaction.
    
    - **transaction_id**: ID of the transaction
    """
    transaction = crud.get_transaction_by_id(
        db=db, 
        transaction_id=transaction_id,
        user_id=current_user.user_id
    )
    # Ensure the response properly includes buyer, seller, and item details
    return TransactionDetailedResponse(**transaction)


@router.post(
    "/transfer",
    response_model=BalanceResponse,
    summary="Transfer balance to another user"
)
def transfer_funds(
    transfer_data: BalanceTransfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transfer funds from current user to another user.
    
    - **receiver_id**: ID of the user receiving the funds
    - **amount**: Amount to transfer (must be positive)
    """
    result = crud.transfer_balance(
        db=db,
        transfer_data=transfer_data,
        sender_id=current_user.user_id
    )
    return BalanceResponse(
        user_id=current_user.user_id,
        cash_balance=result["cash_balance"],
        message=result["message"]
    )