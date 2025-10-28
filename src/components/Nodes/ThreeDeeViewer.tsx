/* eslint-disable react/no-unknown-property -- Three.js properties */
import { useErrorBoundary } from 'use-error-boundary';
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Box, Typography } from '@mui/material';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Html, useProgress, ContactShadows } from '@react-three/drei';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { Flex } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { usePrevious } from '@/hooks/usePrevious';
import { Model } from './ThreedeeUtils';
import type { MediaAsset } from '@/types/api/assets';

const logger = log.getLogger('ThreeDeeViewer');

const VIEWER_SIZE = { w: 304, h: 304 }; // the reason for 304 is 320 (css custom-node.preview width) minus the 2x*8px padding

function ModelLoader() {
  const { progress } = useProgress();

  return <Html center>{progress} % loaded</Html>;
}

function SetCameraPosition({ cameraPosition }: { cameraPosition?: { x: number; y: number; z: number } }) {
  const { camera } = useThree();

  useEffect(() => {
    // Only set camera position if explicitly provided
    if (cameraPosition) {
      camera.position.x = cameraPosition.x ?? -3;
      camera.position.y = cameraPosition.y ?? 4;
      camera.position.z = cameraPosition.z ?? 5;
    } else {
      // Set default positions only on initial mount
      camera.position.x = -3;
      camera.position.y = 4;
      camera.position.z = 5;
    }

    camera.updateProjectionMatrix();
  }, []);

  return null;
}

