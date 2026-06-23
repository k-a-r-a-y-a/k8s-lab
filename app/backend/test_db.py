# test_db.py
from database import SessionLocal, User, Product, create_tables

def test_connection():
    # Create tables first
    create_tables()
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Try to add a test user
        test_user = User(
            email="test@example.com",
            password_hash="hashed_password_here",
            role="customer"
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Created user with ID: {test_user.id}")
        
        # Query the user back
        user = db.query(User).filter(User.email == "test@example.com").first()
        print(f"✅ Found user: {user.email} (ID: {user.id})")
        
        # Add a test product
        test_product = Product(
            name="Test Product",
            description="This is a test product",
            price=19.99,
            stock_quantity=100,
            category="Electronics"
        )
        
        db.add(test_product)
        db.commit()
        db.refresh(test_product)
        
        print(f"✅ Created product with ID: {test_product.id}")
        print(f"✅ Product name: {test_product.name}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()
