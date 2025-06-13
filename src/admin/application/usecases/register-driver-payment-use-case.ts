import { v4 as uuidv4 } from 'uuid';
import { DriverPayment } from "../../domain/finance";
import { FinanceRepository } from "../ports/finance-repository";
import { Result } from "../result";
import { Logger, LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import { DebtNotFoundError, ValidationError } from "../../domain/errors";

export interface RegisterPaymentInput {
  driverId: string;
  amount: number;
  description?: string;
}

export class RegisterDriverPaymentUseCase {
  private logger: Logger;

  constructor(private financeRepository: FinanceRepository) {
    this.logger = LoggerFactory.getLogger('registerDriverPaymentUseCase');
  }

  async execute(input: RegisterPaymentInput): Promise<Result<DriverPayment>> {
    try {
      this.logger.info('Ejecutando caso de uso para registrar pago de chofer', { 
        driverId: input.driverId,
        amount: input.amount
      });
      
      // Validar entrada
      if (!input.driverId) {
        const error = new ValidationError("ID del chofer es requerido");
        this.logger.warn(error.message);
        return Result.fail(error.message);
      }
      
      if (!input.amount || input.amount <= 0) {
        const error = new ValidationError("El monto debe ser mayor a cero");
        this.logger.warn(error.message, { amount: input.amount });
        return Result.fail(error.message);
      }
      
      // Verificar que el chofer tenga deuda
      const debt = await this.financeRepository.getDriverDebt(input.driverId);
      
      if (!debt) {
        const error = new DebtNotFoundError(input.driverId);
        this.logger.warn(error.message, { driverId: input.driverId });
        return Result.fail(error.message);
      }
      
      if (debt.totalDebt <= 0) {
        const error = new ValidationError("El chofer no tiene deuda pendiente");
        this.logger.warn(error.message, { driverId: input.driverId });
        return Result.fail(error.message);
      }
      
      // Crear el pago
      const now = new Date();
      const payment: DriverPayment = {
        paymentId: uuidv4(),
        driverId: input.driverId,
        amount: input.amount,
        date: now,
        description: input.description || "Pago de comisiones",
        createdAt: now
      };
      
      this.logger.debug('Registrando pago', { 
        paymentId: payment.paymentId,
        driverId: payment.driverId,
        amount: payment.amount
      });
      
      // Registrar el pago
      const savedPayment = await this.financeRepository.registerDriverPayment(payment);
      
      // Actualizar la deuda del chofer
      const updatedDebt = await this.financeRepository.updateDriverDebt(input.driverId, input.amount);
      
      this.logger.info('Pago registrado y deuda actualizada correctamente', {
        paymentId: savedPayment.paymentId,
        driverId: savedPayment.driverId,
        amount: savedPayment.amount,
        newDebt: updatedDebt.totalDebt
      });
      
      return Result.ok(savedPayment);
    } catch (error: any) {
      this.logger.error('Error al registrar pago', error);
      return Result.fail(`Error al registrar pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}