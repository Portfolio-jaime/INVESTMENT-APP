#!/bin/bash

echo "=== Diagnóstico del Cluster ==="

echo "1. Verificando conectividad del cluster..."
kubectl cluster-info 2>&1 | head -5

echo -e "\n2. Verificando namespaces..."
kubectl get namespaces 2>&1

echo -e "\n3. Verificando si ArgoCD existe..."
kubectl get all -n argocd 2>&1

echo -e "\n4. Verificando ingress controllers..."
kubectl get pods -n ingress-nginx 2>&1

echo -e "\n5. Verificando nodos..."
kubectl get nodes 2>&1

echo -e "\n6. Verificando servicios de sistema..."
kubectl get pods -n kube-system | head -10

echo -e "\nDiagnóstico completado."
