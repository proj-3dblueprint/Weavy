import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCol } from '@/UI/styles';
import { useSettingsStore } from '@/state/settings.state';
import { I18N_KEYS } from '@/language/keys';
import { ModelTable } from './ModelsTable/ModelsTable';

export const ModelManagement = () => {
  const { t } = useTranslation();
  const workspaceModels = useSettingsStore((state) => state.workspaceModels);
  const workspaceModelsLoadingState = useSettingsStore((state) => state.workspaceModelsLoadingState);

  const isLoading = workspaceModelsLoadingState === 'loading';

  return (
    <FlexCol sx={{ flex: 1, height: '100%', gap: 3, pb: 3 }}>
      <FlexCol sx={{ gap: 1 }}>
        <Typography variant="body-lg-md" sx={{ position: 'relative', top: '-3px' }}>
          {t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TITLE)}
        </Typography>
        <Typography variant="body-std-rg" color="rgba(255, 255, 255, 0.64)">
          {t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.SUBTITLE)}
        </Typography>
      </FlexCol>
      <ModelTable models={workspaceModels} isLoading={isLoading} />
    </FlexCol>
  );
};
