import { useMemo } from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AppPaper } from '@/UI/styles';
import { color } from '@/colors';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { roundToDecimalIfNotWhole } from '@/utils/numbers';
import { I18N_KEYS } from '@/language/keys';
import GalleryParams from '../Gallery/GalleryParams';
import type { MediaAsset, TextAsset } from '@/types/api/assets';

const ImgVideoInfo = ({ selectedFile }: { selectedFile: MediaAsset }) => {
  return (
    <Typography variant="label-sm-rg" sx={{ color: color.White64_T, mb: 2 }}>
      {selectedFile.width}x{selectedFile.height}
      {selectedFile.duration ? ` | ${selectedFile.duration.toFixed(2)}s` : ''}
      {selectedFile.fps ? ` | ${roundToDecimalIfNotWhole(selectedFile.fps)} fps` : ''}
    </Typography>
  );
};

interface ParamsBlockProps {
  nodeName: string;
  selectedFile: TextAsset | MediaAsset;
  inputsInfo: Record<string, any>;
}
export const ParamsPanel = ({ nodeName, selectedFile, inputsInfo }: ParamsBlockProps) => {
  const { t } = useTranslation();
  const paramsInputs = useMemo(() => {
    return { ...(selectedFile?.params || {}), ...(selectedFile?.input || {}) };
  }, [selectedFile]);

  return (
    <AppPaper
      onClick={(e) => e.stopPropagation()}
      width="240px"
      height="100%"
      sx={{ display: 'flex', flexDirection: 'column', p: 2, overflow: 'auto' }}
      className="wea-no-scrollbar"
    >
      {(selectedFile?.type === 'image' || selectedFile?.type === 'video') && (
        <ImgVideoInfo selectedFile={selectedFile} />
      )}
      <Typography variant="body-sm-rg" sx={{ mb: 1 }}>
        {t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.MODEL)}
      </Typography>
      <EllipsisText variant="body-sm-rg" sx={{ color: color.White64_T, mb: 2, width: '100%' }} delay={500}>
        {nodeName}
      </EllipsisText>

      {(selectedFile?.params || selectedFile?.input) && (
        <GalleryParams inputsInfo={inputsInfo} inputs={paramsInputs} container="gallery" />
      )}
    </AppPaper>
  );
};
