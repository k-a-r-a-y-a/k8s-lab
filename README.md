## ecommerce-platform structure

![Lab Structure](screenshots/lab-structure.png)


## app-structure 
```
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
```

This project demonstrates a complete deployment of an E-Commerce platform with:

- **Frontend**: Static HTML/CSS/JS served by Nginx

![frontend](screenshots/frontend.png)


- **Backend**: FastAPI REST API with JWT authentication

![backend](screenshots/backend.png)

- **Database**: PostgreSQL with persistent storage

![database](screenshots/ecommerce-db.png)

## Services Deployed

| Service | Type | Port |
|---------|------|------|
| Frontend | ClusterIP | 80 |
| Backend | ClusterIP | 8000 |
| PostgreSQL | ClusterIP | 5432 |
| Grafana | ClusterIP | 3000 |

## Kubernetes Resources
- Deployments (frontend, backend, postgres, grafana)
- Services (ClusterIP)
- PersistentVolumeClaim (postgres)
- ConfigMap & Secrets
- HorizontalPodAutoscaler (HPA)
- Ingress (ecommerce.local)
- ResourceQuota

installed minikube and started it,,,

![minikube](screenshots/minikube2.png)

loaded my docker images into minikube

![minikube-images](screenshots/minikube-image.png)

applied my k8s manifests into my namespace (ecommerce-prod)

![deployments](screenshots/deployments.png)

perfomed a rollout on the backend image with kubernetes-backend:v2

![rollouts](screenshots/rollout.png)

used grafana and prometheus for monitoring the cluster

![grafana](screenshots/grafana.png)

![prometheus](screenshots/prometheus.png)

![prometheus-metrics](screenshots/prometheus\metrics.png)
