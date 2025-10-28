import { rudderAnalytics } from '@/providers/rudderstack';
import { posthog } from '@/providers/posthog';
import { TrackTypeEnum, type TrackType } from '@/hooks/useAnalytics';
import type { ApiObject, IdentifyTraits } from '@rudderstack/analytics-js';

export const identify = (userId: string, traits: IdentifyTraits) => {
  posthog.identify(userId, traits);
  rudderAnalytics.identify(userId, traits);
};

//todo: event names in a dedicated file
export const track = (event: string, data: ApiObject | null, type: TrackType = 'Product') => {
  posthog.capture(event, data);
  if (type === TrackTypeEnum.BI) {
    rudderAnalytics.track(event, data);
  }
};

export const page = (url: string) => {
  rudderAnalytics.page(url);
};
