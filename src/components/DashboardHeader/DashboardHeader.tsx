import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import useWorkspacesStore from '@/state/workspaces.state';
import { PlusIcon } from '@/UI/Icons';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { TrackTypeEnum, useAnalytics } from '@/hooks/useAnalytics';
import { I18N_KEYS } from '../../language/keys';

interface DashboardHeaderProps {
  isShowCreateRecipeButton: boolean;
  createRecipe: () => Promise<void>;
}

export const DashboardHeader = ({ isShowCreateRecipeButton, createRecipe }: DashboardHeaderProps) => {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const workspaceName = useWorkspacesStore((state) => state.activeWorkspace.workspaceName);

  const onCreateRecipe = useCallback(() => {
    track('created_new_flow', { source: 'dashboard_header' }, TrackTypeEnum.BI);
    void createRecipe();
  }, [createRecipe, track]);

  return (
    <Box sx={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <Typography variant="body-std-rg">{workspaceName}</Typography>
      {isShowCreateRecipeButton && (
        <ButtonContained onClick={onCreateRecipe} startIcon={<PlusIcon width={16} height={16} />}>
          {t(I18N_KEYS.MAIN_DASHBOARD.CREATE_NEW_FILE)}
        </ButtonContained>
      )}
    </Box>
  );
};
