import { useEffect } from 'react';

interface RepeatedCheckOptions {
  // return true if the check is successful
  check: () => boolean;
  preCondition: () => boolean;
  interval: number;
  onSuccess: () => void;
}

export const useRepeatedCheck = ({ check, preCondition, interval, onSuccess }: RepeatedCheckOptions) => {
  useEffect(() => {
    if (!preCondition()) {
      return;
    }
    let timeoutId: NodeJS.Timeout;
    const repeatedCheck = () => {
      if (check()) {
        onSuccess();
      } else {
        timeoutId = setTimeout(repeatedCheck, interval);
      }
    };
    timeoutId = setTimeout(repeatedCheck, interval);
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [check, preCondition, interval, onSuccess]);
};
