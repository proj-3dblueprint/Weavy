import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { validateFile } from '@/utils/nodeInputValidation';
import { HandleType } from '@/enums/handle-type.enum';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { log } from '@/logger/logger';
import { FF_NODE_GRID_VIEW } from '@/consts/featureFlags';
import { NodeViewMode } from '@/enums/node-view-mode.enum';
import { useNodeViewModesMenuItems } from '@/hooks/nodes/useNodeViewModeMenu';
import { FileUploaderV2 } from '../../Common/FileUploaderV2';
import { useImportView } from '../../Recipe/FlowContext';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { ImportNodeViewer } from './ImportNodeViewer';
import type { Handle, ImportData } from '@/types/node';
import type { MediaAsset } from '@/types/api/assets';

const logger = log.getLogger('ImportNode');
function ImportNode({
  id,
  data,
  updateNodeData,
}: {
  id: string;
  data: ImportData;
  updateNodeData: (id: string, data: Partial<ImportData>) => void;
}) {
  const role = useUserWorkflowRole();
  const importView = useImportView(id);
  const nodeGridViewEnabled = useFeatureFlagEnabled(FF_NODE_GRID_VIEW);
  const [isUploadFormUploading, setIsUploadFormUploading] = useState(false);
  const [viewMode, setViewMode] = useState<NodeViewMode>(NodeViewMode.Single);

  const { handles, pastedData, initialData, selectedIndex, files } = data;
  const editable = data.isLocked !== true && role === 'editor';

  const selectedFile = files[selectedIndex];

  const onUpload = useCallback(
    async (file: Partial<MediaAsset> | null) => {
      const fileKind = validateFile(file);
      logger.info('file upload success', { fileKind });
      if (fileKind) {
        await importView.addFile(fileKind, false);
      }
    },
    [importView],
  );

  useEffect(() => {
    // Handle 3D file specific logic
    const hasImageHandle = handles?.output?.['image'] !== undefined;
    if (selectedFile?.type === '3D' && !hasImageHandle) {
      const handle: Handle = {
        description: '',
        format: 'uri',
        id: uuidv4(),
        label: 'image',
        order: 1,
        required: false,
        type: HandleType.Image,
      };

      updateNodeData(id, {
        handles: {
          ...handles,
          output: {
            ...handles?.output,
            image: handle,
          },
        },
      });
    }
  }, [id, updateNodeData, handles, selectedFile]);

  useEffect(() => {
    if (initialData) {
      const fileKind = validateFile(initialData);
      if (fileKind) {
        void importView.setFiles([fileKind], undefined, false);
      }
    }
  }, [id, importView, initialData]);

  const onInitialFileUpload = useCallback(
    (hadError: boolean) => {
      if (hadError) {
        importView.clearPastedAndInitialData();
      }
    },
    [importView],
  );
  const viewModeMenuItems = useNodeViewModesMenuItems(viewMode, setViewMode);

  return (
    <DynamicNode2
      id={id}
      data={data}
      className="import"
      additionalMenu={nodeGridViewEnabled ? viewModeMenuItems : undefined}
    >
      {files.length > 0 && selectedFile && !isUploadFormUploading ? (
        <ImportNodeViewer id={id} files={files} selectedIndex={selectedIndex} onUpload={onUpload} viewMode={viewMode} />
      ) : (
        <FileUploaderV2
          allowUrlInput
          disabled={!editable}
          id={id}
          initialFile={(pastedData?.imageFile as File) || undefined}
          onUpload={onUpload}
          value={selectedFile}
          isFileValid={(file) => {
            return validateFile(file) !== undefined;
          }}
          setIsUploading={setIsUploadFormUploading}
          isUploading={isUploadFormUploading}
          onInitialFileUpload={onInitialFileUpload}
        />
      )}
    </DynamicNode2>
  );
}

export default ImportNode;
