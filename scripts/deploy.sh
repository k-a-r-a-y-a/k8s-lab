#!/bin/bash
set -e

echo "🚀 Deploying E-Commerce Platform to Kubernetes..."

# Apply namespace
kubectl apply -f kubernetes/namespace.yaml

# Apply secrets and configmaps
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/configmap.yaml

# Deploy PostgreSQL
kubectl apply -f kubernetes/postgres/postgres-pvc.yaml
kubectl apply -f kubernetes/postgres/postgres-deployment.yaml
kubectl apply -f kubernetes/postgres/postgres-service.yaml

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
kubectl wait --namespace=ecommerce-prod --for=condition=ready pod -l app=postgres --timeout=120s

# Deploy Backend
kubectl apply -f kubernetes/backend/backend-deployment.yaml
kubectl apply -f kubernetes/backend/backend-service.yaml

# Wait for Backend
echo "⏳ Waiting for Backend..."
kubectl wait --namespace=ecommerce-prod --for=condition=ready pod -l app=backend --timeout=120s

# Deploy Frontend
kubectl apply -f kubernetes/frontend/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend/frontend-service.yaml

# Deploy Ingress
kubectl apply -f kubernetes/ingress.yaml

# Deploy HPA
kubectl apply -f kubernetes/hpa.yaml

# Deploy Resource Quota
kubectl apply -f kubernetes/resource-quota.yaml

# Deploy Monitoring
kubectl apply -f monitoring/prometheus/prometheus-configmap.yaml
kubectl apply -f monitoring/grafana/grafana-deployment.yaml
kubectl apply -f monitoring/grafana/grafana-service.yaml

echo "✅ Deployment complete!"
echo ""
echo "📊 Services:"
kubectl get all -n ecommerce-prod
echo ""
echo "🌐 Access your application:"
echo "   Add to /etc/hosts: 127.0.0.1 ecommerce.local"
echo "   Then visit: http://ecommerce.local"
