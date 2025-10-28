import { useEffect, useRef } from 'react';
import { useHotkeysContext } from 'react-hotkeys-hook';
import type { HotkeysScopes } from '@/types/hotkeyScopes';

export const useHotkeysUniqueScope = (scope: HotkeysScopes, enabled: boolean) => {
  const { activeScopes, enableScope, disableScope } = useHotkeysContext();

  const activeScopesRef = useRef(activeScopes);

  useEffect(() => {
    if (!enabled) return;
    const initiallyActive = activeScopesRef.current.filter((s) => s !== scope);
    initiallyActive.forEach(disableScope);
    enableScope(scope);
    return () => {
      initiallyActive.forEach(enableScope);
      disableScope(scope);
    };
  }, [enableScope, disableScope, scope, enabled]);
};
