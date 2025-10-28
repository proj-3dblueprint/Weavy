import { useCallback, useEffect, useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { validateFile } from '@/utils/nodeInputValidation';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { ImageIteratorIcon } from '@/UI/Icons';
import { NodeViewMode } from '@/enums/node-view-mode.enum';
import { useNodeViewModesMenuItems } from '@/hooks/nodes/useNodeViewModeMenu';
import { FF_NODE_GRID_VIEW } from '@/consts/featureFlags';
import { FileUploaderV2 } from '../../Common/FileUploaderV2';
import { useMediaIteratorView } from '../../Recipe/FlowContext';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { ImportNodeViewer } from './../ImportNode/ImportNodeViewer';
import type { MediaIteratorData } from '@/types/node';
import type { MediaAsset } from '@/types/api/assets';

function MediaIteratorNode({ id, data }: { id: string; data: MediaIteratorData }) {
  const role = useUserWorkflowRole();
  const mediaIteratorView = useMediaIteratorView(id);
  const [isUploadFormUploading, setIsUploadFormUploading] = useState(false);
  const [viewMode, setViewMode] = useState<NodeViewMode>(NodeViewMode.Single);
  const { pastedData, initialData, selectedIndex } = data;
  const files = mediaIteratorView.getFilesList();
  const acceptedFileType = 'image';
  const editable = data.isLocked !== true && role === 'editor';
  const nodeGridViewEnabled = useFeatureFlagEnabled(FF_NODE_GRID_VIEW);

  const selectedFile = files[selectedIndex];

  const onUpload = useCallback(
    async (file: Partial<MediaAsset> | null) => {
      const fileKind = validateFile(file);
      if (fileKind) {
        await mediaIteratorView.addFile(fileKind, false);
      }
    },
    [mediaIteratorView],
  );

  useEffect(() => {
    if (initialData) {
      const fileKind = validateFile(initialData);
      if (fileKind) {
        void mediaIteratorView.setFiles([fileKind], undefined, false);
      }
    }
  }, [id, mediaIteratorView, initialData]);

  const onInitialFileUpload = useCallback(
    (hadError: boolean) => {
      if (hadError) {
        mediaIteratorView.clearPastedAndInitialData();
      }
    },
    [mediaIteratorView],
  );
  const viewModeMenuItems = useNodeViewModesMenuItems(viewMode, setViewMode);

  return (
    <DynamicNode2
      id={id}
      data={data}
      icon={<ImageIteratorIcon />}
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
          acceptedFileType={acceptedFileType}
        />
      )}
    </DynamicNode2>
  );
}

export default MediaIteratorNode;
