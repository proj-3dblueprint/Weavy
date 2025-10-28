import { log } from '@/logger/logger.ts';

const logger = log.getLogger('Intercom');

export const openIntercom = () => {
  if (!window.Intercom) {
    return logger.error('WEA: Intercom not loaded');
  }

  if (typeof window.Intercom !== 'function') {
    return logger.error('WEA: Intercom is not a function');
  }

  (window.Intercom as (command: string) => void)('show');
};
