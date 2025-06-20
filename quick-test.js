// Prueba rápida para verificar que los casos de uso se instancian correctamente
const { financeController } = require('./dist/app.js');

console.log('🔍 Verificando instanciación de casos de uso...');

// Verificar que los casos de uso no son objetos vacíos
console.log('getIncomeReportUseCase:', typeof financeController.getIncomeReportUseCase?.execute);
console.log('getDriverDebtsUseCase:', typeof financeController.getDriverDebtsUseCase?.execute);
console.log('getDriverDebtsUseCase.getDriverDebt:', typeof financeController.getDriverDebtsUseCase?.getDriverDebt);
console.log('registerDriverPaymentUseCase:', typeof financeController.registerDriverPaymentUseCase?.execute);

console.log('\n✅ Si todos muestran "function", los errores están corregidos');