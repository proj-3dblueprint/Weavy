import React, { useState } from 'react';
import { Box, Typography, LinearProgress, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { color, colorMap } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { UploadIcon } from '@/UI/Icons/UploadIcon';
import { FlexCol } from '@/UI/styles';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { handleFileInputChange } from '@/utils/fileUploadUtils';
import { uploadLoraUsingPreSignedUrl } from '@/utils/loraUploadUtils';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { hasEditingPermissions } from './Utils';

const logger = log.getLogger('UploadLoraNode');

function UploadLoraNode({ id, data, updateNodeData }) {
  const { t: translate } = useTranslation();
  const role = useUserWorkflowRole();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const uploadFileToS3 = async (file: File) => {
    setIsUploading(true);
    setErrorMessage('');

    try {
      const loraId = await uploadLoraUsingPreSignedUrl(file, (progress) => setUploadProgress(progress));

      // Update node data with the uploaded lora
      updateNodeData(id, {
        result: { lora: loraId },
        output: {
          type: 'text',
          lora: `weavy-lora::${loraId}`,
        },
      });
      setUploadProgress(100);
      setTimeout(() => setIsUploading(false), 100);
    } catch (error) {
      logger.error('Failed uploading Lora', error);
      setErrorMessage('File upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = (event) => {
    handleFileInputChange(event, (file) => {
      void uploadFileToS3(file);
    });
  };

  const extension = '.safetensors';
  const filename =
    data?.result?.lora?.indexOf(extension) > 0
      ? data.result.lora.substring(0, data.result.lora.indexOf(extension) + extension.length)
      : data?.result?.lora;

  return (
    <DynamicNode2 id={id} data={data} className="import" handleColor={colorMap.get(data.color)}>
      <Box sx={{ width: '100%' }}>
        {data && data.result ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', mt: 1 }}>
            <TextField
              className="nodrag"
              value={filename}
              label="LoRA"
              multiline
              rows={3}
              fullWidth
              size="small"
              disabled
            />
          </Box>
        ) : (
          <Box id="upload-container" sx={{ textAlign: 'center' }}>
            {!isUploading && (
              <label
                htmlFor="file-input"
                style={{
                  cursor: 'pointer',
                  border: '1px dashed',
                  borderColor: color.White64_T,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 1,
                  padding: '16px',
                  borderRadius: '8px',
                }}
              >
                <FlexCol sx={{ alignItems: 'center', gap: 1 }}>
                  <UploadIcon />
                  <Typography variant="body-std-rg">
                    {translate(I18N_KEYS.UPLOAD_LORA_NODE.UPLOAD_BUTTON_TEXT)}
                  </Typography>
                </FlexCol>
              </label>
            )}
            <input
              id="file-input"
              type="file"
              onChange={handleFileUpload}
              accept=".safetensors"
              style={{ display: 'none' }}
              disabled={!hasEditingPermissions(role, data)}
            />
            {isUploading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body-std-rg">{translate(I18N_KEYS.UPLOAD_LORA_NODE.UPLOADING)}</Typography>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
              </Box>
            )}
            {errorMessage && (
              <Typography variant="body-lg-rg" color="error">
                {errorMessage}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </DynamicNode2>
  );
}

export default UploadLoraNode;
