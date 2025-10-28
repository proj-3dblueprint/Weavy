import { Box, Input, Slider } from '@mui/material';
import { styled } from '@mui/material/styles';

export const Container = styled(Box)({
  marginBottom: '16px',
});

export const Row = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

export const SliderContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
});

export const StyledSlider = styled(Slider)(({ disabled }) => ({
  marginRight: '16px',
  width: '80%',
  ...(disabled && {
    opacity: 0.5,
    '& .MuiSlider-track': {
      opacity: 0.5,
    },
    '& .MuiSlider-thumb': {
      opacity: 0.5,
      '&:hover': {
        boxShadow: 'none',
      },
    },
    '& .MuiSlider-rail': {
      opacity: 0.5,
    },
  }),
}));

export const StyledInput = styled(Input)({
  fontSize: '10px',
});

export const FullWidthBox = styled(Box)({
  width: '100%',
});
