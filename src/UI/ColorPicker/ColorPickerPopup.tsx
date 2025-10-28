import * as colorPicker from '@zag-js/color-picker';
import { useCallback, type RefObject } from 'react';
import './ColorPicker.styles.css';
import { useHotkeys } from 'react-hotkeys-hook';
import { PopperPlacementType } from '@mui/material';
import { useHotkeysUniqueScope } from '@/hooks/useHotkeysUniqueScope';
import { FloatingPanel } from '../FloatingPanel/FloatingPanel';
import { ColorPicker } from './ColorPicker';
import type { ColorFormat } from './ColorPicker';

interface ColorPickerPopupProps {
  color: colorPicker.Color;
  onChange: (color: colorPicker.Color) => void;
  onClose: () => void;
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement>;
  anchorEl?: HTMLElement;
  format?: ColorFormat;
  offset?: number;
  placement?: PopperPlacementType;
  onFormatChange?: (format: ColorFormat) => void;
  onChangeEnd?: (color: colorPicker.Color) => void;
  fakeKey?: string;
  showAlpha?: boolean;
}

export function ColorPickerPopup({
  color,
  onChange,
  onChangeEnd,
  isOpen: open,
  onClose,
  triggerRef,
  anchorEl,
  format: propFormat,
  onFormatChange: propOnFormatChange,
  offset,
  placement = 'auto',
  showAlpha = true,
}: ColorPickerPopupProps) {
  const onPickerClosed = useCallback(() => {
    onClose();
  }, [onClose]);

  useHotkeysUniqueScope('color-picker', open);

  useHotkeys('Escape, Enter', onPickerClosed, { scopes: 'color-picker', enabled: open });

  return (
    <FloatingPanel
      open={open}
      triggerRef={triggerRef}
      anchorEl={anchorEl || triggerRef.current}
      onClose={onPickerClosed}
      placement={placement}
      offset={offset}
    >
      <ColorPicker
        color={color}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        format={propFormat}
        onFormatChange={propOnFormatChange}
        showAlpha={showAlpha}
      />
    </FloatingPanel>
  );
}
