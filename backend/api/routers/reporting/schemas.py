from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class SalesTimeSeriesPoint(BaseModel):
    """Time series data point for sales analysis"""

    date: datetime
    total_sales: float
    transaction_count: int


class SalesTimeSeries(BaseModel):
    """Time series data for sales over time"""

    data: List[SalesTimeSeriesPoint]
    total_amount: float
    total_transactions: int


class CategorySalesSummary(BaseModel):
    """Summary of sales by category"""

    category: str
    total_sales: float
    transaction_count: int
    item_count: int
    percentage: float


class CategorySalesReport(BaseModel):
    """Complete report of sales by categories"""

    categories: List[CategorySalesSummary]
    total_amount: float


class SellerPerformance(BaseModel):
    """Performance metrics for a specific seller"""

    seller_id: int
    username: str
    total_sales: float
    items_sold: int
    transaction_count: int
    average_sale: float


class SellerPerformanceReport(BaseModel):
    """Report containing performance of multiple sellers"""

    sellers: List[SellerPerformance]
    total_sellers: int
    total_sales: float


class TransactionStats(BaseModel):
    """Statistics about transactions for a user or the whole system"""

    total_transactions: int
    total_spent: Optional[float] = None
    total_earned: Optional[float] = None
    average_transaction_value: float
    highest_transaction: float
    recent_transaction_count: int


class UserSalesSummary(BaseModel):
    """Summary of a user's sales and purchases"""

    user_id: int
    username: str
    total_purchases: int
    total_spent: float
    total_sales: int
    total_earned: float
    net_balance_change: float
