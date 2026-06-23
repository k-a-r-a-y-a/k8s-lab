#!/bin/bash

ACTION=$1
SERVICE=$2
VERSION=$3

case $ACTION in
  update)
    echo "🔄 Performing rolling update for $SERVICE to version $VERSION..."
    kubectl set image deployment/$SERVICE -n ecommerce-prod $SERVICE=$SERVICE:$VERSION
    kubectl rollout status deployment/$SERVICE -n ecommerce-prod
    ;;
  
  rollback)
    echo "⏪ Rolling back $SERVICE to previous version..."
    kubectl rollout undo deployment/$SERVICE -n ecommerce-prod
    kubectl rollout status deployment/$SERVICE -n ecommerce-prod
    ;;
  
  history)
    echo "📜 Rollout history for $SERVICE:"
    kubectl rollout history deployment/$SERVICE -n ecommerce-prod
    ;;
  
  status)
    echo "📊 Rollout status for $SERVICE:"
    kubectl rollout status deployment/$SERVICE -n ecommerce-prod
    ;;
  
  *)
    echo "Usage: $0 {update|rollback|history|status} {backend|frontend} [version]"
    echo ""
    echo "Examples:"
    echo "  $0 update backend v2"
    echo "  $0 rollback backend"
    echo "  $0 history frontend"
    exit 1
    ;;
esac
