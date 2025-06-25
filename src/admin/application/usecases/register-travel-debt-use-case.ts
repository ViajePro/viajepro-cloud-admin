import { TravelDebtRecord, PaymentMethodType } from '../../domain/finance';
import { FinanceRepository } from '../ports/finance-repository';
import { Result } from '../result';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterTravelDebtInput {
  travelId: string;
  driverId: string;
  amount: number;
  companyCommission: number;
  paymentMethod: PaymentMethodType;
  description?: string;
}

export class RegisterTravelDebtUseCase {
  constructor(private readonly financeRepository: FinanceRepository) {}

  async execute(input: RegisterTravelDebtInput): Promise<Result<TravelDebtRecord>> {
    try {
      if (!input.travelId || !input.driverId || input.amount <= 0) {
        return Result.fail<TravelDebtRecord>('Invalid input parameters');
      }

      const debtRecord: TravelDebtRecord = {
        recordId: uuidv4(),
        travelId: input.travelId,
        driverId: input.driverId,
        amount: input.amount,
        companyCommission: input.companyCommission,
        paymentMethod: input.paymentMethod,
        createdAt: new Date(),
        description: input.description
      };

      const registeredDebt = await this.financeRepository.registerTravelDebt(debtRecord);
      
      // La actualización de la deuda ya se maneja dentro del repositorio
      // No es necesario llamar a updateDriverDebt aquí
      
      return Result.ok<TravelDebtRecord>(registeredDebt);
    } catch (error) {
      return Result.fail<TravelDebtRecord>(`Error registering travel debt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}