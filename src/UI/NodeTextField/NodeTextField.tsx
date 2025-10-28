import { TextField, TextFieldProps, Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { color } from '@/colors';
import ShowMoreChip from '@/components/Nodes/Shared/ShowMoreChip';

const MAX_HEIGHT = 430;
interface NodeTextFieldProps extends Omit<TextFieldProps, 'expandable'> {
  expandable?: boolean;
  readOnly?: boolean;
}

export const NodeTextField = ({
  sx,
  slotProps,
  color: textColor,
  expandable = false,
  ...props
}: NodeTextFieldProps) => {
  const textFieldRef = useRef<HTMLDivElement>(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    const handleHeightChange = (height) => {
      const containerHeight = MAX_HEIGHT;
      setHasOverflow(height > containerHeight);
    };
    if (textFieldRef?.current) {
      const textFieldElement = textFieldRef?.current?.querySelector('.MuiInputBase-root');
      if (textFieldElement) {
        const height = textFieldElement.scrollHeight;
        handleHeightChange(height);
      }
    }
  }, [props.value]);

  return (
    <Box
      sx={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="nodrag"
    >
      <TextField
        ref={textFieldRef}
        {...props}
        slotProps={{
          ...slotProps,
          input: {
            ...(slotProps?.input || {}),
            style: {
              resize: 'vertical',
              fontSize: '16px',
              fontWeight: 500,
              color: textColor || color.White100,
            },
          },
        }}
        sx={{
          maxHeight: expandable ? (isTextExpanded ? 'auto' : `${MAX_HEIGHT}px`) : 'none',
          overflow: 'auto',
          bgcolor: color.Black84,
          borderColor: color.White04_T,
          borderRadius: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            padding: '24px',
            '& fieldset': {
              borderColor: color.White04_T,
            },
            '&:hover fieldset': {
              borderColor: color.White04_T,
            },
            '&.Mui-focused fieldset': {
              borderColor: color.White04_T,
            },
            '& textarea::placeholder': {
              color: color.White40_T,
            },
          },
          ...sx,
        }}
      />
      {expandable && hasOverflow && (
        <ShowMoreChip isExpanded={isTextExpanded} showChip={isHovered} setIsExpanded={setIsTextExpanded} />
      )}
    </Box>
  );
};
