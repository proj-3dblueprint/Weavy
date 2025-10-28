import { Box } from '@mui/material';
import { useCallback, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { color } from '@/colors';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { XIcon } from '@/UI/Icons/XIcon';
import { BaseNodeData } from '@/types/node';
import { useHotkeyScope } from '@/hooks/useHotkeyScope';
import { TOOLBAR_WIDTH_V2 } from '../../consts/ui';
import { useFlowView, useNodeNullable } from '../../FlowContext';
import { Photopea } from './photopea/Photopea';
import CompositorV2 from './CompositorV2';
import { DesignerEditor } from './Designer/DesignerEditor';
import { useEditorStore } from './editor.state';
import type { NodeId } from 'web';
import type { CompositorData } from '@/types/nodes/compositor';

interface NodeData {
  input: Record<string, { url: string }>;
  handles: { input: string[] };
  result: { url: string };
  data?: CompositorData;
}

// hack for nullable node id
const invalidNodeId = '';

export function Editor() {
  const cleanupRef = useRef<(() => Promise<void> | void) | null>(null);
  const nodeId = useEditorStore((selector) => selector.nodeId);
  const onClose = useEditorStore((selector) => selector.onClose);
  const flowView = useFlowView();

  const updateNodeData = useCallback(
    (nodeId: NodeId, data: Partial<BaseNodeData>) => {
      flowView.updateNodeData(nodeId, data);
    },
    [flowView],
  );

  const updateResult = useCallback(
    (data: unknown) => {
      if (!nodeId) return;
      updateNodeData(nodeId, { result: data });
    },
    [updateNodeData, nodeId],
  );

  const node = useNodeNullable(nodeId ?? invalidNodeId);
  const { data, type } = node || {};
  const { input, result } = (data as NodeData) || {};
  const srcFileUrl = input?.['file']?.url || '';
  const psdFileUrl = result?.url || '';

  const setCleanup = useCallback((cleanup: () => Promise<void> | void) => {
    cleanupRef.current = cleanup;
  }, []);

  const cleanUpAndClose = useCallback(() => {
    if (cleanupRef.current) {
      const result = cleanupRef.current();
      if (result instanceof Promise) {
        result.then(onClose).catch(onClose);
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  }, [onClose]);

  useHotkeyScope('editor');

  useHotkeys('Escape', cleanUpAndClose, { scopes: 'editor' });

  return (
    <Box
      data-testid="editor-container"
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: color.Black100,
        display: 'flex',
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: TOOLBAR_WIDTH_V2,
          backgroundColor: color.Black92,
          border: '1px solid',
          borderColor: color.White08_T,
          display: 'flex',
          justifyContent: 'center',
          px: 1.25,
          py: 2,
        }}
      >
        <AppIconButton width={36} height={36} onClick={cleanUpAndClose}>
          <XIcon height={24} width={24} />
        </AppIconButton>
      </Box>
      {type === 'edit' && (
        <Photopea src={srcFileUrl} psdSrc={psdFileUrl} setCleanup={setCleanup} updateResult={updateResult} />
      )}
      {type === 'compv2' && (
        <CompositorV2 id={nodeId} data={data} updateNodeData={updateNodeData} onClose={onClose} container="editor" />
      )}
      {type === 'compv3' && nodeId && <DesignerEditor id={nodeId} setCleanup={setCleanup} />}
    </Box>
  );
}
