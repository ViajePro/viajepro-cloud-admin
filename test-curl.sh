#!/bin/bash

# Configurar la URL base de tu API Gateway
API_BASE_URL="https://YOUR_API_GATEWAY_URL.execute-api.us-east-2.amazonaws.com/Prod"

echo "🧪 Iniciando pruebas con curl..."
echo ""

# Test 1: Reporte de ingresos
echo "1️⃣ Probando reporte de ingresos..."
curl -X GET "${API_BASE_URL}/finance/income-report?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""

# Test 2: Deudas de choferes
echo "2️⃣ Probando deudas de choferes..."
curl -X GET "${API_BASE_URL}/finance/driver-debts" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""

# Test 3: Deuda de chofer específico
echo "3️⃣ Probando deuda de chofer específico..."
curl -X GET "${API_BASE_URL}/finance/driver-debts/test-driver-123" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""

# Test 4: Registrar pago
echo "4️⃣ Probando registro de pago..."
curl -X POST "${API_BASE_URL}/finance/driver-payments" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "test-driver-123",
    "amount": 100.50,
    "description": "Pago de prueba"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""

echo "🏁 Pruebas completadas"