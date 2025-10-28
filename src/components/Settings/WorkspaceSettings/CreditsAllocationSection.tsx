import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { FlexCenVer, FlexCenVerSpaceBetween, FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { ButtonTextPlain } from '@/UI/ButtonTextPlain/ButtonTextPlain';
import useWorkspacesStore from '@/state/workspaces.state';
import { formatNumberWithCommas } from '@/utils/numbers';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { TrackTypeEnum, useAnalytics } from '@/hooks/useAnalytics';
import { log } from '@/logger/logger';
import { getAxiosInstance } from '@/services/axiosConfig';
import ChangeCreditsLimitModal, { SelectedOptionEnum } from './ChangeCreditsLimitModal';

const logger = log.getLogger('CreditsAllocationSection');
const axiosInstance = getAxiosInstance();

export const CreditsAllocationSection = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const activeWorkspace = useWorkspacesStore((state) => state.activeWorkspace);
  const defaultMonthlyAllocatedCredits = activeWorkspace.preferences?.defaultMonthlyAllocatedCredits || null;
  const updateActiveWorkspace = useWorkspacesStore((state) => state.updateActiveWorkspace);
  const { track } = useAnalytics();

  const handleConfirm = async (selectedOption: SelectedOptionEnum, limit: number | null): Promise<void> => {
    let newDefaultMonthlyAllocatedCredits = limit;
    if (selectedOption === SelectedOptionEnum.Unlimited) {
      newDefaultMonthlyAllocatedCredits = null;
    }
    try {
      await axiosInstance.put(`/v1/workspaces/${activeWorkspace.workspaceId}`, {
        defaultMonthlyAllocatedCredits: newDefaultMonthlyAllocatedCredits,
      });
      updateActiveWorkspace({
        preferences: {
          ...activeWorkspace.preferences,
          defaultMonthlyAllocatedCredits: newDefaultMonthlyAllocatedCredits,
        },
      });
      track(
        'Workspace Settings - Changed Default Monthly Allocated Credits',
        {
          limit: newDefaultMonthlyAllocatedCredits,
        },
        TrackTypeEnum.Product,
      );
    } catch (e) {
      logger.error('Error updating default monthly allocated credits', e);
    }
  };
  return (
    <FlexCol>
      <Typography variant="label-sm-rg" sx={{ color: color.White80_T, mb: 0.75 }}>
        {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.TITLE)}
      </Typography>
      <FlexCenVerSpaceBetween>
        <FlexCenVer>
          {defaultMonthlyAllocatedCredits !== null && <AsteriskIcon width={24} height={24} />}
          <Typography variant="h2" sx={{ ml: defaultMonthlyAllocatedCredits !== null ? 0.5 : 0 }}>
            {defaultMonthlyAllocatedCredits === null
              ? t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.UNLIMITED)
              : formatNumberWithCommas(defaultMonthlyAllocatedCredits)}
          </Typography>
        </FlexCenVer>
        <ButtonTextPlain onClick={() => setOpen(true)} variant="body-std-rg">
          {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.EDIT_DEFAULT_ALLOCATION_CTA)}
        </ButtonTextPlain>
      </FlexCenVerSpaceBetween>
      <ChangeCreditsLimitModal
        title={t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.EDIT_DEFAULT_ALLOCATION_CTA)}
        subtitle={t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL.SUBTITLE)}
        open={open}
        onClose={() => setOpen(false)}
        activeWorkspace={activeWorkspace}
        onConfirm={handleConfirm}
      />
    </FlexCol>
  );
};
