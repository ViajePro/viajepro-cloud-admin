import { z } from 'zod';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial'
}

export const DriverPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  driverId: z.string().uuid(),
  amount: z.number().positive(),
  date: z.date(),
  description: z.string().optional(),
  createdAt: z.date()
});

export type DriverPayment = z.infer<typeof DriverPaymentSchema>;

export const DriverDebtSchema = z.object({
  driverId: z.string().uuid(),
  totalDebt: z.number(),
  lastUpdated: z.date()
});

export type DriverDebt = z.infer<typeof DriverDebtSchema>;

export const TravelIncomeSchema = z.object({
  travelId: z.string().uuid(),
  amount: z.number().positive(),
  driverId: z.string().uuid(),
  companyCommission: z.number(),
  date: z.date(),
  status: z.nativeEnum(PaymentStatus)
});

export type TravelIncome = z.infer<typeof TravelIncomeSchema>;

export interface IncomeReportItem {
  date: string;
  totalAmount: number;
  totalCommission: number;
  travelCount: number;
}

export interface IncomeReport {
  startDate: string;
  endDate: string;
  items: IncomeReportItem[];
  totalAmount: number;
  totalCommission: number;
  totalTravels: number;
}

export interface DriverDebtSummary {
  driverId: string;
  driverName: string;
  totalDebt: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

export const DebtRecordSchema = z.object({
  registroId: z.string().uuid(),
  choferId: z.string().uuid(),
  fechaHora: z.date(),
  monto: z.number(), // positivo para deuda, negativo para pago
  descripcion: z.string()
});

export type DebtRecord = z.infer<typeof DebtRecordSchema>;

export enum PaymentMethodType {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer'
}

export const TravelDebtRecordSchema = z.object({
  recordId: z.string().uuid(),
  travelId: z.string().uuid(),
  driverId: z.string().uuid(),
  amount: z.number().positive(),
  companyCommission: z.number(),
  paymentMethod: z.nativeEnum(PaymentMethodType),
  createdAt: z.date(),
  description: z.string().optional()
});

export type TravelDebtRecord = z.infer<typeof TravelDebtRecordSchema>;