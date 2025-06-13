export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  private error: string = '';
  private _value: T | undefined;

  private constructor(isSuccess: boolean, error?: string, value?: T) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: Un resultado exitoso no puede contener un error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: Un resultado fallido debe contener un error");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    if (error) this.error = error;
    this._value = value;
    
    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error("No se puede obtener el valor de un resultado fallido. Use getError() en su lugar.");
    }

    return this._value as T;
  }

  public getError(): string {
    if (!this.isFailure) {
      throw new Error("No se puede obtener el error de un resultado exitoso. Use getValue() en su lugar.");
    }

    return this.error;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (!result.isSuccess) {
        return result;
      }
    }
    return Result.ok();
  }
}