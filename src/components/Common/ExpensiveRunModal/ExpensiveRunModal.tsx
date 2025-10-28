import { Modal, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useState } from 'react';
import { color, EL_COLORS } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { AppCheckbox } from '@/UI/AppCheckbox/AppCheckbox';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { AsteriskIcon } from '@/UI/Icons';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ExpensiveRunModalProps {
  onConfirm: () => void;
  onClose: () => void;
  open?: boolean;
  cost: number;
}

export const ExpensiveRunModal = ({ onClose, onConfirm, open = false, cost }: ExpensiveRunModalProps) => {
  const { t } = useTranslation();

  const { getItem, setItem } = useLocalStorage<boolean>('allowRunExpensiveRun');
  const [checked, setChecked] = useState(getItem() ?? false);

  return (
    <Modal
      data-testid="expensive-run-warning-modal"
      open={open}
      onClose={onClose}
      aria-labelledby="expensive-run-warning-modal"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <FlexCol
        sx={{
          width: 450,
          background: color.Black92,
          border: `1px solid ${EL_COLORS.BoxBorder}`,
          p: 3,
          borderRadius: 2,
          gap: 3,
        }}
      >
        <FlexCol sx={{ gap: 0.5 }}>
          <AppXBtn onClick={onClose} size={20} sx={{ alignSelf: 'flex-end' }} />
          <FlexCol sx={{ gap: 2 }}>
            <Typography variant="body-lg-sb">{t(I18N_KEYS.COMMON_COMPONENTS.EXPENSIVE_RUN_MODAL.TITLE)}</Typography>
            <Typography variant="body-std-rg" sx={{ whiteSpace: 'pre-line' }}>
              <Trans
                i18nKey={I18N_KEYS.COMMON_COMPONENTS.EXPENSIVE_RUN_MODAL.SUBTITLE}
                components={{
                  b: <b />,
                  icon: <AsteriskIcon width={14} height={14} style={{ verticalAlign: 'sub' }} />,
                }}
                values={{
                  cost,
                }}
              />
            </Typography>
          </FlexCol>
        </FlexCol>
        <AppCheckbox
          checked={checked}
          onChange={(_, checked) => {
            setChecked(checked);
            setItem(checked);
          }}
          label={t(I18N_KEYS.COMMON_COMPONENTS.EXPENSIVE_RUN_MODAL.CHECKBOX_LABEL)}
        />
        <FlexCenVer sx={{ gap: 2, justifyContent: 'flex-end', width: '100%' }}>
          <ButtonContained mode="text" onClick={onClose} size="medium">
            {t(I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained mode="filled-light" onClick={onConfirm} size="medium">
            {t(I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </FlexCenVer>
      </FlexCol>
    </Modal>
  );
};
