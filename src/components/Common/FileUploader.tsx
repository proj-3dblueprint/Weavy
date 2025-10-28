import { useState, useCallback, useId, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, LinearProgress, OutlinedInput, InputAdornment } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { DropEvent, DropzoneState, FileRejection, useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { getAxiosInstance } from '@/services/axiosConfig';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { useIsHovered } from '@/hooks/useIsHovered';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { getFilteredAcceptedFileTypes } from '@/utils/fileTypes';
import ThreeDeeViewer from '../Nodes/ThreeDeeViewer';
import type { AxiosProgressEvent } from 'axios';
import type { MediaAsset } from '@/types/api/assets';

const logger = log.getLogger('FileUploader');
const axiosInstance = getAxiosInstance();

type FileDisplayProps = {
  isHovered: boolean;
  maxHeight?: number;
  openFileUploader: (e: React.MouseEvent<HTMLDivElement>) => void;
  previewImage?: string;
  showLoader?: boolean;
  uploadProgress: number;
  uploadedFileType?: string;
  value?: Partial<MediaAsset> | null;
  disabled?: boolean;
};

const MediaElement = ({
  url,
  type,
  poster,
  maxHeight,
}: {
  url?: string;
  type?: string;
  poster?: string;
  maxHeight?: number;
}) => {
  const { t } = useTranslation();

  if (!url) return null;
  if (type === 'video') {
    let extension = url.split('.').pop();
    if (extension?.includes('?')) {
      extension = extension.split('?')[0];
    }
    if (extension === 'mov') extension = 'mp4';
    return (
      <video
        key={url}
        poster={poster}
        draggable={false}
        crossOrigin="anonymous"
        width="100%"
        style={{ display: 'block' }}
        controls
        loop
      >
        <source src={url} type={`video/${extension}`} />
      </video>
    );
  } else if (type === 'image') {
    return (
      <img
        draggable={false}
        src={url}
        alt="Media"
        style={{ display: 'block', height: 'auto', maxHeight, objectFit: 'contain', width: '100%' }}
      />
    );
  } else if (type === 'audio') {
    return (
      <audio
        className="file-uploader-audio"
        draggable="false"
        crossOrigin="anonymous"
        src={url}
        controls
        style={{ display: 'block' }}
      />
    );
  } else if (type === '3D') {
    return <ThreeDeeViewer objUrl={url} />;
  } else {
    return <Typography>{t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.NO_PREVIEW)}</Typography>;
  }
};

