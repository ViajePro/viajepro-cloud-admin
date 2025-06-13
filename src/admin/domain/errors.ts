export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class DriverNotFoundError extends NotFoundError {
  constructor(driverId: string) {
    super(`No se encontró el chofer con ID ${driverId}`);
  }
}

export class DebtNotFoundError extends NotFoundError {
  constructor(driverId: string) {
    super(`No se encontró deuda para el chofer con ID ${driverId}`);
  }
}