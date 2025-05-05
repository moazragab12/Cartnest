from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract, or_, and_
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
import calendar

from api.models.transaction.model import Transaction
from api.models.item.model import Item
from api.models.user.model import User
from api.routers.dashboard.schemas import (
    SalesDataPoint, SalesSummary, CategorySales, 
    ProductPerformance, TimeSeriesData, DashboardSummary
)


async def get_dashboard_summary(
    db: Session, 
    user_id: Optional[int] = None, 
    view_type: str = "all",
    time_range: str = "30_days"
) -> DashboardSummary:
    """Get summary statistics for the dashboard.
    
    Args:
        db: Database session
        user_id: User ID for filtering
        view_type: View type filter 
        time_range: Time range for filtering ('30_days', '90_days', 'this_year', 'all_time')
    """
    # Initialize metrics
    total_orders = 0
    delivered_value = 0
    total_spent = 0
    products_listed = 0
    
    # Calculate date range based on time_range parameter
    today = datetime.now().date()
    
    if time_range == "30_days":
        start_date = today - timedelta(days=30)
        prev_start_date = today - timedelta(days=60) 
        prev_end_date = start_date
    elif time_range == "90_days":
        start_date = today - timedelta(days=90)
        prev_start_date = today - timedelta(days=180)
        prev_end_date = start_date
    elif time_range == "this_year":
        start_date = datetime(today.year, 1, 1).date()
        prev_start_date = datetime(today.year-1, 1, 1).date()
        prev_end_date = datetime(today.year-1, 12, 31).date()
    else:  # all_time
        start_date = datetime(2000, 1, 1).date()  # A date far in the past
        prev_start_date = None  # No previous period for all time
        prev_end_date = None
    
    if user_id:
        # Base query with time filter
        orders_query = db.query(Transaction).filter(Transaction.buyer_user_id == user_id)
        spent_query = db.query(func.sum(Transaction.total_amount)).filter(Transaction.buyer_user_id == user_id)
        
        # Apply time filter except for all_time
        if time_range != "all_time":
            orders_query = orders_query.filter(Transaction.transaction_time >= start_date)
            spent_query = spent_query.filter(Transaction.transaction_time >= start_date)
        
        # 1. Total orders - count transactions where user is the buyer
        total_orders = orders_query.count()
        
        # 2. Delivered value - same as total orders
        delivered_value = total_orders
        
        # 3. Total spent - sum of transaction amounts where user is the buyer
        total_spent_result = spent_query.scalar()
        total_spent = total_spent_result or 0
        
        # 4. Products listed - count items where user is the seller
        products_listed = db.query(Item).filter(
            Item.seller_user_id == user_id
        ).count()

    # Activity Summary Graph Data
    purchase_data = []
    sales_data = []
    
    if user_id:
        # For activity graph, use the selected time range
        purchases_activity_query = db.query(
            func.date(Transaction.transaction_time).label("date"),
            func.sum(Transaction.total_amount).label("amount")
        ).filter(
            Transaction.buyer_user_id == user_id
        )
        
        sales_activity_query = db.query(
            func.date(Transaction.transaction_time).label("date"),
            func.sum(Transaction.total_amount).label("amount")
        ).filter(
            Transaction.seller_user_id == user_id
        )
        
        # Apply time filter except for all_time
        if time_range != "all_time":
            purchases_activity_query = purchases_activity_query.filter(
                Transaction.transaction_time >= start_date
            )
            sales_activity_query = sales_activity_query.filter(
                Transaction.transaction_time >= start_date
            )
        
        # Get purchase data
        purchase_results = purchases_activity_query.group_by(
            func.date(Transaction.transaction_time)
        ).order_by(
            func.date(Transaction.transaction_time)
        ).all()
        
        # Get sales data
        sales_results = sales_activity_query.group_by(
            func.date(Transaction.transaction_time)
        ).order_by(
            func.date(Transaction.transaction_time)
        ).all()
        
        # Convert to dictionary for easier lookup
        purchase_by_date = {str(date): float(amount) for date, amount in purchase_results}
        sales_by_date = {str(date): float(amount) for date, amount in sales_results}
        
        # Determine appropriate date range for the graph based on time_range
        if time_range == "all_time":
            # For all time, we need to find the first transaction date
            earliest_tx = db.query(func.min(Transaction.transaction_time)).filter(
                or_(
                    Transaction.buyer_user_id == user_id,
                    Transaction.seller_user_id == user_id
                )
            ).scalar()
            
            if earliest_tx:
                earliest_date = earliest_tx.date()
                days_diff = (today - earliest_date).days
                date_range = [(earliest_date + timedelta(days=i)) for i in range(days_diff + 1)]
            else:
                # No transactions, use last 30 days as default
                date_range = [(today - timedelta(days=i)) for i in range(30)]
                date_range.reverse()
        else:
            # For other time ranges, generate dates from start_date to today
            days_diff = (today - start_date).days
            date_range = [(start_date + timedelta(days=i)) for i in range(days_diff + 1)]
        
        # Create the purchase and sales data series
        purchase_data = [
            {"date": date.strftime("%Y-%m-%d"), "value": purchase_by_date.get(str(date), 0)} 
            for date in date_range
        ]
        
        sales_data = [
            {"date": date.strftime("%Y-%m-%d"), "value": sales_by_date.get(str(date), 0)} 
            for date in date_range
        ]
    
    # Spending by Category data with time range filter
    category_spending = []
    if user_id:
        # Base category query
        category_query = db.query(
            Item.category,
            func.sum(Transaction.total_amount).label("amount")
        ).join(
            Transaction, Transaction.item_id == Item.item_id
        ).filter(
            Transaction.buyer_user_id == user_id
        )
        
        # Apply time filter except for all_time
        if time_range != "all_time":
            category_query = category_query.filter(Transaction.transaction_time >= start_date)
        
        # Execute query with grouping
        category_results = category_query.group_by(
            Item.category
        ).order_by(
            desc(func.sum(Transaction.total_amount))
        ).all()
        
        # Calculate total spending for percentages
        total_category_spending = sum(float(amount) for _, amount in category_results)
        
        # Format category data for the pie chart
        for category, amount in category_results:
            amount_float = float(amount)
            percentage = (amount_float / total_category_spending * 100) if total_category_spending > 0 else 0
            category_spending.append({
                "category": category or "Other",  # Use "Other" if category is None
                "amount": amount_float,
                "percentage": round(percentage, 1)  # Round to 1 decimal place
            })
    
    # Best Selling Products with time range filter
    best_selling_products = []
    if user_id:
        # Base query for best sellers
        best_sellers_query = db.query(
            Item.item_id,
            Item.name,
            func.sum(Transaction.total_amount).label("sales"),
            func.sum(Transaction.quantity_purchased).label("units_sold")
        ).join(
            Transaction, Transaction.item_id == Item.item_id
        ).filter(
            Transaction.seller_user_id == user_id
        )
        
        # Apply time filter except for all_time
        if time_range != "all_time":
            best_sellers_query = best_sellers_query.filter(Transaction.transaction_time >= start_date)
            
            # For previous period comparison (for growth calculation)
            if prev_start_date and prev_end_date:
                prev_period_query = db.query(
                    Item.item_id,
                    func.sum(Transaction.total_amount).label("sales")
                ).join(
                    Transaction, Transaction.item_id == Item.item_id
                ).filter(
                    Transaction.seller_user_id == user_id,
                    Transaction.transaction_time >= prev_start_date,
                    Transaction.transaction_time < prev_end_date
                ).group_by(
                    Item.item_id
                ).all()
                
                # Create a lookup for previous period sales
                prev_sales_lookup = {item_id: float(sales) for item_id, sales in prev_period_query}
            else:
                prev_sales_lookup = {}
        else:
            # No previous period for all time
            prev_sales_lookup = {}
        
        # Get current period best sellers
        current_period_products = best_sellers_query.group_by(
            Item.item_id, Item.name
        ).order_by(
            desc(func.sum(Transaction.total_amount))
        ).limit(5).all()
        
        # Format best selling products
        for item_id, name, sales, units_sold in current_period_products:
            prev_sales = prev_sales_lookup.get(item_id, 0)
            growth = ((float(sales) - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
            
            best_selling_products.append({
                "product_id": item_id,
                "product_name": name,
                "total_sales": float(sales),
                "units_sold": int(units_sold),
                "growth": round(growth, 1)
            })
    
    # Return the dashboard summary with all data
    return DashboardSummary(
        total_orders=total_orders,
        total_customers=delivered_value,  # Reusing for delivered value
        total_spent=total_spent,
        products_listed=products_listed,
        purchase_activity=purchase_data,
        sales_activity=sales_data,
        category_spending=category_spending,
        best_selling_products=best_selling_products
    )


async def get_sales_over_time(
    db: Session, 
    period: str = "daily", 
    days: int = 30,
    user_id: Optional[int] = None,
    view_type: str = "all",
    custom_start_date: Optional[date] = None,
    custom_end_date: Optional[date] = None
) -> TimeSeriesData:
    """Get sales data over time with specified period (daily, weekly, monthly, yearly)."""
    # Determine date range
    today = datetime.now().date()
    start_date = custom_start_date or (today - timedelta(days=days))
    end_date = custom_end_date or today
    
    # Base query setup based on user role
    base_query = db.query(Transaction).filter(
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date
    )
    
    # Apply user filters based on view type
    if user_id and view_type != "all":
        if view_type == "seller":
            # Get all items sold by this user
            base_query = base_query.filter(Transaction.seller_user_id == user_id)
        elif view_type == "buyer":
            base_query = base_query.filter(Transaction.buyer_user_id == user_id)
        elif view_type == "both":
            # Transactions where user is either buyer or seller
            base_query = base_query.filter(
                or_(
                    Transaction.buyer_user_id == user_id,
                    Transaction.seller_user_id == user_id
                )
            )
    
    # Period-specific data aggregation
    if period == "daily":
        # Daily sales for the specified number of days
        query_result = base_query.with_entities(
            func.date(Transaction.transaction_time).label("date"),
            func.sum(Transaction.total_amount).label("revenue"),
            func.count(Transaction.transaction_id).label("orders")
        ).group_by(
            func.date(Transaction.transaction_time)
        ).order_by(
            func.date(Transaction.transaction_time)
        ).all()
        
        # Create a date-to-data mapping for all results
        date_data = {result.date: (float(result.revenue), int(result.orders)) for result in query_result}
        
        # Generate all dates in range to ensure continuous time series
        date_range = [(start_date + timedelta(days=i)) for i in range((end_date - start_date).days + 1)]
        
        # Format into labels and datasets
        labels = [d.strftime("%a, %b %d") for d in date_range]
        revenues = [date_data.get(d, (0, 0))[0] for d in date_range]
        orders = [date_data.get(d, (0, 0))[1] for d in date_range]
        
    elif period == "weekly":
        # Weekly aggregation
        query_result = base_query.with_entities(
            func.date_trunc('week', Transaction.transaction_time).label("week_start"),
            func.sum(Transaction.total_amount).label("revenue"),
            func.count(Transaction.transaction_id).label("orders")
        ).group_by(
            func.date_trunc('week', Transaction.transaction_time)
        ).order_by(
            func.date_trunc('week', Transaction.transaction_time)
        ).all()
        
        # Process the data for each week
        labels = []
        revenues = []
        orders = []
        
        for week_start, revenue, order_count in query_result:
            # Format week as "Apr 1 - Apr 7"
            week_end = week_start + timedelta(days=6)
            week_label = f"{week_start.strftime('%b %d')} - {week_end.strftime('%b %d')}"
            labels.append(week_label)
            revenues.append(float(revenue))
            orders.append(int(order_count))
        
    elif period == "monthly":
        # Get monthly data 
        query_result = base_query.with_entities(
            extract('year', Transaction.transaction_time).label("year"),
            extract('month', Transaction.transaction_time).label("month"),
            func.sum(Transaction.total_amount).label("revenue"),
            func.count(Transaction.transaction_id).label("orders")
        ).group_by(
            extract('year', Transaction.transaction_time),
            extract('month', Transaction.transaction_time)
        ).order_by(
            extract('year', Transaction.transaction_time),
            extract('month', Transaction.transaction_time)
        ).all()
        
        labels = []
        revenues = []
        orders = []
        
        for year, month, revenue, order_count in query_result:
            month_name = calendar.month_abbr[int(month)]
            labels.append(f"{month_name} {int(year)}")
            revenues.append(float(revenue))
            orders.append(int(order_count))
            
    elif period == "yearly":
        # Yearly data
        query_result = base_query.with_entities(
            extract('year', Transaction.transaction_time).label("year"),
            func.sum(Transaction.total_amount).label("revenue"),
            func.count(Transaction.transaction_id).label("orders")
        ).group_by(
            extract('year', Transaction.transaction_time)
        ).order_by(
            extract('year', Transaction.transaction_time)
        ).all()
        
        labels = []
        revenues = []
        orders = []
        
        for year, revenue, order_count in query_result:
            labels.append(str(int(year)))
            revenues.append(float(revenue))
            orders.append(int(order_count))
    
    # Default case - prepare empty datasets
    else:
        labels = []
        revenues = []
        orders = []
    
    # Prepare the TimeSeriesData response
    datasets = [
        {
            "label": "Revenue",
            "data": revenues,
            "borderColor": "#0d99ff",
            "backgroundColor": "rgba(13, 153, 255, 0.1)",
            "borderWidth": 2,
            "tension": 0.4,
            "fill": False,
            "yAxisID": 'y'
        },
        {
            "label": "Orders",
            "data": orders,
            "borderColor": "#10B981",
            "backgroundColor": "rgba(16, 185, 129, 0.1)",
            "borderWidth": 2,
            "tension": 0.4,
            "fill": False,
            "yAxisID": 'y1'
        }
    ]
    
    return TimeSeriesData(labels=labels, datasets=datasets)


async def get_category_breakdown(
    db: Session,
    user_id: Optional[int] = None,
    view_type: str = "all"
) -> List[CategorySales]:
    """Get sales breakdown by category."""
    # Base query for joining items and transactions
    base_query = db.query(
        Item.category,
        func.sum(Transaction.total_amount).label("sales"),
        func.count(Transaction.transaction_id).label("count")
    ).join(
        Transaction, Transaction.item_id == Item.item_id
    )
    
    # Apply filters based on user role
    if user_id and view_type != "all":
        if view_type == "seller":
            base_query = base_query.filter(Transaction.seller_user_id == user_id)
        elif view_type == "buyer":
            base_query = base_query.filter(Transaction.buyer_user_id == user_id)
        elif view_type == "both":
            base_query = base_query.filter(
                or_(
                    Transaction.seller_user_id == user_id,
                    Transaction.buyer_user_id == user_id
                )
            )
    
    # Get total sales amount for calculating percentages
    if user_id and view_type != "all":
        if view_type == "seller":
            total_sales = db.query(func.sum(Transaction.total_amount)).filter(
                Transaction.seller_user_id == user_id
            ).scalar() or 0
        elif view_type == "buyer":
            total_sales = db.query(func.sum(Transaction.total_amount)).filter(
                Transaction.buyer_user_id == user_id
            ).scalar() or 0
        elif view_type == "both":
            total_sales = db.query(func.sum(Transaction.total_amount)).filter(
                or_(
                    Transaction.seller_user_id == user_id,
                    Transaction.buyer_user_id == user_id
                )
            ).scalar() or 0
    else:
        total_sales = db.query(func.sum(Transaction.total_amount)).scalar() or 0
    
    # Execute the category query with group by
    query_result = base_query.group_by(
        Item.category
    ).order_by(
        desc(func.sum(Transaction.total_amount))
    ).all()
    
    categories = []
    for category, sales, count in query_result:
        percentage = (sales / total_sales * 100) if total_sales > 0 else 0
        categories.append(
            CategorySales(
                category=category,
                sales=float(sales),
                percentage=float(percentage),
                count=count
            )
        )
    
    return categories


async def get_top_products(
    db: Session, 
    limit: int = 5,
    user_id: Optional[int] = None,
    view_type: str = "all"
) -> List[ProductPerformance]:
    """Get top selling products."""
    # Get current period (last 30 days)
    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)
    sixty_days_ago = today - timedelta(days=60)
    
    # Base query for current period top products
    base_query = db.query(
        Item.item_id,
        Item.name,
        func.sum(Transaction.total_amount).label("sales"),
        func.count(Transaction.transaction_id).label("quantity")
    ).join(
        Transaction, Transaction.item_id == Item.item_id
    ).filter(
        Transaction.transaction_time >= thirty_days_ago
    )
    
    # Base query for previous period (for growth calculation)
    prev_query = db.query(
        Item.item_id,
        func.sum(Transaction.total_amount).label("sales")
    ).join(
        Transaction, Transaction.item_id == Item.item_id
    ).filter(
        Transaction.transaction_time >= sixty_days_ago,
        Transaction.transaction_time < thirty_days_ago
    )
    
    # Apply filters based on user role
    if user_id and view_type != "all":
        if view_type == "seller":
            base_query = base_query.filter(Transaction.seller_user_id == user_id)
            prev_query = prev_query.filter(Transaction.seller_user_id == user_id)
        elif view_type == "buyer":
            base_query = base_query.filter(Transaction.buyer_user_id == user_id)
            prev_query = prev_query.filter(Transaction.buyer_user_id == user_id)
        elif view_type == "both":
            base_query = base_query.filter(
                or_(
                    Transaction.seller_user_id == user_id,
                    Transaction.buyer_user_id == user_id
                )
            )
            prev_query = prev_query.filter(
                or_(
                    Transaction.seller_user_id == user_id,
                    Transaction.buyer_user_id == user_id
                )
            )
    
    # Get top products for current period
    current_period_products = base_query.group_by(
        Item.item_id, Item.name
    ).order_by(
        desc(func.sum(Transaction.total_amount))
    ).limit(limit).all()
    
    # Get previous period sales for growth calculation
    previous_period_sales = {}
    previous_sales_query = prev_query.group_by(Item.item_id).all()
    
    for item_id, sales in previous_sales_query:
        previous_period_sales[item_id] = sales
    
    # Calculate growth and prepare response
    products = []
    for product_id, product_name, sales, quantity in current_period_products:
        previous_sales = previous_period_sales.get(product_id, 0)
        growth = ((sales - previous_sales) / previous_sales * 100) if previous_sales > 0 else 0
        
        products.append(
            ProductPerformance(
                product_id=str(product_id),  # Convert integer product_id to string
                product_name=product_name,
                sales=float(sales),
                quantity=int(quantity),
                growth=float(growth)
            )
        )
    
    return products


async def get_recent_transactions(
    db: Session, 
    limit: int = 10,
    user_id: Optional[int] = None,
    view_type: str = "all"
) -> List[Dict[str, Any]]:
    """Get recent transactions with user and item details."""
    # Base query
    base_query = db.query(
        Transaction.transaction_id,
        Transaction.total_amount,
        Transaction.transaction_time,
        Transaction.buyer_user_id,
        Transaction.seller_user_id,
        Item.name.label("item_name"),
        Item.category
    ).join(
        Item, Item.item_id == Transaction.item_id
    )
    
    # Apply filters based on view type
    if user_id and view_type != "all":
        if view_type == "seller":
            base_query = base_query.filter(Transaction.seller_user_id == user_id)
        elif view_type == "buyer":
            base_query = base_query.filter(Transaction.buyer_user_id == user_id)
        elif view_type == "both":
            # Both buyer and seller transactions
            base_query = base_query.filter(
                or_(
                    Transaction.seller_user_id == user_id,
                    Transaction.buyer_user_id == user_id
                )
            )
    
    # Execute query with ordering and limit
    transactions = base_query.order_by(
        desc(Transaction.transaction_time)
    ).limit(limit).all()
    
    result = []
    for tx_id, amount, created_at, buyer_id, seller_id, item_name, category in transactions:
        # Get buyer and seller usernames
        buyer = db.query(User.username).filter(User.user_id == buyer_id).first()
        seller = db.query(User.username).filter(User.user_id == seller_id).first()
        
        buyer_username = buyer[0] if buyer else "Unknown"
        seller_username = seller[0] if seller else "Unknown"
        
        transaction_type = ""
        if user_id:
            if seller_id == user_id:
                transaction_type = "sale"
            elif buyer_id == user_id:
                transaction_type = "purchase"
        
        result.append({
            "id": tx_id,
            "amount": float(amount),
            "date": created_at.strftime("%Y-%m-%d %H:%M"),
            "buyer_username": buyer_username,
            "seller_username": seller_username,
            "item_name": item_name,
            "category": category,
            "transaction_type": transaction_type
        })
    
    return result


async def get_sales_summary(
    db: Session, 
    days: int = 30,
    user_id: Optional[int] = None,
    view_type: str = "all"
) -> SalesSummary:
    """Get sales summary for a specified period."""
    today = datetime.now().date()
    start_date = today - timedelta(days=days)
    previous_start = today - timedelta(days=days*2)
    
    # Base query for current period
    current_query = db.query(Transaction).filter(
        Transaction.transaction_time >= start_date
    )
    
    # Base query for previous period
    previous_query = db.query(Transaction).filter(
        Transaction.transaction_time >= previous_start,
        Transaction.transaction_time < start_date
    )
    
    # Apply filters based on user role
    if user_id and view_type != "all":
        if view_type == "seller":
            # Filter for transactions where user is the seller
            current_query = current_query.filter(Transaction.seller_user_id == user_id)
            previous_query = previous_query.filter(Transaction.seller_user_id == user_id)
        elif view_type == "buyer":
            # Filter for transactions where user is the buyer
            current_query = current_query.filter(Transaction.buyer_user_id == user_id)
            previous_query = previous_query.filter(Transaction.buyer_user_id == user_id)
        elif view_type == "both":
            # Both buyer and seller transactions
            current_query = current_query.filter(
                or_(
                    Transaction.buyer_user_id == user_id,
                    Transaction.seller_user_id == user_id
                )
            )
            previous_query = previous_query.filter(
                or_(
                    Transaction.buyer_user_id == user_id,
                    Transaction.seller_user_id == user_id
                )
            )
    
    # Get summary metrics for current period
    current_sales = current_query.with_entities(func.sum(Transaction.total_amount)).scalar() or 0
    current_orders = current_query.with_entities(func.count(Transaction.transaction_id)).scalar() or 0
    
    # Get total sales for previous period
    previous_sales = previous_query.with_entities(func.sum(Transaction.total_amount)).scalar() or 0
    
    # Calculate metrics
    avg_order_value = current_sales / current_orders if current_orders > 0 else 0
    growth = ((current_sales - previous_sales) / previous_sales * 100) if previous_sales > 0 else 0
    
    return SalesSummary(
        total_sales=float(current_sales),
        total_orders=int(current_orders),
        average_order_value=float(avg_order_value),
        period_growth=float(growth)
    )