import { z } from 'zod';
import { Result } from './Result';

export class ValidationError extends Error {
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export function validate<T>(schema: z.ZodType<T>, data: any): Result<T> {
  try {
    const validatedData = schema.parse(data);
    return Result.ok(validatedData);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return Result.fail(new ValidationError(
        'Error de validación',
        details
      ).message);
    }
    
    return Result.fail(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}