import { trace, context } from "@opentelemetry/api";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  timestamp: string;
  level: string;
  message: string; 
  trace_id?: string; 
  span_id?: string;  
  meta?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): LogPayload {
    const activeSpan = trace.getSpan(context.active());
    const spanContext = activeSpan?.spanContext();

    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(), 
      message,
      ...(spanContext?.traceId && { trace_id: spanContext.traceId }),
      ...(spanContext?.spanId && { span_id: spanContext.spanId }),
      ...(meta && { meta }),
    };
  }

    debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(JSON.stringify(this.format("debug", message, meta)));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.log(JSON.stringify(this.format("info", message, meta)));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(JSON.stringify(this.format("warn", message, meta)));
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(JSON.stringify(this.format("error", message, meta)));
    }
  }

  separator(): void {
    console.log(JSON.stringify({ separator: "─".repeat(60) }));
  }
}

export const logger = new Logger((process.env.LOG_LEVEL as LogLevel) || "info");

