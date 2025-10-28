import { Box, Typography, type TypographyProps } from '@mui/material';
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

interface EditableLabelProps {
  value: string;
  onSubmit: (label: string) => void;
}

export function EditableLabel({
  value,
  onSubmit,
  ...extraProps
}: EditableLabelProps & Omit<TypographyProps, 'onSubmit'>) {
  const [editing, setEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (newValue: string) => {
      if (newValue !== '') {
        onSubmit(newValue);
      }
    },
    [onSubmit],
  );

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (!inputRef.current) return;
    handleSubmit(inputRef.current.textContent || '');
  }, [handleSubmit]);

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLDivElement>) => {
      if (evt.code === 'Enter') {
        evt.preventDefault();
        if (!inputRef.current) return;
        handleSubmit(inputRef.current.textContent || '');
        setEditing(false);
      } else if (evt.code === 'Escape') {
        evt.preventDefault();
        // press Escape -> cancel edit
        if (!inputRef.current) return;
        inputRef.current.textContent = value;
        setEditing(false);
      } else if (evt.code === 'z' && evt.getModifierState('Control')) {
        // stop Cmd+z propagation
        evt.stopPropagation();
        evt.preventDefault();
      } else if (evt.code === 'Backspace' || evt.code === 'Delete') {
        evt.stopPropagation();
      }
    },
    [handleSubmit, value],
  );

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    if (!inputRef.current) return;

    // inputRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(inputRef.current);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    setTimeout(() => inputRef.current?.focus());
  }, []);

  return (
    <Box onDoubleClick={handleDoubleClick} sx={{ width: '100%', display: 'block' }}>
      <Typography
        ref={inputRef}
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={editing ? handleBlur : undefined}
        onKeyDown={editing ? handleKeyDown : undefined}
        key={editing ? 'editing' : 'display'}
        {...extraProps}
        sx={{
          ...extraProps.sx,
          ...(editing && {
            outline: 'none',
            '&:focus': {
              outline: 'none',
            },
            minHeight: '1.2em', // Prevent collapse
            whiteSpace: 'nowrap', // Prevent wrapping
          }),
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
