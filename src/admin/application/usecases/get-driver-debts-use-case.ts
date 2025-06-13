import { DriverDebt, DriverDebtSummary } from "../../domain/finance";
import { FinanceRepository } from "../ports/finance-repository";
import { Result } from "../result";
import { Logger, LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import { DynamoDBDriverRepository } from "../../infrastructure/repositories/driver-repository";
import { DebtNotFoundError, DriverNotFoundError } from "../../domain/errors";

export class GetDriverDebtsUseCase {
  private logger: Logger;

  constructor(
    private financeRepository: FinanceRepository,
    private driverRepository: DynamoDBDriverRepository
  ) {
    this.logger = LoggerFactory.getLogger('getDriverDebtsUseCase');
  }

  async execute(): Promise<Result<DriverDebtSummary[]>> {
    try {
      this.logger.info('Ejecutando caso de uso para obtener deudas de choferes');
      
      const debts = await this.financeRepository.getAllDriverDebts();
      this.logger.debug('Deudas obtenidas del repositorio', { count: debts.length });
      
      // Transformar a DriverDebtSummary con información del chofer
      const debtSummaries = await Promise.all(
        debts.map(async (debt) => {
          // Obtener información del chofer (nombre)
          const driver = await this.driverRepository.getDriverById(debt.driverId);
          
          const summary: DriverDebtSummary = {
            driverId: debt.driverId,
            driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Desconocido',
            totalDebt: debt.totalDebt
          };
          
          return summary;
        })
      );
      
      this.logger.info('Resumen de deudas de choferes generado', { count: debtSummaries.length });
      return Result.ok(debtSummaries);
    } catch (error: any) {
      this.logger.error('Error al obtener deudas de choferes', error);
      return Result.fail(`Error al obtener deudas de choferes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async getDriverDebt(driverId: string): Promise<Result<DriverDebtSummary>> {
    try {
      this.logger.info('Obteniendo deuda de chofer específico', { driverId });
      
      const debt = await this.financeRepository.getDriverDebt(driverId);
      
      if (!debt) {
        const error = new DebtNotFoundError(driverId);
        this.logger.warn(error.message, { driverId });
        return Result.fail(error.message);
      }
      
      // Obtener información del chofer
      const driver = await this.driverRepository.getDriverById(driverId);
      
      if (!driver) {
        const error = new DriverNotFoundError(driverId);
        this.logger.warn(error.message, { driverId });
        return Result.fail(error.message);
      }
      
      const debtSummary: DriverDebtSummary = {
        driverId: debt.driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        totalDebt: debt.totalDebt
      };
      
      this.logger.info('Deuda de chofer obtenida correctamente', { 
        driverId, 
        driverName: debtSummary.driverName,
        totalDebt: debtSummary.totalDebt
      });
      
      return Result.ok(debtSummary);
    } catch (error: any) {
      this.logger.error('Error al obtener deuda del chofer', error);
      return Result.fail(`Error al obtener deuda del chofer: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}