/**
 * FlipFlow - Logging Utility
 *
 * Provides structured logging with support for:
 * - Console logging (development & production)
 * - Log levels (debug, info, warn, error)
 * - Context tracking (request IDs, user IDs)
 * - Error serialization
 *
 * Sentry integration: When SENTRY_DSN is set, errors are also sent to Sentry
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;
  private context: LogContext = {};

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) ||
      (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
  }

  /**
   * Set context that will be included in all subsequent logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(`| ctx: ${JSON.stringify(entry.context)}`);
    }

    if (entry.error) {
      parts.push(`| error: ${entry.error.name}: ${entry.error.message}`);
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatEntry(entry);

    // Console output with appropriate method
    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        if (error?.stack) {
          console.error(error.stack);
        }
        break;
    }

    // Send errors to Sentry if configured
    if (level === 'error' && process.env.SENTRY_DSN && error) {
      this.sendToSentry(error, entry.context);
    }
  }

  private async sendToSentry(error: Error, context?: LogContext): Promise<void> {
    // Dynamic import to avoid loading Sentry in non-error paths
    try {
      // Note: Sentry SDK must be installed: npm install @sentry/nextjs
      const Sentry = await import('@sentry/nextjs').catch(() => null);
      if (Sentry) {
        Sentry.withScope((scope: any) => {
          if (context) {
            Object.entries(context).forEach(([key, value]) => {
              scope.setTag(key, String(value));
            });
          }
          Sentry.captureException(error);
        });
      }
    } catch {
      // Sentry not available, skip
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    if (error && !(error instanceof Error)) {
      context = { ...context, errorDetails: String(error) };
    }
    this.log('error', message, context, err);
  }

  /**
   * Log API request
   */
  logRequest(req: {
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
  }): void {
    this.info(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.userAgent,
      ip: req.ip,
    });
  }

  /**
   * Log API response
   */
  logResponse(res: {
    statusCode: number;
    duration: number;
    url: string;
  }): void {
    const level = res.statusCode >= 500 ? 'error' :
                  res.statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `Response ${res.statusCode} in ${res.duration}ms`, {
      statusCode: res.statusCode,
      duration: res.duration,
      url: res.url,
    });
  }

  /**
   * Log job execution
   */
  logJob(job: {
    type: string;
    id: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    error?: Error;
  }): void {
    const level = job.status === 'failed' ? 'error' : 'info';
    this.log(level, `Job ${job.type} ${job.status}`, {
      jobType: job.type,
      jobId: job.id,
      status: job.status,
      duration: job.duration,
    }, job.error);
  }

  /**
   * Log analysis result
   */
  logAnalysis(analysis: {
    listingId: string;
    score: number;
    dealQuality: string;
    duration: number;
  }): void {
    this.info(`Analysis complete: score=${analysis.score}`, {
      listingId: analysis.listingId,
      score: analysis.score,
      dealQuality: analysis.dealQuality,
      duration: analysis.duration,
    });
  }

  /**
   * Log scrape result
   */
  logScrape(scrape: {
    listingsFound: number;
    pagesScraped: number;
    duration: number;
    errors?: number;
  }): void {
    this.info(`Scrape complete: ${scrape.listingsFound} listings`, {
      listingsFound: scrape.listingsFound,
      pagesScraped: scrape.pagesScraped,
      duration: scrape.duration,
      errors: scrape.errors,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating child loggers
export { Logger };

// Helper to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
