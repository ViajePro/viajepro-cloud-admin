# ViajeProCloud Admin - Módulo Financiero

Este módulo proporciona funcionalidades de gestión financiera para la plataforma ViajeProCloud.

## Funcionalidades

### Gestión Financiera Básica

- **FUN-CENTRAL-FINANCIERO-001**: Visualizar un reporte simple de ingresos totales por viajes completados en un período.
- **FUN-CENTRAL-FINANCIERO-002**: Visualizar la deuda acumulada de cada chofer (comisiones pendientes de pago a la remisería).
- **FUN-CENTRAL-FINANCIERO-003**: Registrar un pago realizado por un chofer para saldar parcial o totalmente su deuda.

## API Endpoints

### Reporte de Ingresos

```
GET /finance/income-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

Parámetros:
- `startDate`: Fecha de inicio del período (obligatorio)
- `endDate`: Fecha de fin del período (opcional, por defecto es la fecha actual)

### Deudas de Choferes

```
GET /finance/driver-debts
```

Retorna la lista de todos los choferes con sus deudas acumuladas.

### Deuda de un Chofer Específico

```
GET /finance/driver-debts/{driverId}
```

Retorna la deuda acumulada de un chofer específico.

### Registrar Pago de Chofer

```
POST /finance/driver-payments
```

Cuerpo de la solicitud:
```json
{
  "driverId": "uuid-del-chofer",
  "amount": 1000.50,
  "description": "Pago de comisiones semana 32"
}
```

## Despliegue

Para desplegar este módulo:

```bash
npm run build
npm run deploy
```

Para ejecutar localmente:

```bash
npm run start:local
```