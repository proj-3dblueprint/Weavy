import { PropsWithChildren, useEffect } from 'react';
import init, { setLogger } from 'web';
import { log } from '@/logger/logger.ts';
import { useWorkflowStore } from '@/state/workflow.state';

type WasmProviderProps = PropsWithChildren;

const logger = log.getLogger('Wasm');
export function WasmProvider({ children }: WasmProviderProps) {
  const setLoadingState = useWorkflowStore((state) => state.setLoadingState);
  const wasmLoadingState = useWorkflowStore((state) => state.loadingStates.get('wasm'));

  useEffect(() => {
    const f = async () => {
      setLoadingState('wasm', 'loading');
      try {
        await init();
        setLogger((type: string, msg: string) => {
          switch (type) {
            case 'TRACE':
              logger.trace(msg);
              break;
            case 'DEBUG':
              logger.debug(msg);
              break;
            case 'INFO':
              logger.info(msg);
              break;
            case 'WARN':
              logger.warn(msg);
              break;
            case 'ERROR':
              logger.error(msg);
              break;
          }
        });
        setLoadingState('wasm', 'loaded');
      } catch (error) {
        logger.error('Error initializing wasm', error);
        setLoadingState('wasm', 'error');
      }
    };
    if (wasmLoadingState === 'initial') {
      void f();
    }
  }, [setLoadingState, wasmLoadingState]);

  if (wasmLoadingState !== 'loaded') {
    return null;
  }

  return children;
}