const FileDisplay = ({
  previewImage,
  uploadedFileType,
  value,
  openFileUploader,
  showLoader = false,
  uploadProgress,
  isHovered,
  maxHeight,
  disabled,
}: FileDisplayProps) => {
  const { t } = useTranslation();

  const isImage = uploadedFileType === 'image';

  const isLoading = showLoader && uploadProgress > 0 && uploadProgress < 100;

  const uploadFile = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isImage) {
        openFileUploader(e);
      } else {
        e.stopPropagation();
      }
    },
    [isImage, openFileUploader],
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        className={uploadedFileType !== 'audio' ? 'media-container' : ''}
        sx={{ width: '100%', height: '100%', cursor: disabled ? undefined : 'pointer' }}
        onClick={disabled ? undefined : uploadFile}
      >
        <MediaElement
          url={value?.url || previewImage}
          type={uploadedFileType}
          poster={previewImage}
          maxHeight={maxHeight}
        />
        {value?.width && value?.height ? (
          <Typography
            variant="label-sm-rg"
            sx={{ position: 'absolute', top: 12, left: 12, textShadow: '0 0 5px rgba(0, 0, 0, 1)' }}
          >
            {value.width}x{value.height}
          </Typography>
        ) : null}
      </Box>
      {isLoading ? (
        <Box sx={{ width: '100%', position: 'absolute', top: 0 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      ) : null}
      {!disabled && isHovered && isImage && (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            height: '100%',
            left: 0,
            position: 'absolute',
            top: 0,
            width: '100%',
            zIndex: 1000,
          }}
          onClick={openFileUploader}
        >
          <Box
            sx={{
              alignItems: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'center',
            }}
          >
            <i className="fa-light fa-photo-film-music" style={{ fontSize: '24px' }}></i>
            <Typography variant="body-sm-rg" fontWeight="bold" color={color.White100}>
              {t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.REPLACE_FILE)}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

type UploadFormProps = {
  error: boolean;
  helperText: string;
  allowUrlInput: boolean;
  getInputProps: DropzoneState['getInputProps'];
  onLinkUpload: (link: string) => Promise<void>;
};

const UploadForm = ({ error, helperText, allowUrlInput, getInputProps, onLinkUpload }: UploadFormProps) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [fileLink, setFileLink] = useState('');

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileLink(e.target.value);
  };

  const onUploadClick = useCallback(() => {
    if (allowUrlInput && fileLink) {
      void onLinkUpload(fileLink);
    }
  }, [allowUrlInput, fileLink, onLinkUpload]);

  const handleInputClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        height: '200px',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: allowUrlInput ? 'column' : 'row',
          gap: 1,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            alignItems: 'center',
            border: '1px dashed',
            borderColor: error ? color.Yambo_Orange : color.White64_T,
            borderRadius: 1,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            width: '100%',
            gap: 1,
          }}
        >
          <i
            className="fa-light fa-photo-film-music"
            style={{
              color: error ? color.Yambo_Orange : color.White64_T,
              fontSize: '24px',
              transition: 'all 0.1s ease',
            }}
          />
          <Typography variant="body-sm-rg" fontWeight="bold" color={error ? color.Yambo_Orange : color.White64_T}>
            {error ? helperText : t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.CTA)}
          </Typography>
        </Box>
        {allowUrlInput ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }} onClick={handleInputClick}>
            <Box>
              <Typography variant="body-sm-rg">{t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.OR)}</Typography>
            </Box>
            <OutlinedInput
              className={isFocused ? 'nowheel nodrag nopan' : ''}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              type="text"
              placeholder={t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.PASTE_LINK)}
              value={fileLink}
              onChange={handleLinkChange}
              fullWidth
              size="small"
              endAdornment={
                <InputAdornment
                  position="end"
                  aria-label="upload-from-link"
                  onClick={onUploadClick}
                  sx={{
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0.25,
                    transition: 'background-color 0.3s ease',
                    '&:hover': {
                      backgroundColor: color.White16_T,
                    },
                  }}
                >
                  <UploadIcon sx={{ fontSize: '1.25rem' }} />
                </InputAdornment>
              }
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

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
  onInitialFileUpload?: () => void;
  onUploadStart?: () => void;
  onUpload: (file: Partial<MediaAsset> | null) => void;
  showInnerLoader?: boolean;
  value?: Partial<MediaAsset> | null;
  acceptedFileType?: string;
};

