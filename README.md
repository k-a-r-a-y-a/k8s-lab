## ecommerce-platform structure

![Lab Structure](screenshots/lab-structure.png)


## app-structure 

┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                         │
│                   http://localhost                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (Nginx)                           │
│              Port 80 → Static Files                     │
│              /api/* → Proxy to Backend                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI)                          │
│              Port 8000                                  │
│              JWT Authentication                         │
│              CRUD Operations                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                      │
│              Port 5432                                  │
│              Tables: users, products, orders,           │
│              order_items                                │
└─────────────────────────────────────────────────────────┘

This project demonstrates a complete deployment of an E-Commerce platform with:

- **Frontend**: Static HTML/CSS/JS served by Nginx

![frontend](screenshots/frontend.png)


- **Backend**: FastAPI REST API with JWT authentication

![backend](screenshots/backend.png)

- **Database**: PostgreSQL with persistent storage

![database](screenshots/ecommerce-db.png)



