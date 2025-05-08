from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
from api.models.user.model import User
from api.models.item.model import Item, item_status
from api.models.transaction.model import Transaction
from api.models.deposit.model import Deposit


def search_items(
    db: Session,
    name: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status: Optional[item_status] = None,
    seller_id: Optional[int] = None,
) -> List[Item]:
    """Search for items based on various criteria"""
    query = db.query(Item)
    
    if status:
        query = query.filter(Item.status == status)
    if name:
        query = query.filter(Item.name.ilike(f"%{name.lower()}%"))
    if category:
        query = query.filter(Item.category.ilike(f"%{category.lower()}%"))
    if min_price is not None:
        query = query.filter(Item.price >= min_price)
    if max_price is not None:
        query = query.filter(Item.price <= max_price)
    if seller_id:
        query = query.filter(Item.seller_user_id == seller_id)
    
    return query.all()


def enhanced_search_items(
    db: Session,
    name: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status: Optional[item_status] = None,
    seller_id: Optional[int] = None,
    min_quantity: Optional[int] = None,
) -> List[Tuple[Item, User]]:
    """Enhanced search for items with seller information"""
    query = db.query(Item, User).join(User, Item.seller_user_id == User.user_id)
    
    if status:
        query = query.filter(Item.status == status)
    if name:
        query = query.filter(Item.name.ilike(f"%{name.lower()}%"))
    if category:
        query = query.filter(Item.category.ilike(f"%{category.lower()}%"))
    if min_price is not None:
        query = query.filter(Item.price >= min_price)
    if max_price is not None:
        query = query.filter(Item.price <= max_price)
    if seller_id:
        query = query.filter(Item.seller_user_id == seller_id)
    if min_quantity is not None:
        query = query.filter(Item.quantity >= min_quantity)
    
    return query.all()


def get_item_by_id(db: Session, item_id: int) -> Optional[Item]:
    """Get a single item by ID"""
    return db.query(Item).filter(Item.item_id == item_id).first()


def enhanced_search_item_by_id(db: Session, item_id: int) -> Optional[Tuple[Item, User]]:
    """Get enhanced item info (with seller) by ID"""
    result = db.query(Item, User)\
              .join(User, Item.seller_user_id == User.user_id)\
              .filter(Item.item_id == item_id)\
              .first()
    return result


