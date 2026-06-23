// API Configuration
const API_URL = 'http://localhost:8000';

// API Client
const api = {
    // Helper for API calls
    async request(endpoint, method = 'GET', data = null, token = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const options = {
            method,
            headers,
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || 'Request failed');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Auth endpoints
    register(email, password) {
        return this.request('/auth/register', 'POST', { email, password });
    },
    
    login(email, password) {
        return this.request('/auth/login', 'POST', { email, password });
    },
    
    // Product endpoints
    getProducts(category = null) {
        const url = category ? `/products?category=${category}` : '/products';
        return this.request(url);
    },
    
    getProduct(id) {
        return this.request(`/products/${id}`);
    },
    
    createProduct(data, token) {
        return this.request('/products', 'POST', data, token);
    },
    
    updateProduct(id, data, token) {
        return this.request(`/products/${id}`, 'PUT', data, token);
    },
    
    deleteProduct(id, token) {
        return this.request(`/products/${id}`, 'DELETE', null, token);
    },
    
    // Order endpoints
    createOrder(items, token) {
        return this.request('/orders', 'POST', { items }, token);
    },
    
    getMyOrders(token) {
        return this.request('/orders', 'GET', null, token);
    },
    
    getOrder(id, token) {
        return this.request(`/orders/${id}`, 'GET', null, token);
    },
    
    // Admin endpoints
    getAllOrders(token) {
        return this.request('/admin/orders', 'GET', null, token);
    },
    
    updateOrderStatus(id, status, token) {
        return this.request(`/admin/orders/${id}/status?status=${status}`, 'PUT', null, token);
    }
};