import { Box } from '@mui/material';
import { useMemo } from 'react';
import { color } from '@/colors';

interface CropOverlayProps {
  x: number;
  y: number;
  cropWidth: number;
  cropHeight: number;
  aspectRatio: number;
  showGrid: boolean;
}

const dashedBorder = `dashed 1px ${color.Yellow64}`;
const cornerBorder = `2px outset ${color.Yellow100}`;
const cornerStyle = {
  position: 'absolute',
  width: 16,
  height: 16,
  borderTop: cornerBorder,
  borderLeft: cornerBorder,
};

export function CropOverlay({ x, y, cropWidth, cropHeight, aspectRatio, showGrid }: CropOverlayProps) {
  const maskId = useMemo(() => `rectangle-cutout-${Math.random().toString(36).substring(2, 9)}`, []);
  const left = x;
  const top = y;

  return (
    <>
      <svg
        width="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          aspectRatio,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={cropWidth} height={cropHeight} fill="black" />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgb(0,0,0,0.5)" mask={`url(#${maskId})`} />
        <rect x={x} y={y} width={cropWidth} height={cropHeight} fill="none" stroke={color.Yellow100} strokeWidth={1} />
      </svg>

      {/* TODO these are better in the svg probably */}
      <Box sx={{ position: 'absolute', pointerEvents: 'none', left, top, width: cropWidth, height: cropHeight }}>
        <Box sx={{ ...cornerStyle, transform: `rotate(0.00turn)`, top: -2, left: -2 }} />
        <Box sx={{ ...cornerStyle, transform: `rotate(0.25turn)`, top: -2, right: -2 }} />
        <Box sx={{ ...cornerStyle, transform: `rotate(0.50turn)`, bottom: -2, right: -2 }} />
        <Box sx={{ ...cornerStyle, transform: `rotate(0.75turn)`, bottom: -2, left: -2 }} />
      </Box>
      {showGrid ? (
        <>
          <Box
            sx={{
              borderLeft: dashedBorder,
              borderRight: dashedBorder,
              position: 'absolute',
              left: left + cropWidth / 3,
              top,
              width: cropWidth / 3,
              height: cropHeight,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              borderTop: dashedBorder,
              borderBottom: dashedBorder,
              position: 'absolute',
              left,
              top: top + cropHeight / 3,
              width: cropWidth,
              height: cropHeight / 3,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : null}
    </>
  );
}
