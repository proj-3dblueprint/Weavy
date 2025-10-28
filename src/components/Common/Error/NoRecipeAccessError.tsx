import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { color } from '@/colors';
import { FlexCenHorVer } from '@/UI/styles';
import { LockKeyIcon } from '@/UI/Icons/LockKeyIcon';
import { I18N_KEYS } from '@/language/keys';
import { ErrorSidebar } from './ErrorSidebar';
import { ErrorDisplay } from './ErrorDisplay';

export const NoRecipeAccessError = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <FlexCenHorVer sx={{ height: '100%', width: '100%', backgroundColor: color.Black100 }}>
      <ErrorSidebar />
      <ErrorDisplay
        icon={<LockKeyIcon />}
        title={t(I18N_KEYS.RECIPE_MAIN.ERRORS.NO_RECIPE_ACCESS.TITLE)}
        description={t(I18N_KEYS.RECIPE_MAIN.ERRORS.NO_RECIPE_ACCESS.DESCRIPTION)}
        actions={[
          {
            label: t(I18N_KEYS.RECIPE_MAIN.ERRORS.NO_RECIPE_ACCESS.ACTION),
            onClick: () => {
              navigate('/');
            },
          },
        ]}
      />
    </FlexCenHorVer>
  );
};
