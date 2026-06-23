from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from database import execute_query
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin_user
)

# ============ PYDANTIC SCHEMAS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    category: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    category: Optional[str] = None

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]

# ============ FASTAPI APP ============

app = FastAPI(
    title="E-Commerce API",
    description="Cloud-Native E-Commerce with Python 3.14 + psycopg v3",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#
# Security
security = HTTPBearer()

# ============ ROOT ============

@app.get("/")
def root():
    return {
        "message": "Welcome to E-Commerce API",
        "docs": "/docs",
        "version": "1.0.0",
        "endpoints": [
            "/auth/register",
            "/auth/login",
            "/products",
            "/orders",
            "/admin/orders"
        ]
    }

@app.get("/test-db")
def test_db():
    """Test database connection"""
    try:
        result = execute_query("SELECT NOW() as current_time", fetch_one=True)
        return {
            "status": "connected",
            "postgres_time": result['current_time']
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

# ============ AUTH ENDPOINTS ============

@app.post("/auth/register")
def register_user(user_data: UserCreate):
    """Register a new user"""
    
    # Check if user exists
    existing = execute_query(
        "SELECT id FROM users WHERE email = %s",
        (user_data.email,),
        fetch_one=True
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Insert user
    execute_query(
        """
        INSERT INTO users (email, password_hash, role, created_at)
        VALUES (%s, %s, 'customer', %s)
        """,
        (user_data.email, hashed_password, datetime.utcnow())
    )
    
    # Get the created user
    new_user = execute_query(
        "SELECT id, email, role, created_at FROM users WHERE email = %s",
        (user_data.email,),
        fetch_one=True
    )
    
    return {
        "message": "User registered successfully",
        "user": new_user
    }

@app.post("/auth/login")
def login_user(user_data: UserLogin):
    """Login and get JWT token"""
    
    # Find user
    user = execute_query(
        "SELECT id, email, password_hash, role FROM users WHERE email = %s",
        (user_data.email,),
        fetch_one=True
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user['id']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user['id'],
        "email": user['email'],
        "role": user['role']
    }

# ============ PRODUCT ENDPOINTS ============

@app.get("/products")
def get_products(category: Optional[str] = None, skip: int = 0, limit: int = 100):
    """Get all products with optional category filter"""
    
    query = "SELECT * FROM products"
    params = []
    
    if category:
        query += " WHERE category = %s"
        params.append(category)
    
    query += " ORDER BY id LIMIT %s OFFSET %s"
    params.extend([limit, skip])
    
    products = execute_query(query, tuple(params), fetch_all=True)
    return products or []

@app.get("/products/{product_id}")
def get_product(product_id: int):
    """Get a single product by ID"""
    
    product = execute_query(
        "SELECT * FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product

@app.post("/products")
def create_product(
    product_data: ProductCreate,
    current_user = Depends(get_current_admin_user)
):
    """Create a new product (Admin only)"""
    
    # Insert product
    execute_query(
        """
        INSERT INTO products (name, description, price, stock_quantity, category, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            product_data.name,
            product_data.description,
            product_data.price,
            product_data.stock_quantity,
            product_data.category,
            datetime.utcnow()
        )
    )
    
    # Get the created product
    new_product = execute_query(
        "SELECT * FROM products WHERE name = %s ORDER BY id DESC LIMIT 1",
        (product_data.name,),
        fetch_one=True
    )
    
    return {
        "message": "Product created successfully",
        "product": new_product
    }

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user = Depends(get_current_admin_user)
):
    """Update a product (Admin only)"""
    
    # Check if product exists
    existing = execute_query(
        "SELECT id FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Build dynamic UPDATE query
    update_fields = []
    params = []
    
    if product_data.name is not None:
        update_fields.append("name = %s")
        params.append(product_data.name)
    
    if product_data.description is not None:
        update_fields.append("description = %s")
        params.append(product_data.description)
    
    if product_data.price is not None:
        update_fields.append("price = %s")
        params.append(product_data.price)
    
    if product_data.stock_quantity is not None:
        update_fields.append("stock_quantity = %s")
        params.append(product_data.stock_quantity)
    
    if product_data.category is not None:
        update_fields.append("category = %s")
        params.append(product_data.category)
    
    if not update_fields:
        product = execute_query(
            "SELECT * FROM products WHERE id = %s",
            (product_id,),
            fetch_one=True
        )
        return {
            "message": "No changes made",
            "product": product
        }
    
    params.append(product_id)
    query = f"""
        UPDATE products 
        SET {', '.join(update_fields)}
        WHERE id = %s
    """
    
    execute_query(query, tuple(params))
    
    updated = execute_query(
        "SELECT * FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    return {
        "message": "Product updated successfully",
        "product": updated
    }

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_user = Depends(get_current_admin_user)
):
    """Delete a product (Admin only)"""
    
    # Check if product exists
    existing = execute_query(
        "SELECT id FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Try to delete (will fail if referenced by order_items due to RESTRICT)
    try:
        execute_query("DELETE FROM products WHERE id = %s", (product_id,))
    except Exception as e:
        if "violates foreign key" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete product: it has existing orders"
            )
        raise
    
    return {"message": f"Product {product_id} deleted successfully"}

# ============ ORDER ENDPOINTS ============

@app.post("/orders")
def create_order(
    order_data: OrderCreate,
    current_user = Depends(get_current_user)
):
    user_id = current_user['id']
    
    """Create a new order with stock validation"""
    
    total_amount = 0
    order_items_data = []
    
    # Process each item
    for item in order_data.items:
        # Get product with lock (FOR UPDATE prevents race conditions)
        product = execute_query(
            "SELECT id, name, price, stock_quantity FROM products WHERE id = %s FOR UPDATE",
            (item.product_id,),
            fetch_one=True
        )
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found"
            )
        
        if product['stock_quantity'] < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product['name']}. Available: {product['stock_quantity']}"
            )
        
        subtotal = product['price'] * item.quantity
        total_amount += subtotal
        
        order_items_data.append({
            "product_id": product['id'],
            "product_name": product['name'],
            "quantity": item.quantity,
            "price_at_purchase": product['price'],
            "subtotal": subtotal
        })
        
        # Update stock
        execute_query(
            "UPDATE products SET stock_quantity = stock_quantity - %s WHERE id = %s",
            (item.quantity, item.product_id)
        )
    
    # Create order
    order_result = execute_query(
        """
        INSERT INTO orders (user_id, total_amount, status, created_at)
        VALUES (%s, %s, 'pending', %s)
        RETURNING id
        """,
        (current_user['id'], total_amount, datetime.utcnow()),
        fetch_one=True
    )
    
    order_id = order_result['id']
    
    # Insert order items
    for item in order_items_data:
        execute_query(
            """
            INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES (%s, %s, %s, %s)
            """,
            (order_id, item['product_id'], item['quantity'], item['price_at_purchase'])
        )
    
    return {
        "message": "Order created successfully",
        "order_id": order_id,
        "total_amount": total_amount,
        "items": order_items_data,
        "status": "pending"
    }

@app.get("/orders")
def get_user_orders(current_user = Depends(get_current_user)):
    """Get all orders for the current user"""
    
    orders = execute_query(
        """
        SELECT id, user_id, total_amount, status, created_at
        FROM orders
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (current_user['id'],),
        fetch_all=True
    )
    
    if not orders:
        return {"message": "No orders found", "orders": []}
    
    result = []
    for order in orders:
        # Get order items
        items = execute_query(
            """
            SELECT 
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase,
                p.name as product_name,
                (oi.quantity * oi.price_at_purchase) as subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
            """,
            (order['id'],),
            fetch_all=True
        )
        
        result.append({
            "order": order,
            "items": items or []
        })
    
    return result

@app.get("/orders/{order_id}")
def get_order(order_id: int, current_user = Depends(get_current_user)):
    """Get a specific order by ID"""
    
    order = execute_query(
        "SELECT * FROM orders WHERE id = %s",
        (order_id,),
        fetch_one=True
    )
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user owns this order OR is admin
    if order['user_id'] != current_user['id'] and current_user['role'] != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own orders"
        )
    
    items = execute_query(
        """
        SELECT 
            oi.product_id,
            oi.quantity,
            oi.price_at_purchase,
            p.name as product_name,
            (oi.quantity * oi.price_at_purchase) as subtotal
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = %s
        """,
        (order_id,),
        fetch_all=True
    )
    
    return {
        "order": order,
        "items": items or []
    }

# ============ ADMIN ENDPOINTS ============

@app.get("/admin/orders")
def get_all_orders(current_user = Depends(get_current_admin_user)):
    """Get all orders (Admin only)"""
    
    orders = execute_query(
        """
        SELECT id, user_id, total_amount, status, created_at
        FROM orders
        ORDER BY created_at DESC
        """,
        fetch_all=True
    )
    
    if not orders:
        return {"message": "No orders found", "orders": []}
    
    result = []
    for order in orders:
        items = execute_query(
            """
            SELECT 
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase,
                p.name as product_name,
                (oi.quantity * oi.price_at_purchase) as subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
            """,
            (order['id'],),
            fetch_all=True
        )
        
        result.append({
            "order": order,
            "items": items or []
        })
    
    return result

@app.put("/admin/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    current_user = Depends(get_current_admin_user)
):
    """Update order status (Admin only)"""
    
    allowed_statuses = ["pending", "shipped", "delivered", "cancelled"]
    if status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {allowed_statuses}"
        )
    
    # Check if order exists
    order = execute_query(
        "SELECT id FROM orders WHERE id = %s",
        (order_id,),
        fetch_one=True
    )
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update status
    execute_query(
        "UPDATE orders SET status = %s WHERE id = %s",
        (status, order_id)
    )
    
    return {"message": f"Order {order_id} status updated to {status}"}
