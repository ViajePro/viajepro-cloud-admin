export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error | Record<string, any> | unknown): void;
}

class ConsoleLogger implements Logger {
  private context: string;
  private logLevel: string;

  constructor(context: string) {
    this.context = context;
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  private shouldLog(level: string): boolean {
    const levels: Record<string, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    return levels[level] <= levels[this.logLevel];
  }

  private formatMeta(meta?: Record<string, any>): string {
    if (!meta) return '';
    try {
      return JSON.stringify(meta);
    } catch (e) {
      return '[Error serializing meta]';
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] [${this.context}] ${message} ${this.formatMeta(meta)}`.trim());
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] [${this.context}] ${message} ${this.formatMeta(meta)}`.trim());
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] [${this.context}] ${message} ${this.formatMeta(meta)}`.trim());
    }
  }

  error(message: string, error?: Error | Record<string, any> | unknown): void {
    if (this.shouldLog('error')) {
      let errorMsg = '';
      if (error instanceof Error) {
        errorMsg = `${error.message}\n${error.stack || ''}`;
      } else if (error && typeof error === 'object') {
        errorMsg = this.formatMeta(error as Record<string, any>);
      }
      console.error(`[ERROR] [${this.context}] ${message} ${errorMsg}`.trim());
    }
  }
}

export class LoggerFactory {
  static getLogger(context: string): Logger {
    return new ConsoleLogger(context);
  }
}