import { useEffect, useRef } from 'react';

/**
 * A hook that executes a callback function only once when the component mounts.
 *
 * This hook is useful for performing side effects that should only happen once
 * during the component's lifecycle, such as:
 * - Initializing external libraries
 * - Setting up subscriptions
 * - Making one-time API calls
 * - Logging analytics events
 *
 * The callback is executed synchronously during the mount phase, ensuring it runs
 * before the component renders for the first time.
 *
 * @param callback The function to execute on mount
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useOnMount(() => {
 *     console.log('Component mounted');
 *     // Initialize external library
 *     initializeLibrary();
 *   });
 *
 *   return <div>My Component</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function AnalyticsComponent() {
 *   useOnMount(() => {
 *     // Track page view only once
 *     analytics.track('page_view', { page: 'dashboard' });
 *   });
 *
 *   return <div>Analytics Component</div>;
 * }
 * ```
 */
export function useOnMount(callback: () => void): void {
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      callback();
    }
  }, [callback]);
}