export const FileUploader = ({
  id,
  value,
  onUpload,
  allowRemove = false,
  allowUrlInput = false,
  disabled = false,
  error = false,
  helperText = '',
  initialFile,
  isLoading = false,
  showInnerLoader = false,
  maxHeight = undefined,
  onInitialFileUpload,
  onUploadStart,
  acceptedFileType,
}: FileUploaderProps) => {
  const uniqueId = useId(); // to avoid conflicts with multiple upload components
  const { t } = useTranslation();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(value?.viewUrl);
  const [uploadedFileType, setUploadedFileType] = useState(value?.type);
  const [hasError, setHasError] = useState(false);
  const { isHovered, ...elementProps } = useIsHovered();
  const isUploadingRef = useRef(false);

  const inputId = `file-upload-input-${id}-${uniqueId}`;
  const inProgress = isLoading || (uploadProgress > 0 && uploadProgress < 100);
  const fileIsSet = (previewImage || value?.url) && !hasError;

  useEffect(() => {
    if (value) {
      setPreviewImage(value.viewUrl);
      setUploadedFileType(value.type);
    }
  }, [value, value?.thumbnailUrl, value?.type]);

  const uploadSuccess = useCallback(
    (uploadData: MediaAsset) => {
      setUploadProgress(100);
      setPreviewImage(uploadData.viewUrl);
      setUploadedFileType(uploadData.type);
      onUpload(uploadData);
    },
    [onUpload],
  );

  const removeFile = useCallback(() => {
    if (inProgress) return;
    onUpload({ url: '', thumbnailUrl: '', type: undefined });
    setPreviewImage(undefined);
    setUploadedFileType(undefined);
  }, [inProgress, onUpload]);

  const onUploadProgress = useCallback((progressEvent: AxiosProgressEvent) => {
    const total = progressEvent.total ?? progressEvent.loaded;
    const progress = Math.round((progressEvent.loaded / total) * 95);
    setUploadProgress(progress);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      onUploadStart?.();
      const fileName = file.name.toLowerCase();

      if (file.type.startsWith('video')) {
        setUploadedFileType('video');
        setPreviewImage(URL.createObjectURL(file));
      } else if (file.type.startsWith('image')) {
        setUploadedFileType('image');
        setPreviewImage(URL.createObjectURL(file));
      } else if (file.type.startsWith('audio')) {
        setUploadedFileType('audio');
        setPreviewImage('/audio.png');
      } else if (fileName.endsWith('.glb')) {
        setUploadedFileType('3D');
        // Preview image doesn't work for heic files
      } else if (fileName.endsWith('.heic')) {
        setUploadedFileType('image');
      }

      const formData = new FormData();
      formData.append('file', file);
      if (file.type || fileName.endsWith('.heic')) {
        formData.append('type', file.type || 'image/heic');
      }

      try {
        setUploadProgress(0);
        const response = await axiosInstance.post<MediaAsset>(`/v1/assets/upload`, formData, {
          onUploadProgress,
        });

        uploadSuccess(response.data);
      } catch (err) {
        logger.error('Error uploading file', err);
        setHasError(true);
      } finally {
        setUploadProgress(0);
      }
    },
    [onUploadProgress, uploadSuccess],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], _rejectedFiles?: FileRejection[], event?: DropEvent) => {
      if (event && 'preventDefault' in event) {
        event.preventDefault();
      }
      setHasError(false);
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        void uploadFile(file);
      }
    },
    [uploadFile],
  );

  useEffect(() => {
    if (initialFile && onInitialFileUpload && !isUploadingRef.current) {
      isUploadingRef.current = true;
      uploadFile(initialFile)
        .then(() => {
          onInitialFileUpload();
          isUploadingRef.current = false;
        })
        .catch((error) => {
          logger.error('Error uploading initial file', error);
        });
    }
  }, [initialFile, onInitialFileUpload, uploadFile]);
  const acceptedFileTypes = getFilteredAcceptedFileTypes(acceptedFileType);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: false,
    disabled: disabled || isLoading,
  });

  const openFileUploader = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const inputElement = document.getElementById(inputId);
      inputElement?.click();
    },
    [inputId],
  );

  const onLinkUpload = useCallback(
    async (link: string) => {
      setUploadProgress(0);
      setHasError(false);
      setPreviewImage(link);
      setUploadedFileType('image');
      const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
      if (!urlPattern.test(link)) {
        logger.error('Invalid URL');
        setHasError(true);
        return;
      }

      try {
        const parsedUrl = new URL(link);
        const filePath = parsedUrl.pathname;
        // const fileUrlPattern = /[/|.|\w|\s|-]*\.(?:jpg|jpeg|png|obj|fbx|glb)/gi;

        if (filePath) {
          const response = await axiosInstance.post<MediaAsset>(`/v1/assets/upload`, null, {
            params: {
              file: link,
            },
            onUploadProgress,
          });

          uploadSuccess(response.data);
        }
      } catch (err) {
        logger.error(err);
        setHasError(true);
      } finally {
        setUploadProgress(0);
      }
    },
    [onUploadProgress, uploadSuccess],
  );

  const borderColor = useMemo(() => {
    if (error) return color.Yambo_Orange;
    return 'transparent';
  }, [error]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {!showInnerLoader && uploadProgress > 0 && uploadProgress < 100 ? (
        <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      ) : null}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box
          {...getRootProps()}
          sx={{
            width: '100%',
            position: 'relative',
            transition: 'all 0.1s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              border: `1px solid ${borderColor}`,
              borderRadius: 1,
            }}
            {...elementProps}
          >
            {fileIsSet ? (
              <FileDisplay
                isHovered={isHovered}
                maxHeight={maxHeight}
                openFileUploader={openFileUploader}
                previewImage={previewImage}
                showLoader={showInnerLoader}
                uploadProgress={uploadProgress}
                uploadedFileType={uploadedFileType}
                value={value}
                disabled={disabled}
              />
            ) : (
              <UploadForm
                error={error}
                helperText={helperText}
                allowUrlInput={allowUrlInput}
                getInputProps={getInputProps}
                onLinkUpload={onLinkUpload}
              />
            )}
          </Box>

          <input id={inputId} type="file" style={{ display: 'none' }} {...getInputProps()} />
          {hasError && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', px: 1 }}>
              <Typography variant="body-sm-rg" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <i className="fa-light fa-poo" />
                {t(I18N_KEYS.GENERAL.UPLOAD_ERROR)}
              </Typography>
            </Box>
          )}
        </Box>
        {allowRemove && fileIsSet ? (
          <Box>
            <ButtonContained
              mode="text"
              size="small"
              startIcon={<i className="fa-light fa-trash" />}
              onClick={removeFile}
              disabled={inProgress}
            >
              {t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.REMOVE_FILE)}
            </ButtonContained>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
