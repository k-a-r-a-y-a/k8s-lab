// ============ App State ============
const state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
    currentPage: 'store'
};

// ============ DOM Helpers ============
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createElement(tag, className = '', innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
}

// ============ Navigation ============
function showPage(page) {
    state.currentPage = page;
    renderPage(page);
    updateNav();
}

function updateNav() {
    // Update active nav links
    $$('.nav-links a').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('onclick');
        if (href && href.includes(page)) {
            link.classList.add('active');
        }
    });
    
    // Update auth/user display
    if (state.token && state.user) {
        $('#navAuth').style.display = 'none';
        $('#navUser').style.display = 'flex';
        $('#userEmail').innerHTML = `<i class="fas fa-user"></i> ${state.user.email}`;
    } else {
        $('#navAuth').style.display = 'flex';
        $('#navUser').style.display = 'none';
    }
    
    // Update cart badge
    const badge = $('#cartBadge');
    if (badge) {
        badge.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

// ============ Page Renderer ============
function renderPage(page) {
    const container = $('#mainContent');
    
    switch(page) {
        case 'login':
            renderLogin(container);
            break;
        case 'register':
            renderRegister(container);
            break;
        case 'store':
            renderStore(container);
            break;
        case 'cart':
            renderCart(container);
            break;
        case 'orders':
            renderOrders(container);
            break;
        case 'add-product':
            renderAddProduct(container);
            break;
        case 'admin-orders':
            renderAdminOrders(container);
            break;
        default:
            renderStore(container);
    }
}

// ============ Login Page ============
function renderLogin(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 400px; margin: 0 auto;">
            <h2><i class="fas fa-sign-in-alt"></i> Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </form>
            <div id="loginMessage" class="alert" style="display: none;"></div>
            <p style="margin-top: 1rem; text-align: center;">
                Don't have an account? <a href="#" onclick="showPage('register')">Register</a>
            </p>
        </div>
    `;
    
    $('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#loginEmail').value;
        const password = $('#loginPassword').value;
        const message = $('#loginMessage');
        
        try {
            const result = await api.login(email, password);
            state.token = result.access_token;
            state.user = {
                id: result.user_id,
                email: result.email,
                role: result.role
            };
            
            localStorage.setItem('token', state.token);
            localStorage.setItem('user', JSON.stringify(state.user));
            
            message.className = 'alert alert-success';
            message.textContent = '✅ Login successful!';
            message.style.display = 'block';
            
            setTimeout(() => {
                showPage('store');
            }, 1000);
        } catch (error) {
            message.className = 'alert alert-error';
            message.textContent = `❌ ${error.message}`;
            message.style.display = 'block';
        }
    });
}

// ============ Register Page ============
function renderRegister(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 400px; margin: 0 auto;">
            <h2><i class="fas fa-user-plus"></i> Register</h2>
            <form id="registerForm">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="registerEmail" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="registerPassword" required>
                </div>
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" id="registerConfirm" required>
                </div>
                <button type="submit" class="btn btn-success" style="width: 100%;">
                    <i class="fas fa-user-plus"></i> Register
                </button>
            </form>
            <div id="registerMessage" class="alert" style="display: none;"></div>
            <p style="margin-top: 1rem; text-align: center;">
                Already have an account? <a href="#" onclick="showPage('login')">Login</a>
            </p>
        </div>
    `;
    
    $('#registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#registerEmail').value;
        const password = $('#registerPassword').value;
        const confirm = $('#registerConfirm').value;
        const message = $('#registerMessage');
        
        if (password !== confirm) {
            message.className = 'alert alert-error';
            message.textContent = '❌ Passwords do not match';
            message.style.display = 'block';
            return;
        }
        
        try {
            await api.register(email, password);
            message.className = 'alert alert-success';
            message.textContent = '✅ Registration successful! Please login.';
            message.style.display = 'block';
            
            setTimeout(() => {
                showPage('login');
            }, 1500);
        } catch (error) {
            message.className = 'alert alert-error';
            message.textContent = `❌ ${error.message}`;
            message.style.display = 'block';
        }
    });
}

