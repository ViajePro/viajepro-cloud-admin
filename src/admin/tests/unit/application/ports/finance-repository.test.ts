import { FinanceRepository } from '../../../../application/ports/finance-repository';
import { 
  DriverDebt, 
  DriverPayment, 
  IncomeReport, 
  TravelIncome, 
  PaymentStatus,
  TravelDebtRecord 
} from '../../../../domain/finance';

// Clase mock para implementar la interfaz FinanceRepository
class MockFinanceRepository implements FinanceRepository {
  private incomeReports: Map<string, IncomeReport> = new Map();
  private driverDebts: Map<string, DriverDebt> = new Map();
  private driverPayments: DriverPayment[] = [];
  private travelDebtRecords: TravelDebtRecord[] = [];

  constructor() {
    // Inicializar con algunos datos de prueba
    const mockDriverDebt1: DriverDebt = {
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      totalDebt: 1500,
      lastUpdated: new Date('2023-01-15')
    };

    const mockDriverDebt2: DriverDebt = {
      driverId: '223e4567-e89b-12d3-a456-426614174001',
      totalDebt: 2500,
      lastUpdated: new Date('2023-01-20')
    };

    this.driverDebts.set(mockDriverDebt1.driverId, mockDriverDebt1);
    this.driverDebts.set(mockDriverDebt2.driverId, mockDriverDebt2);

    // Crear un reporte de ingresos de ejemplo
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    const reportKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    
    const mockReport: IncomeReport = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      items: [
        {
          date: '2023-01-05',
          totalAmount: 500,
          totalCommission: 100,
          travelCount: 5
        },
        {
          date: '2023-01-10',
          totalAmount: 800,
          totalCommission: 160,
          travelCount: 8
        }
      ],
      totalAmount: 1300,
      totalCommission: 260,
      totalTravels: 13
    };

    this.incomeReports.set(reportKey, mockReport);
  }

  async getIncomeReport(startDate: Date, endDate: Date): Promise<IncomeReport> {
    const reportKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    const report = this.incomeReports.get(reportKey);
    
    if (!report) {
      // Si no existe el reporte para ese período, devolvemos uno vacío
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        items: [],
        totalAmount: 0,
        totalCommission: 0,
        totalTravels: 0
      };
    }
    
    return report;
  }

  async getAllDriverDebts(): Promise<DriverDebt[]> {
    return Array.from(this.driverDebts.values());
  }

  async getDriverDebt(driverId: string): Promise<DriverDebt | null> {
    return this.driverDebts.get(driverId) || null;
  }

  async registerDriverPayment(payment: DriverPayment): Promise<DriverPayment> {
    this.driverPayments.push(payment);
    return payment;
  }

  async updateDriverDebt(driverId: string, amountPaid: number): Promise<DriverDebt> {
    const debt = this.driverDebts.get(driverId);
    
    if (!debt) {
      throw new Error(`No se encontró deuda para el conductor con ID: ${driverId}`);
    }
    
    const updatedDebt: DriverDebt = {
      ...debt,
      totalDebt: Math.max(0, debt.totalDebt - amountPaid),
      lastUpdated: new Date()
    };
    
    this.driverDebts.set(driverId, updatedDebt);
    return updatedDebt;
  }

  async registerTravelDebt(debtRecord: TravelDebtRecord): Promise<TravelDebtRecord> {
    this.travelDebtRecords.push(debtRecord);
    return debtRecord;
  }
}

describe('FinanceRepository', () => {
  let repository: FinanceRepository;
  
  beforeEach(() => {
    repository = new MockFinanceRepository();
  });

  describe('getIncomeReport', () => {
    it('debería devolver un reporte de ingresos para un período específico', async () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      // Act
      const report = await repository.getIncomeReport(startDate, endDate);
      
      // Assert
      expect(report).toBeDefined();
      expect(report.startDate).toBe(startDate.toISOString());
      expect(report.endDate).toBe(endDate.toISOString());
      expect(report.totalAmount).toBe(1300);
      expect(report.totalCommission).toBe(260);
      expect(report.totalTravels).toBe(13);
      expect(report.items.length).toBe(2);
    });

    it('debería devolver un reporte vacío si no hay datos para el período', async () => {
      // Arrange
      const startDate = new Date('2022-01-01');
      const endDate = new Date('2022-01-31');
      
      // Act
      const report = await repository.getIncomeReport(startDate, endDate);
      
      // Assert
      expect(report).toBeDefined();
      expect(report.startDate).toBe(startDate.toISOString());
      expect(report.endDate).toBe(endDate.toISOString());
      expect(report.totalAmount).toBe(0);
      expect(report.totalCommission).toBe(0);
      expect(report.totalTravels).toBe(0);
      expect(report.items.length).toBe(0);
    });
  });

  describe('getAllDriverDebts', () => {
    it('debería devolver todas las deudas de los conductores', async () => {
      // Act
      const debts = await repository.getAllDriverDebts();
      
      // Assert
      expect(debts).toBeDefined();
      expect(debts.length).toBe(2);
      expect(debts[0].totalDebt).toBe(1500);
      expect(debts[1].totalDebt).toBe(2500);
    });
  });

  describe('getDriverDebt', () => {
    it('debería devolver la deuda de un conductor específico', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Act
      const debt = await repository.getDriverDebt(driverId);
      
      // Assert
      expect(debt).toBeDefined();
      expect(debt?.driverId).toBe(driverId);
      expect(debt?.totalDebt).toBe(1500);
    });

    it('debería devolver null si el conductor no tiene deuda registrada', async () => {
      // Arrange
      const driverId = 'non-existent-id';
      
      // Act
      const debt = await repository.getDriverDebt(driverId);
      
      // Assert
      expect(debt).toBeNull();
    });
  });

  describe('registerDriverPayment', () => {
    it('debería registrar un pago de conductor correctamente', async () => {
      // Arrange
      const payment: DriverPayment = {
        paymentId: '123e4567-e89b-12d3-a456-426614174099',
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 500,
        date: new Date(),
        createdAt: new Date()
      };
      
      // Act
      const result = await repository.registerDriverPayment(payment);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.paymentId).toBe(payment.paymentId);
      expect(result.driverId).toBe(payment.driverId);
      expect(result.amount).toBe(payment.amount);
    });
  });

  describe('updateDriverDebt', () => {
    it('debería actualizar la deuda de un conductor después de un pago', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const amountPaid = 500;
      
      // Act
      const updatedDebt = await repository.updateDriverDebt(driverId, amountPaid);
      
      // Assert
      expect(updatedDebt).toBeDefined();
      expect(updatedDebt.driverId).toBe(driverId);
      expect(updatedDebt.totalDebt).toBe(1000); // 1500 - 500
      expect(updatedDebt.lastUpdated).toBeInstanceOf(Date);
    });

    it('debería establecer la deuda en 0 si el pago es mayor que la deuda', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const amountPaid = 2000; // Mayor que la deuda de 1500
      
      // Act
      const updatedDebt = await repository.updateDriverDebt(driverId, amountPaid);
      
      // Assert
      expect(updatedDebt).toBeDefined();
      expect(updatedDebt.driverId).toBe(driverId);
      expect(updatedDebt.totalDebt).toBe(0);
    });

    it('debería lanzar un error si el conductor no existe', async () => {
      // Arrange
      const driverId = 'non-existent-id';
      const amountPaid = 500;
      
      // Act & Assert
      await expect(repository.updateDriverDebt(driverId, amountPaid))
        .rejects
        .toThrow(`No se encontró deuda para el conductor con ID: ${driverId}`);
    });
  });
});