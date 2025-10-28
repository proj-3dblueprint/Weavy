import { Box, Select, Typography, FormControl, OutlinedInput, InputAdornment, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { color } from '../../../../../colors';
import { BLEND_MODES } from './BlendModes';

const ExtraSmallSelect = styled(Select)`
  & .MuiInputBase-root,
  & {
    font-size: 0.6rem;
    height: 26px;
  }

  & .MuiSelect-select {
    padding: 4px 6px;
  }

  & .MuiOutlinedInput-notchedOutline {
    border-radius: 4px;
  }

  margin-left: 8px;
  width: 152px;

  // Style the icon to match the smaller size
  & .MuiSelect-icon {
    font-size: 1rem;
    right: 3px;
  }

  // Change selection outline to white
  &.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${color.Yambo_Idle_Icon} !important;
    border-width: 1px;
  }

  // Also ensure the fieldset border is white when focused
  & fieldset {
    &.Mui-focused {
      border-color: ${color.Yambo_Idle_Icon} !important;
    }
  }
`;

const ExtraSmallOutlinedInput = styled(OutlinedInput)`
  & .MuiInputBase-root,
  & {
    font-size: 0.6rem;
    height: 26px;
  }

  & .MuiInputBase-input {
    padding: 4px 6px;

    /* Remove arrows from number input */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    &[type='number'] {
      -moz-appearance: textfield;
    }
  }

  & .MuiOutlinedInput-notchedOutline {
    border-radius: 4px;
  }

  & .MuiInputAdornment-root {
    font-size: 0.65rem;
  }

  // Change selection outline to white
  &.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${color.Yambo_Idle_Icon} !important;
    border-width: 1px;
  }

  // Also ensure the fieldset border is white when focused
  & fieldset {
    &.Mui-focused {
      border-color: ${color.Yambo_Idle_Icon} !important;
    }
  }

  max-width: 70px;
  margin-left: 8px;
`;

export const propertiesStructure = {
  position: {
    label: 'Position',
    properties: {
      x: { label: 'x', unit: '', type: 'number' },
      y: { label: 'y', unit: '', type: 'number' },
    },
  },
  size: {
    label: 'Size',
    properties: {
      width: { label: 'w', unit: '', type: 'number' },
      height: { label: 'h', unit: '', type: 'number' },
    },
  },
  rotation: {
    label: 'Rotation',
    properties: {
      angle: { label: '', unit: '°', type: 'number' },
    },
  },
  blendMode: {
    label: 'Blend',
    properties: {
      mode: {
        label: '',
        type: 'select',
        options: BLEND_MODES,
      },
    },
  },
};

// Canvas specific properties structure
const canvasPropertiesStructure = {
  size: {
    label: 'Size',
    properties: {
      width: { label: 'w', unit: '', type: 'number' },
      height: { label: 'h', unit: '', type: 'number' },
    },
  },
};

export const convertToLocalValues = (globalTransform, canvas) => ({
  x: (globalTransform.x - canvas.x) / canvas.scale,
  y: (globalTransform.y - canvas.y) / canvas.scale,
  width: Math.round((globalTransform.width / canvas.scale) * globalTransform.scaleX),
  height: Math.round((globalTransform.height / canvas.scale) * globalTransform.scaleY),
  scaleX: 100,
  scaleY: 100,
  angle: globalTransform.rotation || 0,
});

export const convertToGlobalValues = (localValues, canvas) => {
  const globalTransform = {};

  if ('x' in localValues) globalTransform.x = localValues.x * canvas.scale + canvas.x;
  if ('y' in localValues) globalTransform.y = localValues.y * canvas.scale + canvas.y;
  if ('width' in localValues) globalTransform.width = localValues.width * canvas.scale;
  if ('height' in localValues) globalTransform.height = localValues.height * canvas.scale;
  if ('scaleX' in localValues) globalTransform.scaleX = 1;
  if ('scaleY' in localValues) globalTransform.scaleY = 1;
  if ('angle' in localValues) globalTransform.rotation = localValues.angle;

  return globalTransform;
};

function LayerPropertiesPanel({ layers, selectedLayerKey, canvas, updateLayer, setCanvas, tempTransformedLayer }) {
  const [localTransform, setLocalTransform] = useState();
  const [localTempTransform, setLocalTempTransform] = useState();
  const [localBlendMode, setLocalBlendMode] = useState();
  const [tempInputs, setTempInputs] = useState({});
  const [localCanvasSize, setLocalCanvasSize] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const layer = selectedLayerKey !== 'canvas' ? layers[selectedLayerKey] : canvas;

  useEffect(() => {
    if (selectedLayerKey === 'canvas' && canvas) {
      setLocalCanvasSize({
        width: canvas.width ? Math.round(canvas.width / canvas.scale) : 0,
        height: canvas.height ? Math.round(canvas.height / canvas.scale) : 0,
      });
    } else if (layer && layer.transform) {
      const localValues = convertToLocalValues(layer.transform, canvas);
      setLocalBlendMode(layer.blend_mode);
      setLocalTransform(localValues);
    }
  }, [layer, selectedLayerKey, canvas]);

  // convert tempTransformedLayer to local values
  useEffect(() => {
    if (tempTransformedLayer) {
      setLocalTempTransform(convertToLocalValues(tempTransformedLayer.transform, canvas));
    } else {
      setLocalTempTransform(null);
    }
  }, [tempTransformedLayer]);

  const handleKeyDown = (property) => (event) => {
    if (event.key === 'Enter') {
      if (selectedLayerKey === 'canvas') {
        handleCanvasCommit(property);
      } else {
        handleTransformCommit(property);
      }
      event.target.blur();
    }
  };

  const handleInputChange = (property) => (event) => {
    setTempInputs((prev) => ({
      ...prev,
      [property]: event.target.value,
    }));
  };

  const handleCanvasCommit = (property) => (event) => {
    if (event.type === 'keydown' && event.key !== 'Enter') return;

    const value = tempInputs[property] ?? localCanvasSize[property];
    const newValue = Number(value);

    const globalValue = newValue * canvas.scale;

    setCanvas({
      [property]: globalValue,
    });

    setTempInputs((prev) => ({
      ...prev,
      [property]: undefined,
    }));
  };

  const handleBlendModeChange = (value) => {
    updateLayer(selectedLayerKey, {
      ...layer,
      blend_mode: value,
    });
  };

  const handleTransformCommit = (property) => (event) => {
    if (event.type === 'keydown' && event.key !== 'Enter') return;

    const value = tempInputs[property] ?? localTransform[property];
    const newLocalValues = {
      ...localTransform,
      [property]: Number(value),
    };

    const globalTransform = convertToGlobalValues(newLocalValues, canvas);

    updateLayer(selectedLayerKey, {
      ...layer,
      transform: globalTransform,
    });

    setTempInputs((prev) => ({
      ...prev,
      [property]: undefined,
    }));
  };

  const formatDisplayValue = (value, isSize) => {
    if (value === undefined || value === null) return '';

    return isSize ? Math.round(value).toString() : Number(value).toFixed(1);
  };

  const renderProperties = (structure, localValues, handleChange, handleCommit) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Object.entries(structure).map(([groupKey, group]) => (
        <Box
          key={groupKey}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body-sm-rg">{group.label}</Typography>
          <Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {Object.entries(group.properties).map(([propKey, prop]) => (
                <React.Fragment key={propKey}>
                  <FormControl variant="outlined">
                    {prop.type !== 'select' && (
                      <ExtraSmallOutlinedInput
                        value={
                          localTempTransform && localTempTransform[propKey] !== undefined
                            ? formatDisplayValue(localTempTransform[propKey], groupKey === 'size')
                            : tempInputs[propKey] !== undefined
                              ? tempInputs[propKey]
                              : localValues[propKey] !== undefined
                                ? formatDisplayValue(localValues[propKey], groupKey === 'size')
                                : ''
                        }
                        onChange={handleChange(propKey)}
                        onBlur={handleCommit(propKey)}
                        onKeyDown={handleKeyDown(propKey)}
                        disabled={selectedLayerKey !== 'canvas' && layer?.locked}
                        id={`property-${groupKey}-${propKey}`}
                        endAdornment={
                          <InputAdornment position="end">
                            <span
                              style={{
                                color:
                                  selectedLayerKey !== 'canvas' && layer?.locked
                                    ? 'rgba(255,255,255,0.3)'
                                    : color.White100,
                              }}
                            >
                              {prop.label}
                              {prop.unit}
                            </span>
                          </InputAdornment>
                        }
                        inputProps={{
                          'aria-label': `${group.label} ${prop.label}`,
                          type: 'number',
                          onFocus: (e) => e.target.select(),
                        }}
                      />
                    )}
                    {prop.type === 'select' && (
                      <ExtraSmallSelect
                        labelId={`${propKey}-label`}
                        id={propKey}
                        value={localBlendMode}
                        onChange={(e) => handleBlendModeChange(e.target.value)}
                        size="small"
                        disabled={selectedLayerKey !== 'canvas' && layer?.locked}
                        onOpen={() => setIsMenuOpen(true)}
                        onClose={() => setIsMenuOpen(false)}
                      >
                        {prop.options.map((option) => (
                          <MenuItem
                            key={propKey + option.value}
                            value={option.value}
                            onMouseEnter={() => {
                              // Only update if menu is still mounted
                              if (isMenuOpen) {
                                updateLayer(selectedLayerKey, {
                                  ...layer,
                                  blend_mode: option.value,
                                });
                              }
                            }}
                            onMouseLeave={() => {
                              // Restore original blend mode when mouse leaves
                              updateLayer(selectedLayerKey, {
                                ...layer,
                                blend_mode: localBlendMode,
                              });
                            }}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </ExtraSmallSelect>
                    )}
                  </FormControl>
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );

  return (
    // <Box id="compositor-layers-properties-container" className="compositor-panel">
    <Box
      id="compositor-layers-panel"
      sx={{
        background: color.Black92,
        position: 'absolute',
        top: 30,
        right: 30,
        borderRadius: 1,
        width: '240px',
        overflow: 'hidden',
      }}
    >
      <Box
        id="compositor-layers-panel-header"
        sx={{
          width: '100%',
          background: color.Yambo_Black,
          px: 1,
          py: 0.4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="body-sm-rg" sx={{ display: 'flex', alignItems: 'center' }}>
          {selectedLayerKey === 'canvas' ? (
            <>
              <i className="fa-light fa-frame fa-sm"></i>
              &nbsp;&nbsp;canvas
            </>
          ) : (
            <>
              <i className="fa-light fa-image fa-sm"></i>
              &nbsp;&nbsp;{layer?.name}
            </>
          )}
        </Typography>
      </Box>

      <Box id="compositor-layers-panel-layers-container" sx={{ p: 1 }}>
        {selectedLayerKey === 'canvas' &&
          canvas &&
          localCanvasSize &&
          renderProperties(canvasPropertiesStructure, localCanvasSize, handleInputChange, handleCanvasCommit)}

        {selectedLayerKey !== 'canvas' &&
          localTransform &&
          renderProperties(propertiesStructure, localTransform, handleInputChange, handleTransformCommit)}
      </Box>
    </Box>
    // </Box>
  );
}

export default LayerPropertiesPanel;
