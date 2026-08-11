type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private level: LogLevel;
  constructor(level: LogLevel = "info") {
    this.level = level;
  }
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    return `${timestamp} [${levelStr}] ${message}`;
  }
  debug(message: string): void {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message));
    }
  }
  info(message: string): void {
    if (this.shouldLog("info")) {
      console.log(this.format("info", message));
    }
  }
  warn(message: string): void {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message));
    }
  }
  error(message: string): void {
    if (this.shouldLog("error")) {
      console.error(this.format("error", message));
    }
  }
  separator(): void {
    console.log("─".repeat(60));
  }
}
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || "info"
);