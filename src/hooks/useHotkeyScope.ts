import { useEffect } from 'react';
import { useHotkeysContext } from 'react-hotkeys-hook';
import type { HotkeysScopes } from '@/types/hotkeyScopes';

export const useHotkeyScope = (scope: HotkeysScopes) => {
  const { enableScope, disableScope } = useHotkeysContext();

  useEffect(() => {
    enableScope(scope);
    return () => {
      disableScope(scope);
    };
  }, [enableScope, disableScope, scope]);
};
