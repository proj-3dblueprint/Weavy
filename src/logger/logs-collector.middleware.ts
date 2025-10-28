import { RootLogger } from 'loglevel';
import remote from 'loglevel-plugin-remote';
import { LogLevelLog, LogsCollectorLog, WeavyLog } from './types.ts';

const formatLog = (log: LogLevelLog, appVersion: string): LogsCollectorLog => {
  try {
    const weavyLog = JSON.parse(log.message) as WeavyLog;

    const { originalStackTrace, ...additionalInfo } = weavyLog.additionalInfo || {};

    return {
      message: weavyLog.msg,
      level: weavyLog.level,
      timestamp: log.timestamp,
      context: weavyLog.context,
      stacktrace: originalStackTrace?.join('\n') || log.stacktrace || undefined,
      error: weavyLog.error
        ? typeof weavyLog.error === 'string'
          ? weavyLog.error
          : (JSON.parse(JSON.stringify(weavyLog.error, Object.getOwnPropertyNames(weavyLog.error))) as object)
        : undefined,
      additionalInfo: additionalInfo,
      metadata: {
        appVersion,
        user: weavyLog.userData,
        traceId: weavyLog.traceId,
        posthogRecordingUrl: weavyLog.posthogRecordingUrl,
      },
    };
  } catch (e: unknown) {
    const stacktrace = (e as Error)?.stack;

    return {
      context: 'LogsCollectorMiddleware',
      level: 'error',
      message: 'Failed parsing log',
      stacktrace,
      timestamp: new Date().toDateString(),
    };
  }
};

const logCollectorConfig = {
  url: import.meta.env.VITE_LOGS_COLLECTOR_URL,
  method: 'POST',
  level: import.meta.env.VITE_LOGS_COLLECTOR_LEVEL,
  stacktrace: {
    levels: ['trace', 'warn', 'error'],
    depth: 25,
    excess: 0,
  },
  timestamp: (): string => new Date().toISOString(),
  format: formatLog,
  timeout: 0,
  interval: 10000,
  capacity: 500,
  backoff: {
    multiplier: 2,
    jitter: 0.1,
    limit: 30000,
  },
};

export const logsCollectorMiddleware = (logger: RootLogger, appVersion: string): void => {
  if (import.meta.env.VITE_LOGS_COLLECTOR_ENABLED !== 'true') {
    return;
  }

  const configWithVersion = {
    ...logCollectorConfig,
    format: (log: LogLevelLog) => formatLog(log, appVersion),
  };

  remote.apply(logger, configWithVersion);
};
