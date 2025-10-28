import { styled, Typography } from '@mui/material';
import { useCallback } from 'react';
import { color } from '@/colors';
import { FlexCenHorVer, FlexCenVer } from '../styles';
import { MinusIcon, PlusIcon } from '../Icons';

type Size = 'small' | 'medium' | 'large';

const getTypographyVariant = (size: Size) => {
  switch (size) {
    case 'large':
      return 'h2';
    case 'medium':
      return 'body-std-rg';
    case 'small':
    default:
      return 'body-sm-md';
  }
};

const getIconProps = (size: Size, disabled: boolean) => {
  const iconColor = disabled ? color.White40_T : color.White100;
  switch (size) {
    case 'large':
      return { style: { width: 24, height: 24 }, strokeWidth: 1.13, color: iconColor };
    case 'medium':
      return { style: { width: 8, height: 8 }, strokeWidth: 3, color: iconColor };
    case 'small':
      return { style: { width: 8, height: 8 }, strokeWidth: 3, color: iconColor };
  }
};

const getContainerStyle = (size: Size) => {
  return {
    border: `1px solid ${color.White16_T}`,
    borderRadius: size === 'medium' ? '8px' : '4px',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    height: size === 'large' ? '56px' : size === 'medium' ? '36px' : '24px',
    width: size === 'large' ? '160px' : size === 'medium' ? '72px' : '85px',
  };
};

const StyledButton = styled('button')(({
  disabled,
  size,
  side,
}: {
  disabled: boolean;
  size: Size;
  side: 'left' | 'right';
}) => {
  return {
    height: '100%',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: disabled ? 'transparent' : color.White08_T,
      cursor: disabled ? 'inherit' : 'pointer',
    },
    padding: `0 ${size === 'large' ? '16px' : '8px'}`,
    outline: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(side === 'left' && {
      borderTopLeftRadius: size === 'medium' ? '8px' : '4px',
      borderBottomLeftRadius: size === 'medium' ? '8px' : '4px',
    }),
    ...(side === 'right' && {
      borderTopRightRadius: size === 'medium' ? '8px' : '4px',
      borderBottomRightRadius: size === 'medium' ? '8px' : '4px',
    }),
  };
});

interface CounterProps {
  count: number;
  disabled?: boolean;
  max?: number;
  min?: number;
  onChange: (newValue: number) => void;
  step?: number;
  size?: Size;
}

function Counter({ count, disabled = false, onChange, min, max, step = 1, size = 'small' }: CounterProps) {
  const handleIncrement = useCallback(() => {
    if (max === undefined) {
      onChange(count + step);
      return;
    }
    if (count < max && count + step <= max) {
      onChange(count + step);
    }
  }, [count, max, onChange, step]);

  const handleDecrement = useCallback(() => {
    if (min === undefined) {
      onChange(count - step);
      return;
    }
    if (count > min && count - step >= min) {
      onChange(count - step);
    }
  }, [count, min, onChange, step]);

  const disabledDecrement = disabled || (min !== undefined && count <= min);
  const disabledIncrement = disabled || (max !== undefined && count >= max);

  return (
    <FlexCenVer sx={getContainerStyle(size)}>
      <StyledButton
        onClick={handleDecrement}
        aria-disabled={disabledDecrement}
        aria-label="Decrement"
        size={size}
        disabled={disabledDecrement}
        side="left"
      >
        <MinusIcon {...getIconProps(size, disabledDecrement)} />
      </StyledButton>
      <FlexCenHorVer sx={{ height: '100%' }}>
        <Typography variant={getTypographyVariant(size)} color={disabled ? color.White40_T : color.White100}>
          {count}
        </Typography>
      </FlexCenHorVer>
      <StyledButton
        onClick={handleIncrement}
        aria-disabled={disabledIncrement}
        aria-label="Increment"
        size={size}
        disabled={disabledIncrement}
        side="right"
      >
        <PlusIcon {...getIconProps(size, disabledIncrement)} />
      </StyledButton>
    </FlexCenVer>
  );
}

export default Counter;