// ============ Store Page ============
async function renderStore(container) {
    container.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2><i class="fas fa-store"></i> Products</h2>
                ${state.user && state.user.role === 'admin' ? `
                    <button class="btn btn-primary" onclick="showPage('add-product')">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                ` : ''}
            </div>
            <div id="productList">
                <div class="loading"><i class="fas fa-spinner"></i> Loading products...</div>
            </div>
        </div>
    `;
    
    try {
        const products = await api.getProducts();
        const productList = $('#productList');
        
        if (!products || products.length === 0) {
            productList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No products available yet.
                </div>
            `;
            return;
        }
        
        productList.innerHTML = `
            <div class="products-grid">
                ${products.map(product => `
                    <div class="product-card">
                        <div class="category">${product.category || 'General'}</div>
                        <h3>${product.name}</h3>
                        <p class="description">${product.description || ''}</p>
                        <div class="price">$${product.price.toFixed(2)}</div>
                        <div class="stock">📦 Stock: ${product.stock_quantity}</div>
                        <button class="btn btn-success" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, ${product.stock_quantity})" 
                                ${product.stock_quantity === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> 
                            ${product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        $('#productList').innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i> Failed to load products: ${error.message}
            </div>
        `;
    }
}

// ============ Cart Functions ============
function addToCart(id, name, price, maxStock) {
    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        if (existing.quantity < maxStock) {
            existing.quantity++;
        } else {
            alert('Not enough stock!');
            return;
        }
    } else {
        state.cart.push({ id, name, price, quantity: 1, maxStock });
    }
    
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateNav();
    showNotification(`${name} added to cart!`, 'success');
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateNav();
    renderPage('cart');
}

function updateCartQuantity(index, quantity) {
    const item = state.cart[index];
    if (quantity > item.maxStock) {
        alert('Not enough stock!');
        return;
    }
    if (quantity < 1) {
        removeFromCart(index);
        return;
    }
    item.quantity = quantity;
    localStorage.setItem('cart', JSON.stringify(state.cart));
    renderPage('cart');
}

// ============ Cart Page ============
function renderCart(container) {
    if (!state.cart || state.cart.length === 0) {
        container.innerHTML = `
            <div class="card">
                <h2><i class="fas fa-shopping-cart"></i> Your Cart</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> Your cart is empty.
                    <br><br>
                    <a href="#" onclick="showPage('store')" class="btn btn-primary">
                        <i class="fas fa-store"></i> Continue Shopping
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    let total = 0;
    let itemsHTML = state.cart.map((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div>$${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <input type="number" value="${item.quantity}" min="1" max="${item.maxStock}" 
                           onchange="updateCartQuantity(${index}, parseInt(this.value))">
                    <span>$${subtotal.toFixed(2)}</span>
                    <button class="btn btn-danger" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-shopping-cart"></i> Your Cart</h2>
            ${itemsHTML}
            <div class="cart-total">
                <strong>Total: $${total.toFixed(2)}</strong>
                <br><br>
                <button class="btn btn-success" onclick="checkout()">
                    <i class="fas fa-check"></i> Place Order
                </button>
                <button class="btn btn-secondary" onclick="showPage('store')">
                    <i class="fas fa-store"></i> Continue Shopping
                </button>
            </div>
            <div id="checkoutMessage" class="alert" style="display: none;"></div>
        </div>
    `;
}

// ============ Checkout ============
async function checkout() {
    if (!state.token) {
        alert('Please login first!');
        showPage('login');
        return;
    }
    
    const message = $('#checkoutMessage');
    if (!message) return;
    
    try {
        const items = state.cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));
        
        const result = await api.createOrder(items, state.token);
        
        message.className = 'alert alert-success';
        message.textContent = `✅ Order placed successfully! Order #${result.order_id}`;
        message.style.display = 'block';
        
        state.cart = [];
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateNav();
        
        setTimeout(() => {
            showPage('orders');
        }, 2000);
    } catch (error) {
        message.className = 'alert alert-error';
        message.textContent = `❌ Failed to place order: ${error.message}`;
        message.style.display = 'block';
    }
}

// ============ Orders Page ============
async function renderOrders(container) {
    if (!state.token) {
        showPage('login');
        return;
    }
    
    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-box"></i> My Orders</h2>
            <div id="orderList">
                <div class="loading"><i class="fas fa-spinner"></i> Loading orders...</div>
            </div>
        </div>
    `;
    
    try {
        const data = await api.getMyOrders(state.token);
        const orderList = $('#orderList');
        
        if (!data || (Array.isArray(data) && data.length === 0) || 
            (data.orders && data.orders.length === 0)) {
            orderList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No orders yet.
                    <br><br>
                    <a href="#" onclick="showPage('store')" class="btn btn-primary">
                        <i class="fas fa-store"></i> Start Shopping
                    </a>
                </div>
            `;
            return;
        }
        
        const orders = Array.isArray(data) ? data : data.orders || [];
        
        orderList.innerHTML = orders.map(order => {
            const orderData = order.order || order;
            const items = order.items || [];
            const statusClass = `status-${orderData.status}`;
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <strong>Order #${orderData.id}</strong>
                            <br>
                            <small>${new Date(orderData.created_at).toLocaleString()}</small>
                        </div>
                        <div>
                            <span class="order-status ${statusClass}">${orderData.status}</span>
                            <span style="margin-left: 1rem; font-weight: bold;">
                                $${orderData.total_amount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div class="order-items">
                        ${items.map(item => `
                            <div class="order-item">
                                <span>${item.product_name}</span>
                                <span>${item.quantity} × $${item.price_at_purchase.toFixed(2)} = $${item.subtotal.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        $('#orderList').innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i> Failed to load orders: ${error.message}
            </div>
        `;
    }
}

// ============ Admin: Add Product ============
function renderAddProduct(container) {
    if (!state.token || state.user.role !== 'admin') {
        showPage('store');
        return;
    }
    
    container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <h2><i class="fas fa-plus"></i> Add New Product</h2>
            <form id="addProductForm">
                <div class="form-group">
                    <label>Product Name *</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="productDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Price *</label>
                    <input type="number" id="productPrice" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Stock Quantity *</label>
                    <input type="number" id="productStock" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="productCategory">
                </div>
                <button type="submit" class="btn btn-success" style="width: 100%;">
                    <i class="fas fa-plus"></i> Add Product
                </button>
            </form>
            <div id="productMessage" class="alert" style="display: none;"></div>
        </div>
    `;
    
    $('#addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = $('#productMessage');
        
        try {
            const data = {
                name: $('#productName').value,
                description: $('#productDescription').value,
                price: parseFloat($('#productPrice').value),
                stock_quantity: parseInt($('#productStock').value),
                category: $('#productCategory').value || null
            };
            
            await api.createProduct(data, state.token);
            
            message.className = 'alert alert-success';
            message.textContent = '✅ Product added successfully!';
            message.style.display = 'block';
            
            setTimeout(() => {
                showPage('store');
            }, 1500);
        } catch (error) {
            message.className = 'alert alert-error';
            message.textContent = `❌ ${error.message}`;
            message.style.display = 'block';
        }
    });
}

// ============ Admin: All Orders ============
async function renderAdminOrders(container) {
    if (!state.token || state.user.role !== 'admin') {
        showPage('store');
        return;
    }
    
    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-list"></i> All Orders</h2>
            <div id="adminOrderList">
                <div class="loading"><i class="fas fa-spinner"></i> Loading orders...</div>
            </div>
        </div>
    `;
    
    try {
        const data = await api.getAllOrders(state.token);
        const orderList = $('#adminOrderList');
        
        if (!data || (Array.isArray(data) && data.length === 0) || 
            (data.orders && data.orders.length === 0)) {
            orderList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No orders found.
                </div>
            `;
            return;
        }
        
        const orders = Array.isArray(data) ? data : data.orders || [];
        
        orderList.innerHTML = orders.map(order => {
            const orderData = order.order || order;
            const items = order.items || [];
            const statusClass = `status-${orderData.status}`;
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <strong>Order #${orderData.id}</strong>
                            <br>
                            <small>User ID: ${orderData.user_id}</small>
                            <br>
                            <small>${new Date(orderData.created_at).toLocaleString()}</small>
                        </div>
                        <div>
                            <span class="order-status ${statusClass}">${orderData.status}</span>
                            <span style="margin-left: 1rem; font-weight: bold;">
                                $${orderData.total_amount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div class="order-items">
                        ${items.map(item => `
                            <div class="order-item">
                                <span>${item.product_name}</span>
                                <span>${item.quantity} × $${item.price_at_purchase.toFixed(2)} = $${item.subtotal.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                        <label>Update Status:</label>
                        <select id="status_${orderData.id}" class="form-group" style="width: auto; display: inline-block; margin: 0 1rem;">
                            <option value="pending" ${orderData.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="shipped" ${orderData.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${orderData.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${orderData.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button class="btn btn-primary" onclick="updateOrderStatus(${orderData.id})">
                            <i class="fas fa-sync"></i> Update
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        $('#adminOrderList').innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i> Failed to load orders: ${error.message}
            </div>
        `;
    }
}

// ============ Admin: Update Order Status ============
async function updateOrderStatus(orderId) {
    const select = $(`#status_${orderId}`);
    if (!select) return;
    
    const status = select.value;
    
    try {
        await api.updateOrderStatus(orderId, status, state.token);
        showNotification(`Order #${orderId} status updated to ${status}`, 'success');
        renderPage('admin-orders');
    } catch (error) {
        showNotification(`Failed to update status: ${error.message}`, 'error');
    }
}

// ============ Utility Functions ============
function showNotification(message, type = 'info') {
    const container = $('#mainContent');
    const notification = createElement('div', `alert alert-${type}`, message);
    notification.style.position = 'fixed';
    notification.style.top = '80px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '400px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    container.parentNode.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function logout() {
    state.token = null;
    state.user = null;
    state.cart = [];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    updateNav();
    showPage('store');
}

// ============ Initialize App ============
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    showPage('store');
});