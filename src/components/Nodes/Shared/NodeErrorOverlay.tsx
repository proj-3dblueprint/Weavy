import { Box, Typography } from '@mui/material';
import { color } from '@/colors';
import { WarningTriangleIcon } from '@/UI/Icons/WarningTriangleIcon';
import { FlexColCenHorVer } from '@/UI/styles';

function NodeErrorOverlay({ errorMessage }: { errorMessage: string }) {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: color.Black84_T,
        }}
      />
      <FlexColCenHorVer
        data-testid="error-container"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: color.Weavy_Error_08_T,
          borderRadius: 2,
        }}
      >
        <WarningTriangleIcon color={color.Weavy_Error} />
        <Typography variant="body-std-rg" color={color.Weavy_Error} sx={{ width: '80%', textAlign: 'center', mt: 1 }}>
          {errorMessage}
        </Typography>
      </FlexColCenHorVer>
    </>
  );
}

export default NodeErrorOverlay;
