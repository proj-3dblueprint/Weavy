import { Box, Skeleton } from '@mui/material';
import { useMemo, useState } from 'react';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { getAxiosInstance } from '@/services/axiosConfig';
import { appendQsFromArray } from '@/utils/urls';
import { getResultId } from '@/utils/files';
import DesignAppGallery from '../DesignAppGallery';
import type { DeleteFunctions } from '@/components/Common/ImageList/types';
import type { RenderingAsset, MediaAsset } from '@/types/api/assets';
import type { DesignAppResult } from '@/types/design-app.types';

const logger = log.getLogger('Preview');
const axiosInstance = getAxiosInstance();

interface PreviewProps {
  recipeId: string;
  version: string;
  isLoading: boolean;
  isProcessing: boolean;
  results: DesignAppResult[];
  setResults: (results: DesignAppResult[]) => void;
  recipeName: string;
  numberOfLoadingResults: number;
  progress?: number;
}

const Preview = ({
  recipeId,
  version,
  isLoading,
  isProcessing,
  results,
  setResults,
  recipeName,
  numberOfLoadingResults,
  progress,
}: PreviewProps) => {
  const [selected, setSelected] = useState(0);

  const baseUrl = useMemo(() => {
    return `/v1/recipe-runs/recipes/${recipeId}/user-design-app/results`;
  }, [recipeId]);

  const deleteCurrentResult = async () => {
    if (numberOfLoadingResults > 0) {
      // will delete incorrectly while rendering new results
      return;
    }
    try {
      // TODO: use result id when we add it instead of publicId
      const idWithFolder = getResultId(results[selected].publicId);
      const params = appendQsFromArray('id', [idWithFolder]);
      params.append('version', version);
      await axiosInstance.delete(`${baseUrl}?${params.toString()}`);
      setResults(results.filter((_, index) => index !== selected));
      setSelected(0);
    } catch (e) {
      logger.error('deleteCurrentResult(): error', e);
    }
  };

  const deleteAllOtherResults = async () => {
    if (numberOfLoadingResults > 0) {
      // will delete incorrectly while rendering new results
      return;
    }
    try {
      const idsToDelete = results
        .filter((_, index) => index !== selected)
        .map((result) => getResultId(result.publicId));
      const params = appendQsFromArray('id', idsToDelete);
      params.append('version', version);
      await axiosInstance.delete(`${baseUrl}?${params.toString()}`);
      setResults(results.filter((_, index) => index === selected));
      setSelected(0);
    } catch (e) {
      logger.error('deleteAllOtherResults(): error', e);
    }
  };

  const deleteAllResults = async () => {
    try {
      const idsToDelete = results.map((result) => getResultId(result.publicId));
      const params = appendQsFromArray('id', idsToDelete);
      params.append('version', version);
      await axiosInstance.delete(`${baseUrl}?${params.toString()}`);
      setResults([]);
      setSelected(0);
    } catch (e) {
      logger.error('deleteAllResults(): error', e);
    }
  };

  const deletionFunctions: DeleteFunctions = {
    deleteCurrentResult,
    deleteAllOtherResults,
    deleteAllResults,
    disableDelete: numberOfLoadingResults > 0,
  };

  return (
    <Box
      id="design-app-preview-container"
      sx={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: `${color.Black92}`,
        border: `1px solid ${color.Dark_Grey}`,
        p: 2,
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              width: '100%',
              height: '80%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Box
              sx={{
                flex: 1,
                width: '80%',
                position: 'relative',
              }}
            >
              <Skeleton variant="rounded" animation="wave" width="100%" height="100%" />
              <i
                className="fa-light fa-photo-film-music fa-xl"
                style={{
                  fontSize: '50px',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: color.White64_T,
                }}
              ></i>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '80%',
                height: '20%',
                gap: 2,
                position: 'relative',
              }}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" animation="wave" width="100%" height="100%" />
              ))}
            </Box>
          </Box>
        ) : (
          <>
            {results.length > 0 || isProcessing ? (
              <DesignAppGallery
                recipeName={recipeName}
                mediaArray={
                  isProcessing
                    ? [
                        ...Array<MediaAsset | RenderingAsset>(numberOfLoadingResults).fill({
                          type: 'rendering',
                          progress,
                        }),
                        ...results,
                      ]
                    : results
                }
                selected={selected}
                setSelected={setSelected}
                deletionFunctions={deletionFunctions}
              />
            ) : (
              <Box
                sx={{
                  border: `1px solid ${color.White64_T}`,
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <i className="fa-thin fa-image fa-xl" style={{ fontSize: '50px' }}></i>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default Preview;
