import { useContext, useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tooltip, Typography } from '@mui/material';
import { AppPaper, FlexCenVer, FlexCenVerSpaceBetween, FlexCol } from '@/UI/styles';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { CreditsContext } from '@/services/CreditsContext';
import { formatNumberToShortString } from '@/utils/numbers';
import { ShareIcon } from '@/UI/Icons/ShareIcon';
import { I18N_KEYS } from '@/language/keys';
import { PermissionsContainer } from '@/components/PermissionsContainer/PermissionsContainer';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import { color } from '@/colors';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import ShareWorkflowModal from '../ShareWorkflowModal';
import { BatchStatusButton } from '../../RunFlow/TaskManager/BatchStatusButton';
import { CREDITS_INFO_WIDTH } from '../../consts/ui';

interface CreditsInfoProps {
  isPaperBg?: boolean;
}

const CreditsInfoComponent = forwardRef<HTMLDivElement, CreditsInfoProps>(({ isPaperBg = true }, ref) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { credits, handleGetMoreCreditsClick } = useContext(CreditsContext);
  const { isAllowedForPermission } = useSubscriptionPermissions();

  const { t } = useTranslation();
  const { track } = useAnalytics();

  const handleShare = () => {
    track('shared_workflow_modal_open', {}, TrackTypeEnum.BI);
    setIsShareModalOpen(true);
  };

  const Container = isPaperBg ? AppPaper : FlexCol;

  return (
    <>
      <Container
        ref={ref}
        sx={{
          ...(isPaperBg
            ? { p: 1, display: 'flex', flexDirection: 'column', width: CREDITS_INFO_WIDTH }
            : { width: '100%' }),
          gap: 1,
        }}
      >
        <FlexCenVerSpaceBetween sx={{ gap: 1 }}>
          <PermissionsContainer permission="credits">
            <Tooltip
              title={t(I18N_KEYS.FLOW_NAVBAR.GET_MORE_CREDITS_V2)}
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, -10],
                      },
                    },
                  ],
                },
              }}
            >
              <FlexCenVer
                sx={{
                  height: 24,
                  gap: 0.25,
                  cursor: 'pointer',
                  pointerEvents: isAllowedForPermission('credits', 'action') ? 'auto' : 'none',
                  px: 0.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: color.Black84 },
                }}
                onClick={handleGetMoreCreditsClick}
              >
                <AsteriskIcon width={16} height={16} />
                <Typography variant="body-sm-rg">
                  {t(I18N_KEYS.GENERAL.CREDITS_DISPLAY, {
                    credits: credits !== null ? formatNumberToShortString(credits) : 0,
                  })}
                </Typography>
              </FlexCenVer>
            </Tooltip>
          </PermissionsContainer>
          <ButtonContained
            onClick={handleShare}
            startIcon={<ShareIcon width={16} height={16} />}
            size="xs"
            mode="filled-light-secondary"
          >
            {t(I18N_KEYS.RECIPE_MAIN.FLOW.SHARE)}
          </ButtonContained>
        </FlexCenVerSpaceBetween>
        <Box>
          <BatchStatusButton />
        </Box>
      </Container>
      {isShareModalOpen && <ShareWorkflowModal open={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />}
    </>
  );
});

CreditsInfoComponent.displayName = 'CreditsInfo';

export const CreditsInfo = CreditsInfoComponent;