function CameraControls({ lockOrbit, setCameraPosition, onOrbitChange }) {
  const { camera } = useThree();
  const prevPosition = useRef({ x: 0, y: 0, z: 0 });
  const frameRef = useRef<number>(undefined);
  const isMovingRef = useRef(false);

  useEffect(() => {
    const checkMovement = () => {
      const currentPos = camera.position;
      const velocity = Math.sqrt(
        Math.pow(currentPos.x - prevPosition.current.x, 2) +
          Math.pow(currentPos.y - prevPosition.current.y, 2) +
          Math.pow(currentPos.z - prevPosition.current.z, 2),
      );

      const MOVEMENT_THRESHOLD = 0.025; // Adjust this value as needed

      if (velocity < MOVEMENT_THRESHOLD && isMovingRef.current) {
        isMovingRef.current = false;
        onOrbitChange?.();
      } else if (velocity >= MOVEMENT_THRESHOLD) {
        isMovingRef.current = true;
      }

      prevPosition.current = {
        x: currentPos.x,
        y: currentPos.y,
        z: currentPos.z,
      };

      frameRef.current = requestAnimationFrame(checkMovement);
    };

    frameRef.current = requestAnimationFrame(checkMovement);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [camera, onOrbitChange]);

  return (
    <OrbitControls
      enableRotate={!lockOrbit}
      enableZoom={!lockOrbit}
      enablePan={!lockOrbit}
      target={[0, 1.5, 0]}
      dampingFactor={0.1}
      onChange={() => {
        if (setCameraPosition) {
          setCameraPosition({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          });
        }
      }}
    />
  );
}

type ThreeDeeViewerProps = {
  objUrl: string;
  containerSize?: { w: number; h: number };
  setExportedImage?: (image: Partial<MediaAsset>) => void;
  lockOrbit?: boolean;
  cameraPosition?: { x: number; y: number; z: number };
  setCameraPosition?: (position: { x: number; y: number; z: number }) => void;
  allowInteraction?: boolean;
  isSelected?: boolean;
  displayBackground?: boolean;
};

function ThreeDeeViewer({
  objUrl,
  containerSize,
  setExportedImage,
  lockOrbit,
  cameraPosition,
  setCameraPosition,
  allowInteraction = true,
  isSelected = true,
  displayBackground = false,
}: ThreeDeeViewerProps) {
  const { t } = useTranslation();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerSize = containerSize || VIEWER_SIZE;
  const [finishedLoading, setFinishedLoading] = useState(false);
  const { ErrorBoundary, didCatch, error, reset: resetError } = useErrorBoundary();
  const previousIsSelectedRef = usePrevious(isSelected);

  useEffect(() => {
    let url: string | null = null;
    if (objUrl) {
      fetch(objUrl)
        .then((response) => response.blob())
        .then((blob) => {
          url = URL.createObjectURL(blob);
          setObjectUrl(url);
        })
        .catch((error) => logger.error('Error fetching OBJ file', error));
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [objUrl]);

  useEffect(() => {
    if (containerRef.current) {
      const canvasElement = containerRef.current;

      // Focus canvas when mouse enters or interaction occurs
      const handleMouseEnter = () => {
        canvasElement.focus();
      };

      const handleWheel = (event) => {
        const containerElement = containerRef.current;
        if (
          containerElement &&
          (containerElement === document.activeElement || containerElement.contains(document.activeElement))
        ) {
          event.stopPropagation(); // Prevent scrolling propagation
        }
      };
      const handleMouseClick = (event) => {
        const containerElement = containerRef.current;
        if (
          containerElement &&
          (containerElement === document.activeElement || containerElement.contains(document.activeElement))
        ) {
          event.stopPropagation(); // Prevent scrolling propagation
        }
      };

      if (allowInteraction) {
        canvasElement.addEventListener('mouseenter', handleMouseEnter);
        canvasElement.addEventListener('click', handleMouseClick);
        canvasElement.addEventListener('wheel', handleWheel);
      }

      return () => {
        canvasElement.removeEventListener('mouseenter', handleMouseEnter);
        canvasElement.removeEventListener('click', handleMouseClick);
        canvasElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [containerRef, allowInteraction]);

  const setCanvasSize = () => {
    if (canvasRef && canvasRef.current) {
      canvasRef.current.style.width = `${viewerSize.w}px`;
      canvasRef.current.style.height = `${viewerSize.h}px`;
    }
  };

  const handleCanvasCreated = () => {
    setCanvasSize();
  };

  useEffect(() => {
    setCanvasSize();
  }, [objUrl]);

  useEffect(() => {
    if (error) {
      logger.error('Error in Three.js boundary', error);
      resetError();
    }
  }, [error, resetError, t]);

  const exportImage = () => {
    if (!isSelected) {
      return;
    }
    if (canvasRef && canvasRef.current) {
      const canvas = canvasRef.current;

      try {
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        const threeDImage = {
          type: 'image' as const,
          url: dataUrl,
          width: canvas.width,
          height: canvas.height,
        };
        setExportedImage?.(threeDImage);
      } catch (error) {
        logger.error('Error exporting canvas', error);
      }
    }
  };

  const debouncedExport = useRef(
    debounce(() => {
      if (!setExportedImage) return;
      exportImage();
    }, 500),
  ).current;

  useEffect(() => {
    return () => {
      debouncedExport.cancel();
    };
  }, [debouncedExport]);

  useEffect(() => {
    if (finishedLoading && isSelected) {
      if (previousIsSelectedRef === undefined) {
        // when the component is first rendered, we want to export the image after a delay
        setTimeout(() => {
          exportImage();
        }, 1000);
      } else {
        // when only the selection changes, we want to export the image immediately
        exportImage();
      }
    }
  }, [finishedLoading, isSelected]);

  return (
    <Box
      ref={containerRef}
      tabIndex={0}
      className={`3d_player ${displayBackground ? 'media-container-dark' : ''}`}
      id="three-d-player-wrapper"
      sx={{
        width: `${viewerSize.w}px`,
        height: `${viewerSize.h}px`,
        '&:focus': {
          outline: 'none',
        },
      }}
    >
      {didCatch ? (
        <Flex sx={{ padding: 2 }}>
          <Typography variant="body-sm-rg" color="error">
            {t(I18N_KEYS.COMMON_COMPONENTS.THREE_DEE_VIEWER.ERROR)}
          </Typography>
        </Flex>
      ) : objectUrl ? (
        <ErrorBoundary>
          <Canvas
            key={objectUrl}
            shadows
            onCreated={({ gl }) => {
              gl.setClearColor('#e0e0e0', 0);
              handleCanvasCreated();
              exportImage();
            }}
            // this fixes canvas size issues caused by the zoom of the workflow stage which breaks the automatic
            // measurement of the canvas container
            resize={{ offsetSize: true }}
            gl={{ preserveDrawingBuffer: true, alpha: true }}
            ref={canvasRef}
          >
            <SetCameraPosition cameraPosition={cameraPosition} />
            <CameraControls
              lockOrbit={allowInteraction ? lockOrbit : true}
              setCameraPosition={setCameraPosition}
              onOrbitChange={debouncedExport}
            />
            <directionalLight
              intensity={1}
              position={[-5, 10, -5]}
              castShadow
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
            <ambientLight color="#dce7f5" intensity={0.5} />
            <Suspense fallback={<ModelLoader />}>
              <Model objUrl={objectUrl} type={4} setFinishedLoading={setFinishedLoading} />
              <ContactShadows
                rotation-x={Math.PI / 2}
                position={[0, 0, 0]}
                opacity={1}
                width={5}
                height={5}
                blur={1}
                far={1}
              />
            </Suspense>
            <Environment preset="city" blur={0.5} />
          </Canvas>
        </ErrorBoundary>
      ) : null}
    </Box>
  );
}

export default ThreeDeeViewer;
