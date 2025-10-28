import { Box } from '@mui/material';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUploadMediaAsset } from '@/hooks/useUploadMediaAsset';
import { useImportView, useNodeData } from '@/components/Recipe/FlowContext';
import { FlexCol } from '@/UI/styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { GridViewer } from '@/components/GridViewer/GridViewer';
import { I18N_KEYS } from '@/language/keys';
import { ImportData } from '@/types/node';
import { FileKind } from '@/designer/designer';
import { NodeViewMode } from '@/enums/node-view-mode.enum';
import { UploadProgressOverlay } from '../../Common/FileUploader/UploadProgressOverlay';
import { UploadAnotherOverlay } from '../../Common/FileUploader/UploadAnotherOverlay';
import { FileViewer } from '../Shared/FileViewer';
import type { MediaAsset } from '@/types/api/assets';
export const ImportNodeViewer = ({
  id,
  files,
  selectedIndex,
  onUpload,
  viewMode = NodeViewMode.Single,
}: {
  id: string;
  files: FileKind[];
  selectedIndex: number;
  onUpload: (file: Partial<MediaAsset> | null) => Promise<void>;
  viewMode?: NodeViewMode;
}) => {
  const { t } = useTranslation();
  const importView = useImportView(id);
  const selectedFile = files[selectedIndex];
  const fileType = selectedFile?.type;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { dropzoneState, isInProgress, getAcceptedFileTypesToUpload } = useUploadMediaAsset({
    onUpload,
    allowMultiple: true,
    fileType,
  });

  const getAddMoreTextBasedOnCurrentFile = useCallback(() => {
    switch (selectedFile?.type) {
      case 'image':
        return t(I18N_KEYS.RECIPE_MAIN.NODES.IMPORT_NODE.ADD_MORE_IMAGES);
      case 'video':
        return t(I18N_KEYS.RECIPE_MAIN.NODES.IMPORT_NODE.ADD_MORE_VIDEOS);
      case 'audio':
        return t(I18N_KEYS.RECIPE_MAIN.NODES.IMPORT_NODE.ADD_MORE_AUDIO);
      case '3D':
        return t(I18N_KEYS.RECIPE_MAIN.NODES.IMPORT_NODE.ADD_MORE_3D_FILES);
      default:
        return t(I18N_KEYS.RECIPE_MAIN.NODES.IMPORT_NODE.ADD_MORE_FILES);
    }
  }, [selectedFile, t]);

  const handleBack = useCallback(() => {
    const steps = files.length;
    const newIndex = selectedIndex === 0 ? steps - 1 : selectedIndex - 1;
    void importView.setSelectedIndex(newIndex, false);
  }, [importView, files, selectedIndex]);

  const handleNext = useCallback(() => {
    const steps = files.length;
    const newIndex = selectedIndex === steps - 1 ? 0 : selectedIndex + 1;
    void importView.setSelectedIndex(newIndex, false);
  }, [importView, files, selectedIndex]);

  const handleAddMoreImages = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handle3DLockStateChange = useCallback(
    (locked: boolean) => {
      importView.setCameraLocked(locked);
    },
    [importView],
  );

  const handleFileSelect = useCallback(
    (index: number) => {
      void importView.setSelectedIndex(index, false);
    },
    [importView],
  );

  const nodeData = useNodeData<ImportData>(id);
  const isCameraLocked = nodeData.cameraOptions?.locked ?? false;
  const steps = files.length;
  const isNodeLocked = nodeData.isLocked ?? false;
  const isVideo = selectedFile?.type === 'video';
  const dragOverlayBottomMargin = isVideo ? 64 : 0;

  return (
    <FlexCol sx={{ width: '100%', height: '100%', gap: 2 }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          cursor: 'default',
          position: 'relative',
        }}
        {...dropzoneState.getRootProps()}
      >
        {viewMode === NodeViewMode.Single ? (
          <>
            <FileViewer
              id={id}
              index={selectedIndex}
              asset={selectedFile}
              handleBack={handleBack}
              handleNext={handleNext}
              selected={selectedIndex}
              steps={steps}
              isNodeLocked={isNodeLocked}
              isCameraLocked={isCameraLocked}
              on3DLockStateChange={handle3DLockStateChange}
            />
            {isInProgress ? <UploadProgressOverlay /> : null}
            {dropzoneState.isDragActive ? (
              <UploadAnotherOverlay
                show={dropzoneState.isDragActive}
                sx={{ bottom: dragOverlayBottomMargin, borderRadius: '7px' }}
              />
            ) : null}
          </>
        ) : (
          <GridViewer
            nodeId={id}
            files={files}
            selectedIndex={selectedIndex}
            onFileSelect={handleFileSelect}
            isNodeLocked={isNodeLocked}
            on3DLockStateChange={handle3DLockStateChange}
          />
        )}
      </Box>

      <ButtonContained
        mode="text"
        size="small"
        onClick={handleAddMoreImages}
        disabled={isInProgress}
        sx={{ alignSelf: 'flex-start' }}
      >
        + {getAddMoreTextBasedOnCurrentFile()}
      </ButtonContained>
      <input
        type="file"
        style={{ display: 'none' }}
        {...dropzoneState.getInputProps()}
        ref={fileInputRef}
        accept={getAcceptedFileTypesToUpload()}
      />
    </FlexCol>
  );
};
