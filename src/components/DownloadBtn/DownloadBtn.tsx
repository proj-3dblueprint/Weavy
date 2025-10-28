import { useTranslation } from 'react-i18next';
import { Tooltip } from '@mui/material';
import { I18N_KEYS } from '@/language/keys';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { DownloadIcon } from '@/UI/Icons/DownloadIcon';

interface DownloadBtnProps {
  disabled: boolean;
  setDownloadMenuAnchorEl: (anchorEl: HTMLElement | null) => void;
}

export const DownloadBtn = ({ disabled, setDownloadMenuAnchorEl }: DownloadBtnProps) => {
  const { t } = useTranslation();
  return (
    <Tooltip title={t(I18N_KEYS.GENERAL.DOWNLOAD)} placement="top">
      <AppIconButton
        mode="on-dark"
        onClick={(e) => {
          e.stopPropagation();
          setDownloadMenuAnchorEl(e.currentTarget);
        }}
        disabled={disabled}
      >
        <DownloadIcon width={20} height={20} />
      </AppIconButton>
    </Tooltip>
  );
};
