import log, { RootLogger } from 'loglevel';
import { getAppVersion } from '@/utils/general.ts';
import { logsCollectorMiddleware } from './logs-collector.middleware.ts';
import { logFormatterMiddleware } from './log-formatter.middleware.ts';
import { consoleLogMiddleware } from './console-log.middleware';

let initialized = false;

export const initLogger = (logger: RootLogger): void => {
  // todo: env var
  logger.setLevel('debug');

  const appVersion = getAppVersion() || 'NA';

  // middleware executed in a reverse order
  consoleLogMiddleware(logger);
  logsCollectorMiddleware(logger, appVersion);
  logFormatterMiddleware(logger, appVersion);

  initialized = true;
};

if (!initialized) {
  initLogger(log);
}

export { log };
