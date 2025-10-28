import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropzoneState } from 'react-dropzone';
import { color } from '@/colors';
import { Input } from '@/UI/Input/Input';
import { UploadIcon } from '@/UI/Icons/UploadIcon';
import { I18N_KEYS } from '../../../language/keys';

export type UploadFormProps = {
  allowUrlInput: boolean;
  getInputProps: DropzoneState['getInputProps'];
  onLinkUpload: (link: string) => Promise<void>;
  isSelected?: boolean;
};

export const UploadForm = ({ allowUrlInput, getInputProps, onLinkUpload, isSelected }: UploadFormProps) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [fileLink, setFileLink] = useState('');

  const handleLinkPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text');
    setFileLink(pastedText);
    void onLinkUpload(pastedText);
  };
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileLink(event.target.value);
  };
  const handleInputClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: allowUrlInput ? 'column' : 'row',
          gap: 2,
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Box
          className="media-container-dark"
          sx={{
            alignItems: 'center',
            border: '1px solid',
            bgcolor: color.Black92,
            borderColor: color.White04_T,
            borderRadius: 2,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            height: '430px',
            justifyContent: 'center',
            width: '100%',
            gap: 1,
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon />
          <Typography data-testid="file-upload-cta" variant="body-std-rg" color={color.White100}>
            {t(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.CTA)}
          </Typography>
        </Box>
        {allowUrlInput ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              opacity: isSelected ? 1 : 0,
              transition: 'all 0.1s ease',
            }}
            onClick={handleInputClick}
          >
            <Input
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
              onChange={handleInputChange}
              onPaste={(event: React.ClipboardEvent<HTMLInputElement>) => handleLinkPaste(event)}
              fullWidth
              size="large"
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
