import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { FlexCol } from '@/UI/styles';
import { roundToDecimalIfNotWhole } from '@/utils/numbers';
import GalleryParams from '@/components/Recipe/FlowComponents/Gallery/GalleryParams';
import type { UploadedAsset } from '@/types/api/assets';

interface GalleryInfoContainerProps {
  selectedFile: UploadedAsset;
  zoomPercentage?: number;
}

export const GalleryInfoContainer = ({ selectedFile, zoomPercentage }: GalleryInfoContainerProps) => {
  const paramsInputs = useMemo(() => {
    if (selectedFile && (selectedFile.type === 'image' || selectedFile.type === 'video')) {
      return { ...(selectedFile.params || {}), ...(selectedFile.input || {}) };
    }
    return {};
  }, [selectedFile]);
  if (selectedFile?.type !== 'image' && selectedFile?.type !== 'video') {
    return null;
  }
  return (
    <FlexCol
      data-testid="file-info-container"
      sx={{
        position: 'absolute',
        top: 10,
        left: 20,
      }}
    >
      {selectedFile.name && (
        <Typography
          variant="body-sm-rg"
          sx={{
            fontWeight: 'bold',
            fontSize: '10px',
            textShadow: '0px 0px 2px black',
          }}
        >
          {`${selectedFile.name}`}
        </Typography>
      )}
      <Typography variant="label-sm-rg">
        {selectedFile.width}x{selectedFile.height}
        {selectedFile.duration ? ` | ${selectedFile.duration.toFixed(2)}s` : ''}
        {selectedFile.fps ? ` | ${roundToDecimalIfNotWhole(selectedFile.fps)} fps` : ''}
        {selectedFile.type === 'image' ? ` | ${zoomPercentage}%` : ``}
      </Typography>
      {(selectedFile.params || selectedFile.input) && (
        <Box sx={{ position: 'relative' }}>
          <GalleryParams inputs={paramsInputs} />
        </Box>
      )}
    </FlexCol>
  );
};
