import { Box, TextField, Skeleton } from '@mui/material';
import { color } from '@/colors';

function DesignAppPrompt({ id, value, onChange, isLoading, setIsEditingInputMetadata, error, helperText, disabled }) {
  const onPromptChange = (event) => {
    const updatedPrompt = event.target.value;
    onChange(id, { prompt: updatedPrompt });
  };

  return (
    <Box>
      {isLoading ? (
        <Box
          sx={{
            width: '100%',
            height: '110px',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${color.White64_T}`,
            borderRadius: 1,
            p: 2,
          }}
        >
          <Skeleton animation="wave" width="100%" height={14} />
          <Skeleton animation="wave" width="50%" height={14} />
          <Skeleton animation="wave" width="80%" height={14} />
          <Skeleton animation="wave" width="60%" height={14} />
        </Box>
      ) : (
        <TextField
          error={error}
          helperText={helperText}
          placeholder={value}
          fullWidth
          multiline
          onFocus={() => setIsEditingInputMetadata(true)}
          onBlur={() => setIsEditingInputMetadata(false)}
          value={value}
          onChange={onPromptChange}
          rows={4}
          disabled={disabled}
          inputProps={{
            style: { resize: 'vertical' },
          }}
          sx={{
            background: `${color.Black100}`,
            '& .MuiFormHelperText-root': {
              background: `none`,
              margin: 0,
              paddingLeft: 0,
              paddingTop: 0.5,
            },
          }}
        />
      )}
    </Box>
  );
}

export default DesignAppPrompt;
