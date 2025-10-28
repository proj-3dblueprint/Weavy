import { Tooltip } from '@mui/material';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { PlusIcon } from '@/UI/Icons/PlusIcon';

interface AddItemButtonProps {
  show?: boolean;
  onClick: () => void;
  text: string;
  disabled?: boolean;
  disabledTooltipText?: string;
}

export const AddItemButton = ({
  show = false,
  onClick,
  text,
  disabled = false,
  disabledTooltipText = '',
}: AddItemButtonProps) => {
  if (!show) return null;

  const button = (
    <ButtonContained
      mode="text"
      onClick={onClick}
      size="small"
      disabled={disabled}
      startIcon={<PlusIcon style={{ width: 16, height: 16 }} />}
    >
      {text}
    </ButtonContained>
  );

  return disabled ? (
    <Tooltip title={disabledTooltipText}>
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};
