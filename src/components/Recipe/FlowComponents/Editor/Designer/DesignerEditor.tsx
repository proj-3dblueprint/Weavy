import { Alert, Box, Snackbar } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useCompositorView, useOnFlowError } from '@/components/Recipe/FlowContext';
import { useCursor } from './useCursor';
import { LayerPanel } from './LayerPanel/LayerPanel';
import { DesignerEditorActionsBar } from './NavigationPanel';
import { CompositorCanvas } from './CompositorCanvas';
import { LayerPropertyPanel } from './LayerPropertyPanel/LayerPropertyPanel';
import type { NodeId } from 'web';

interface DesignerEditorProps {
  id: NodeId;
  setCleanup: (cleanup: () => Promise<void> | void) => void;
}

export function DesignerEditor({ id, setCleanup }: DesignerEditorProps) {
  const compositorView = useCompositorView(id);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cursor = useCursor(id);

  const onError = useCallback(
    (err: { message: string; recovered: boolean }) => {
      const { message, recovered } = err;
      if (recovered) {
        compositorView.enableNodeEditor();
      }
      setErrorMessage(message);
    },
    [compositorView],
  );
  useOnFlowError(onError);

  const handleClose = useCallback(() => {
    compositorView.disableNodeEditor();
    compositorView.disableUndoBarrier();
    compositorView.renderResult();
  }, [compositorView]);

  // On exit, clear the editor
  // TODO: Move this logic when moving the editor to a new component
  useEffect(() => {
    setCleanup(handleClose);
  }, [handleClose, setCleanup]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e instanceof KeyboardEvent) {
        const isCtrl = e.getModifierState('Control') || e.getModifierState('Meta');
        if (isCtrl && (e.key === 'z' || e.key === 'Z')) {
          if (e.getModifierState('Shift')) {
            compositorView.redo();
          } else {
            compositorView.undo();
          }
        }

        // if (e.key === 'Backspace' || e.key === 'Delete') {
        //   const selectedLayerIds = compositorView.selectedLayersIds();
        //   if (selectedLayerIds.length > 0) {
        //     compositorView.removeLayers(id, selectedLayerIds);
        //   }
        // }

        if ((isCtrl && e.key === '=') || e.key === '+') {
          const zoomLevel = compositorView.zoomLevel();
          compositorView.setZoomLevel(zoomLevel * 1.1);
          e.preventDefault();
        }

        if (isCtrl && e.key === '-') {
          const zoomLevel = compositorView.zoomLevel();
          compositorView.setZoomLevel(zoomLevel / 1.1);
          e.preventDefault();
        }

        if (isCtrl && e.key === '0') {
          compositorView.setZoomLevel(1);
          e.preventDefault();
        }

        if (isCtrl && e.key === '1') {
          compositorView.zoomToFit();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [compositorView]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,

          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          width: '100%',

          userSelect: 'none',
          pointerEvents: 'none',
          '& > *': {
            pointerEvents: 'auto',
          },

          cursor,
        }}
      >
        {/* Left Panel */}
        <LayerPanel nodeId={id} />

        {/* Center Area */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          <CompositorCanvas />
          <DesignerEditorActionsBar nodeId={id} />
        </Box>

        {/* Right Panel */}
        <LayerPropertyPanel nodeId={id} />

        <Snackbar
          open={errorMessage !== null}
          autoHideDuration={5000}
          onClose={() => setErrorMessage(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setErrorMessage(null)}
            severity="error"
            variant="filled"
            sx={{ width: '100%', '& .MuiAlert-icon': { display: 'none' } }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
