import { 
  PaymentStatus, 
  DriverPaymentSchema, 
  DriverDebtSchema, 
  TravelIncomeSchema,
  DriverPayment,
  DriverDebt,
  TravelIncome,
  IncomeReportItem,
  IncomeReport,
  DriverDebtSummary
} from '../../../domain/finance';
import { z } from 'zod';

describe('Finance Domain Models', () => {
  describe('PaymentStatus', () => {
    it('debería tener los estados correctos', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
      expect(PaymentStatus.PAID).toBe('paid');
      expect(PaymentStatus.PARTIAL).toBe('partial');
    });
  });
  
  describe('DriverPaymentSchema', () => {
    it('debería validar un pago válido', () => {
      // Arrange
      const validPayment = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        amount: 500,
        date: new Date(),
        description: 'Pago mensual',
        createdAt: new Date()
      };
      
      // Act & Assert
      expect(() => DriverPaymentSchema.parse(validPayment)).not.toThrow();
      const parsed = DriverPaymentSchema.parse(validPayment);
      expect(parsed).toEqual(validPayment);
    });
    
    it('debería validar un pago sin descripción', () => {
      // Arrange
      const validPayment = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        amount: 500,
        date: new Date(),
        createdAt: new Date()
      };
      
      // Act & Assert
      expect(() => DriverPaymentSchema.parse(validPayment)).not.toThrow();
    });
    
    it('debería rechazar un pago con ID inválido', () => {
      // Arrange
      const invalidPayment = {
        paymentId: 'no-uuid',
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        amount: 500,
        date: new Date(),
        createdAt: new Date()
      };
      
      // Act & Assert
      expect(() => DriverPaymentSchema.parse(invalidPayment)).toThrow();
    });
    
    it('debería rechazar un pago con monto negativo', () => {
      // Arrange
      const invalidPayment = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        amount: -500,
        date: new Date(),
        createdAt: new Date()
      };
      
      // Act & Assert
      expect(() => DriverPaymentSchema.parse(invalidPayment)).toThrow();
    });
  });
  
  describe('DriverDebtSchema', () => {
    it('debería validar una deuda válida', () => {
      // Arrange
      const validDebt = {
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        totalDebt: 1500,
        lastUpdated: new Date()
      };
      
      // Act & Assert
      expect(() => DriverDebtSchema.parse(validDebt)).not.toThrow();
      const parsed = DriverDebtSchema.parse(validDebt);
      expect(parsed).toEqual(validDebt);
    });
    
    it('debería validar una deuda con valor cero', () => {
      // Arrange
      const validDebt = {
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        totalDebt: 0,
        lastUpdated: new Date()
      };
      
      // Act & Assert
      expect(() => DriverDebtSchema.parse(validDebt)).not.toThrow();
    });
    
    it('debería rechazar una deuda con ID inválido', () => {
      // Arrange
      const invalidDebt = {
        driverId: 'no-uuid',
        totalDebt: 1500,
        lastUpdated: new Date()
      };
      
      // Act & Assert
      expect(() => DriverDebtSchema.parse(invalidDebt)).toThrow();
    });
  });
  
  describe('TravelIncomeSchema', () => {
    it('debería validar un ingreso válido', () => {
      // Arrange
      const validIncome = {
        travelId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 500,
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        companyCommission: 100,
        date: new Date(),
        status: PaymentStatus.PAID
      };
      
      // Act & Assert
      expect(() => TravelIncomeSchema.parse(validIncome)).not.toThrow();
      const parsed = TravelIncomeSchema.parse(validIncome);
      expect(parsed).toEqual(validIncome);
    });
    
    it('debería rechazar un ingreso con monto negativo', () => {
      // Arrange
      const invalidIncome = {
        travelId: '123e4567-e89b-12d3-a456-426614174000',
        amount: -500,
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        companyCommission: 100,
        date: new Date(),
        status: PaymentStatus.PAID
      };
      
      // Act & Assert
      expect(() => TravelIncomeSchema.parse(invalidIncome)).toThrow();
    });
    
    it('debería rechazar un ingreso con estado inválido', () => {
      // Arrange
      const invalidIncome = {
        travelId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 500,
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        companyCommission: 100,
        date: new Date(),
        status: 'invalid-status'
      };
      
      // Act & Assert
      expect(() => TravelIncomeSchema.parse(invalidIncome)).toThrow();
    });
  });
  
  describe('Interfaces', () => {
    it('debería permitir crear un objeto IncomeReportItem', () => {
      // Arrange & Act
      const item: IncomeReportItem = {
        date: '2023-01-05',
        totalAmount: 500,
        totalCommission: 100,
        travelCount: 5
      };
      
      // Assert
      expect(item.date).toBe('2023-01-05');
      expect(item.totalAmount).toBe(500);
      expect(item.totalCommission).toBe(100);
      expect(item.travelCount).toBe(5);
    });
    
    it('debería permitir crear un objeto IncomeReport', () => {
      // Arrange & Act
      const report: IncomeReport = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        items: [
          {
            date: '2023-01-05',
            totalAmount: 500,
            totalCommission: 100,
            travelCount: 5
          }
        ],
        totalAmount: 500,
        totalCommission: 100,
        totalTravels: 5
      };
      
      // Assert
      expect(report.startDate).toBe('2023-01-01');
      expect(report.endDate).toBe('2023-01-31');
      expect(report.items.length).toBe(1);
      expect(report.totalAmount).toBe(500);
      expect(report.totalCommission).toBe(100);
      expect(report.totalTravels).toBe(5);
    });
    
    it('debería permitir crear un objeto DriverDebtSummary', () => {
      // Arrange & Act
      const summary: DriverDebtSummary = {
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        driverName: 'Juan Pérez',
        totalDebt: 1500,
        lastPaymentDate: '2023-01-15',
        lastPaymentAmount: 500
      };
      
      // Assert
      expect(summary.driverId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(summary.driverName).toBe('Juan Pérez');
      expect(summary.totalDebt).toBe(1500);
      expect(summary.lastPaymentDate).toBe('2023-01-15');
      expect(summary.lastPaymentAmount).toBe(500);
    });
    
    it('debería permitir crear un objeto DriverDebtSummary sin pagos previos', () => {
      // Arrange & Act
      const summary: DriverDebtSummary = {
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        driverName: 'Juan Pérez',
        totalDebt: 1500
      };
      
      // Assert
      expect(summary.driverId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(summary.driverName).toBe('Juan Pérez');
      expect(summary.totalDebt).toBe(1500);
      expect(summary.lastPaymentDate).toBeUndefined();
      expect(summary.lastPaymentAmount).toBeUndefined();
    });
  });
});