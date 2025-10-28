import React from 'react';

const RequiredHandle = ({ size = 24, color = '#212126', style = {} }) => {
  // Adjust the viewBox to center the content
  const viewBox = '0 0 12 12';

  // Calculate stroke width proportionally to the size
  // For size=12, we want strokeWidth=2.5
  // For smaller sizes, we scale it down proportionally
  const baseSize = 12;
  const baseStrokeWidth = 2.5;
  const strokeWidth = size < baseSize ? (size / baseSize) * baseStrokeWidth * 0.5 : (size / baseSize) * baseStrokeWidth;

  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <g transform="translate(1, 0)">
        <path d="M5 2V10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M8.46484 4L1.53664 8"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.46484 8L1.53664 4"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default RequiredHandle;
