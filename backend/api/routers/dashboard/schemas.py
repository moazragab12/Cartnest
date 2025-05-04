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
    sales: float
    quantity: int
    growth: float


class TimeSeriesData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]


class DashboardSummary(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    total_customers: int
    revenue_growth: float
    order_growth: float


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