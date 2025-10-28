import { LogLevelNumbers, LogLevelNames, RootLogger } from 'loglevel';
import { posthog } from '@/providers/posthog';
import { useUserStore } from '@/state/user.state.ts';
import { traceIdManager } from '../services/traceIdManager.ts';
import type { User } from '@/types/auth.types.ts';
import type { WeavyLog } from './types.ts';

const isError = (value: unknown): value is Error => {
  if (!value) return false;

  // Check for instanceof Error first (handles most standard cases)
  if (value instanceof Error) return true;

  // For cross-realm errors or custom error-like objects, check properties
  return Boolean(
    typeof value === 'object' &&
      'message' in value &&
      typeof value.message === 'string' &&
      'stack' in value &&
      typeof value.stack === 'string' &&
      ('name' in value ? typeof value.name === 'string' : true),
  );
};

const getUserDataToLog = (user: User | null): object => {
  if (!user) return {};

  return {
    activeWorkspace: user.activeWorkspace,
    credits: user.activeWorkspace?.subscription?.credits,
    id: user.id,
    name: user.name,
    email: user.email,
    subscriptionType: user.subscriptionType,
    createdAt: user.createdAt,
  };
};

export const logFormatterMiddleware = (logger: RootLogger, appVersion: string): void => {
  const originalMethodFactory = logger.methodFactory;
  logger.methodFactory = (levelName: LogLevelNames, logLevel: LogLevelNumbers, loggerName: string | symbol) => {
    const logFunc = originalMethodFactory(levelName, logLevel, loggerName);

    return (...message: unknown[]) => {
      let error: string | object | undefined;
      let additionalInfo = {};
      const messageParts = message.filter((item: unknown) => {
        if (item instanceof Error || isError(item)) {
          error = item;
          return false;
        }
        if (typeof item === 'object' && !Array.isArray(item)) {
          additionalInfo = {
            ...additionalInfo,
            ...item,
          };

          return false;
        }

        return true;
      });

      const log: WeavyLog = {
        msg: messageParts.join(' '),
        level: levelName,
        context: String(loggerName),
        traceId: traceIdManager.getTraceId(),
        userData: getUserDataToLog(useUserStore.getState().user),
        appVersion,
        additionalInfo,
        error,
      };

      if (levelName === 'error') {
        const posthogRecordingUrl = posthog?.get_session_replay_url();
        if (posthogRecordingUrl) {
          log.posthogRecordingUrl = posthogRecordingUrl;
        }
      }
      logFunc(JSON.stringify(log));
    };
  };
  logger.setLevel(logger.getLevel());
};
