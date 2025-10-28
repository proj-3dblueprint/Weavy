import { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/logger/logger';
import { useSaveRecipe } from '@/hooks/useSaveRecipe';
import { useEdges, useNodes } from '../FlowContext';

const AUTO_SAVE_DELAY = 2000;
const logger = log.getLogger('useAutoSaveRecipe');

const DID_NOT_AUTO_SAVE_LONG_TIMEOUT = 300000; // 5 minutes

export const useAutoSaveRecipe = () => {
  const nodes = useNodes();
  const edges = useEdges();
  const saveRecipe = useSaveRecipe();

  const debounceTimeoutRef = useRef<number>();
  const lastSaveAttemptRef = useRef<number>(Date.now());
  const longTimeoutRef = useRef<number>();

  const debouncedSave = useCallback(() => {
    clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = window.setTimeout(() => {
      const saveFlowId = uuidv4();
      // Update last save attempt time when we actually attempt to save
      lastSaveAttemptRef.current = Date.now();

      void saveRecipe({ saveFlowId });
    }, AUTO_SAVE_DELAY);
  }, [saveRecipe]);

  // Set up long timeout detection - runs independently of debounce
  const setupLongTimeout = useCallback(() => {
    clearTimeout(longTimeoutRef.current);
    longTimeoutRef.current = window.setTimeout(() => {
      const timeSinceLastAttempt = Date.now() - lastSaveAttemptRef.current;

      // Only log if document is visible and it's been over 5 minutes
      if (document.visibilityState === 'visible' && timeSinceLastAttempt >= DID_NOT_AUTO_SAVE_LONG_TIMEOUT) {
        logger.warn('Auto-save has not happened for over 5 minutes while document is visible', {
          timeSinceLastAttemptMs: timeSinceLastAttempt,
          hasActiveTimeout: !!debounceTimeoutRef.current,
        });
      }

      // Set up the next check
      setupLongTimeout();
    }, DID_NOT_AUTO_SAVE_LONG_TIMEOUT);
  }, []);

  // Effect for debounced save (resets on nodes/edges change)
  useEffect(() => {
    debouncedSave();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [nodes, edges, debouncedSave]);

  // Effect for long timeout setup (only runs once)
  useEffect(() => {
    setupLongTimeout();

    return () => {
      if (longTimeoutRef.current) {
        clearTimeout(longTimeoutRef.current);
      }
    };
  }, [setupLongTimeout]);
};
