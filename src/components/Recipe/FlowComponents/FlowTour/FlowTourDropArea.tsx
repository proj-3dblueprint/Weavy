import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';

export const FlowTourDropArea = ({ canMoveToNextStep }: { canMoveToNextStep: boolean }) => {
  const { t } = useTranslation();
  return (
    <Box
      component="div"
      className={canMoveToNextStep ? 'tour-fade-out-scale-up' : 'tour-drop-area-scale-up-down'}
      id="flow-tour-drop-area"
      sx={{
        position: 'fixed',
        top: 'calc(50% - 175px)',
        left: 'calc(50% - 150px)',
        justifyContent: 'center',
        alignItems: 'center',
        height: '350px',
        width: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        pointerEvents: 'none',
        borderRadius: '8px',
        border: '1px solid rgba(240, 240, 229, 0.3)',
        backgroundColor: 'rgba(240, 240, 229, 0.05)',
      }}
    >
      <Typography variant="body-lg-md">{t(I18N_KEYS.PRODUCT_TOURS.FLOW.NAVIGATION_TOUR.DROP_NODE_HERE)}</Typography>
    </Box>
  );
};
