import { Modal, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Flex, FlexCol } from '@/UI/styles';
import { color, EL_COLORS } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { XIcon } from '@/UI/Icons/XIcon';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { AppCheckbox } from '@/UI/AppCheckbox/AppCheckbox';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const PricyModelModal = ({
  open,
  modelPrice,
  onConfirm,
  onClose,
  modelName,
  displayName,
}: {
  open: boolean;
  modelPrice: number;
  onConfirm: () => void;
  onClose: () => void;
  modelName: string;
  displayName: string;
}) => {
  const { t } = useTranslation();

  const [isChecked, setIsChecked] = useState(false);

  const { getItem, setItem } = useLocalStorage<Record<string, boolean>>('allowRunPricyModel');

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
    const allowRunPricyModel = getItem() || {};
    allowRunPricyModel[modelName] = event.target.checked;
    setItem(allowRunPricyModel);
  };

  return (
    <Modal data-testid="pricy-model-modal" open={open} onClose={onClose} aria-labelledby="pricy-model-modal">
      <FlexCol
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 450,
          background: color.Black92,
          border: `1px solid ${EL_COLORS.BoxBorder}`,
          p: 3,
          pt: 6,
          borderRadius: 2,
        }}
      >
        <AppIconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
          <XIcon width={20} height={20} />
        </AppIconButton>
        <Typography variant="body-lg-sb" sx={{ mb: 1 }}>
          {t(I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.TITLE)}
        </Typography>
        <Typography variant="body-std-rg" sx={{ mb: 4, alignItems: 'center' }}>
          <Trans
            i18nKey={I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.SUBTITLE}
            components={{
              b: <Typography variant="body-std-rg" component="span" sx={{ fontWeight: 600 }} />,
              icon: <AsteriskIcon width={14} height={14} style={{ marginRight: 2, transform: 'translateY(2px)' }} />,
            }}
            values={{
              displayName,
              modelPrice,
            }}
          />
        </Typography>
        <Flex sx={{ mb: 4 }}>
          <AppCheckbox
            checked={isChecked}
            onChange={handleCheckboxChange}
            label={t(I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.CHECKBOX_LABEL)}
          />
        </Flex>
        <Flex sx={{ gap: 1, justifyContent: 'flex-end' }}>
          <ButtonContained mode="text" onClick={onClose} size="medium" sx={{ px: 2 }}>
            {t(I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained mode="filled-light" onClick={onConfirm} sx={{ px: 2 }} size="medium">
            {t(I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </Flex>
      </FlexCol>
    </Modal>
  );
};
