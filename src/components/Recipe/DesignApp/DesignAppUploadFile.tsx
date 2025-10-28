import React from 'react';
import { FileUploader } from '../../Common/FileUploader';
import type { MediaAsset } from '@/types/api/assets';

type DesignAppUploadFileProps = {
  error?: boolean;
  helperText?: string;
  id: string;
  isLoading: boolean;
  onUpload: (id: string, file: { file: Partial<MediaAsset> | null }) => void;
  setIsUploading: (isUploading: boolean) => void;
  value: { file: Partial<MediaAsset> };
  isGuest: boolean;
  acceptedFileType?: string;
};

const DESIGN_APP_FILE_MAX_HEIGHT = 300;

function DesignAppUploadFile({
  id,
  value,
  onUpload,
  isLoading,
  setIsUploading,
  acceptedFileType,
  error,
  helperText,
  isGuest,
}: DesignAppUploadFileProps) {
  const handleUpload = (file: Partial<MediaAsset> | null) => {
    setIsUploading(false);
    onUpload(id, { file });
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  return (
    <FileUploader
      id={id}
      allowRemove={!isGuest}
      value={value?.file}
      disabled={isGuest}
      onUpload={handleUpload}
      onUploadStart={handleUploadStart}
      isLoading={isLoading}
      error={error}
      helperText={helperText}
      showInnerLoader
      maxHeight={DESIGN_APP_FILE_MAX_HEIGHT}
      acceptedFileType={acceptedFileType}
    />
  );
}

export default DesignAppUploadFile;
