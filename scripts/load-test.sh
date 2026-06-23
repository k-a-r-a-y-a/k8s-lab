#!/bin/bash

echo "🔬 Starting load test..."

# Get service IP
SERVICE_IP=$(kubectl get svc -n ecommerce-prod backend-service -o jsonpath='{.spec.clusterIP}' 2>/dev/null)

if [ -z "$SERVICE_IP" ]; then
    echo "❌ Could not get service IP. Make sure backend is deployed."
    exit 1
fi

echo "🌐 Testing backend at: http://$SERVICE_IP:8000"
echo ""

# Test products endpoint
echo "📊 Testing /products endpoint..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "http://$SERVICE_IP:8000/products"

echo ""
echo "📊 Testing /auth/login endpoint..."
curl -s -o /dev/null -w "Status: %{http_code}\n" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}' \
    "http://$SERVICE_IP:8000/auth/login"

echo ""
echo "📊 Checking HPA status..."
kubectl get hpa -n ecommerce-prod

echo ""
echo "📊 Checking pod status..."
kubectl get pods -n ecommerce-prod
