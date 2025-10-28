import { useCallback, useContext, useMemo } from 'react';
import { format } from 'date-fns';
import { AuthContext } from '@/contexts/AuthContext';
import { rudderAnalytics } from '@/providers/rudderstack';
import { posthog } from '@/providers/posthog';
import type { ApiObject, IdentifyTraits } from '@rudderstack/analytics-js';

export enum TrackTypeEnum {
  Product = 'Product',
  BI = 'BI',
}

export type TrackType = keyof typeof TrackTypeEnum;

export const useAnalytics = () => {
  const { currentUser } = useContext(AuthContext);
  const credits = useMemo(() => {
    const creditsValue = currentUser?.activeWorkspace?.subscription?.credits;
    // Check if credits is a valid number before using toFixed
    if (typeof creditsValue === 'number' && !isNaN(creditsValue)) {
      return Number(creditsValue.toFixed(1));
    }
    return 0;
  }, [currentUser]);
  const renewalDayOfMonth = useMemo(() => {
    const startsAt = currentUser?.activeWorkspace?.subscription?.startsAt;
    // Only calculate renewal day if startsAt exists
    if (startsAt) {
      return Number(format(startsAt, 'd'));
    }
    return 0;
  }, [currentUser]);

  const identify = useCallback((userId: string, traits: IdentifyTraits) => {
    posthog.identify(userId, traits);
    rudderAnalytics.identify(userId, traits);
  }, []);

  const track = useCallback(
    (event: string, data: ApiObject | null, type: TrackType = 'Product') => {
      const enrichedData = {
        ...(data || {}),
        credits,
        renewalDayOfMonth,
      };

      posthog.capture(event, enrichedData);
      if (type === TrackTypeEnum.BI) {
        rudderAnalytics.track(event, enrichedData);
      }
    },
    [credits, renewalDayOfMonth],
  );

  const page = useCallback((url: string) => {
    rudderAnalytics.page(url);
  }, []);

  return {
    identify,
    track,
    page,
  };
};
