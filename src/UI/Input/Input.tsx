import { FormControl, InputBase, InputBaseProps, InputLabel, Typography, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { forwardRef, type ComponentProps, type ReactNode, type ForwardedRef } from 'react';
import { color } from '@/colors';

export interface InputProps extends Omit<InputBaseProps, 'size' | 'ref'> {
  variant?: 'dark' | 'light';
  label?: ReactNode;
  helperText?: string;
  size?: 'large' | 'small';
  noBlurOnEnter?: boolean;
  noAutoSelect?: boolean;
}

type StyledInputLabelProps = Omit<ComponentProps<typeof InputLabel>, 'size'> & {
  size?: 'large' | 'small';
};

const StyledInput = styled(
  InputBase as (props: InputProps & { ref: ForwardedRef<HTMLInputElement> }) => React.JSX.Element,
  {
    shouldForwardProp: (prop) => prop !== 'size',
  },
)(({ theme, size = 'large' }: { theme: Theme; size?: 'large' | 'small' }) => ({
  'label + &': {
    marginTop: theme.spacing(2.5),
  },
  '&.MuiInputBase-root': {
    backgroundColor: 'var(--input-background-color)',
    border: '1px solid',
    borderColor: 'var(--input-border-color)',
    borderRadius: 4,
    color: 'var(--input-color)',
    fontFamily: ['"DM Sans"', 'sans-serif'].join(','),
    fontSize: '0.75rem',
    gap: theme.spacing(1),
    minWidth: '32px',
    padding: size === 'large' ? theme.spacing(1, 1.5) : theme.spacing(0.5, 1),
    position: 'relative',
    transition: theme.transitions.create(['border-color', 'background-color']),
    '&.MuiInputBase-adornedStart > svg:first-of-type': {
      height: '16px',
      width: '16px',
    },
    '&.MuiInputBase-adornedEnd > svg:last-of-type': {
      height: '16px',
      width: '16px',
    },
    '&.Mui-focused': {
      borderColor: 'var(--input-focus-border-color)',
    },
    '&.Mui-error': {
      backgroundColor: 'var(--input-error-background-color)',
      borderColor: 'var(--input-error-border-color)',
    },
    '&.Mui-disabled': {
      backgroundColor: 'var(--input-disabled-background-color)',
      color: 'var(--input-disabled-color)',
    },
    '& > .MuiInputBase-input': {
      backgroundColor: 'unset',
      height: '16px',
      padding: '0',
      WebkitTextFillColor: 'unset',
      '&::placeholder': {
        color: 'var(--input-placeholder-color)',
        fontSize: '0.75rem',
        fontWeight: 400,
        opacity: 1,
      },
    },
  },
}));

const StyledInputLabel = styled(InputLabel as (props: StyledInputLabelProps) => React.JSX.Element, {
  shouldForwardProp: (prop) => prop !== 'size',
})(({ size = 'large' }: { size?: 'large' | 'small' }) => ({
  color: size === 'large' ? 'var(--input-label-color)' : 'var(--input-small-label-color)',
  fontFamily: size === 'large' ? '"DM Mono"' : '"DM Sans"',
  fontSize: '0.75rem',
  fontWeight: 400,
  transform: 'translateY(-4px)',
  '&.Mui-focused': {
    color: size === 'large' ? 'var(--input-label-color)' : 'var(--input-small-label-color)',
  },
}));

const DarkStyles = {
  '--input-background-color': color.Black92,
  '--input-border-color': color.White08_T,
  '--input-color': color.White100,
  '--input-disabled-background-color': color.Black92,
  '--input-disabled-color': color.White16_T,
  '--input-error-background-color': color.Weavy_Error_08_T,
  '--input-error-border-color': color.Weavy_Error_64_T,
  '--input-error-color': color.Weavy_Error,
  '--input-focus-border-color': color.White40_T,
  '--input-label-color': color.White80_T,
  '--input-small-label-color': color.White64_T,
  '--input-placeholder-color': color.White64_T,
};

const LightStyles = {
  '--input-background-color': color.Black08_T,
  '--input-border-color': color.White04_T,
  '--input-color': color.Black100,
  '--input-disabled-background-color': color.Black04_T,
  '--input-disabled-color': color.Black40_T,
  '--input-error-background-color': color.Weavy_Error_08_T,
  '--input-error-border-color': color.Weavy_Error,
  '--input-error-color': color.Weavy_Error,
  '--input-focus-border-color': color.Black40_T,
  '--input-label-color': color.Black92_T,
  '--input-small-label-color': color.Black64_T,
  '--input-placeholder-color': color.Black64_T,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'dark',
      label,
      id,
      helperText,
      size = 'large',
      noBlurOnEnter = false,
      noAutoSelect = false,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!noBlurOnEnter && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (ref && typeof ref === 'object' && 'current' in ref) {
          ref.current?.blur();
        }
      }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      if (!noAutoSelect) {
        event.target.select();
      }
      onFocus?.(event);
    };

    return (
      <FormControl variant="standard" sx={variant === 'dark' ? DarkStyles : LightStyles} fullWidth={props.fullWidth}>
        {label ? (
          <StyledInputLabel size={size} htmlFor={id}>
            {label}
          </StyledInputLabel>
        ) : null}
        <StyledInput onKeyDown={handleKeyDown} onFocus={handleFocus} {...props} ref={ref} id={id} size={size} />
        {helperText ? (
          <Typography
            variant="body-xs-rg"
            id={`${id}-helper-text`}
            color={props.error ? 'var(--input-error-color)' : 'var(--input-color)'}
            sx={{
              alignSelf: 'flex-start',
              marginTop: 0.5,
              marginLeft: 0.5,
            }}
          >
            {helperText}
          </Typography>
        ) : null}
      </FormControl>
    );
  },
);

Input.displayName = 'Input';
