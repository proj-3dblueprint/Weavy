import { useCallback, useState } from 'react';
import { useDropzone, type DropEvent, type FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { getAxiosInstance } from '@/services/axiosConfig';
import { validateFile } from '@/utils/nodeInputValidation';
import { log } from '@/logger/logger';
import { getFilteredAcceptedFileTypes } from '@/utils/fileTypes';
import { useGlobalStore } from '@/state/global.state';
import { I18N_KEYS } from '@/language/keys';
import type { MediaAsset } from '@/types/api/assets';
import type { AxiosProgressEvent } from 'axios';

const axiosInstance = getAxiosInstance();
const logger = log.getLogger('useUploadMediaAsset');

type UseUploadMediaAssetErrors = 'invalid_url' | 'upload_error' | 'invalid_file_type';

type FileType = 'image' | 'video' | 'audio' | '3D' | 'unknown';

interface UseUploadMediaAssetProps {
  disabled?: boolean;
  onUpload: (uploadData: MediaAsset) => Promise<void>;
  allowMultiple?: boolean;
  // Emphasizing that this can and should be undefined, until a file is chosen
  fileType?: FileType | undefined;
  setIsUploading?: (isUploading: boolean) => void;
  acceptedFileType?: string;
}

export const useUploadMediaAsset = ({
  disabled = false,
  onUpload,
  allowMultiple = false,
  fileType = undefined,
  setIsUploading,
  acceptedFileType,
}: UseUploadMediaAssetProps) => {
  const { t } = useTranslation();
  const [uploadedFileType, setUploadedFileType] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<UseUploadMediaAssetErrors | null>(null);
  const { updateSnackbarData } = useGlobalStore();
  const handleError = useCallback(
    (error: UseUploadMediaAssetErrors, params?: { invalidFileTypeCount?: number; fileType?: FileType }) => {
      setError(error);
      let text = t(I18N_KEYS.GENERAL.UPLOAD_ERROR);
      switch (error) {
        case 'invalid_url':
          text = t(I18N_KEYS.GENERAL.INVALID_URL);
          break;
        case 'upload_error':
          text = t(I18N_KEYS.GENERAL.UPLOAD_ERROR);
          break;
        case 'invalid_file_type': {
          let fileTypeKey: keyof typeof I18N_KEYS.GENERAL.FILE_TYPES = 'IMAGE';
          switch (params?.fileType) {
            case 'video':
              fileTypeKey = 'VIDEO';
              break;
            case 'audio':
              fileTypeKey = 'AUDIO';
              break;
            case '3D':
              fileTypeKey = 'THREE_D';
              break;
            default:
              fileTypeKey = 'IMAGE';
              break;
          }
          text = t(I18N_KEYS.RECIPE_MAIN.NODES.IMPORT_NODE.UPLOAD_ERROR_INVALID_FILE_TYPE, {
            count: params?.invalidFileTypeCount,
            fileType: t(I18N_KEYS.GENERAL.FILE_TYPES[fileTypeKey], {
              // In this scenario we always want the plural form
              count: 2,
              context: 'lower',
            }),
          });
          break;
        }
      }
      updateSnackbarData({
        text,
        severity: 'error',
        icon: null,
        isOpen: true,
      });
    },
    [t, updateSnackbarData],
  );

  const isInProgress = uploadProgress > 0 && uploadProgress < 100;

  const uploadSuccess = useCallback(
    async (uploadData: MediaAsset) => {
      setUploadProgress(100);
      setPreviewImage(uploadData.viewUrl || uploadData.thumbnailUrl);
      setUploadedFileType(uploadData.type);
      await onUpload(uploadData);
    },
    [onUpload],
  );

  const onUploadProgress = useCallback((progressEvent: AxiosProgressEvent) => {
    const total = progressEvent.total ?? progressEvent.loaded;
    const progress = Math.round((progressEvent.loaded / total) * 95);
    setUploadProgress(progress);
  }, []);

  const handleUploadStart = useCallback((fileType: string, previewSrc: string) => {
    setError(null);
    setUploadedFileType(fileType);
    setPreviewImage(previewSrc);
    setUploadProgress(0);
  }, []);

  const resetUpload = useCallback(() => {
    setError(null);
    setUploadedFileType('');
    setPreviewImage('');
    setUploadProgress(0);
  }, []);

  const executeUpload = useCallback(
    async (uploadData: FormData | null, params?: Record<string, string>) => {
      try {
        logger.info('file upload start', { uploadData, params });
        const response = await axiosInstance.post<MediaAsset>(`/v1/assets/upload`, uploadData, {
          params,
          onUploadProgress,
        });

        if (!validateFile(response.data)) {
          throw new Error('Invalid file response: ' + JSON.stringify(response.data));
        }

        await uploadSuccess(response.data);
      } catch (err) {
        logger.error('Error uploading:', err);
        handleError('upload_error');
        throw err;
      } finally {
        setUploadProgress(0);
      }
    },
    [handleError, onUploadProgress, uploadSuccess],
  );

  const detectFileType = useCallback((file: File): { type: FileType; previewSrc: string } => {
    const fileName = file.name.toLowerCase();

    if (file.type.startsWith('video')) {
      return { type: 'video', previewSrc: URL.createObjectURL(file) };
    } else if (file.type.startsWith('image')) {
      return { type: 'image', previewSrc: URL.createObjectURL(file) };
    } else if (file.type.startsWith('audio')) {
      return { type: 'audio', previewSrc: '/audio.png' };
    } else if (fileName.endsWith('.glb')) {
      return { type: '3D', previewSrc: '' };
    } else if (fileName.endsWith('.heic')) {
      return { type: 'image', previewSrc: '' };
    }

    return { type: 'unknown', previewSrc: '' };
  }, []);

  const uploadFile = useCallback(
    async (file: File, fileInfo?: { type: FileType; previewSrc: string }) => {
      const { type, previewSrc } = fileInfo || detectFileType(file);
      handleUploadStart(type, previewSrc);

      const formData = new FormData();
      formData.append('file', file);
      if (file.type || file.name.toLowerCase().endsWith('.heic')) {
        formData.append('type', file.type || 'image/heic');
      }

      await executeUpload(formData);
    },
    [detectFileType, handleUploadStart, executeUpload],
  );

  const onLinkUpload = useCallback(
    async (link: string) => {
      const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
      if (!urlPattern.test(link)) {
        logger.error('Invalid URL');
        handleError('invalid_url');
        return;
      }

      handleUploadStart('image', link);
      await executeUpload(null, { file: link });
    },
    [handleUploadStart, executeUpload, handleError],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], _rejectedFiles?: FileRejection[], event?: DropEvent) => {
      if (event) {
        // Ensure the event doesn't bubble up to the Flow component
        const e = event as unknown as DragEvent;
        e.stopPropagation();
        e.preventDefault();
      }
      const uploadPromises: Promise<void>[] = [];
      if (acceptedFiles.length > 0) {
        if (allowMultiple) {
          let selectedFileType = fileType;
          let invalidFileTypeCount = 0;
          acceptedFiles.forEach((file) => {
            const { type, previewSrc } = detectFileType(file);
            if (selectedFileType && selectedFileType !== type) {
              invalidFileTypeCount++;
              return;
            }
            selectedFileType = type;
            uploadPromises.push(uploadFile(file, { type, previewSrc }));
          });
          if (invalidFileTypeCount > 0) {
            handleError('invalid_file_type', { invalidFileTypeCount, fileType: selectedFileType });
          }
        } else {
          const file = acceptedFiles[0];
          uploadPromises.push(uploadFile(file));
        }
      }
      setIsUploading?.(true);
      Promise.all(uploadPromises)
        .then(() => {
          setIsUploading?.(false);
        })
        .catch((error) => {
          setIsUploading?.(false);
          // dropzone is catching errors, so we log them here instead of throwing for visibility
          // eslint-disable-next-line no-console
          console.error('Error uploading files', error);
        });
    },
    [setIsUploading, allowMultiple, fileType, detectFileType, uploadFile, handleError],
  );

  /**
   *
   * @returns a list of accepted file types based on the accepted file type or current file type.
   * If none is provided, return all accepted file types.
   */
  const getAcceptedFileTypesToUpload = useCallback(() => {
    const fileTypesValues = Object.values(getFilteredAcceptedFileTypes(acceptedFileType || fileType)).flat();
    return fileTypesValues.join(',');
  }, [acceptedFileType, fileType]);

  const dropzoneState = useDropzone({
    onDrop,
    accept: getFilteredAcceptedFileTypes(acceptedFileType || fileType),
    multiple: true,
    disabled: disabled || isInProgress,
    preventDropOnDocument: true,
  });

  return {
    dropzoneState,
    error,
    isInProgress,
    onLinkUpload,
    previewImage,
    resetUpload,
    uploadFile,
    uploadProgress,
    uploadedFileType,
    getAcceptedFileTypesToUpload,
  };
};
