import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RegisterTravelDebtUseCase } from '../../application/usecases/register-travel-debt-use-case';
import { PaymentMethodType } from '../../domain/finance';
import { ResponseFormatter } from '../api/response-formatter';
import { LoggerFactory } from '../logging/LoggerFactory';

const logger = LoggerFactory.getLogger('TravelDebtController');

export class TravelDebtController {
  constructor(private readonly registerTravelDebtUseCase: RegisterTravelDebtUseCase) {}

  async handleTravelFinishedEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      logger.info('Received travel finished event');
      
      if (!event.body) {
        return ResponseFormatter.error('Missing event body', 400);
      }
      
      const travelData = JSON.parse(event.body);
      
      if (!travelData.travelId || !travelData.driverId || !travelData.amount || !travelData.paymentMethod) {
        return ResponseFormatter.error('Invalid event data. Required: travelId, driverId, amount, paymentMethod', 400);
      }
      
      const result = await this.registerTravelDebtUseCase.execute({
        travelId: travelData.travelId,
        driverId: travelData.driverId,
        amount: travelData.amount,
        companyCommission: travelData.companyCommission || 0,
        paymentMethod: travelData.paymentMethod as PaymentMethodType,
        description: `Deuda por viaje ${travelData.travelId}`
      });
      
      if (result.isFailure) {
        logger.error('Failed to register travel debt', { error: result.getError() });
        return ResponseFormatter.error(result.getError(), 500);
      }
      
      logger.info('Travel debt registered successfully', { recordId: result.getValue().recordId });
      return ResponseFormatter.success({
        message: 'Travel debt registered successfully',
        data: result.getValue()
      }, 201);
    } catch (error) {
      logger.error('Error handling travel finished event', { error });
      return ResponseFormatter.error(
        `Error handling travel finished event: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }
}