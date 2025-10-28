import { FormControl, InputLabel, OutlinedInput } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { InputProps } from './Input';

const StyledCreditsInputLarge = styled(OutlinedInput)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(3), // Adjusted margin
  },
  '&.MuiInputBase-root.MuiOutlinedInput-root': {
    backgroundColor: 'transparent',
    fontSize: '1.5rem',
    border: '1px solid',
    borderColor: 'var(--input-border-color)',
    borderRadius: 4,
    color: 'var(--input-color)',
    boxSizing: 'none',
    margin: '0px',
    fontFamily: ['"DM Sans"', 'sans-serif'].join(','),
    transition: theme.transitions.create(['border-color', 'background-color']),
    '&::placeholder': {
      color: 'var(--input-placeholder-color)',
      fontSize: '1rem', // Adjusted placeholder font size
      fontWeight: 400,
      opacity: 1,
    },
  },
  '& .MuiInputBase-input.MuiOutlinedInput-input': {
    height: '24px',
  },
  '&.MuiInputBase-root.MuiOutlinedInput-root.Mui-focused': {
    borderColor: 'var(--input-focus-border-color)',
    outline: 'none',
    boxSizing: 'none',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));

const DarkStylesLarge = {
  '--input-background-color': '#343337',
  '--input-border-color': 'rgba(255, 255, 255, 0.04)',
  '--input-color': 'rgba(255, 255, 255, 1)',
  '--input-focus-border-color': 'rgba(255, 255, 255, 0.4)',
  '--input-label-color': 'rgba(255, 255, 255, 0.8)',
  '--input-placeholder-color': 'rgba(255, 255, 255, 0.4)',
};

const LightStylesLarge = {
  '--input-background-color': 'rgba(52, 51, 55, 0.08)',
  '--input-border-color': 'rgba(255, 255, 255, 0.04)',
  '--input-color': 'rgba(52, 51, 55, 1)',
  '--input-focus-border-color': 'rgba(52, 51, 55, 0.16)',
  '--input-label-color': 'rgba(52, 51, 55, 0.8)',
  '--input-placeholder-color': 'rgba(52, 51, 55, 0.4)',
};

export const CreditsInput = ({ variant = 'dark', label, id, ...props }: Omit<InputProps, 'size'>) => {
  return (
    <FormControl variant="standard" sx={variant === 'dark' ? DarkStylesLarge : LightStylesLarge}>
      {label ? (
        <InputLabel
          htmlFor={id}
          sx={{
            color: 'var(--input-label-color)',
            fontFamily: '"DM Mono"',
            fontSize: '1rem', // Adjusted label font size
            fontWeight: 400,
            transform: 'none',
            '&.Mui-focused': {
              color: 'var(--input-label-color)',
            },
          }}
        >
          {label}
        </InputLabel>
      ) : null}
      <StyledCreditsInputLarge {...props} id={id} />
    </FormControl>
  );
};
