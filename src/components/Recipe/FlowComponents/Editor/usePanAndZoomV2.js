import { useEffect, useState, useCallback } from 'react';

const useCanvasPanAndZoomV2 = (stageRef, containerRef, backgroundLayerRef, canvasScale) => {
  const [isZooming, setIsZooming] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [zoomTimeout, setZoomTimeout] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(1);

  const getStageCenter = useCallback(() => {
    if (!stageRef?.current || !containerRef?.current) return { x: 0, y: 0 };

    const container = containerRef.current;

    return {
      x: container.offsetWidth / 2,
      y: container.offsetHeight / 2,
    };
  }, [stageRef, containerRef]);

  const handleZoomToPoint = useCallback(
    (newZoom, point = null) => {
      if (!stageRef?.current) return;

      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const newScale = newZoom;

      // If no point provided, use stage center
      const zoomPoint = point || getStageCenter();

      // Get the point position relative to the stage
      const mousePointTo = {
        x: (zoomPoint.x - stage.x()) / oldScale,
        y: (zoomPoint.y - stage.y()) / oldScale,
      };

      // Calculate new position to keep the point under mouse
      const newPos = {
        x: zoomPoint.x - mousePointTo.x * newScale,
        y: zoomPoint.y - mousePointTo.y * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();

      setCurrentZoom(newScale);
    },
    [stageRef, getStageCenter],
  );

  const resetViewport = useCallback(() => {
    if (stageRef && stageRef.current) {
      stageRef.current.scale({ x: 1, y: 1 });
      stageRef.current.position({ x: 0, y: 0 });
      stageRef.current.batchDraw();
    }
  }, [stageRef]);

  const handleWheelZoom = useCallback(
    (e) => {
      if (!stageRef?.current) return;

      if (e.evt) {
        e.evt.preventDefault(); // For Konva events
      } else {
        e.preventDefault(); // For native events
      }
      const stage = stageRef.current;
      const oldScale = stage.scaleX();

      const mousePointTo = {
        x: (stage.getPointerPosition().x - stage.x()) / oldScale,
        y: (stage.getPointerPosition().y - stage.y()) / oldScale,
      };

      const newScale = e.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;

      const newPos = {
        x: stage.getPointerPosition().x - mousePointTo.x * newScale,
        y: stage.getPointerPosition().y - mousePointTo.y * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();

      setCurrentZoom(newScale);
    },
    [stageRef],
  );

  useEffect(() => {
    if (
      stageRef &&
      stageRef.current &&
      containerRef &&
      containerRef.current &&
      backgroundLayerRef &&
      backgroundLayerRef.current
    ) {
      const stage = stageRef.current;
      let isPanning = false;
      let lastPosX = 0;
      let lastPosY = 0;

      const handleWheel = (event) => {
        event.preventDefault();
        const panOnScroll = localStorage.getItem('panOnScroll') !== 'false';

        if (event.ctrlKey || event.metaKey) {
          setIsZooming(true);
          handleWheelZoom(event);

          if (zoomTimeout) clearTimeout(zoomTimeout);
          const newZoomTimeout = setTimeout(() => setIsZooming(false), 200);
          setZoomTimeout(newZoomTimeout);
        } else if (!panOnScroll && !spacePressed) {
          setIsZooming(true);
          handleWheelZoom(event);

          if (zoomTimeout) clearTimeout(zoomTimeout);
          const newZoomTimeout = setTimeout(() => setIsZooming(false), 200);
          setZoomTimeout(newZoomTimeout);
        } else if (!isZooming && !spacePressed) {
          stage.position({
            x: stage.x() - event.deltaX,
            y: stage.y() - event.deltaY,
          });
          stage.batchDraw();
        }
      };

      // Handle space key for enabling panning
      const handleKeyDown = (e) => {
        if (e.code === 'Space') {
          setSpacePressed(true);
          stage.container().style.cursor = 'grab';
        }
        if ((e.ctrlKey || e.metaKey) && (e.code === 'Equal' || e.code === 'NumpadAdd')) {
          e.preventDefault();
          setIsZooming(true);
          handleZoomToPoint(currentZoom * 1.15);
          if (zoomTimeout) clearTimeout(zoomTimeout);
          const newZoomTimeout = setTimeout(() => setIsZooming(false), 200);
          setZoomTimeout(newZoomTimeout);
        }
        if ((e.ctrlKey || e.metaKey) && (e.code === 'Minus' || e.code === 'NumpadSubtract')) {
          e.preventDefault();
          setIsZooming(true);
          handleZoomToPoint(currentZoom / 1.15);
          if (zoomTimeout) clearTimeout(zoomTimeout);
          const newZoomTimeout = setTimeout(() => setIsZooming(false), 200);
          setZoomTimeout(newZoomTimeout);
        }
      };

      const handleKeyUp = (e) => {
        if (e.code === 'Space') {
          setSpacePressed(false);
          stage.container().style.cursor = 'default';
        }
      };

      const handleMouseDown = (e) => {
        if (spacePressed) {
          isPanning = true;
          const pos = stage.getPointerPosition();
          lastPosX = pos.x;
          lastPosY = pos.y;
          e.evt.preventDefault();
        }
      };

      const handleMouseMove = () => {
        if (isPanning && spacePressed) {
          const pos = stage.getPointerPosition();
          const dx = pos.x - lastPosX;
          const dy = pos.y - lastPosY;

          stage.position({
            x: stage.x() + dx,
            y: stage.y() + dy,
          });
          stage.batchDraw();
          lastPosX = pos.x;
          lastPosY = pos.y;
        }
      };

      const handleMouseUpOrOut = () => {
        isPanning = false;
      };

      const stageEl = stage.container();
      stageEl.addEventListener('wheel', handleWheel);
      stage.on('mousedown', handleMouseDown);
      stage.on('mousemove', handleMouseMove);
      stage.on('mouseup', handleMouseUpOrOut);
      stage.on('mouseout', handleMouseUpOrOut);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
        stageEl.removeEventListener('wheel', handleWheel);
        stage.off('mousedown', handleMouseDown);
        stage.off('mousemove', handleMouseMove);
        stage.off('mouseup', handleMouseUpOrOut);
        stage.off('mouseout', handleMouseUpOrOut);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        if (zoomTimeout) {
          clearTimeout(zoomTimeout);
        }
      };
    }
  }, [
    stageRef,
    containerRef,
    backgroundLayerRef,
    isZooming,
    zoomTimeout,
    spacePressed,
    handleZoomToPoint,
    currentZoom,
    canvasScale,
    handleWheelZoom,
  ]);

  return {
    resetViewport,
    handleZoomToPoint,
    currentZoom,
  };
};

export default useCanvasPanAndZoomV2;
