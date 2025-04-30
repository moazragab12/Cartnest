from sqlalchemy.orm import Session
from api.models.user.model import User, UserRole
from api.dependencies import get_password_hash

def seed_users(db: Session):
    """Seed the database with initial users"""
    # Check if users already exist
    if db.query(User).first():
        print("Users already exist, skipping user seeding")
        return

    # Create admin user
    admin = User(
        username="admin",
        email="admin@example.com",
        password_hash=get_password_hash("admin123"),
        role=UserRole.admin,
        cash_balance=1000.00
    )
    db.add(admin)

    # Create test user
    test_user = User(
        username="testuser",
        email="test@example.com",
        password_hash=get_password_hash("test123"),
        role=UserRole.user,
        cash_balance=500.00
    )
    db.add(test_user)

    # Commit the changes
    db.commit()
    print("Successfully seeded users") 