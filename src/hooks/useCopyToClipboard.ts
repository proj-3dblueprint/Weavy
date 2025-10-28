import { useState } from 'react';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { log } from '@/logger/logger.ts';
import type { ApiObject } from '@rudderstack/analytics-js';

const logger = log.getLogger('useCopyToClipboard');

interface UseCopyToClipboardOptions {
  trackingName: string;
  trackingPayload?: ApiObject;
  timeout?: number;
}

export const useCopyToClipboard = ({
  trackingName,
  trackingPayload = {},
  timeout = 2000,
}: UseCopyToClipboardOptions) => {
  const [copied, setCopied] = useState(false);
  const { track } = useAnalytics();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      track(trackingName, trackingPayload, TrackTypeEnum.Product);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    } catch (err) {
      logger.error('Error copying text.', err);
    }
  };

  return { copied, copyToClipboard };
};
