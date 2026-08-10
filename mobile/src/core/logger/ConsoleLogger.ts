import { ILogger } from './ILogger';

export class ConsoleLogger implements ILogger {
  constructor(private readonly prefix: string = '[RENT_APP]') {}

  public info(message: string, context?: Record<string, unknown>): void {
    console.log(`${this.prefix} [INFO] ${message}`, context ?? '');
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`${this.prefix} [WARN] ${message}`, context ?? '');
  }

  public error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    console.error(`${this.prefix} [ERROR] ${message}`, error ?? '', context ?? '');
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (__DEV__) {
      console.debug(`${this.prefix} [DEBUG] ${message}`, context ?? '');
    }
  }
}

export const logger: ILogger = new ConsoleLogger();
