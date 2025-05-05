from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from api.db import get_db
from api.dependencies import get_current_user
from api.models.user.model import User, UserRole
from api.routers.dashboard.schemas import (
    DashboardSummary, 
    TimeSeriesData, 
    CategoryBreakdown, 
    TopProducts, 
    TransactionSummary,
    SalesSummary,
    UserProfile
)
from api.routers.dashboard.analytics import (
    get_dashboard_summary,
    get_sales_over_time,
    get_category_breakdown,
    get_top_products,
    get_recent_transactions,
    get_sales_summary
)

# Create router with authentication requirement
router = APIRouter(
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)]
)

# User profile route moved from auth
@router.get("/profile", response_model=UserProfile)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile information
    """
    return current_user

@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    view_type: str = Query("all", description="View type for filtering data"),
    time_range: str = Query("30_days", description="Time range: '30_days', '90_days', 'this_year', 'all_time'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summary statistics for the dashboard. Can be filtered by time range."""
    # Simply use the current user's ID without role checks
    return await get_dashboard_summary(db, user_id=current_user.user_id, view_type=view_type, time_range=time_range)

@router.get("/sales", response_model=TimeSeriesData)
async def sales_data(
    period: str = Query("daily", description="Time period: daily, weekly, monthly, yearly"),
    days: int = Query(30, description="Number of days of data to return (for daily/weekly)"),
    view_type: str = Query("seller", description="View type: 'seller', or 'buyer'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales data over time with the specified aggregation period."""
    return await get_sales_over_time(db, period, days, user_id=current_user.user_id, view_type=view_type)

@router.get("/categories", response_model=List[CategoryBreakdown])
async def category_breakdown(
    view_type: str = Query("seller", description="View type: 'seller', or 'buyer'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales breakdown by category."""
    return await get_category_breakdown(db, user_id=current_user.user_id, view_type=view_type)

@router.get("/top-products", response_model=List[TopProducts])
async def top_products(
    limit: int = Query(5, description="Number of top products to return"),
    view_type: str = Query("seller", description="View type: 'seller', or 'buyer'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get top selling products. If view_type is 'seller', shows the user's top sold products. 
    If 'buyer', shows their most purchased products."""
    products = await get_top_products(db, limit, user_id=current_user.user_id, view_type=view_type)
    # Wrap the products in a TopProducts model as expected by the frontend
    return [TopProducts(products=products)]

@router.get("/recent-transactions", response_model=TransactionSummary)
async def recent_transactions(
    limit: int = Query(10, description="Number of recent transactions to return"),
    view_type: str = Query("both", description="View type: 'seller', 'buyer', or 'both'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent transactions. Can filter by those where the user is the seller or buyer."""
    transactions = await get_recent_transactions(
        db, limit, user_id=current_user.user_id, view_type=view_type
    )
    
    return TransactionSummary(
        recent_transactions=transactions,
        transaction_count=len(transactions)
    )

@router.get("/sales-summary", response_model=SalesSummary)
async def sales_summary(
    days: int = Query(30, description="Number of days to include in the summary"),
    view_type: str = Query("seller", description="View type: 'seller', or 'buyer'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales summary for a specified period. Can be filtered by seller or buyer view."""
    return await get_sales_summary(db, days, user_id=current_user.user_id, view_type=view_type)

# Route for custom date range analytics
@router.get("/custom-range", response_model=TimeSeriesData)
async def custom_range_analysis(
    start_date: str = Query(..., description="Start date in format YYYY-MM-DD"),
    end_date: str = Query(..., description="End date in format YYYY-MM-DD"),
    metric: str = Query("revenue", description="Metric to analyze: revenue, orders, customers"),
    view_type: str = Query("seller", description="View type: 'seller', or 'buyer'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get analytics for a custom date range."""
    try:
        # Parse dates
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Calculate days difference to determine appropriate aggregation
        days_diff = (end - start).days
        
        if days_diff <= 31:
            period = "daily"
        elif days_diff <= 90:
            period = "weekly"
        else:
            period = "monthly"
            
        # Use the sales_over_time function with custom date range
        return await get_sales_over_time(
            db, period, days_diff, user_id=current_user.user_id, view_type=view_type, 
            custom_start_date=start, custom_end_date=end
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")