/**
 * Façade de log : console en dev, sink branchable en prod (Crashlytics, E12).
 * Seul module autorisé à appeler console (cf. eslint.config.js).
 */

type LogSink = (level: 'warn' | 'error', message: string, error?: unknown) => void;

let sink: LogSink | null = null;

export function setLoggerSink(nextSink: LogSink): void {
  sink = nextSink;
}

function emit(level: 'warn' | 'error', message: string, error?: unknown): void {
  if (sink !== null) {
    sink(level, message, error);
    return;
  }
  if (__DEV__) {
    if (level === 'warn') console.warn(message, error ?? '');
    else console.error(message, error ?? '');
  }
}

export const logger = {
  warn(message: string, error?: unknown): void {
    emit('warn', message, error);
  },
  error(message: string, error?: unknown): void {
    emit('error', message, error);
  },
};
