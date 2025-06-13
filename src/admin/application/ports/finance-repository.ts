import { DriverDebt, DriverPayment, IncomeReport, TravelIncome } from "../../domain/finance";

export interface FinanceRepository {
  /**
   * Obtiene un reporte de ingresos por viajes en un período específico
   */
  getIncomeReport(startDate: Date, endDate: Date): Promise<IncomeReport>;
  
  /**
   * Obtiene la deuda acumulada de todos los choferes
   */
  getAllDriverDebts(): Promise<DriverDebt[]>;
  
  /**
   * Obtiene la deuda de un chofer específico
   */
  getDriverDebt(driverId: string): Promise<DriverDebt | null>;
  
  /**
   * Registra un pago realizado por un chofer
   */
  registerDriverPayment(payment: DriverPayment): Promise<DriverPayment>;
  
  /**
   * Actualiza la deuda de un chofer después de un pago
   */
  updateDriverDebt(driverId: string, amountPaid: number): Promise<DriverDebt>;
}