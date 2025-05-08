from sqlmodel import Session, select, col, func, distinct, desc
from datetime import datetime, timedelta
from typing import Dict, Optional, Literal

from api.models.transaction.model import Transaction
from api.models.item.model import Item
from api.models.user.model import User


def get_sales_time_series(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[int] = None,
    is_seller: bool = False,
) -> Dict:
    """
    Get time series data for sales over time

    Args:
        db: Database session
        start_date: Start date for the report
        end_date: End date for the report
        user_id: User ID to filter by (if None, all users)
        is_seller: If True, filter by seller_user_id, else by buyer_user_id

    Returns:
        Dictionary with date, total_sales and transaction_count
    """
    # Set default date range to last 30 days if not specified
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Create the SQLModel select statement
    statement = select(
        func.date_trunc("day", Transaction.transaction_time).label("date"),
        func.sum(Transaction.total_amount).label("total_sales"),
        func.count(Transaction.transaction_id).label("transaction_count"),
    ).where(
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
    )

    # Apply user filter if specified
    if user_id:
        if is_seller:
            statement = statement.where(Transaction.seller_user_id == user_id)
        else:
            statement = statement.where(Transaction.buyer_user_id == user_id)

    # Group by date and order by date
    statement = statement.group_by(
        func.date_trunc("day", Transaction.transaction_time)
    ).order_by(func.date_trunc("day", Transaction.transaction_time))

    # Execute the query
    result = db.exec(statement).all()

    # Calculate total sales and transactions
    total_amount = sum(row.total_sales for row in result)
    total_transactions = sum(row.transaction_count for row in result)

    return {
        "data": [
            {
                "date": row.date,
                "total_sales": float(row.total_sales),
                "transaction_count": row.transaction_count,
            }
            for row in result
        ],
        "total_amount": float(total_amount) if total_amount else 0.0,
        "total_transactions": total_transactions,
    }


def get_category_sales(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 10,
) -> Dict:
    """
    Get sales breakdown by category

    Args:
        db: Database session
        start_date: Start date for the report
        end_date: End date for the report
        limit: Maximum number of categories to return

    Returns:
        Dictionary with categories and total sales data
    """
    # Set default date range to last 30 days if not specified
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Create SQLModel select statement for category sales
    statement = (
        select(
            Item.category,
            func.sum(Transaction.total_amount).label("total_sales"),
            func.count(Transaction.transaction_id).label("transaction_count"),
            func.count(distinct(Item.item_id)).label("item_count"),
        )
        .join(Item, Transaction.item_id == Item.item_id)
        .where(
            Transaction.transaction_time >= start_date,
            Transaction.transaction_time <= end_date,
        )
        .group_by(Item.category)
        .order_by(desc(col("total_sales")))
        .limit(limit)
    )

    # Execute the query
    result = db.exec(statement).all()

    # Create SQLModel select statement for total sales amount
    total_statement = select(
        func.sum(Transaction.total_amount).label("total_amount")
    ).where(
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
    )

    # Execute the query to get total amount
    total_row = db.exec(total_statement).first()
    total_amount = total_row.total_amount if total_row and total_row.total_amount else 0

    return {
        "categories": [
            {
                "category": row.category or "Uncategorized",
                "total_sales": float(row.total_sales),
                "transaction_count": row.transaction_count,
                "item_count": row.item_count,
                "percentage": (
                    float(row.total_sales / total_amount * 100)
                    if total_amount > 0
                    else 0
                ),
            }
            for row in result
        ],
        "total_amount": float(total_amount),
    }


