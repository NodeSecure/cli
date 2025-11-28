function noop() {
  // VOID
}

export interface AbstractLogger {
  fatal: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  trace: (...args: any[]) => void;
}

export function createNoopLogger(): AbstractLogger {
  const logger: AbstractLogger = {
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop
  };

  return logger;
}
