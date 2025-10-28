import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { Tag } from '@/UI/Tag/Tag';

export const YouTag = () => {
  const { t } = useTranslation();
  return <Tag text={t(I18N_KEYS.SETTINGS.TEAM.YOU)} textColor={color.White80_T} bgColor={color.White08_T} />;
};