def get_seller_performance(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 10,
) -> Dict:
    """
    Get performance metrics for top sellers

    Args:
        db: Database session
        start_date: Start date for the report
        end_date: End date for the report
        limit: Maximum number of sellers to return

    Returns:
        Dictionary with seller performance data
    """
    # Set default date range to last 30 days if not specified
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Create SQLModel select statement for seller performance
    statement = (
        select(
            Transaction.seller_user_id,
            User.username,
            func.sum(Transaction.total_amount).label("total_sales"),
            func.sum(Transaction.quantity_purchased).label("items_sold"),
            func.count(Transaction.transaction_id).label("transaction_count"),
        )
        .join(User, Transaction.seller_user_id == User.user_id)
        .where(
            Transaction.transaction_time >= start_date,
            Transaction.transaction_time <= end_date,
        )
        .group_by(Transaction.seller_user_id, User.username)
        .order_by(desc(col("total_sales")))
        .limit(limit)
    )

    # Execute the query
    result = db.exec(statement).all()

    # Create SQLModel select statement for total sales
    total_sales_statement = select(
        func.sum(Transaction.total_amount).label("total_sales")
    ).where(
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
    )

    # Execute the query to get total sales
    total_sales_row = db.exec(total_sales_statement).first()
    total_sales = (
        total_sales_row.total_sales
        if total_sales_row and total_sales_row.total_sales
        else 0
    )

    # Create SQLModel select statement for total sellers
    total_sellers_statement = select(
        func.count(distinct(Transaction.seller_user_id)).label("total_sellers")
    ).where(
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
    )

    # Execute the query to get total number of sellers
    total_sellers_row = db.exec(total_sellers_statement).first()
    total_sellers = total_sellers_row.total_sellers if total_sellers_row else 0

    return {
        "sellers": [
            {
                "seller_id": row.seller_user_id,
                "username": row.username,
                "total_sales": float(row.total_sales),
                "items_sold": row.items_sold,
                "transaction_count": row.transaction_count,
                "average_sale": (
                    float(row.total_sales / row.transaction_count)
                    if row.transaction_count > 0
                    else 0
                ),
            }
            for row in result
        ],
        "total_sellers": total_sellers,
        "total_sales": float(total_sales),
    }


