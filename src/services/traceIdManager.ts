import { v4 as uuidv4 } from 'uuid';

/**
 * TraceIdManager - Manages a consistent traceId for user sessions within the current tab
 * The traceId persists as long as the user is signed in and the tab remains open,
 * including through page refreshes.
 */
class TraceIdManager {
  private traceId = '';
  private storageKey = 'app_trace_id';

  constructor() {
    this.restoreFromStorage();
  }

  /**
   * Attempts to restore the traceId from sessionStorage
   * This is useful after page refreshes
   */
  restoreFromStorage() {
    const storedTraceId = sessionStorage.getItem(this.storageKey);
    if (storedTraceId) {
      this.traceId = storedTraceId;
    }
  }

  generateTraceId(): string {
    return uuidv4();
  }

  getTraceId() {
    if (this.traceId) {
      return this.traceId;
    }

    this.traceId = this.generateTraceId();
    sessionStorage.setItem(this.storageKey, this.traceId);
    return this.traceId;
  }

  /**
   * Clears the current traceId
   */
  clearTraceId() {
    this.traceId = '';
    sessionStorage.removeItem(this.storageKey);
  }
}

// Create a singleton instance
export const traceIdManager = new TraceIdManager();
