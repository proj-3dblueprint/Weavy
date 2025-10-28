import React from 'react';
import { styled } from '@mui/material';
import { color } from '@/colors';
import { FlexCol, FlexCenVer } from '../styles';
import { EyeDropIcon } from '../Icons/EyeDropIcon';
import type { Api as ColorPickerApi } from '@zag-js/color-picker';

const IconButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
  background: 'none',
  border: 'none',
  borderRadius: '4px',
  color: color.White100,
  cursor: disabled ? 'not-allowed' : 'pointer',
  height: '32px',
  width: '32px',
  margin: 0,
  padding: theme.spacing(0.5),
  '&:hover': {
    background: disabled ? 'none' : color.White16_T,
  },
}));

export const ColorPickerSliders = React.memo(function ColorPickerSliders({
  api,
  showAlpha,
}: {
  api: ColorPickerApi;
  showAlpha: boolean;
}) {
  return (
    <FlexCenVer sx={{ flexGrow: 1, gap: 1 }}>
      <IconButton {...api.getEyeDropperTriggerProps()} disabled={!window.EyeDropper}>
        <EyeDropIcon height={20} width={20} />
      </IconButton>
      <FlexCol sx={{ flexGrow: 1, gap: 1 }}>
        <div {...api.getChannelSliderProps({ channel: 'hue' })}>
          <div {...api.getChannelSliderTrackProps({ channel: 'hue' })}></div>
          <div style={{ position: 'absolute', top: 0, left: 6, width: 'calc(100% - 12px)', height: '100%' }}>
            <div {...api.getChannelSliderThumbProps({ channel: 'hue' })} />
          </div>
        </div>

        {showAlpha && (
          <div {...api.getChannelSliderProps({ channel: 'alpha' })}>
            <div {...api.getTransparencyGridProps({ size: '12px' })} />
            <div {...api.getChannelSliderTrackProps({ channel: 'alpha' })} />
            <div style={{ position: 'absolute', top: 0, left: 6, width: 'calc(100% - 12px)', height: '100%' }}>
              <div {...api.getChannelSliderThumbProps({ channel: 'alpha' })} />
            </div>
          </div>
        )}
      </FlexCol>
    </FlexCenVer>
  );
});
