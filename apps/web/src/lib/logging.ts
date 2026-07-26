// Structured logging utilities

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  timestamp: string;
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  data?: unknown;
  error?: { message: string; stack?: string };
}

export class Logger {
  private isDev: boolean;

  constructor(isDev: boolean = process.env.NODE_ENV === "development") {
    this.isDev = isDev;
  }

  private log(entry: LogEntry): void {
    // In production, send to monitoring service (e.g., Sentry)
    // In development, log to console
    if (this.isDev) {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      // Production logging would go here
      // Example: await logToMonitoringService(entry);
    }
  }

  debug(message: string, context: LogContext, data?: unknown): void {
    if (this.isDev) {
      this.log({
        level: LogLevel.DEBUG,
        message,
        context,
        data,
      });
    }
  }

  info(message: string, context: LogContext, data?: unknown): void {
    this.log({
      level: LogLevel.INFO,
      message,
      context,
      data,
    });
  }

  warn(message: string, context: LogContext, data?: unknown): void {
    this.log({
      level: LogLevel.WARN,
      message,
      context,
      data,
    });
  }

  error(message: string, context: LogContext, error?: Error, data?: unknown): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      context,
      error: error
        ? {
            message: error.message,
            stack: this.isDev ? error.stack : undefined,
          }
        : undefined,
      data,
    });
  }
}

export const logger = new Logger();

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
