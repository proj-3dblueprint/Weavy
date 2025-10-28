import { Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MouseEvent, useMemo, useState } from 'react';
import { ApiObject } from '@rudderstack/analytics-js';
import { I18N_KEYS } from '@/language/keys';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { CopyIcon } from '@/UI/Icons/CopyIcon';
import { log } from '@/logger/logger.ts';
import { LinkIcon } from '@/UI/Icons/LinkIcon';
import { ButtonContained } from '@/UI/Buttons/AppButton';

const logger = log.getLogger('CopyBtn');

interface CopyBtnProps {
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'medium' | 'large';
  eventTracking?: { name: string; payload: ApiObject };
  variant?: 'icon' | 'text';
  label?: string;
  title?: string;
  icon?: 'link' | 'copy';
}

const CopyBtnV2 = ({
  text,
  onClick,
  disabled = false,
  size = 'large',
  eventTracking = { name: 'copy_btn_clicked', payload: {} },
  variant = 'icon',
  label,
  title,
  icon = 'copy',
}: CopyBtnProps) => {
  const { t } = useTranslation();
  const [isTextCopied, setIsTextCopied] = useState(false);
  const { track } = useAnalytics();

  const onCopyHandler = () => {
    setIsTextCopied(true);
    setTimeout(() => setIsTextCopied(false), 2000);
  };

  const handleCopyLink = (e: MouseEvent) => {
    e.stopPropagation();
    track(eventTracking.name, eventTracking.payload, TrackTypeEnum.Product);
    if (onClick) {
      onClick();
      onCopyHandler();
      return;
    }
    if (!text) {
      return;
    }

    void navigator.clipboard.writeText(text).catch((e) => logger.error('Error copying text.', e));
    onCopyHandler();
  };
  const sizes = useMemo(() => {
    if (size === 'medium') {
      return { icon: 16, btn: 24 };
    }
    return { icon: 20, btn: 28 };
  }, [size]);

  const getTitle = () => {
    if (isTextCopied) {
      return t(I18N_KEYS.GENERAL.COPIED);
    }

    if (title) {
      return title;
    }

    return t(I18N_KEYS.GENERAL.COPY);
  };

  if (variant === 'text') {
    return (
      <Tooltip title={getTitle()} placement="top">
        <Box>
          <ButtonContained
            mode="text"
            size="small"
            onClick={handleCopyLink}
            disabled={disabled}
            startIcon={<LinkIcon width={16} height={16} />}
          >
            {label}
          </ButtonContained>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={getTitle()} placement="top">
      <AppIconButton mode="on-dark" onClick={handleCopyLink} disabled={disabled} width={sizes.btn} height={sizes.btn}>
        {icon === 'copy' ? (
          <CopyIcon width={sizes.icon} height={sizes.icon} />
        ) : (
          <LinkIcon width={sizes.icon} height={sizes.icon} />
        )}
      </AppIconButton>
    </Tooltip>
  );
};
export default CopyBtnV2;
