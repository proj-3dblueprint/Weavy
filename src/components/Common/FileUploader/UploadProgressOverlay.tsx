import { color } from '@/colors';
import { LoadingCircle } from '@/UI/Animations/LoadingCircle';
import { FlexColCenHorVer } from '@/UI/styles';

export const UploadProgressOverlay = () => {
  return (
    <FlexColCenHorVer
      sx={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        backgroundColor: color.Black64_T,
        gap: 1,
      }}
    >
      <LoadingCircle size={24} color={color.White100} />
    </FlexColCenHorVer>
  );
};
