/**
 * Result — padrão de retorno para operações de domínio
 * Evita exceções para erros de negócio previsíveis
 */
export class Result<T = void> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: string;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
  }

  public get value(): T {
    if (!this.isSuccess) {
      throw new Error(`Não é possível acessar o valor de um Result com falha. Erro: ${this._error}`);
    }
    return this._value as T;
  }

  public get error(): string {
    if (this.isSuccess) {
      throw new Error('Não é possível acessar o erro de um Result com sucesso.');
    }
    return this._error as string;
  }

  public static ok<U = void>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  public static fail<U = void>(error: string): Result<U> {
    return new Result<U>(false, undefined, error);
  }
}
