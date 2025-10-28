import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useUpdateNodeInternals } from 'reactflow';
import cloneDeep from 'lodash/cloneDeep';
import { v4 as uuidv4 } from 'uuid';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { colorMap } from '../../colors';
import CompositorV2 from '../Recipe/FlowComponents/Editor/CompositorV2';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { hasEditingPermissions } from './Utils';

const DEFAULT_LAYER_STATE = {
  transform: null,
  visible: true,
  locked: false,
  blend_mode: 'source-over',
};

function CompNodeV2({ id, data, updateNodeData, openEditWindow }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const role = useUserWorkflowRole();
  const { input, handles, description } = data;
  const [previewImage, setPreviewImage] = useState(data.result || undefined);
  const [layerOrder, setLayerOrder] = useState(data.layerOrder || []);

  const [canvasDimensions, setCanvasDimensions] = useState(data.canvasDimensions || null);
  const [stageDimensions, setStageDimensions] = useState(data.stageDimensions || null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    containerHeight: '0px',
    containerScale: 1,
    stageOffsetX: 0,
    stageOffsetY: 0,
  });

  useEffect(() => {
    if (data.canvasDimensions) {
      setCanvasDimensions(data.canvasDimensions);
    }
    if (data.stageDimensions) {
      setStageDimensions(data.stageDimensions);
    }
  }, [data.canvasDimensions, data.stageDimensions]);

  //handle connection / disconnection

  useEffect(() => {
    if (input && handles.input) {
      const newLayers = { ...(data.layers || {}) };
      let newOrder = [...layerOrder];
      let hasChanges = false;

      for (const [key, handle] of Object.entries(handles.input)) {
        if (input[key] && input[key].url) {
          if (!newLayers[handle.id]) {
            // If the layer doesn't exist yet
            hasChanges = true;
            newLayers[handle.id] = {
              ...DEFAULT_LAYER_STATE,
              ...input[key],
              name: key,
              locked: false,
              order: data?.layers?.length || handle.order || 0,
            };
            if (!newOrder.includes(handle.id)) {
              newOrder.push(handle.id);
            }
          }
          // If the layer exists but URL changed
          else if (newLayers[handle.id].url !== input[key].url) {
            /// here on url change we need to fit the new image into the transform of the previous image.
            // in order to maintain the proportions of the new image - we conform the w/h based on the bigger dimension:
            const oldTransform = newLayers[handle.id].transform;
            const newTransform = cloneDeep(oldTransform);
            // calculate the new image proportions
            const imageAspectRatio = input[key].width / input[key].height;
            // if the image is landscape (aspect ratio >1 ) - conform the height and reposition the new image to the center
            if (newLayers[handle.id].transform) {
              if (imageAspectRatio > 1) {
                newTransform.height = newTransform.width / imageAspectRatio;
                newTransform.y = (oldTransform.height - newTransform.height) / 2 + oldTransform.y;
              }
              // if the image is portrait (or 1:1) - conform the width and reposition the new image to the center
              else {
                newTransform.width = newTransform.height * imageAspectRatio;
                newTransform.x = (oldTransform.width - newTransform.width) / 2 + oldTransform.x;
              }
            }
            hasChanges = true;

            newLayers[handle.id] = {
              ...DEFAULT_LAYER_STATE,
              ...newLayers[handle.id],
              ...input[key],
              transform: newTransform,
              visible: newLayers[handle.id].visible,
              locked: newLayers[handle.id].locked,
            };
          }
        } else if (newLayers[handle.id]) {
          if (!newLayers[handle.id].transform) {
            // if the layer exists but no transform yet (could happen when disconnected and reconnected before opening the edit window)
            delete newLayers[handle.id];
            newOrder = newOrder.filter((id) => id !== handle.id);
          } else {
            // Remove url if it no longer exists in input, keeping the layer transform
            newLayers[handle.id] = {
              ...newLayers[handle.id],
              url: '',
            };
          }
          hasChanges = true;
        }
      }

      if (hasChanges) {
        updateNodeData(id, {
          layers: newLayers,
          layerOrder: newOrder,
        });
        setLayerOrder(newOrder);
      }
    }
  }, [input, handles.input, id]);

  /// set the preview image of the node
  useEffect(() => {
    if (!data.canvasDimensions && data.layers) {
      // First, try to find the background layer
      const backgroundLayer = Object.values(data.layers).find((layer) => layer.name === 'background');

      if (backgroundLayer) {
        setPreviewImage(backgroundLayer);
        updateNodeData(id, {
          result: backgroundLayer,
        });
      } else {
        setPreviewImage(undefined);
        updateNodeData(id, {
          result: undefined,
        });
      }
    }
  }, [data.layers]);

  useEffect(() => {
    updateNodeData(id, {
      output: {
        [data.handles.output[0]]: data.result,
      },
    });
  }, [data.result]);

  const handleOpenEditWindow = useCallback(() => {
    openEditWindow(id);
  }, [id, openEditWindow]);

  const handleAddInputHandle = useCallback(() => {
    const newInputKey = `layer_${Object.keys(handles.input).length}`;
    const newInput = {
      ...handles.input,
      [newInputKey]: {
        description: '',
        format: 'uri',
        id: uuidv4(),
        order: Object.keys(handles.input).length,
        required: false,
      },
    };
    updateNodeData(id, {
      handles: {
        ...handles,
        input: newInput,
      },
    });
  }, [handles, updateNodeData]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [handles.input]);

  // calculate the node dimensions for resizing the compositor canvas
  useEffect(() => {
    if (!canvasDimensions || !stageDimensions || !containerRef.current) {
      setDimensions({
        containerHeight: '100%',
        containerScale: 1,
        stageOffsetX: 0,
        stageOffsetY: 0,
      });
      return;
    }

    const canvasRatio = canvasDimensions.width / canvasDimensions.height;
    const containerWidth = containerRef.current?.clientWidth;

    setDimensions({
      containerHeight: `${containerWidth / canvasRatio}px`,
      containerScale: containerWidth / canvasDimensions.width,
      stageOffsetX: (-canvasDimensions.x * containerWidth) / canvasDimensions.width,
      stageOffsetY: (-canvasDimensions.y * containerWidth) / canvasDimensions.width,
    });
  }, [canvasDimensions, stageDimensions]);

  return (
    <DynamicNode2
      id={id}
      data={data}
      className="edit"
      handleColor={colorMap.get(data.color)}
      headerColor={colorMap.get(data.dark_color)}
    >
      <Typography variant="body-sm-rg" dangerouslySetInnerHTML={{ __html: description }} />
      {previewImage && !canvasDimensions && (
        <Box sx={{ mt: 1, position: 'relative' }} className="media-container">
          <img
            src={data?.result?.url || previewImage?.url || ''}
            draggable="false"
            width="100%"
            style={{ display: 'block' }}
          />
          {previewImage && previewImage.type && (previewImage.type === 'image' || previewImage.type === 'video') && (
            <Typography
              variant="body-sm-rg"
              sx={{
                fontWeight: 'bold',
                fontSize: '10px',
                position: 'absolute',
                top: 5,
                left: 5,
                textShadow: '0px 0px 2px black',
              }}
            >
              {previewImage.width} X {previewImage.height}
            </Typography>
          )}
        </Box>
      )}
      {canvasDimensions && (
        <Box
          id="node-compositor-container"
          ref={containerRef}
          sx={{
            width: '100%',
            height: dimensions.containerHeight,
            overflow: 'hidden',
            mt: 1,
          }}
        >
          <CompositorV2
            id={id}
            data={data}
            updateNodeData={updateNodeData}
            container="node"
            containerScale={dimensions.containerScale}
            stageOffsetX={dimensions.stageOffsetX}
            stageOffsetY={dimensions.stageOffsetY}
          />
        </Box>
      )}
      <ButtonContained
        onClick={handleOpenEditWindow}
        disabled={(!canvasDimensions && !previewImage) || !hasEditingPermissions(role, data)}
        fullWidth
        mode="text"
        sx={{ mt: 1 }}
      >
        Edit
      </ButtonContained>
      {role !== 'guest' && !data.isLocked && (
        <Box sx={{ mt: 1 }}>
          <ButtonContained mode="text" size="small" onClick={handleAddInputHandle}>
            + Add Another Layer
          </ButtonContained>
        </Box>
      )}
    </DynamicNode2>
  );
}

export default CompNodeV2;
