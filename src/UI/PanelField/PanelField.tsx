import { Tooltip } from '@mui/material';
import { color } from '@/colors';
import { useIsHovered } from '@/hooks/useIsHovered';
import { FlexCenVer, FlexCol } from '../styles';
import { InfoIcon } from '../Icons/InfoIcon';
import { EllipsisText } from '../EllipsisText/EllipsisText';
import type { ReactNode } from 'react';

interface PanelFieldProps {
  label: string;
  tooltipText?: string;
  slot?: ReactNode;
  showSlotOnHoverOnly?: boolean;
  slotContainerH?: number;
  disabled?: boolean;
  useHorizontalLayout?: boolean;
  children: ReactNode;
}

export const PanelField = ({
  label,
  tooltipText,
  slot,
  useHorizontalLayout = false,
  showSlotOnHoverOnly = false,
  slotContainerH = 24,
  disabled = false,
  children,
}: PanelFieldProps) => {
  const { isHovered, ...elementProps } = useIsHovered();

  const labelElement = (
    <EllipsisText
      variant="body-sm-rg"
      sx={{
        color: disabled ? color.White16_T : color.White64_T,
      }}
    >
      {label}
    </EllipsisText>
  );

  const tooltipElement = tooltipText && (
    <Tooltip title={tooltipText}>
      <FlexCenVer
        sx={{
          color: disabled ? color.White16_T : color.White64_T,
          '&:hover': { color: disabled ? color.White16_T : color.White80_T },
        }}
      >
        <InfoIcon width={16} height={16} />
      </FlexCenVer>
    </Tooltip>
  );

  const slotElement = showSlotOnHoverOnly ? isHovered && slot : slot;

  if (useHorizontalLayout) {
    return (
      <FlexCenVer sx={{ gap: 1 }} {...elementProps}>
        <FlexCenVer sx={{ gap: 0.5 }}>{children}</FlexCenVer>
        <FlexCenVer sx={{ gap: 0.5, height: slotContainerH, flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
          <FlexCenVer sx={{ gap: 0.5, minWidth: 0 }}>
            {labelElement}
            {tooltipElement}
          </FlexCenVer>
          {slotElement}
        </FlexCenVer>
      </FlexCenVer>
    );
  }

  return (
    <FlexCol sx={{ gap: 0.75 }} {...elementProps}>
      <FlexCenVer sx={{ justifyContent: 'space-between', height: slotContainerH }}>
        <FlexCenVer sx={{ gap: 0.5, minWidth: 0 }}>
          {labelElement}
          {tooltipElement}
        </FlexCenVer>
        {slotElement}
      </FlexCenVer>
      <FlexCenVer sx={{ gap: 0.5 }}>{children}</FlexCenVer>
    </FlexCol>
  );
};
