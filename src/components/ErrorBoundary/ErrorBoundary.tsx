import React, { ErrorInfo, ReactNode } from 'react';
import { log } from '@/logger/logger.ts';
import { ErrorPage } from '../Errors/ErrorPage/ErrorPage';
import { getOriginalStackTrace } from './mapStackTrace';

const logger = log.getLogger('ErrorBoundary');

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private logger = log.getLogger(ErrorBoundary.name);

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Use a separate async function for the async operations
    void this.logError(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    let originalStackTrace: string[] | undefined = undefined;
    try {
      originalStackTrace = await getOriginalStackTrace(error);
    } catch (internalError) {
      logger.error('Error getting original stack trace', internalError);
    }

    const performance = window.performance;
    // Only available in Chrome
    const memory =
      'memory' in performance &&
      typeof performance.memory === 'object' &&
      performance.memory !== null &&
      'usedJSHeapSize' in performance.memory &&
      'jsHeapSizeLimit' in performance.memory
        ? (performance.memory as { usedJSHeapSize: number; jsHeapSizeLimit: number })
        : null;

    this.logger.error('Received an uncaught error in React Error Boundary', error, {
      errorMessage: error.message || 'N/A',
      errorInfo,
      originalStackTrace: originalStackTrace || 'N/A',
      location: {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        referrer: document.referrer,
      },
      display: {
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.type,
      },
      performance: {
        timeFromLoad: Math.round(performance.now()),
        memory: memory
          ? {
              used: Math.round(memory.usedJSHeapSize / 1048576), // MB
              limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
            }
          : null,
      },
      session: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        visibility: document.visibilityState,
        hasFocus: document.hasFocus(),
      },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorPage />;
    }

    return this.props.children;
  }
}
