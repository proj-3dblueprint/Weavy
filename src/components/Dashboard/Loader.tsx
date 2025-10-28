import { CircularProgress } from '@mui/material';
import { color } from '@/colors';
import { FlexCenHorVer } from '@/UI/styles';

export const Loader = ({ offset = 0 }: { offset?: number }) => (
  <FlexCenHorVer
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 100,
      background: color.Black100,
    }}
  >
    <CircularProgress color="inherit" sx={{ position: 'relative', left: `${offset / 2}px` }} />
  </FlexCenHorVer>
);
