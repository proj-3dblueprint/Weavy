import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Image as KonvaImage, Rect } from 'react-konva';
import Konva from 'konva';
import { Box, IconButton, Divider, Typography, Link, Slider } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import useImage from 'use-image';
import { useViewport } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { ColorPickerField } from '@/UI/ColorPicker/ColorPickerField';
import { color as colors } from '@/colors';
import { parseHexColor, parseWebColor } from '@/UI/ColorPicker/colorPicker.utils';
import { FlexCenHorVer, Flex } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';
import { LinkIcon } from '@/UI/Icons/LinkIcon';
import { LinkBreakIcon } from '@/UI/Icons/LinkBreakIcon';
import { I18N_KEYS } from '@/language/keys';
import { AppToggleButton } from '@/UI/AppToggleButtons/AppToggleButton';
import { useIsHovered } from '@/hooks/useIsHovered';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { useFlowView } from '../Recipe/FlowContext';
import {
  enableCustomCursor,
  disableCustomCursor,
  setCursorRadius,
  setCursorColor,
  hideCustomCursor,
  showCustomCursor,
} from '../Recipe/FlowComponents/Editor/CustomCursor';
import { hasEditingPermissions } from './Utils';

const debounce = (func, wait) => {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const NODE_WIDTH = 426;
const MIN_SIZE = 50;
const MAX_SIZE = 4096;
const DEFAULT_WIDTH = 426;
const DEFAULT_HEIGHT = 426;

const checkersStyle = (size) => {
  return {
    backgroundColor: colors.Black92,
    backgroundImage: `linear-gradient(45deg, #2a2a2f 25%, transparent 25%), 
    linear-gradient(-45deg, #2a2a2f 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2a2f 75%), 
    linear-gradient(-45deg, transparent 75%, #2a2a2f 75%)`,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `0 0, 0 ${size / 2}px, ${size / 2}px -${size / 2}px, -${size / 2}px 0px`,
  };
};

function PaintCore({ id, data, updateNodeData, isSelected }) {
  const { zoom } = useViewport();
  const { t } = useTranslation();
  const { handles } = data;
  const [localSelectedSize, setLocalSelectedSize] = useState(
    data.result?.selectedSize ? data.result.selectedSize : { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
  );
  const [localScaleFactor, setLocalScaleFactor] = useState(data?.result?.scaleFactor || NODE_WIDTH / DEFAULT_WIDTH);
  const [tempWidth, setTempWidth] = useState(
    data.result?.selectedSize?.width / data?.result?.scaleFactor || data.result?.canvasSize?.width || DEFAULT_WIDTH,
  ); // canvasSize for backwards compatibility
  const [tempHeight, setTempHeight] = useState(
    data.result?.selectedSize?.height / data?.result?.scaleFactor || data.result?.canvasSize?.height || DEFAULT_HEIGHT,
  ); // canvasSize for backwards compatibility
  const [aspectRatio, setAspectRatio] = useState(data.result?.aspectRatio ?? 1);
  const [lockAspectRatio, setLockAspectRatio] = useState(data.result?.lockAspectRatio ?? true);
  const [tool, setTool] = useState('brush');
  const [localBackgroundColor, setLocalBackgroundColor] = useState(data?.result?.backgroundColor || '#000000FF');
  const [localColor, setLocalColor] = useState(data?.result?.color || '#FFFFFF');
  const [localBrushSize, setLocalBrushSize] = useState(data?.result?.brushSize || 50);
  const [mouseMoved, setMouseMoved] = useState(false);
  const [localLines, setLocalLines] = useState(data?.result?.lines || []);
  const [history, setHistory] = useState([data?.result?.lines || []]);
  const [redoHistory, setRedoHistory] = useState([]);
  const isDrawing = useRef(false);
  const [image] = useImage(data.input?.image?.url || '', 'anonymous');

  const { isHovered: sizeSettingsSectionHovered, ...elementProps } = useIsHovered();
  // const [imageSizeOption, setImageSizeOption] = useState(null);
  const stageRef = useRef(null);
  const customCursorRef = useRef(null);

  const updateLocalBackgroundColorNew = useCallback((color) => {
    const hexColor = parseWebColor(color).toString('hexa');
    setLocalBackgroundColor(hexColor);
  }, []);

  const hexToWebColor = (hex) => {
    const color = parseHexColor(hex);
    return {
      r: color.getChannelValue('red'),
      g: color.getChannelValue('green'),
      b: color.getChannelValue('blue'),
      a: color.getChannelValue('alpha'),
    };
  };

  const updateLocalColorNew = useCallback((color) => {
    const hexColor = parseWebColor(color).toString('hexa');
    setLocalColor(hexColor);
  }, []);

  const role = useUserWorkflowRole();

  const handleMouseDown = (e) => {
    if (!hasEditingPermissions(role, data)) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const scaledPos = {
      x: pos.x / localScaleFactor,
      y: pos.y / localScaleFactor,
    };
    if (
      scaledPos.x >= 0 &&
      scaledPos.x <= stage.width() / localScaleFactor &&
      scaledPos.y >= 0 &&
      scaledPos.y <= stage.height() / localScaleFactor
    ) {
      isDrawing.current = true;
      setMouseMoved(false);
      setLocalLines([
        ...localLines,
        { tool, points: [scaledPos.x, scaledPos.y], color: localColor, brushSize: localBrushSize / localScaleFactor },
      ]);
    }
  };

  const handleMouseMove = (e) => {
    if (!hasEditingPermissions(role, data) || !isDrawing.current) return;
    setMouseMoved(true);
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scaledPoint = {
      x: point.x / localScaleFactor,
      y: point.y / localScaleFactor,
    };
    const lastLine = localLines[localLines.length - 1];
    lastLine.points = lastLine.points.concat([scaledPoint.x, scaledPoint.y]);
    setLocalLines([...localLines.slice(0, localLines.length - 1), lastLine]);
  };

  const handleMouseUp = useCallback(() => {
    if (!hasEditingPermissions(role, data)) return;
    if (isDrawing.current) {
      if (!mouseMoved) {
        const stage = stageRef.current;
        const point = stage.getPointerPosition();
        const scaledPoint = {
          x: point.x / localScaleFactor,
          y: point.y / localScaleFactor,
        };
        const lastLine = localLines[localLines.length - 1];
        lastLine.points = lastLine.points.concat([scaledPoint.x, scaledPoint.y]);
        setLocalLines([...localLines.slice(0, localLines.length - 1), lastLine]);
      }
      setHistory((prevHistory) => [...prevHistory, localLines]);
      setRedoHistory([]);
    }
    isDrawing.current = false;
  }, [localLines, mouseMoved, role, localScaleFactor]);

  const handleMouseEnter = useCallback(() => {
    if (!hasEditingPermissions(role, data)) return;
    showCustomCursor(customCursorRef);
  }, [localColor, localBrushSize]);

  const handleMouseLeave = () => {
    isDrawing.current = false;
    hideCustomCursor(customCursorRef);
  };

  useEffect(() => {
    if (!hasEditingPermissions(role, data)) return;

    const stage = stageRef.current;
    if (stage) {
      const container = stage.container();
      container.style.cursor = 'none';
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      enableCustomCursor(customCursorRef, container, stage, localColor, localBrushSize * zoom);
      hideCustomCursor(customCursorRef);

      // Clean up custom cursor on component unmount
      return () => {
        disableCustomCursor(customCursorRef);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  useEffect(() => {
    if (data.input?.image) {
      const newScaleFactor = NODE_WIDTH / data.input.image.width;
      const imageSize = {
        width: data.input.image.width * newScaleFactor,
        height: data.input.image.height * newScaleFactor,
      };
      setLocalSelectedSize(imageSize);
      setTempWidth(Math.round(data.input.image.width));
      setTempHeight(Math.round(data.input.image.height));
      // setImageSizeOption(imageSize);
      setLocalScaleFactor(newScaleFactor);
    } else {
      if (data.result?.selectedSize) return;
      let newScaleFactor;
      if (data.result?.selectedSize) {
        if (data.result?.selectedSize?.width >= data.result?.selectedSize?.height) {
          newScaleFactor = NODE_WIDTH / data.result?.selectedSize?.width;
        } else if (data.result?.selectedSize?.width < data.result?.selectedSize?.height) {
          newScaleFactor = NODE_WIDTH / data.result?.selectedSize?.height;
        } else newScaleFactor = 1;
      } else newScaleFactor = NODE_WIDTH / DEFAULT_WIDTH;

      setLocalSelectedSize(
        data.result?.selectedSize
          ? data.result?.selectedSize
          : {
              width: DEFAULT_WIDTH * newScaleFactor,
              height: DEFAULT_HEIGHT * newScaleFactor,
            },
      );
      setTempWidth(Math.round(data.result?.selectedSize?.width || DEFAULT_WIDTH));
      setTempHeight(Math.round(data.result?.selectedSize?.height || DEFAULT_HEIGHT));
      setLocalScaleFactor(newScaleFactor);
    }
    // force render on init
    handleExport(
      localLines,
      localBrushSize,
      localColor,
      localSelectedSize,
      localScaleFactor,
      localBackgroundColor,
      aspectRatio,
      lockAspectRatio,
    );
  }, [data.input?.image]);

  const handleUndo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.length > 1) {
        const newHistory = prevHistory.slice(0, -1);
        setLocalLines([...newHistory[newHistory.length - 1]]);
        setRedoHistory((prevRedoHistory) => [prevHistory[prevHistory.length - 1], ...prevRedoHistory]);

        return newHistory;
      }

      return prevHistory;
    });
  }, [setLocalLines]);

  const handleRedo = useCallback(() => {
    setRedoHistory((prevRedoHistory) => {
      if (prevRedoHistory.length > 0) {
        const [nextState, ...newRedoHistory] = prevRedoHistory;
        setHistory((prevHistory) => [...prevHistory, nextState]);
        setLocalLines(nextState);

        return newRedoHistory;
      }

      return prevRedoHistory;
    });
  }, [setLocalLines]);

  const handleReset = useCallback(() => {
    setLocalLines([]);
    setHistory([[]]);
    setRedoHistory([]);
  }, []);

  useEffect(() => {
    setCursorColor(customCursorRef, localColor);
  }, [localColor]);

  useEffect(() => {
    setCursorRadius(customCursorRef, localBrushSize * zoom);
  }, [localBrushSize, zoom]);

  useEffect(() => {
    if (tool === 'brush') {
      setCursorColor(customCursorRef, localColor);
    } else {
      setCursorColor(customCursorRef, '#FFFFFF');
    }
  }, [tool]);

  /// handle export
  const handleExport = useCallback(
    (lines, brushSize, color, selectedSize, scaleFactor, backgroundColor, aspectRatio, lockAspectRatioState) => {
      if (!selectedSize || !scaleFactor) return;
      const stage = stageRef.current;
      // handle saving data
      const stageJSON = stageRef.current.toJSON();
      updateNodeData(id, {
        result: {
          canvasData: stageJSON,
          backgroundColor,
          selectedSize,
          scaleFactor,
          aspectRatio,
          color,
          brushSize,
          lines,
          lockAspectRatio: lockAspectRatioState,
        },
      });
      const fullCanvasDataURL = stage.toDataURL({
        mimeType: 'image/png',
        pixelRatio: 1 / scaleFactor,
      });

      // Temporarily remove or hide the background image
      const backgroundImage = stage.findOne('Image');
      if (backgroundImage) {
        backgroundImage.hide();
        stage.draw();
      }
      // Store original colors
      const originalColors = [];
      const originalAlphas = [];
      const drawingLayer = stage.findOne('#drawingLayer');
      drawingLayer.children.forEach((line) => {
        if (line instanceof Konva.Line) {
          const originalColor = line.stroke();
          let alpha = 'FF';

          if (originalColor.length === 9) {
            // If color is in #RRGGBBAA format
            alpha = originalColor.slice(7, 9);
          }
          originalColors.push(originalColor);
          originalAlphas.push(alpha);

          // Set the stroke to white with the same alpha value
          line.stroke(`#FFFFFF${alpha}`);
          // line.stroke(`#FFFFFF`);
        }
      });

      const backgroundLayer = stage.findOne('#backgroundLayer');
      backgroundLayer.getChildren()[0].fill('black');
      stage.draw();

      // Export the lines only (without the background image)
      const linesOnlyDataURL = stage.toDataURL({
        mimeType: 'image/png',
        pixelRatio: 1 / scaleFactor,
      });

      backgroundLayer.getChildren()[0].fill(backgroundColor);
      drawingLayer.children.forEach((line, index) => {
        if (line instanceof Konva.Line) {
          line.stroke(originalColors[index]);
        }
      });
      if (backgroundImage) {
        backgroundImage.show();
      }
      stage.draw();

      const formattedOutput = {};
      const output = [
        {
          type: 'image',
          url: fullCanvasDataURL,
          width: selectedSize.width / scaleFactor,
          height: selectedSize.height / scaleFactor,
        },
        {
          type: 'image',
          url: linesOnlyDataURL,
          width: selectedSize.width / scaleFactor,
          height: selectedSize.height / scaleFactor,
        },
      ];
      if (data.version === 3) {
        formattedOutput['result'] = output[0];
        formattedOutput['mask'] = output[1];
      } else {
        handles.output.forEach((elementName, index) => {
          formattedOutput[elementName] = output[index];
        });
      }
      updateNodeData(id, {
        output: formattedOutput,
      });
    },
    [updateNodeData, id],
  );

  const debouncedExport = useRef();

  useEffect(() => {
    debouncedExport.current = debounce(
      (lines, brushSize, color, selectedSize, scaleFactor, backgroundColor, aspectRatio, lockAspectRatioState) => {
        handleExport(
          lines,
          brushSize,
          color,
          selectedSize,
          scaleFactor,
          backgroundColor,
          aspectRatio,
          lockAspectRatioState,
        );
      },
      500,
    );
  }, []);

  useEffect(() => {
    if (debouncedExport.current) {
      debouncedExport.current(
        localLines,
        localBrushSize,
        localColor,
        localSelectedSize,
        localScaleFactor,
        localBackgroundColor,
        aspectRatio,
        lockAspectRatio,
      );
    }
  }, [
    localLines,
    localBrushSize,
    localColor,
    localSelectedSize,
    localScaleFactor,
    localBackgroundColor,
    aspectRatio,
    lockAspectRatio,
    data.input,
  ]);

  const handleSizeUpdate = useCallback(
    (dimension, value) => {
      let newSize = parseInt(value) || MIN_SIZE;
      newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newSize));

      let newScaleFactor, newAspectRatio;

      if (lockAspectRatio) {
        if (dimension === 'width') {
          newScaleFactor = NODE_WIDTH / newSize;
          setTempWidth(Math.round(newSize));
          setTempHeight(Math.round(newSize / aspectRatio));
          setLocalSelectedSize(() => ({
            width: newSize * newScaleFactor,
            height: Math.round((newSize / aspectRatio) * newScaleFactor),
          }));
        } else if (dimension === 'height') {
          setTempHeight(Math.round(newSize));
          setTempWidth(Math.round(newSize * aspectRatio));
          newScaleFactor = NODE_WIDTH / Math.round(newSize * aspectRatio);
          setLocalSelectedSize(() => ({
            width: Math.round(newSize * aspectRatio * newScaleFactor),
            height: newSize * newScaleFactor,
          }));
        }
      } else {
        newAspectRatio = dimension === 'width' ? newSize / tempHeight : tempWidth / newSize;
        newScaleFactor =
          dimension === 'width' ? NODE_WIDTH / newSize : NODE_WIDTH / Math.round(newSize * newAspectRatio);
        if (dimension === 'width') {
          setTempWidth(Math.round(newSize));
          setLocalSelectedSize(() => ({
            width: newSize * newScaleFactor,
            height: Math.round((newSize / newAspectRatio) * newScaleFactor),
          }));
        } else if (dimension === 'height') {
          setTempHeight(Math.round(newSize));
          setLocalSelectedSize(() => ({
            width: Math.round(newSize * newAspectRatio * newScaleFactor),
            height: newSize * newScaleFactor,
          }));
        }
        setAspectRatio(newAspectRatio);
      }
      setLocalScaleFactor(newScaleFactor);
    },
    [
      aspectRatio,
      setAspectRatio,
      localScaleFactor,
      setLocalScaleFactor,
      localSelectedSize,
      setLocalSelectedSize,
      lockAspectRatio,
    ],
  );

  // select the node when user interacts with any of the ui elements (canvas, buttons, sliders...)
  const flowView = useFlowView();
  const selectNodeById = useCallback((nodeId) => (flowView.selectedNodes = [nodeId]), [flowView]);
  const handleClickOnPaintNode = useCallback(() => {
    selectNodeById(id);
  }, [id]);

  return (
    <Box className="painter-container" onClick={handleClickOnPaintNode}>
      <Box
        data-testid={`konva-container-${id}`}
        className="nodrag"
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
      >
        <Stage
          ref={stageRef}
          tabIndex="0"
          width={localSelectedSize.width}
          height={localSelectedSize.height}
          style={{ ...checkersStyle(30) }}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          scaleX={localScaleFactor}
          scaleY={localScaleFactor}
        >
          <Layer id="backgroundLayer">
            <Rect
              x={0}
              y={0}
              width={localSelectedSize.width / localScaleFactor}
              height={localSelectedSize.height / localScaleFactor}
              fill={localBackgroundColor}
            />
          </Layer>
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={localSelectedSize.width / localScaleFactor}
                height={localSelectedSize.height / localScaleFactor}
              />
            )}
          </Layer>
          <Layer id="drawingLayer">
            {localLines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.tool === 'eraser' ? '#FFFFFF' : line.color}
                strokeWidth={line.brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
              />
            ))}
          </Layer>
        </Stage>
      </Box>
      <Box
        data-testid={`painter-settings-and-tools-container-${id}`}
        sx={{
          opacity: isSelected ? 1 : 0,
          transition: `all 0.1s ease-in-out`,
          pointerEvents: isSelected ? 'auto' : 'none',
          cursor: isSelected ? 'auto' : 'default',
        }}
      >
        <Box id="painter-main" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {role === 'editor' && (
            <>
              <Box
                id="painter-tools-container"
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  alignItems: 'center',
                  mt: 2,
                }}
              >
                <Box data-testid="painter-tools">
                  <IconButton
                    disableRipple
                    onClick={() => setTool('brush')}
                    sx={{
                      width: '30px',
                      height: '30px',
                      p: 0.2,
                      borderRadius: '4px',
                      backgroundColor: tool === 'brush' ? colors.Black64_T : 'transparent',
                      '&:active': {
                        backgroundColor: colors.Black64_T,
                      },
                    }}
                  >
                    <i className="fa-thin fa-paintbrush fa-xs"></i>
                  </IconButton>
                  <IconButton
                    disableRipple
                    onClick={() => setTool('eraser')}
                    sx={{
                      width: '30px',
                      height: '30px',
                      p: 0.2,
                      borderRadius: '4px',
                      ml: 1,
                      backgroundColor: tool === 'eraser' ? colors.Black64_T : 'transparent',
                      '&:active': {
                        backgroundColor: colors.Black64_T,
                      },
                    }}
                  >
                    <i className="fa-thin fa-eraser fa-xs"></i>
                  </IconButton>
                </Box>
                <Box id="painter-undo-settings">
                  <IconButton
                    disableRipple
                    onClick={handleUndo}
                    disabled={history.length === 1}
                    sx={{ width: '30px', height: '30px', p: 0.2, borderRadius: '4px' }}
                  >
                    <UndoIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    disableRipple
                    onClick={handleRedo}
                    disabled={redoHistory.length === 0}
                    sx={{ width: '30px', height: '30px', p: 0.2, borderRadius: '4px' }}
                  >
                    <RedoIcon fontSize="small" />
                  </IconButton>
                  <Link
                    onClick={() => handleReset()}
                    sx={{ cursor: 'pointer', fontSize: '12px', mx: 1, color: colors.White80_T }}
                  >
                    {t(I18N_KEYS.GENERAL.CLEAR)}
                  </Link>
                </Box>
              </Box>
            </>
          )}

          {role === 'editor' && (
            <Box
              className="nodrag"
              id="painter-brush-attributes-container"
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                mt: 1.5,
                mb: 2,
                justifyContent: 'space-between',
              }}
            >
              <ColorPickerField
                className="nodrag"
                color={hexToWebColor(localColor)}
                onChange={updateLocalColorNew}
                onChangeEnd={updateLocalColorNew}
                showColorEditor={true}
                showAlpha={true}
              />
              <FlexCenHorVer sx={{ gap: 1, alignItems: 'center' }}>
                <Typography variant="body-sm-rg" sx={{ color: colors.White80_T }}>
                  {t(I18N_KEYS.RECIPE_MAIN.NODES.PAINTER.BRUSH_SIZE_LABEL)}
                </Typography>
                <Slider
                  className="nodrag"
                  value={localBrushSize}
                  sx={{ width: '140px' }}
                  onChange={(e, value) => setLocalBrushSize(value)}
                  size="small"
                />
                <Typography variant="body-sm-rg" sx={{ minWidth: '20px', textAlign: 'right' }}>
                  {localBrushSize}
                </Typography>
              </FlexCenHorVer>
            </Box>
          )}
        </Box>
        <Divider sx={{ width: '100%' }} />
        <Box
          {...elementProps}
          data-testid={`painter-settings-${id}`}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            mt: 2,
          }}
        >
          <Flex
            data-testid={`painter-size-settings-${id}`}
            sx={{
              alignItems: 'center',
              cursor: !hasEditingPermissions(role, data) ? 'default' : '',
              pointerEvents: !hasEditingPermissions(role, data) ? 'none' : '',
              gap: 1,
            }}
          >
            <Input
              className="nodrag"
              disabled={!!data.input?.image}
              value={tempWidth}
              onChange={(e) => setTempWidth(Math.round(e.target.value))}
              onBlur={() => {
                handleSizeUpdate('width', tempWidth);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSizeUpdate('width', tempWidth);
                  e.target.blur();
                }
              }}
              startAdornment={
                <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem' }} color={colors.White64_T}>
                  W
                </Typography>
              }
              size="small"
              sx={{ width: '80px' }}
            />
            <Input
              className="nodrag"
              disabled={!!data.input?.image}
              value={tempHeight}
              onChange={(e) => setTempHeight(Math.round(e.target.value))}
              onBlur={() => {
                handleSizeUpdate('height', tempHeight);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSizeUpdate('height', tempHeight);
                  e.target.blur();
                }
              }}
              startAdornment={
                <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem' }} color={colors.White64_T}>
                  H
                </Typography>
              }
              size="small"
              sx={{ width: '80px' }}
            />
            <AppToggleButton
              className="nodrag"
              disabled={!!data.input?.image}
              sx={{
                width: '26px',
                height: '26px',
                minWidth: '26px',
                minHeight: '26px',
                p: 0.5,
                opacity: lockAspectRatio ? 1 : sizeSettingsSectionHovered ? 1 : 0,
                transition: 'opacity 0.1s ease-in-out',
              }}
              value={lockAspectRatio}
              onChange={() => setLockAspectRatio((prev) => !prev)}
            >
              {lockAspectRatio ? <LinkIcon width={8} height={8} /> : <LinkBreakIcon width={8} height={8} />}
            </AppToggleButton>
          </Flex>
          <FlexCenHorVer sx={{ gap: 1 }}>
            <Typography variant="body-sm-rg" sx={{ color: colors.White80_T }}>
              {t(I18N_KEYS.RECIPE_MAIN.NODES.PAINTER.BACKGROUND_COLOR_LABEL)}
            </Typography>
            <ColorPickerField
              className="nodrag"
              color={hexToWebColor(localBackgroundColor)}
              onChange={updateLocalBackgroundColorNew}
              onChangeEnd={updateLocalBackgroundColorNew}
              showColorEditor={false}
              showAlpha={false}
              size="large"
            />
          </FlexCenHorVer>
        </Box>
      </Box>
    </Box>
  );
}

export default PaintCore;
