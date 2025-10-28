import { CircularProgress, Dialog } from '@mui/material';
import { Suspense } from 'react';
import { PricingTablePage } from '@/pages/PricingTablePage';
import { FlexCenHorVer } from '@/UI/styles';
import { PricingPageContainer } from '@/enums/pricing-page.enum';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';

interface PricingModalProps {
  open: boolean;
  closeModal: () => void;
}

function PricingModal({ open, closeModal }: PricingModalProps) {
  return (
    <Dialog open={open} onClose={closeModal} fullScreen sx={{ background: 'transparent' }}>
      <Suspense
        fallback={
          <FlexCenHorVer sx={{ height: '100%', width: '100%' }}>
            <CircularProgress color="inherit" />
          </FlexCenHorVer>
        }
      >
        <PricingTablePage container={PricingPageContainer.Modal} />
      </Suspense>
      <AppXBtn onClick={closeModal} sx={{ position: 'absolute', top: 20, right: 20 }} />
    </Dialog>
  );
}

export default PricingModal;
