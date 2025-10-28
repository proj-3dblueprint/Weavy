/* eslint-disable import/order */
import 'core-js/stable/iterator';

// need to import debug tools first
import './providers/whyDidYouRender';
import './providers/useWhatChanged';
// Init PostHog
import { posthog } from './providers/posthog';

import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { PostHogProvider } from 'posthog-js/react';
import './UI/css/index.css';
import './UI/css/fonts.css';
import { log } from '@/logger/logger.ts';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AxiosConfiguration } from './components/AxiosConfiguration/AxiosConfiguration';
import './language';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { MobileCheck } from './components/MobileCheck/MobileCheck';

const logger = log.getLogger('Main');
logger.debug('App started');

const mobileCheckExcludedPaths = ['/pricing', '/signin'];

const root = createRoot(document.getElementById('root') as Element);
root.render(
  <ErrorBoundary>
    <Router
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <PostHogProvider client={posthog}>
        <AuthProvider>
          <AxiosConfiguration>
            <MobileCheck excludedPaths={mobileCheckExcludedPaths}>
              <App />
            </MobileCheck>
          </AxiosConfiguration>
        </AuthProvider>
      </PostHogProvider>
    </Router>
  </ErrorBoundary>,
);
