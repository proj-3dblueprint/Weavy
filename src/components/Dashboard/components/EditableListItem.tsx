import { Input, InputAdornment, IconButton, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface EditableListItemProps {
  isEditing: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  displayValue: string;
}

export function EditableListItem({
  isEditing,
  value = '',
  onChange,
  onConfirm,
  onCancel,
  displayValue,
}: EditableListItemProps) {
  if (!isEditing) {
    return (
      <Typography variant="body-sm-md" component="div">
        {displayValue}
      </Typography>
    );
  }

  return (
    <Input
      inputRef={(input: HTMLInputElement) => input && input.focus()}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onFocus={(e) => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void onConfirm?.();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          void onCancel?.();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            aria-label="confirm rename"
            onClick={(e) => {
              e.preventDefault();
              void onConfirm?.();
            }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </InputAdornment>
      }
    />
  );
}
