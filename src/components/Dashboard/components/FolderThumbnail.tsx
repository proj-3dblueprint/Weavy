import { Box, useTheme } from '@mui/material';
import { color } from '@/colors';
import { FlexCenHorVer } from '@/UI/styles';
import type { FolderRecipeData } from '../utils/listView.utils';

interface FolderThumbnailProps {
  folderId: string;
  folderRecipeData: FolderRecipeData;
}

export function FolderThumbnail({ folderId, folderRecipeData }: FolderThumbnailProps) {
  const theme = useTheme();
  const data = folderRecipeData[folderId];

  if (!data || data.count === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: color.Black92,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src="/icons/folder.svg" alt="folder" style={{ width: '40px', height: '40px' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: color.Black88,
        borderRadius: 1,
        padding: 1,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 0.375,
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {[0, 1, 2, 3].map((index) => {
          const poster = data.posters[index];
          const isLastSlot = index === 3;
          const extraCount = data.count - 4;
          const shouldShowOverlay = isLastSlot && extraCount > 0;

          if (!poster) {
            return <Box key={index} />;
          }

          // Check if this is a folder icon
          if (poster === 'folder') {
            return (
              <Box
                key={index}
                sx={{
                  borderRadius: 0.375,
                  bgcolor: color.Black92,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}
              >
                <img
                  src="/icons/folder.svg"
                  alt="folder"
                  style={{ width: '16px', height: '16px', opacity: shouldShowOverlay ? 0.5 : 1 }}
                />
                {shouldShowOverlay && <Box sx={{ position: 'absolute', inset: 0, bgcolor: color.Black64_T }} />}
              </Box>
            );
          }

          return (
            <Box
              key={index}
              sx={{
                borderRadius: 0.375,
                overflow: 'hidden',
                backgroundImage: shouldShowOverlay
                  ? `linear-gradient(90deg, ${color.Black64_T} 0%, ${color.Black64_T} 100%), url(${poster})`
                  : `url(${poster})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%',
              }}
            />
          );
        })}
        {data.count > 4 && (
          <FlexCenHorVer
            sx={{
              position: 'absolute',
              bottom: 0.25,
              right: 0.25,
              color: color.White100,
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: theme.typography.fontFamily,
              width: 'calc(50% - 4.5px)',
              height: 'calc(50% - 4.5px)',
            }}
          >
            +{data.count - 4}
          </FlexCenHorVer>
        )}
      </Box>
    </Box>
  );
}
