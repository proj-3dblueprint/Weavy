import React from 'react';
import { Rect, Group } from 'react-konva';

export const CheckeredBackground = ({ x = 0, y = 0, width, height, size = 20 }) => {
  // Calculate number of squares needed
  const cols = Math.ceil(width / size);
  const rows = Math.ceil(height / size);

  const squares = [];

  // Create checkerboard pattern
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Alternate colors based on position
      const isDark = (row + col) % 2 === 0;

      squares.push(
        <Rect
          key={`${row}-${col}`}
          x={x + col * size}
          y={y + row * size}
          width={size}
          height={size}
          fill={isDark ? '#686868' : '#8c8c8c'}
        />,
      );
    }
  }

  return (
    <Group clipX={x} clipY={y} clipWidth={width} clipHeight={height}>
      {squares}
    </Group>
  );
};

export const calculateImageDimensions = (
  image,
  containerWidth,
  containerHeight,
  containerScale,
  margin = 0,
  preventUpscaling = false,
) => {
  const imgWidth = image.width; // : layerTransform.width;
  const imgHeight = image.height; // : layerTransform.height;

  // Apply margin to container dimensions
  const adjustedContainerWidth = containerWidth - margin * 2;
  const adjustedContainerHeight = containerHeight - margin * 2;

  if (
    preventUpscaling &&
    imgWidth <= adjustedContainerWidth / containerScale &&
    imgHeight <= adjustedContainerHeight / containerScale
  ) {
    return {
      width: imgWidth * containerScale,
      height: imgHeight * containerScale,
      x: (containerWidth - imgWidth * containerScale) / 2,
      y: (containerHeight - imgHeight * containerScale) / 2,
      scale: 1,
    };
  }

  const containerAspect = adjustedContainerWidth / adjustedContainerHeight;
  const imageAspect = imgWidth / imgHeight;

  let newWidth, newHeight, scaleFactor;

  if (imageAspect > containerAspect) {
    // Image is wider than the container
    newWidth = adjustedContainerWidth;
    newHeight = (imgHeight / imgWidth) * adjustedContainerWidth;
    scaleFactor = newWidth / imgWidth;
  } else {
    // Image is taller than the container
    newHeight = adjustedContainerHeight;
    newWidth = (imgWidth / imgHeight) * adjustedContainerHeight;
    scaleFactor = newHeight / imgHeight;
  }

  return {
    width: newWidth,
    height: newHeight,
    x: (containerWidth - newWidth) / 2,
    y: (containerHeight - newHeight) / 2,
    scale: scaleFactor,
  };
};

export const recenterCanvas = (canvas, container, margin = 0) => {
  const containerWidth = container.width;
  const containerHeight = container.height;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const originalScaleFactor = canvas.scale;
  // Apply margin to container dimensions
  const adjustedContainerWidth = containerWidth - margin * 2;
  const adjustedContainerHeight = containerHeight - margin * 2;

  const containerAspect = adjustedContainerWidth / adjustedContainerHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let newWidth, newHeight, scaleFactor;

  if (canvasAspect > containerAspect) {
    // Image is wider than the container
    newWidth = adjustedContainerWidth;
    newHeight = (canvasHeight / canvasWidth) * adjustedContainerWidth;
    scaleFactor = newWidth / canvasWidth;
  } else {
    // Image is taller than the container
    newHeight = adjustedContainerHeight;
    newWidth = (canvasWidth / canvasHeight) * adjustedContainerHeight;
    scaleFactor = newHeight / canvasHeight;
  }

  return {
    width: newWidth,
    height: newHeight,
    x: (containerWidth - newWidth) / 2,
    y: (containerHeight - newHeight) / 2,
    scale: scaleFactor * originalScaleFactor,
  };
};
