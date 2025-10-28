import { useCallback, useRef, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { FF_SWIPE_TO_DELETE_EDGE } from '@/consts/featureFlags';

/**
 * Hook that enables deleting edges by dragging over them with Cmd/Ctrl modifier
 * When user drags over an edge while holding Cmd/Ctrl, the edge gets deleted
 */
export const useDeleteEdgeOnSwipe = () => {
  const isFFSwipeToDeleteEdgeEnabled = useFeatureFlagEnabled(FF_SWIPE_TO_DELETE_EDGE);
  const isSwipeModeRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const isModifierPressedRef = useRef(false);

  // Track modifier key states using useHotkeys
  useHotkeys(
    'meta,ctrl',
    () => {
      if (isFFSwipeToDeleteEdgeEnabled) {
        isModifierPressedRef.current = true;
        document.body.classList.add('modifier-pressed');

        // Enter swipe mode if mouse is already down (drag first, then press Cmd)
        if (isMouseDownRef.current) {
          isSwipeModeRef.current = true;
        }
      }
    },
    {
      keydown: true,
      keyup: false,
      enabled: isFFSwipeToDeleteEdgeEnabled,
      scopes: 'workflow',
    },
  );

  useHotkeys(
    'meta,ctrl',
    () => {
      isModifierPressedRef.current = false;
      isSwipeModeRef.current = false; // Exit swipe mode when modifier is released
      document.body.classList.remove('modifier-pressed');
    },
    {
      keydown: false,
      keyup: true,
      enabled: isFFSwipeToDeleteEdgeEnabled,
      scopes: 'workflow',
    },
  );

  // Track mouse events for swipe mode initiation
  const handleMouseDown = useCallback(
    (_event: MouseEvent) => {
      if (!isFFSwipeToDeleteEdgeEnabled) return;

      isMouseDownRef.current = true;

      // Enter swipe mode if modifier is already pressed (press Cmd first, then drag)
      if (isModifierPressedRef.current) {
        isSwipeModeRef.current = true;
      }
    },
    [isFFSwipeToDeleteEdgeEnabled],
  );

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    // Don't exit swipe mode on mouse up - allow grace period
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (!isFFSwipeToDeleteEdgeEnabled) return;

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Reset modifier pressed state when window loses focus or becomes hidden
    const handleWindowBlur = () => {
      isModifierPressedRef.current = false;
      isSwipeModeRef.current = false;
      document.body.classList.remove('modifier-pressed');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        isModifierPressedRef.current = false;
        isSwipeModeRef.current = false;
        document.body.classList.remove('modifier-pressed');
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFFSwipeToDeleteEdgeEnabled, handleMouseDown, handleMouseUp]);

  // Export the drag state for use in CustomEdge - swipe mode with grace period
  const getDragState = useCallback(
    () => ({
      isDragging: isSwipeModeRef.current && isModifierPressedRef.current,
      isModifierPressed: isModifierPressedRef.current,
    }),
    [],
  );
  // Return the drag state getter for use in CustomEdge
  return { getDragState };
};
