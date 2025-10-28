import { LogLevelNumbers, RootLogger } from 'loglevel';

export const consoleLogMiddleware = (logger: RootLogger): void => {
  const consoleLogLevel = 'warn'; // todo: env var
  const upperCaseLevel = consoleLogLevel.toUpperCase() as keyof typeof logger.levels;
  const minLogLevelToPrint = logger.levels[upperCaseLevel] || logger.levels.ERROR;

  const originalMethodFactory = logger.methodFactory;
  logger.methodFactory = (methodName, logLevel: LogLevelNumbers, loggerName: string | symbol) => {
    const logFunc = originalMethodFactory(methodName, logLevel, loggerName);
    const upperCaseLevel = methodName.toUpperCase() as keyof typeof logger.levels;
    const currentLogLevel = logger.levels[upperCaseLevel];

    return (...message: unknown[]) => {
      if (minLogLevelToPrint <= currentLogLevel) {
        logFunc(...message);
      }
    };
  };

  logger.setLevel(logger.getLevel());
};