def search_users(
    db: Session,
    username: Optional[str] = None,
    email: Optional[str] = None,
    min_cash_balance: Optional[float] = None,
    max_cash_balance: Optional[float] = None,
) -> List[User]:
    """Search for users based on various criteria"""
    query = db.query(User)

    if username:
        query = query.filter(User.username.ilike(f"%{username.lower()}%"))
    if email:
        query = query.filter(User.email.ilike(f"%{email.lower()}%"))
    if min_cash_balance is not None:
        query = query.filter(User.cash_balance >= min_cash_balance)
    if max_cash_balance is not None:
        query = query.filter(User.cash_balance <= max_cash_balance)

    return query.all()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get a single user by ID"""
    return db.query(User).filter(User.user_id == user_id).first()


def search_deposits(
    db: Session,
    user_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
) -> List[Deposit]:
    """Search for deposits based on various criteria"""
    query = db.query(Deposit)

    if user_id:
        query = query.filter(Deposit.user_id == user_id)
    if min_amount is not None:
        query = query.filter(Deposit.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Deposit.amount <= max_amount)

    return query.all()


def enhanced_search_deposits(
    db: Session,
    user_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
) -> List[Tuple[Deposit, User]]:
    """Search for deposits with full user details"""
    query = db.query(Deposit, User).join(User, Deposit.user_id == User.user_id)

    if user_id:
        query = query.filter(Deposit.user_id == user_id)
    if min_amount is not None:
        query = query.filter(Deposit.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Deposit.amount <= max_amount)

    return query.all()


def get_deposit_by_id(db: Session, deposit_id: int) -> Optional[Deposit]:
    """Get a single deposit by ID"""
    return db.query(Deposit).filter(Deposit.deposit_id == deposit_id).first()


def enhanced_get_deposit_by_id(db: Session, deposit_id: int) -> Optional[Tuple[Deposit, User]]:
    """Get a single deposit with user details by ID"""
    result = db.query(Deposit, User)\
              .join(User, Deposit.user_id == User.user_id)\
              .filter(Deposit.deposit_id == deposit_id)\
              .first()
    return result


def search_transactions(
    db: Session,
    item_id: Optional[int] = None,
    buyer_user_id: Optional[int] = None,
    seller_user_id: Optional[int] = None,
    min_quantity: Optional[int] = None,
    max_quantity: Optional[int] = None,
    min_total_amount: Optional[float] = None,
    max_total_amount: Optional[float] = None,
) -> List[Transaction]:
    """Search for transactions based on various criteria"""
    query = db.query(Transaction)

    if item_id:
        query = query.filter(Transaction.item_id == item_id)
    if buyer_user_id:
        query = query.filter(Transaction.buyer_user_id == buyer_user_id)
    if seller_user_id:
        query = query.filter(Transaction.seller_user_id == seller_user_id)
    if min_quantity is not None:
        query = query.filter(Transaction.quantity_purchased >= min_quantity)
    if max_quantity is not None:
        query = query.filter(Transaction.quantity_purchased <= max_quantity)
    if min_total_amount is not None:
        query = query.filter(Transaction.total_amount >= min_total_amount)
    if max_total_amount is not None:
        query = query.filter(Transaction.total_amount <= max_total_amount)

    return query.all()


def enhanced_search_transactions(
    db: Session,
    item_id: Optional[int] = None,
    buyer_user_id: Optional[int] = None,
    seller_user_id: Optional[int] = None,
    min_quantity: Optional[int] = None,
    max_quantity: Optional[int] = None,
    min_total_amount: Optional[float] = None,
    max_total_amount: Optional[float] = None,
) -> List[Tuple[Transaction, User, User, Optional[Item]]]:
    """Search for transactions with full user and item details"""
    # Using aliased joins to get both seller and buyer information
    from sqlalchemy.orm import aliased
    
    SellerUser = aliased(User)
    BuyerUser = aliased(User)
    
    query = db.query(Transaction, SellerUser, BuyerUser, Item)\
              .join(SellerUser, Transaction.seller_user_id == SellerUser.user_id)\
              .join(BuyerUser, Transaction.buyer_user_id == BuyerUser.user_id)\
              .outerjoin(Item, Transaction.item_id == Item.item_id)

    if item_id:
        query = query.filter(Transaction.item_id == item_id)
    if buyer_user_id:
        query = query.filter(Transaction.buyer_user_id == buyer_user_id)
    if seller_user_id:
        query = query.filter(Transaction.seller_user_id == seller_user_id)
    if min_quantity is not None:
        query = query.filter(Transaction.quantity_purchased >= min_quantity)
    if max_quantity is not None:
        query = query.filter(Transaction.quantity_purchased <= max_quantity)
    if min_total_amount is not None:
        query = query.filter(Transaction.total_amount >= min_total_amount)
    if max_total_amount is not None:
        query = query.filter(Transaction.total_amount <= max_total_amount)

    return query.all()


def get_transaction_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
    """Get a single transaction by ID"""
    return db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()


def enhanced_get_transaction_by_id(db: Session, transaction_id: int) -> Optional[Tuple[Transaction, User, User, Optional[Item]]]:
    """Get a single transaction with full user and item details by ID"""
    from sqlalchemy.orm import aliased
    
    SellerUser = aliased(User)
    BuyerUser = aliased(User)
    
    result = db.query(Transaction, SellerUser, BuyerUser, Item)\
              .join(SellerUser, Transaction.seller_user_id == SellerUser.user_id)\
              .join(BuyerUser, Transaction.buyer_user_id == BuyerUser.user_id)\
              .outerjoin(Item, Transaction.item_id == Item.item_id)\
              .filter(Transaction.transaction_id == transaction_id)\
              .first()
              
    return result