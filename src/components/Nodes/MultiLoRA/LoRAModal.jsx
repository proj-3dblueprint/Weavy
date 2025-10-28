import { Box, Modal, Typography, LinearProgress, Paper, Link, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { useIsHovered } from '@/hooks/useIsHovered';
import { handleFileInputChange } from '@/utils/fileUploadUtils';
import { uploadLoraUsingPreSignedUrl, updateLoraMetadata } from '@/utils/loraUploadUtils';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { SmallFontTextField, uploadFile } from '../../Nodes/Utils';

const logger = log.getLogger('LoRAModal');

const StyledPaper = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  padding: '8px',
  alignItems: 'center',
  '& .MuiTextField-root': {
    flex: 1,
    minWidth: 100,
  },
  '& .MuiInputBase-root': {
    '& textarea': {
      height: '20px !important',
      overflow: 'hidden',
      marginTop: '6px',
    },
  },
}));

function LoRAModal({ open, onClose, lora, updateLora }) {
  const { t: translate } = useTranslation();
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [_uploadImageProgress, setUploadImageProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [_imageUploadError, setImageUploadError] = useState(false);
  const { isHovered: imageHover, ...imageHoverProps } = useIsHovered();
  const [previewImage, setPreviewImage] = useState(lora.coverImage || '');
  const [isClosing, setIsClosing] = useState(false);

  const [localName, setLocalName] = useState(String(lora.name));
  const [localTrigger, setLocalTrigger] = useState(lora.trigger);
  const [localImage, setLocalImage] = useState(lora.coverImage || '');
  const [localFile, setLocalFile] = useState(lora.file || '');
  const [localDefaultWeight, setLocalDefaultWeight] = useState(lora.defaultWeight || 0.5);

  const extension = '.safetensors';
  const filename =
    localFile?.indexOf(extension) > 0
      ? localFile.substring(0, localFile.indexOf(extension) + extension.length)
      : localFile;

  const handleNameChange = (value) => {
    setLocalName(String(value));
  };

  const handleTriggerChange = (value) => {
    setLocalTrigger(value);
  };

  const handleDefaultWeightChange = (value) => {
    setLocalDefaultWeight(value);
  };

  const uploadFileToS3 = async (file) => {
    setIsUploadingFile(true);
    setErrorMessage('');
    try {
      const loraId = await uploadLoraUsingPreSignedUrl(file, (progress) => setUploadProgress(progress));

      setLocalFile(loraId);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploadingFile(false);
      }, 100);
    } catch (error) {
      logger.error('Failed uploading Lora', error);
      setErrorMessage('File upload failed. Please try again.');
      setIsUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleClickUploadImage = () => {
    const inputElement = document.getElementById(`image-input-${lora.id}`);
    if (inputElement) {
      inputElement.click();
    } else {
      logger.error('Image input element not found');
    }
  };

  const uploadImageSuccess = (file) => {
    setLocalImage(file.thumbnailUrl);
    setIsUploadingImage(false);
  };

  const handleImageUpload = (event) => {
    handleFileInputChange(event, (file) => {
      // Preview image doesn't work for heic files
      if (!file.name.toLowerCase().includes('.heic')) {
        setPreviewImage(URL.createObjectURL(file));
      }
      setIsUploadingImage(true);
      uploadFile([file], setUploadImageProgress, uploadImageSuccess, setImageUploadError);
    });
  };

  const handleFileUpload = (event) => {
    handleFileInputChange(event, (file) => {
      void uploadFileToS3(file);
    });
  };

  const handleClickUploadFile = () => {
    const inputElement = document.getElementById(`file-input-${lora.id}`);
    if (inputElement) {
      inputElement.click();
    }
  };

  const handleClose = async () => {
    if (localFile && localTrigger !== lora.trigger) {
      setIsClosing(true);
      try {
        await updateLoraMetadata(localFile, localTrigger);
      } catch (error) {
        logger.error('Error updating lora metadata', error);
        setErrorMessage('Failed to update file trigger word.');
      } finally {
        setIsClosing(false);
      }
    }

    // Update local state
    updateLora({
      ...lora,
      name: localName,
      trigger: localTrigger,
      coverImage: localImage,
      file: localFile,
      defaultWeight: localDefaultWeight,
    });

    onClose();
  };

  return (
    <Modal id="lora-modal" open={open} onClose={handleClose} aria-labelledby="lora-modal">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 540,
          height: 300,
          background: color.Black92,
          border: '1px solid',
          borderColor: color.Dark_Grey,
          boxShadow: 24,
          p: 2,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          id="lora-modal-content-container"
          sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'flex-start', mb: 2 }}
        >
          <Box
            id="modal-lora-image-container"
            sx={{
              width: '30%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body-sm-rg" fontWeight="bold" sx={{ color: color.White64_T, mb: 1, display: 'block' }}>
              {translate(I18N_KEYS.GENERAL.IMAGE)}
            </Typography>

            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                border: '1px solid',
                borderColor: color.White64_T,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => handleClickUploadImage()}
              {...imageHoverProps}
            >
              {previewImage && (
                <>
                  <img
                    src={previewImage}
                    alt={lora.name}
                    width="100%"
                    height="100%"
                    style={{
                      objectFit: 'cover',
                      filter: imageHover ? 'brightness(0.6)' : 'brightness(1)',
                    }}
                  />
                  {!isUploadingImage && (
                    <i
                      className="fa-light fa-upload"
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    ></i>
                  )}
                  {isUploadingImage && (
                    <CircularProgress size={20} color="weavy_cta_secondary" sx={{ position: 'absolute' }} />
                  )}
                </>
              )}
              {!previewImage && (
                <>
                  <i
                    className="fa-light fa-upload"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: imageHover ? 1 : 0,
                      transition: 'opacity 0.1s ease-in-out',
                    }}
                  ></i>
                  <i
                    className="fa-light fa-image"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: imageHover ? 0 : 1,
                      transition: 'opacity 0.1s ease-in-out',
                    }}
                  ></i>
                </>
              )}
            </Box>
            <input
              id={`image-input-${lora.id}`}
              type="file"
              onChange={handleImageUpload}
              accept=".jpeg,.jpg,.png,.webp,.heic"
              style={{ display: 'none' }}
            />
          </Box>
          <Box
            id="lora-modal-name-trigger-file"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              justifyContent: 'space-between',
              width: '70%',
              height: '100%',
            }}
          >
            <Box id="lora-modal-name-container" sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography
                variant="body-sm-rg"
                fontWeight="bold"
                sx={{ color: color.White64_T, mb: 1, display: 'block' }}
              >
                {translate(I18N_KEYS.GENERAL.NAME)}
              </Typography>
              <StyledPaper elevation={0} variant="outlined">
                <SmallFontTextField
                  fullWidth
                  value={localName}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder={localName}
                  variant="standard"
                  size="small"
                  autoComplete="off"
                  InputProps={{
                    disableUnderline: true,
                  }}
                />
              </StyledPaper>
            </Box>
            <Box
              id="lora-modal-trigger-weight-container"
              sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1 }}
            >
              <Box id="lora-modal-trigger-container" sx={{ display: 'flex', flexDirection: 'column', width: '65%' }}>
                <Typography
                  variant="body-sm-rg"
                  fontWeight="bold"
                  sx={{ color: color.White64_T, mb: 1, display: 'block' }}
                >
                  {translate(I18N_KEYS.UPLOAD_LORA_NODE.TRIGGER)}
                </Typography>
                <StyledPaper elevation={0} variant="outlined">
                  <SmallFontTextField
                    fullWidth
                    value={localTrigger}
                    onChange={(event) => handleTriggerChange(event.target.value)}
                    placeholder={localTrigger}
                    variant="standard"
                    size="small"
                    autoComplete="off"
                    InputProps={{
                      disableUnderline: true,
                    }}
                  />
                </StyledPaper>
              </Box>
              <Box id="lora-modal-weight-container" sx={{ display: 'flex', flexDirection: 'column', width: '35%' }}>
                <Typography
                  variant="body-sm-rg"
                  fontWeight="bold"
                  sx={{ color: color.White64_T, mb: 1, display: 'block' }}
                >
                  {translate(I18N_KEYS.UPLOAD_LORA_NODE.DEFAULT_WEIGHT)}
                </Typography>
                <StyledPaper elevation={0} variant="outlined">
                  <SmallFontTextField
                    type="number"
                    fullWidth
                    value={localDefaultWeight}
                    onChange={(event) => handleDefaultWeightChange(event.target.value)}
                    placeholder={localDefaultWeight}
                    variant="standard"
                    size="small"
                    autoComplete="off"
                    inputProps={{
                      step: 0.1,
                      min: 0,
                    }}
                    InputProps={{
                      disableUnderline: true,
                    }}
                  />
                </StyledPaper>
              </Box>
            </Box>
            <Box id="lora-upload-container">
              <Typography
                variant="body-sm-rg"
                fontWeight="bold"
                sx={{ color: color.White64_T, mb: 1, display: 'block' }}
              >
                {translate(I18N_KEYS.GENERAL.FILE)}
              </Typography>
              {localFile !== '' && (
                <Typography variant="body-sm-rg" sx={{ color: color.White64_T, display: 'block' }}>
                  {filename.length > 30 ? filename.substring(0, 27) + '...' : filename}
                  <Link onClick={() => handleClickUploadFile()} sx={{ ml: 1 }}>
                    {translate(I18N_KEYS.UPLOAD_LORA_NODE.UPLOAD_ANOTHER_BUTTON_TEXT_FILE)}
                  </Link>
                </Typography>
              )}
              {!isUploadingFile && localFile === '' && (
                <label
                  htmlFor={`file-input-${lora.id}`}
                  style={{
                    cursor: 'pointer',
                    height: '40px',
                    width: '100%',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: color.White64_T,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body-std-rg">
                    {translate(I18N_KEYS.UPLOAD_LORA_NODE.UPLOAD_BUTTON_TEXT)}
                  </Typography>
                </label>
              )}
              <input
                id={`file-input-${lora.id}`}
                type="file"
                onChange={handleFileUpload}
                accept=".safetensors"
                style={{ display: 'none' }}
              />
              {isUploadingFile && (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body-sm-rg" sx={{ color: color.White64_T, fontStyle: 'italic' }}>
                    {translate(I18N_KEYS.UPLOAD_LORA_NODE.UPLOADING)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    color="weavy_cta_secondary"
                    value={uploadProgress}
                    sx={{ mt: 1, height: '2px' }}
                  />
                </Box>
              )}
              {errorMessage && (
                <Typography variant="body-sm-rg" color="error" sx={{ mt: 1 }}>
                  {errorMessage}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <ButtonContained variant="contained" onClick={handleClose} disabled={isClosing} sx={{ mt: 'auto' }}>
          {isClosing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              {translate(I18N_KEYS.GENERAL.SAVING)}
            </Box>
          ) : (
            translate(I18N_KEYS.GENERAL.DONE)
          )}
        </ButtonContained>
      </Box>
    </Modal>
  );
}

export default LoRAModal;
