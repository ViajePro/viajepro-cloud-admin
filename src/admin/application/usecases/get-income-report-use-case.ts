import { IncomeReport } from "../../domain/finance";
import { FinanceRepository } from "../ports/finance-repository";
import { Result } from "../result";
import { Logger, LoggerFactory } from "../../infrastructure/logging/LoggerFactory";

export class GetIncomeReportUseCase {
  private logger: Logger;

  constructor(private financeRepository: FinanceRepository) {
    this.logger = LoggerFactory.getLogger('getIncomeReportUseCase');
  }

  async execute(startDate: string, endDate: string): Promise<Result<IncomeReport>> {
    try {
      this.logger.info('Ejecutando caso de uso para obtener reporte de ingresos', { startDate, endDate });
      
      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        this.logger.warn('Fechas inválidas proporcionadas', { startDate, endDate });
        return Result.fail("Fechas inválidas");
      }
      
      if (start > end) {
        this.logger.warn('La fecha de inicio es posterior a la fecha de fin', { startDate, endDate });
        return Result.fail("La fecha de inicio debe ser anterior a la fecha de fin");
      }

      const report = await this.financeRepository.getIncomeReport(start, end);
      
      this.logger.info('Reporte de ingresos obtenido correctamente', { 
        totalAmount: report.totalAmount,
        totalCommission: report.totalCommission,
        totalTravels: report.totalTravels
      });
      
      return Result.ok(report);
    } catch (error: any) {
      this.logger.error('Error al obtener reporte de ingresos', error);
      return Result.fail(`Error al obtener reporte de ingresos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}