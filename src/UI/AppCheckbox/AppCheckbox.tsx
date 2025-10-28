import { Checkbox, CheckboxProps, FormControlLabel, styled } from '@mui/material';
import { CheckMarkIcon } from '@/UI/Icons/CheckMarkIcon';
import { color } from '@/colors';

const StyledFormControlLabel = styled(FormControlLabel)({
  margin: 0,
  '& .MuiFormControlLabel-label': {
    marginLeft: 8,
    fontSize: '0.75rem',
    fontWeight: 400,
  },
  '&.Mui-disabled': {
    '& .MuiFormControlLabel-label': {
      color: color.White16_T,
    },
  },
});

const StyledCheckbox = styled(Checkbox)(() => ({
  padding: 0,
  width: 18,
  height: 18,
  borderRadius: 2,

  '&.MuiCheckbox-root': {
    backgroundColor: 'transparent',
    border: `1px solid ${color.White64_T}`,
    padding: `0px !important`,
  },

  '&.Mui-checked': {
    backgroundColor: color.White80_T,
    border: 'none',

    '&:hover': {
      backgroundColor: color.White100,
      '& .CheckMarkIcon': {
        color: color.Black92,
      },
    },
    '& .CheckMarkIcon': {
      color: color.Black92,
    },
  },

  '&:hover': {
    backgroundColor: color.White04_T,
    border: `1px solid ${color.White80_T}`,
  },

  '&.Mui-disabled': {
    backgroundColor: color.White04_T,
    border: `1px solid ${color.White04_T}`,

    '&.Mui-checked': {
      backgroundColor: color.White04_T,
      border: 'none',
      '& .CheckMarkIcon': {
        color: color.White16_T,
      },
    },
  },

  '& .MuiSvgIcon-root': {
    display: 'none',
  },
  '& svg': {
    width: 14,
    height: 14,
  },
}));

export type AppCheckboxProps = Omit<CheckboxProps, 'checkedIcon'> & { label?: string };

export const AppCheckbox = ({ label, ...props }: AppCheckboxProps) => {
  return (
    <StyledFormControlLabel
      label={label}
      control={<StyledCheckbox {...props} checkedIcon={<CheckMarkIcon className="CheckMarkIcon" />} />}
    />
  );
};