def get_transaction_statistics(
    db: Session,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict:
    """
    Get transaction statistics for a user or the whole system

    Args:
        db: Database session
        user_id: User ID to filter by (if None, all users)
        start_date: Start date for the report
        end_date: End date for the report

    Returns:
        Dictionary with transaction statistics
    """
    # Set default date range to last 30 days if not specified
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Base query conditions
    date_conditions = [
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
    ]

    # Create user filter condition using SQLModel's approach with OR conditions
    if user_id:
        # SQLModel doesn't have direct 'or_' function, so use this approach instead
        user_condition = (Transaction.buyer_user_id == user_id) | (
            Transaction.seller_user_id == user_id
        )

    # Create SQLModel select statement for total transactions
    count_statement = select(
        func.count(Transaction.transaction_id).label("total_transactions")
    )
    # Add date filters
    for condition in date_conditions:
        count_statement = count_statement.where(condition)
    # Add user filter if specified
    if user_id:
        count_statement = count_statement.where(user_condition)

    # Execute the query to get total transactions
    count_result = db.exec(count_statement).first()
    total_transactions = count_result.total_transactions if count_result else 0

    # Create SQLModel select statement for highest transaction
    max_statement = select(
        func.max(Transaction.total_amount).label("highest_transaction")
    )
    # Add date filters
    for condition in date_conditions:
        max_statement = max_statement.where(condition)
    # Add user filter if specified
    if user_id:
        max_statement = max_statement.where(user_condition)

    # Execute the query to get highest transaction
    max_result = db.exec(max_statement).first()
    highest_transaction = (
        max_result.highest_transaction
        if max_result and max_result.highest_transaction
        else 0
    )

    # Create SQLModel select statement for average transaction value
    avg_statement = select(func.avg(Transaction.total_amount).label("avg_transaction"))
    # Add date filters
    for condition in date_conditions:
        avg_statement = avg_statement.where(condition)
    # Add user filter if specified
    if user_id:
        avg_statement = avg_statement.where(user_condition)

    # Execute the query to get average transaction value
    avg_result = db.exec(avg_statement).first()
    avg_transaction = (
        avg_result.avg_transaction if avg_result and avg_result.avg_transaction else 0
    )

    # Get recent transaction count (last 7 days)
    recent_date = end_date - timedelta(days=7)
    recent_statement = select(
        func.count(Transaction.transaction_id).label("recent_count")
    ).where(
        Transaction.transaction_time >= recent_date,
        Transaction.transaction_time <= end_date,
    )
    if user_id:
        recent_statement = recent_statement.where(user_condition)

    # Execute the query to get recent transaction count
    recent_result = db.exec(recent_statement).first()
    recent_transaction_count = recent_result.recent_count if recent_result else 0

    result = {
        "total_transactions": total_transactions,
        "average_transaction_value": float(avg_transaction),
        "highest_transaction": float(highest_transaction),
        "recent_transaction_count": recent_transaction_count,
    }

    # Add user-specific metrics if filtering by user
    if user_id:
        # Create SQLModel select statement for total spent (as buyer)
        spent_statement = select(
            func.sum(Transaction.total_amount).label("total_spent")
        ).where(
            Transaction.buyer_user_id == user_id,
            Transaction.transaction_time >= start_date,
            Transaction.transaction_time <= end_date,
        )

        # Execute the query to get total spent
        spent_result = db.exec(spent_statement).first()
        total_spent = (
            spent_result.total_spent if spent_result and spent_result.total_spent else 0
        )

        # Create SQLModel select statement for total earned (as seller)
        earned_statement = select(
            func.sum(Transaction.total_amount).label("total_earned")
        ).where(
            Transaction.seller_user_id == user_id,
            Transaction.transaction_time >= start_date,
            Transaction.transaction_time <= end_date,
        )

        # Execute the query to get total earned
        earned_result = db.exec(earned_statement).first()
        total_earned = (
            earned_result.total_earned
            if earned_result and earned_result.total_earned
            else 0
        )

        result["total_spent"] = float(total_spent)
        result["total_earned"] = float(total_earned)

    return result


def get_user_sales_summary(
    db: Session,
    user_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict:
    """
    Get summary of a user's sales and purchases

    Args:
        db: Database session
        user_id: User ID to generate report for
        start_date: Start date for the report
        end_date: End date for the report

    Returns:
        Dictionary with user sales summary
    """
    # Set default date range to last 30 days if not specified
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Get user info using SQLModel select
    user_statement = select(User).where(User.user_id == user_id)
    user = db.exec(user_statement).first()
    if not user:
        return None

    # Create SQLModel select statement for user's purchases
    purchases_statement = select(
        func.count(Transaction.transaction_id).label("total_purchases"),
        func.sum(Transaction.total_amount).label("total_spent"),
        func.sum(Transaction.quantity_purchased).label("items_purchased"),
    ).where(
        Transaction.buyer_user_id == user_id,
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
    )

    # Execute the query to get purchase data
    purchases_result = db.exec(purchases_statement).first()

    # Create SQLModel select statement for user's sales
    # Now include the quantity_purchased sum to get total items sold
    sales_statement = select(
        func.count(Transaction.transaction_id).label("total_sales_transactions"),
        func.sum(Transaction.total_amount).label("total_earned"),
        func.sum(Transaction.quantity_purchased).label("items_sold"),
    ).where(
        Transaction.seller_user_id == user_id,
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
    )

    # Execute the query to get sales data
    sales_result = db.exec(sales_statement).first()

    # Calculate values, handling None cases
    total_purchases = (
        purchases_result.total_purchases
        if purchases_result and purchases_result.total_purchases
        else 0
    )
    total_spent = (
        float(purchases_result.total_spent)
        if purchases_result and purchases_result.total_spent
        else 0
    )
    items_purchased = (
        purchases_result.items_purchased
        if purchases_result and purchases_result.items_purchased
        else 0
    )
    
    # Get number of sales transactions
    total_sales_transactions = (
        sales_result.total_sales_transactions 
        if sales_result and sales_result.total_sales_transactions 
        else 0
    )
    
    # Get total items sold (quantity-based)
    total_sales = (
        sales_result.items_sold 
        if sales_result and sales_result.items_sold 
        else 0
    )
    
    total_earned = (
        float(sales_result.total_earned)
        if sales_result and sales_result.total_earned
        else 0
    )

    return {
        "user_id": user_id,
        "username": user.username,
        "total_purchases": total_purchases,
        "total_spent": total_spent,
        "items_purchased": items_purchased,
        "total_sales_transactions": total_sales_transactions,
        "total_sales": total_sales,  # This now represents total quantity sold
        "total_earned": total_earned,
        "net_balance_change": total_earned - total_spent,
    }


def get_user_items_by_status(
    db: Session,
    user_id: int
) -> Dict:
    """
    Get counts of items by status for a specific user
    
    Args:
        db: Database session
        user_id: User ID to count items for
        
    Returns:
        Dictionary with counts of items by status
    """
    # Get user info using SQLModel select
    user_statement = select(User).where(User.user_id == user_id)
    user = db.exec(user_statement).first()
    if not user:
        return None
    
    # Create a query to count items by status for this user
    status_counts = {}
    
    # Get counts for each possible status
    for status in ['for_sale', 'sold', 'removed', 'draft']:
        # Create a query to count items with this status for this user
        statement = select(func.count(Item.item_id)).where(
            Item.seller_user_id == user_id,
            Item.status == status
        )
        
        # Execute the query - result is directly an integer, not a tuple
        result = db.exec(statement).first()
        count = result if result is not None else 0
        
        # Store the count in our dictionary
        status_counts[status] = count
    
    # Return the complete item status count information
    return {
        "for_sale": status_counts.get('for_sale', 0),
        "sold": status_counts.get('sold', 0),
        "removed": status_counts.get('removed', 0),
        "draft": status_counts.get('draft', 0),
        "user_id": user_id,
        "username": user.username
    }


def get_seller_sales_chart_data(
    db: Session,
    user_id: int,
    time_range: Literal["7_days", "30_days", "90_days", "this_year"] = "7_days",
) -> Dict:
    """
    Get sales data formatted specifically for the seller sales performance chart
    
    Args:
        db: Database session
        user_id: User ID to get sales data for (the seller)
        time_range: Time range to get data for (7_days, 30_days, 90_days, this_year)
        
    Returns:
        Dictionary with formatted sales chart data
    """
    # Get user info
    user_statement = select(User).where(User.user_id == user_id)
    user = db.exec(user_statement).first()
    if not user:
        return None
    
    # Calculate date range based on time_range parameter
    end_date = datetime.now()
    
    if time_range == "7_days":
        start_date = end_date - timedelta(days=6)  # Last 7 days including today
        date_format = "%a"  # Day name (e.g., Mon, Tue)
    elif time_range == "30_days":
        start_date = end_date - timedelta(days=29)  # Last 30 days
        date_format = "%d %b"  # Day and month (e.g., 01 Jan)
    elif time_range == "90_days":
        start_date = end_date - timedelta(days=89)  # Last 90 days
        date_format = "%d %b"  # Day and month (e.g., 01 Jan)
    elif time_range == "this_year":
        start_date = datetime(end_date.year, 1, 1)  # Start of current year
        date_format = "%b"  # Month name (e.g., Jan, Feb)
    else:
        # Default to 7 days
        start_date = end_date - timedelta(days=6)
        date_format = "%a"
    
    # Create the query to get daily sales data for the seller
    daily_sales = func.sum(Transaction.total_amount).label("amount")
    
    statement = select(
        func.date_trunc("day", Transaction.transaction_time).label("date"),
        daily_sales
    ).where(
        Transaction.seller_user_id == user_id,
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date
    ).group_by(
        func.date_trunc("day", Transaction.transaction_time)
    ).order_by(
        func.date_trunc("day", Transaction.transaction_time)
    )
    
    # Execute the query
    result = db.exec(statement).all()
    
    # Create a dictionary to map dates to sales amounts
    date_to_sales = {row.date.strftime('%Y-%m-%d'): float(row.amount) if row.amount else 0 for row in result}
    
    # Create a list of all dates in the range
    all_dates = []
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        all_dates.append(date_str)
        current_date += timedelta(days=1)
    
    # Create the data points with proper formatting for the chart
    data_points = []
    sales_values = []
    
    for date_str in all_dates:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        formatted_date = date_obj.strftime(date_format)
        amount = date_to_sales.get(date_str, 0)
        sales_values.append(amount)
        
        data_points.append({
            "date": formatted_date,
            "amount": amount
        })
    
    # Calculate summary statistics
    total_sales = sum(sales_values)
    average_daily_sales = total_sales / len(all_dates) if all_dates else 0
    highest_daily_sales = max(sales_values) if sales_values else 0
    
    return {
        "data": data_points,
        "total_sales": total_sales,
        "average_daily_sales": average_daily_sales,
        "highest_daily_sales": highest_daily_sales,
        "time_range": time_range,
        "user_id": user_id,
        "username": user.username
    }
