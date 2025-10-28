import { Box, Typography, Tooltip } from '@mui/material';
import { t } from 'i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';

interface TimeDisplayProps {
  showFrames: boolean;
  setShowFrames: (value: boolean) => void;
  timeDisplay: string;
  height?: number;
}

export function TimeDisplay({ showFrames, setShowFrames, timeDisplay, height = 24 }: TimeDisplayProps) {
  return (
    <Tooltip
      placement="top"
      title={showFrames ? t(I18N_KEYS.VIDEO_PREVIEW.CHANGE_TO_TIMECODE) : t(I18N_KEYS.VIDEO_PREVIEW.CHANGE_TO_FRAMES)}
    >
      <Box
        onClick={() => setShowFrames(!showFrames)}
        sx={{
          cursor: 'pointer',
          px: 1,
          height: `${height}px`,
          borderRadius: 1,
          alignContent: 'center',
        }}
      >
        <Typography variant="body-sm-rg" sx={{ color: color.White80_T, '&:hover': { color: color.White100 } }}>
          {timeDisplay}
        </Typography>
      </Box>
    </Tooltip>
  );
}
