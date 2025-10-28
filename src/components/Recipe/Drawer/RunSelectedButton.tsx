import { forwardRef, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { ArrowIcon } from '@/UI/Icons/ArrowIcon';
import { darkTheme } from '@/UI/theme';
import { useWithLoader } from '@/hooks/useWithLoader';

const BUTTON_STYLES = {
  minWidth: '120px',
  width: 'fit-content',
  fontWeight: 500,
  textTransform: 'none',
  boxShadow: 'none',
  position: 'relative',
  textWrap: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontSize: darkTheme.typography['body-sm-md'].fontSize,
  height: '24px',
  borderRadius: '4px',
  px: 1,
  py: 0.5,
  backgroundColor: color.Yellow_Secondary,
  '&:hover': { backgroundColor: color.Yellow40 },
} as const;

export const RunSelectedButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof ButtonContained> & { onClick: () => Promise<void> }
>(function RunSelectedButton({ sx, onClick, disabled, ...props }, ref) {
  const { t } = useTranslation();

  const { isLoading, execute } = useWithLoader(onClick, { sync: true });
  return (
    <ButtonContained
      ref={ref}
      startIcon={<ArrowIcon style={{ transform: 'rotate(90deg)', width: 16, height: 16 }} strokeWidth="1.125" />}
      mode="filled-light"
      {...props}
      disabled={isLoading || disabled}
      onClick={execute}
      sx={{
        ...BUTTON_STYLES,
        ...(sx || {}),
      }}
    >
      {t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.RUN_MODELS_SECTION.CTA)}
    </ButtonContained>
  );
});
