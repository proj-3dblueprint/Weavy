import { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { Box, LinearProgress } from '@mui/material';
import JSZip from 'jszip';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { ModelType } from '@/enums/model-type.enum';
import { CreditsContext } from '@/services/CreditsContext';
import { Flex } from '@/UI/styles';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';
import { I18N_KEYS } from '@/language/keys';
import { getAxiosInstance } from '@/services/axiosConfig';
import { registerImageUtil } from './Utils';
import { runModel } from './RunModel';
import NodeDetailsAccordion from './Shared/NodeDetailsAccordion';
import NodeErrorOverlay from './Shared/NodeErrorOverlay';

const logger = log.getLogger('MaskExtractionCore');
const axiosInstance = getAxiosInstance();

function MaskExtractionCore({ id, recipeId, recipeVersion, data, updateNodeData }) {
  const { t } = useTranslation();
  const { input, handles, params } = data;
  const [fileSrc, setFileSrc] = useState();
  const [masks, setMasks] = useState(data.result?.masks);
  const [hoveredMask, setHoveredMask] = useState(null);
  const [selectedMasks, setSelectedMasks] = useState(data.result?.selectedMasks || []);
  const [, setPanopticImage] = useState(data.result?.panopticImage);
  const [combinedImage, setCombinedImage] = useState(null);
  const [matteImage, setMatteImage] = useState(null);
  const [, setAlphaBlendedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlphaMask, setShowAlphaMask] = useState(false);
  const [hasError, setHasError] = useState(false);
  const visualId = useRef();

  const panopticCanvasRef = useRef();
  const combinedCanvasRef = useRef();

  const { setUserCredits } = useContext(CreditsContext);

  const [chokerWorker, setChokerWorker] = useState(null);
  const [blendWorker, setBlendWorker] = useState(null);
  const chokerRequestRef = useRef();
  const lastChokerTime = useRef(0);

  useEffect(() => {
    if (data.result?.visualId) {
      visualId.current = data.result.visualId;
    }
  }, []);

  const drawPanopticImage = (imageSrc) => {
    const panopticCanvas = panopticCanvasRef.current;
    if (!panopticCanvas) return;
    const panopticCtx = panopticCanvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      panopticCanvas.width = img.width;
      panopticCanvas.height = img.height;
      panopticCtx.drawImage(img, 0, 0);
    };
  };

  const blobToDataURL = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const createCombinedImage = () => {
    if (!masks) return;
    const combinedCanvas = combinedCanvasRef.current;
    if (!combinedCanvas) return;
    const combinedCtx = combinedCanvas.getContext('2d');
    const baseMask = masks[Object.keys(masks)[0]];
    const img = new Image();
    img.src = baseMask;
    img.onload = () => {
      combinedCanvas.width = img.width;
      combinedCanvas.height = img.height;
      combinedCtx.clearRect(0, 0, combinedCanvas.width, combinedCanvas.height);

      if (selectedMasks.length === 0) {
        combinedCtx.fillStyle = 'black';
        combinedCtx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
        const combinedImageData = combinedCanvas.toDataURL('image/png');
        setCombinedImage(combinedImageData);
      } else {
        selectedMasks.forEach((maskKey) => {
          const maskImg = new Image();
          maskImg.src = masks[maskKey];
          maskImg.onload = () => {
            combinedCtx.globalCompositeOperation = 'screen';
            combinedCtx.drawImage(maskImg, 0, 0);
            setCombinedImage(combinedCanvas.toDataURL('image/png'));
          };
        });
      }

      combinedCtx.globalCompositeOperation = 'source-over';
    };
  };

  const downloadAndExtractZip = async (zipUrl) => {
    try {
      const response = await axiosInstance.get(zipUrl, { responseType: 'arraybuffer' });
      // Extract the zip file
      const zip = await JSZip.loadAsync(response.data);
      const extractedFiles = {};
      let panopticImg = null;

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('blob');
          const dataUrl = await blobToDataURL(content);
          if (relativePath.includes('panoptic')) {
            panopticImg = dataUrl;
          } else {
            extractedFiles[relativePath] = dataUrl;
          }
        }
      }
      updateNodeData(id, {
        result: {
          masks: extractedFiles,
          selectedMasks: [],
          panopticImage: panopticImg,
          visualId: visualId.current,
        },
      });
      setMasks(extractedFiles);
      setPanopticImage(panopticImg);
      drawPanopticImage(panopticImg);
      createCombinedImage();
    } catch (error) {
      logger.error('Error downloading or extracting zip file', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalyseMasks = async (runVisualId) => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      await runModel(
        { ...handles, input: ['visualId'] },
        {
          visualId: runVisualId,
        },
        {
          name: ModelType.BRMasks,
          type: ModelType.BRMasks,
        },
        params,
        id,
        recipeId,
        recipeVersion,
        {
          onSuccess: async (results, remainingCredits) => {
            if (results.objects_masks) {
              const zipUrl = results.objects_masks;
              await downloadAndExtractZip(zipUrl);
              if (remainingCredits != null) {
                setUserCredits(remainingCredits);
              }
            }
          },
          onError: (error) => {
            logger.error('Error downloading or extracting zip file.', error);
            setHasError(true);
          },
        },
        data.version,
      );
    } catch (error) {
      logger.error('Error running mask extraction.', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const registerImage = async (url) => {
    setIsLoading(true);
    try {
      return await registerImageUtil(url);
    } catch (error) {
      logger.error('Error registering image.', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnection = useCallback(async () => {
    setFileSrc(input['image']);

    // if there are no prior masks, run the mask extraction
    if (!data.result?.masks && input['image']) {
      if (!input['image'].visualId) {
        visualId.current = await registerImage(input['image'].url);
      } else visualId.current = input['image'].visualId;

      runAnalyseMasks(visualId.current);
    } else {
      drawPanopticImage(data.result.panopticImage);
    }
  }, [fileSrc, data, updateNodeData]);

  const handleDisconnection = useCallback(() => {
    setMasks(null);
    setIsLoading(false);
    setHasError(false);
    setSelectedMasks([]);
    setCombinedImage(null);
    setFileSrc(null);
    updateNodeData(id, {
      selectedMasks: [],
      result: {},
      output: {
        ['image_with_alpha']: null,
        ['mask']: null,
      },
    });
  }, [setMasks, setSelectedMasks, setCombinedImage, updateNodeData]);

  useEffect(() => {
    if (input && input['image']) {
      handleConnection();
    } else {
      handleDisconnection();
    }
  }, [input]);

  const handleMouseMove = (e) => {
    const panopticCanvas = panopticCanvasRef.current;
    if (!panopticCanvas) return;
    const panopticCtx = panopticCanvas.getContext('2d', { willReadFrequently: true });

    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * panopticCanvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * panopticCanvas.height;

    if (panopticCanvas) {
      const pixel = panopticCtx.getImageData(x, y, 1, 1).data;
      const maskKey = `${visualId.current}/${visualId.current}_${pixel[0]}.png`;
      if (masks[maskKey]) {
        setHoveredMask(maskKey);
      } else {
        setHoveredMask(null);
      }
    }
  };

  const handleClickedMask = useCallback(
    (e) => {
      if (hoveredMask) {
        if (e.shiftKey) {
          setSelectedMasks((prev) => {
            if (prev.includes(hoveredMask)) {
              return prev.filter((mask) => mask !== hoveredMask);
            }
            return [...prev, hoveredMask];
          });
        } else if (e.altKey || e.metaKey) {
          setSelectedMasks((prev) => prev.filter((mask) => mask !== hoveredMask));
        } else {
          setSelectedMasks([hoveredMask]);
        }
      }
    },
    [hoveredMask],
  );

  useEffect(() => {
    if (!selectedMasks?.length) {
      // Create a black image when no masks are selected
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Use the dimensions from fileSrc if available, otherwise use a default size
      canvas.width = fileSrc?.width || 800;
      canvas.height = fileSrc?.height || 600;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const blackImage = canvas.toDataURL('image/png');
      setMatteImage(blackImage);
      return;
    }
    createCombinedImage();
    updateNodeData(id, {
      result: {
        ...data.result,
        selectedMasks: selectedMasks,
      },
    });
  }, [selectedMasks, fileSrc?.width, fileSrc?.height]);

  // Worker setup and matte choker application
  useEffect(() => {
    const worker = new Worker('/workers/matteChokerWorker.js');
    setChokerWorker(worker);

    const newBlendWorker = new Worker('/workers/blendWorker.js'); // New worker for blending
    setBlendWorker(newBlendWorker);

    return () => {
      worker.terminate();
      newBlendWorker.terminate();
    };
  }, []);

  const blendOriginalWithAlpha = useCallback(
    (chokedImage) => {
      if (!fileSrc || !chokedImage || !blendWorker) return;

      const originalImage = new Image();
      const alphaImage = new Image();

      originalImage.onload = () => {
        alphaImage.onload = () => {
          const originalCanvas = document.createElement('canvas');
          originalCanvas.width = originalImage.width;
          originalCanvas.height = originalImage.height;
          const originalCtx = originalCanvas.getContext('2d');
          originalCtx.drawImage(originalImage, 0, 0);

          const alphaCanvas = document.createElement('canvas');
          alphaCanvas.width = alphaImage.width;
          alphaCanvas.height = alphaImage.height;
          const alphaCtx = alphaCanvas.getContext('2d');
          alphaCtx.drawImage(alphaImage, 0, 0);

          const originalImageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
          const alphaImageData = alphaCtx.getImageData(0, 0, alphaCanvas.width, alphaCanvas.height);

          blendWorker.postMessage({ originalImageData, alphaImageData }, [
            originalImageData.data.buffer,
            alphaImageData.data.buffer,
          ]);
        };
        alphaImage.src = matteImage;
      };
      originalImage.src = fileSrc.url;
      originalImage.crossOrigin = 'anonymous';

      blendWorker.onmessage = (e) => {
        const { blendedImageData } = e.data;
        const blendedCanvas = document.createElement('canvas');
        blendedCanvas.width = blendedImageData.width;
        blendedCanvas.height = blendedImageData.height;
        const blendedCtx = blendedCanvas.getContext('2d');
        blendedCtx.putImageData(blendedImageData, 0, 0);

        const blendedImage = blendedCanvas.toDataURL('image/png');
        setAlphaBlendedImage(blendedImage);

        const formattedOutput = {};
        formattedOutput['image_with_alpha'] = {
          type: 'image',
          url: blendedImage,
          width: fileSrc?.width,
          height: fileSrc?.height,
        };
        formattedOutput['mask'] = {
          type: 'image',
          url: chokedImage,
          width: fileSrc?.width,
          height: fileSrc?.height,
        };
        updateNodeData(id, { output: formattedOutput });
      };
    },
    [fileSrc, matteImage, blendWorker, updateNodeData],
  );

  const applyMatteChoker = useCallback(() => {
    if (!combinedImage || !chokerWorker) return;
    const tempSize = 256;
    const now = performance.now();
    if (now - lastChokerTime.current < 16) {
      chokerRequestRef.current = requestAnimationFrame(applyMatteChoker);

      return;
    }
    lastChokerTime.current = now;

    const img = new Image();
    img.onload = async () => {
      // Create a small canvas for downscaling
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = tempSize;
      smallCanvas.height = tempSize;
      const smallCtx = smallCanvas.getContext('2d');

      // Draw the image at a smaller size
      smallCtx.drawImage(img, 0, 0, tempSize, tempSize);
      const smallImageData = smallCtx.getImageData(0, 0, tempSize, tempSize);

      chokerWorker.postMessage(
        {
          imageData: smallImageData,
          amount: params.matte_choker,
          originalWidth: img.width,
          originalHeight: img.height,
          featherRadius: params.feather || 0, // Add feather radius parameter
        },
        [smallImageData.data.buffer],
      );
    };
    img.src = combinedImage;

    chokerWorker.onmessage = async (e) => {
      const { chokedImageData, originalWidth, originalHeight } = e.data;

      // Create an ImageBitmap from the choked data
      const chokedBitmap = await createImageBitmap(chokedImageData);

      // Create a canvas to scale the image back up
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = originalWidth;
      finalCanvas.height = originalHeight;
      const finalCtx = finalCanvas.getContext('2d');

      // Draw the choked bitmap at the original size
      finalCtx.imageSmoothingEnabled = false; // Disable smoothing for sharper edges
      finalCtx.drawImage(chokedBitmap, 0, 0, originalWidth, originalHeight);

      const chokedImage = finalCanvas.toDataURL('image/png');
      setMatteImage(chokedImage);

      blendOriginalWithAlpha(chokedImage);
    };
  }, [
    combinedImage,
    params.matte_choker,
    params.feather,
    chokerWorker,
    updateNodeData,
    setMatteImage,
    blendOriginalWithAlpha,
  ]);

  useEffect(() => {
    chokerRequestRef.current = requestAnimationFrame(applyMatteChoker);

    return () => cancelAnimationFrame(chokerRequestRef.current);
  }, [applyMatteChoker]);

  return (
    <Box>
      {isLoading && (
        <Box sx={{ width: '100%', position: 'absolute', top: 7, left: 0 }}>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
        </Box>
      )}
      {(!fileSrc || !fileSrc.url) && (
        <Box sx={{ position: 'relative' }}>
          <Box
            className="media-container-dark"
            sx={{ width: '100%', height: '430px', position: 'relative', borderRadius: 2 }}
          />
          {hasError && <NodeErrorOverlay errorMessage={t(I18N_KEYS.RECIPE_MAIN.NODES.MASKS.ERROR)} />}
        </Box>
      )}
      <canvas ref={panopticCanvasRef} style={{ display: 'none' }} />
      <canvas ref={combinedCanvasRef} style={{ display: 'none' }} />
      <Box
        className="media-container-dark"
        sx={{ position: 'relative', cursor: 'pointer', borderRadius: 2, overflow: 'hidden' }}
      >
        <img
          src={showAlphaMask ? matteImage : fileSrc?.thumbnail || fileSrc?.url || ''}
          draggable="false"
          width="100%"
          style={{ display: 'block' }}
        />
        {masks &&
          Object.entries(masks).map(([key, src]) => {
            return (
              <Box
                key={key}
                sx={{
                  position: 'absolute',
                  opacity: hoveredMask === key || selectedMasks.some((m) => m === key) ? 0.5 : 0,
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${src})`,
                  backgroundSize: 'cover',
                  mixBlendMode: 'screen',
                }}
                onMouseMove={(e) => handleMouseMove(e)}
                onMouseLeave={() => setHoveredMask(null)}
                onClick={(e) => handleClickedMask(e)}
              >
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: selectedMasks.some((m) => m === key) ? color.Yambo_Purple : color.Yambo_Orange,
                    mixBlendMode: 'multiply',
                    opacity: 0.9,
                  }}
                />
              </Box>
            );
          })}
        {!hasError && (
          <Flex
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: color.Black84,
              p: 0.4,
              borderRadius: 1,
            }}
          >
            <AppToggleButtons
              value={showAlphaMask}
              options={[
                { value: false, label: t(I18N_KEYS.RECIPE_MAIN.NODES.MASKS.IMAGE) },
                { value: true, label: t(I18N_KEYS.RECIPE_MAIN.NODES.MASKS.MASK) },
              ]}
              onChange={(value) => setShowAlphaMask(value)}
              sx={{
                '& .MuiButtonBase-root.MuiToggleButton-root.Mui-selected': {
                  background: color.White64_T,
                  color: color.Black92,
                },
                '& .MuiButtonBase-root.MuiToggleButton-root.Mui-selected:hover': {
                  background: color.White80_T,
                  color: color.Black92,
                },
                '& .MuiButtonBase-root.MuiToggleButton-root:hover': {
                  background: color.White16_T,
                },
              }}
            />
          </Flex>
        )}
        {hasError && <NodeErrorOverlay errorMessage={t(I18N_KEYS.RECIPE_MAIN.NODES.MASKS.ERROR)} />}
      </Box>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mt: 1 }}>
        <Box data-testid="compositor-details-container">
          <NodeDetailsAccordion description={data.description} />
        </Box>
      </Flex>
    </Box>
  );
}

export default MaskExtractionCore;
