import { CircularProgress } from '@mui/material';
import { FlexCenHorVer } from '@/UI/styles';
import { color } from '@/colors';

export function PageLoader() {
  return (
    <FlexCenHorVer
      sx={{
        zIndex: 100,
        background: color.Black100,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <CircularProgress color="inherit" />
    </FlexCenHorVer>
  );
}
