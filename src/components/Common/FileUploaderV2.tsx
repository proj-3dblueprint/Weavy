import React, { useState, useCallback, useId, useEffect, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { useIsHovered } from '@/hooks/useIsHovered';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useUploadMediaAsset } from '@/hooks/useUploadMediaAsset';
import { FlexCol } from '@/UI/styles';
import { UploadForm } from './FileUploader/UploadForm';
import { FileDisplay } from './FileUploader/FileDisplay';
import type { ThreeDProps } from './ImageList/types';
import type { MediaAsset } from '@/types/api/assets';

const logger = log.getLogger('FileUploader');

export type FileUploaderProps = {
  allowRemove?: boolean;
  allowUrlInput?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  id: string;
  initialFile?: File;
  isLoading?: boolean;
  maxHeight?: number;
  onInitialFileUpload?: (hadError: boolean) => void;
  onUpload: (file: Partial<MediaAsset> | null) => Promise<void>;
  value?: Partial<MediaAsset> | null;
  isSelected?: boolean;
  showMediaWhileLoading?: boolean;
  threeDProps?: ThreeDProps;
  isFileValid?: (file: MediaAsset) => boolean;
  setIsUploading?: (isUploading: boolean) => void;
  isUploading?: boolean;
  acceptedFileType?: string;
};

export const FileUploaderV2 = ({
  id,
  value,
  onUpload,
  allowRemove = false,
  allowUrlInput = false,
  disabled = false,
  error: initialError = false,
  initialFile,
  maxHeight = undefined,
  onInitialFileUpload,
  isSelected = false,
  showMediaWhileLoading = true,
  threeDProps,
  setIsUploading,
  isUploading,
  acceptedFileType,
}: FileUploaderProps) => {
  const uniqueId = useId(); // to avoid conflicts with multiple upload components
  const { t } = useTranslation();
  const {
    dropzoneState,
    error,
    isInProgress,
    onLinkUpload,
    previewImage,
    resetUpload,
    uploadFile,
    uploadedFileType,
    getAcceptedFileTypesToUpload,
  } = useUploadMediaAsset({ onUpload, disabled, allowMultiple: true, setIsUploading, acceptedFileType });
  const [valuePreviewImage, setValuePreviewImage] = useState(value?.viewUrl || value?.thumbnailUrl);
  const [valueUploadedFileType, setValueUploadedFileType] = useState(value?.type);
  const { isHovered, ...elementProps } = useIsHovered();
  const isUploadingRef = useRef(false);
  const acceptedFileTypes = getAcceptedFileTypesToUpload();
  const inputId = `file-upload-input-${id}-${uniqueId}`;
  const fileIsSet = (previewImage || value?.url) && !error;

  useEffect(() => {
    if (value) {
      setValuePreviewImage(value.viewUrl || value.thumbnailUrl);
      setValueUploadedFileType(value.type);
    }
  }, [value, value?.thumbnailUrl, value?.type]);

  const handleRemoveFile = useCallback(async () => {
    try {
      await onUpload({ url: '', thumbnailUrl: '', type: undefined });
      setValuePreviewImage(undefined);
      setValueUploadedFileType(undefined);
      resetUpload();
    } catch (error) {
      logger.error('Error removing file.', error);
    }
  }, [onUpload, resetUpload]);

  const removeFile = useCallback(() => {
    if (isInProgress) return;
    void handleRemoveFile();
  }, [isInProgress]);

  useEffect(() => {
    if (initialFile && !isUploadingRef.current) {
      isUploadingRef.current = true;
      setIsUploading?.(true);
      uploadFile(initialFile)
        .then(() => {
          onInitialFileUpload?.(false);
          isUploadingRef.current = false;
          setIsUploading?.(false);
        })
        .catch((error) => {
          logger.error('Error uploading initial file.', error);
          onInitialFileUpload?.(true);
          isUploadingRef.current = false;
          setIsUploading?.(false);
        });
    }
  }, [initialFile, onInitialFileUpload, setIsUploading, uploadFile]);

  const openFileUploader = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const inputElement = document.getElementById(inputId);
      inputElement?.click();
    },
    [inputId],
  );

  const borderColor = useMemo(() => {
    if (initialError) return color.Yambo_Orange;
    return 'transparent';
  }, [initialError]);

  return (
    <FlexCol sx={{ gap: 1 }}>
      <FlexCol sx={{ gap: 1 }}>
        <FlexCol
          {...dropzoneState.getRootProps()}
          sx={{
            width: '100%',
            position: 'relative',
            transition: 'all 0.1s ease',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              border: `1px solid ${borderColor}`,
            }}
            {...elementProps}
          >
            {fileIsSet || isInProgress || isUploading ? (
              <FileDisplay
                isHovered={isHovered}
                maxHeight={maxHeight}
                openFileUploader={openFileUploader}
                previewImage={previewImage || valuePreviewImage}
                isInProgress={isInProgress || isUploading}
                uploadedFileType={uploadedFileType || valueUploadedFileType}
                value={value}
                showMediaWhileLoading={showMediaWhileLoading}
                threeDProps={threeDProps}
              />
            ) : (
              <UploadForm
                allowUrlInput={allowUrlInput}
                getInputProps={dropzoneState.getInputProps}
                onLinkUpload={onLinkUpload}
                isSelected={isSelected}
              />
            )}
          </Box>

          <input
            id={inputId}
            type="file"
            style={{ display: 'none' }}
            {...dropzoneState.getInputProps()}
            accept={acceptedFileTypes}
          />
        </FlexCol>
        {allowRemove && fileIsSet ? (
          <Box>
            <ButtonContained
              mode="text"
              size="small"
              startIcon={<i className="fa-light fa-trash" />}
              onClick={removeFile}
              disabled={isInProgress}
            >
              {t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.REMOVE_FILE)}
            </ButtonContained>
          </Box>
        ) : null}
      </FlexCol>
    </FlexCol>
  );
};
