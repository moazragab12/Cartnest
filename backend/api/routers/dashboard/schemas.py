from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime, date
from api.models.user.model import UserRole


class UserProfile(BaseModel):
    user_id: int
    username: str
    email: str
    role: UserRole
    cash_balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class SalesDataPoint(BaseModel):
    date: date
    value: float
    count: int


class SalesSummary(BaseModel):
    total_sales: float
    total_orders: int
    average_order_value: float
    period_growth: float


class CategorySales(BaseModel):
    category: str
    sales: float
    percentage: float
    count: int


class ProductPerformance(BaseModel):
    product_id: str
    product_name: str
    description: Optional[str] = ""
    price: float = 0
    category: str = "Uncategorized"
    status: Optional[str] = "active"
    sales: float
    quantity: int
    revenue: float = 0
    growth: float


class TimeSeriesData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]


class DashboardSummary(BaseModel):
    total_orders: int
    total_customers: int  # Used for delivered value
    total_spent: float
    products_listed: int
    purchase_activity: List[Dict[str, Any]] = []
    sales_activity: List[Dict[str, Any]] = []
    category_spending: List[Dict[str, Any]] = []
    best_selling_products: List[Dict[str, Any]] = []


class RevenueByPeriod(BaseModel):
    daily: List[SalesDataPoint]
    weekly: List[SalesDataPoint]
    monthly: List[SalesDataPoint]
    yearly: List[SalesDataPoint]


class TopProducts(BaseModel):
    products: List[ProductPerformance]


class CategoryBreakdown(BaseModel):
    categories: List[CategorySales]


class TransactionSummary(BaseModel):
    recent_transactions: List[Dict[str, Any]]
    transaction_count: int