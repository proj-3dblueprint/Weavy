import { useState, MouseEvent } from 'react';
import { ButtonBase, Divider, Typography } from '@mui/material';
import { AppPaper, Flex } from '@/UI/styles';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';
import { NavigateIcon } from '@/UI/Icons/NavigateIcon';
import { UndoIcon } from '@/UI/Icons/UndoIcon';
import { RedoIcon } from '@/UI/Icons/RedoIcon';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { color } from '@/colors';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { HandIcon } from '@/UI/Icons/HandIcon';
import { ZoomMenu } from './ZoomMenu';

type Tool = 'select' | 'pan';

export interface ActionsBarProps {
  canUndo?: boolean;
  canRedo?: boolean;
  zoomPercentage: number;
  zoomLimitsPercentage: {
    min: number;
    max: number;
  };
  isEditMode: boolean;
  onUndoRedo?: (undoRedo: 'undo' | 'redo') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  // onZoomChange: (zoom: number) => void;
  onZoomToHundred: () => void;
  onZoomToFit: () => void;
  setSelectOnDrag?: (value: boolean) => void;
  isFullMode?: boolean;
  children?: React.ReactNode;
}

export const ActionsBar = ({
  canUndo,
  canRedo,
  zoomPercentage,
  // zoomLimitsPercentage,
  isEditMode,
  onUndoRedo,
  onZoomIn,
  onZoomOut,
  onZoomToHundred,
  onZoomToFit,
  setSelectOnDrag,
  isFullMode,
  children,
}: ActionsBarProps) => {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClickPointer = () => {
    setActiveTool('select');
    setSelectOnDrag?.(true);
  };

  const handleClickHand = () => {
    setActiveTool('pan');
    setSelectOnDrag?.(false);
  };

  const handleToolChange = (tool: Tool | null) => {
    if (tool === 'select') {
      handleClickPointer();
    } else {
      handleClickHand();
    }
  };

  // const handleZoomChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.value === '') {
  //     setZoomValue(undefined);
  //   } else {
  //     setZoomValue(e.target.value);
  //   }
  // };

  // const handleZoomBlur = (e: FocusEvent<HTMLInputElement>) => {
  //   const valueWithoutPercent = e.target.value.replace('%', '');
  //   const zoomValue = parseInt(valueWithoutPercent, 10);

  //   if (!isLegalValue(zoomValue)) {
  //     setZoomValue(`${zoomPercentage}%`);
  //   } else {
  //     onZoomChange?.(zoomValue);
  //   }
  // };

  // const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  //   const valueWithoutPercent = (e.target as HTMLInputElement).value.replace('%', '');
  //   const res = Number(valueWithoutPercent);
  //   const increment = e.shiftKey ? 10 : 1;

  //   if (e.key === 'ArrowUp') {
  //     const newZoom = res + increment;
  //     onZoomChange?.(Math.min(newZoom, zoomLimitsPercentage.max));
  //   } else if (e.key === 'ArrowDown') {
  //     const newZoom = res - increment;
  //     onZoomChange?.(Math.max(newZoom, zoomLimitsPercentage.min));
  //   }
  // };

  const handleOpenZoomMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleCloseZoomMenu = () => setAnchorEl(null);

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    ...(isFullMode ? { height: '60px', px: '20px', py: '15px', borderRadius: 0 } : { py: 1.25, px: 1, height: '44px' }),
  };
  // const isLegalValue = (zoom: number) =>
  //   !isNaN(zoom) && zoom >= zoomLimitsPercentage.min && zoom <= zoomLimitsPercentage.max;

  return (
    <AppPaper sx={containerStyle}>
      {/* Left controls */}
      {children}

      {/* Design Tools (right side) */}
      <AppToggleButtons
        value={activeTool}
        options={[
          { value: 'select', label: <NavigateIcon />, 'aria-label': 'Navigate' },
          { value: 'pan', label: <HandIcon />, 'aria-label': 'Pan', disabled: setSelectOnDrag === undefined },
        ]}
        onChange={handleToolChange}
        mode="light"
        btnW={28}
        btnH={28}
        isIcons
      />
      {isEditMode && onUndoRedo && (
        <>
          <Divider orientation="vertical" flexItem sx={{ backgroundColor: color.White04_T }} />
          <Flex sx={{ gap: 0.25 }}>
            <AppIconButton onClick={() => onUndoRedo('undo')} disabled={!canUndo} width={28} height={28}>
              <UndoIcon />
            </AppIconButton>
            <AppIconButton onClick={() => onUndoRedo('redo')} disabled={!canRedo} width={28} height={28}>
              <RedoIcon />
            </AppIconButton>
          </Flex>
        </>
      )}

      <Divider orientation="vertical" flexItem sx={{ backgroundColor: color.White04_T }} />
      <ButtonBase
        onClick={handleOpenZoomMenu}
        sx={{ gap: 1, bgcolor: anchorEl ? color.Black84 : 'transparent', py: 0.5, pl: 1, pr: 0.75, borderRadius: 1 }}
      >
        <Typography component="div" sx={{ width: '32px', display: 'inline-flex' }} variant="body-sm-rg">
          {`${zoomPercentage}%`}
        </Typography>
        <CaretIcon />
      </ButtonBase>
      {/* Decided to not allow editing. Not removing now in case we want to revive it */}
      {/* <Input
        size="small"
        value={zoomValue ?? ''}
        onChange={handleZoomChange}
        onBlur={handleZoomBlur}
        onKeyDown={handleKeyDown}
        inputProps={{
          min: zoomLimitsPercentage.min,
          max: zoomLimitsPercentage.max,
        }}
        endAdornment={
          <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={handleOpenZoomMenu}>
            <CaretIcon />
          </InputAdornment>
        }
        sx={{
          
          pointerEvents: 'none',
          width: '80px',
          '&.MuiInputBase-root': {
            border: 'none',
            bgcolor: anchorEl ? color.Black84 : 'transparent',
          },
        }}
      /> */}
      <ZoomMenu
        isOpen={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseZoomMenu}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomToFit={onZoomToFit}
        onZoomToHundred={onZoomToHundred}
      />
    </AppPaper>
  );
};
