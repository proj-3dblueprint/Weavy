import { TextField } from '@mui/material';
import { color } from '@/colors';

interface TextAreaProps {
  id: string;
  value: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement> | null;
  rows?: number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TextArea = ({
  disabled = false,
  id,
  value,
  inputRef = null,
  rows = 8,
  onChange = () => {},
}: TextAreaProps) => {
  return (
    <TextField
      sx={{
        mt: 1,
        borderColor: color.White16_T,
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: color.White40_T,
          },
          '&.Mui-focused fieldset': {
            borderColor: color.White40_T,
            borderWidth: 1,
          },
          '&.Mui-disabled fieldset': {
            borderColor: color.White08_T,
          },
        },
        '& .MuiInputBase-input.Mui-disabled': {
          color: color.White08_T,
          WebkitTextFillColor: color.White08_T,
        },
      }}
      disabled={disabled}
      fullWidth
      id={id}
      multiline
      value={value}
      rows={rows}
      onChange={onChange}
      size="small"
      inputRef={inputRef}
      inputProps={{
        style: { resize: 'vertical' },
      }}
    />
  );
};
