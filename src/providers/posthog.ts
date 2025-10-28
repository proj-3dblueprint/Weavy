import posthogLib, { type PostHog } from 'posthog-js';

let posthog: PostHog;

const options = {
  ui_host: 'https://eu.posthog.com',
  api_host: 'https://posthog-proxy.weavy.ai',
};

export const initPosthog = () => {
  if (!posthog) {
    posthog = posthogLib.init('phc_NT2sOH8m82boUw21Q1Vsr0tQUtjpRJUIE5aoqA0En8T', options);
  }
};

initPosthog();

export { posthog };
