// Putting both Menu and MenuItem into one file, so imports makes sense
import { styled, type SxProps } from '@mui/material/styles';
import { color } from '@/colors';
import { FlexCenHorVer, FlexRow } from '../styles';
import { LoadingCircle } from '../Animations/LoadingCircle';
import { FloatingPanel, FloatingPanelProps } from '../FloatingPanel/FloatingPanel';
import { CheckMarkIcon } from '../Icons/CheckMarkIcon';
import { EllipsisText } from '../EllipsisText/EllipsisText';
import type { ReactNode } from 'react';

interface MenuItemProps {
  children: ReactNode;
  disabled?: boolean;
  endIcon?: ReactNode;
  isHighlighted?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  selected?: boolean;
  size?: 'small' | 'large';
  startIcon?: ReactNode;
  sx?: SxProps;
}

type StyledMenuItemProps = Pick<MenuItemProps, 'disabled' | 'size' | 'isHighlighted'>;

const StyledMenuItem = styled(FlexRow, {
  shouldForwardProp: (prop) => typeof prop === 'string' && !['disabled', 'size', 'isHighlighted'].includes(prop),
})<StyledMenuItemProps>(({ disabled = false, size = 'large', isHighlighted = false, theme }) => ({
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  padding: size === 'small' ? `${theme.spacing(0.5)} ${theme.spacing(1)}` : theme.spacing(1),
  borderRadius: '4px',
  cursor: disabled ? 'default' : 'pointer',
  width: size === 'small' ? '80px' : '164px',
  height: size === 'small' ? '24px' : '32px',
  backgroundColor: isHighlighted ? color.Black84 : color.Black92,
  color: disabled ? color.White40_T : color.White100,
  transition: 'background-color 0.2s ease',

  '&:hover': {
    backgroundColor: !disabled && color.Black84,
  },
}));

const IconContainer = styled(FlexCenHorVer)(() => ({
  height: '16px',
  width: '16px',
}));

export const MenuItem = ({
  children,
  disabled = false,
  endIcon,
  isHighlighted = false,
  loading = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  selected = false,
  size = 'large',
  startIcon,
  sx,
}: MenuItemProps) => {
  const content =
    typeof children === 'string' || typeof children === 'number' || typeof children === 'boolean' ? (
      <EllipsisText variant="body-sm-rg" key="content" color="inherit">
        {String(children)}
      </EllipsisText>
    ) : (
      children
    );

  return (
    <StyledMenuItem
      disabled={disabled}
      size={size}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      isHighlighted={isHighlighted}
      sx={sx}
    >
      {startIcon && <IconContainer>{startIcon}</IconContainer>}
      {content}
      <IconContainer>
        {loading && <LoadingCircle size={16} />}
        {selected && !loading && <CheckMarkIcon title="Selected" />}
        {endIcon && !loading && !selected && endIcon}
      </IconContainer>
    </StyledMenuItem>
  );
};

type MenuProps = FloatingPanelProps;

const MENU_STYLES = {
  gap: 0,
  padding: 0,
};

// Discussion point: should we validate the children here? Should search be included?
export const Menu = ({ children, ...props }: MenuProps) => {
  return (
    <FloatingPanel {...props} sx={MENU_STYLES}>
      {children}
    </FloatingPanel>
  );
};
