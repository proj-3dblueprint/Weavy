import { Box } from '@mui/material';
import { ImageList } from '../../Common/ImageList/ImageList';
import type { DeleteFunctions } from '@/components/Common/ImageList/types';
import type { RenderingAsset, MediaAsset } from '@/types/api/assets';

function DesignAppGallery({
  mediaArray,
  recipeName,
  selected,
  setSelected,
  deletionFunctions,
}: {
  mediaArray: (MediaAsset | RenderingAsset)[];
  recipeName: string;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  deletionFunctions: DeleteFunctions;
}) {
  return (
    <Box
      id="design-app-gallery-container"
      sx={{
        width: '100%',
        height: '100%',
        background: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <ImageList
        nodeName={recipeName}
        images={mediaArray}
        selected={selected}
        setSelected={setSelected}
        container="design-app"
        deletionFunctions={deletionFunctions}
        showHeader
      />
    </Box>
  );
}

export default DesignAppGallery;
