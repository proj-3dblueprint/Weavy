import { useState, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { Chip, Paper, InputBase, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { emailRegex } from '@/utils/strings.utils';
import { Flex, FlexCenVer } from '@/UI/styles';
import { WorkspaceRole } from '@/types/auth.types';
import { XIcon } from '@/UI/Icons/XIcon';
import { RoleSelect } from '@/components/Settings/Team/TeamTable/RoleSelect';

const ChipsInput = styled(InputBase)(({ theme }) => ({
  height: 30,
  width: '100%',
  '& .MuiInputBase-input': {
    backgroundColor: 'transparent',
    color: 'var(--input-color)',
    fontFamily: ['"DM Sans"', 'sans-serif'].join(','),
    fontSize: '0.75rem',
    transition: theme.transitions.create(['border-color', 'background-color']),

    '&::placeholder': {
      color: color.White64_T,
      fontSize: '0.75rem',
      fontWeight: 400,
      opacity: 1,
    },
  },
}));

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => !['isFilled', 'isFocused'].includes(prop as string),
})<{ isFilled: boolean; isFocused: boolean }>(({ theme, isFilled, isFocused }) => ({
  position: 'relative',
  padding: `${isFilled ? theme.spacing(1) : 0} ${theme.spacing(1)}`,
  backgroundColor: color.Black92,
  border: `1px solid ${isFocused ? color.White40_T : color.White16_T}`,
}));

interface EmailChipsInputProps {
  emails: string[];
  currentRole?: WorkspaceRole;
  outsideErr?: string;
  inputW?: string;
  onSetEmails: (emails: string[]) => void;
  onInputChange: (value: string, isValid: boolean) => void;
  onSetRole?: (role: WorkspaceRole) => void;
}

function EmailChipsInput({
  emails,
  currentRole,
  inputW = '400px',
  onSetEmails,
  onInputChange,
  onSetRole,
}: EmailChipsInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  const isShowRoleSelection = !!currentRole;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInputValue(value);
    setError('');
    setSelectedEmail(null);

    // Notify parent of input changes and validity
    if (onInputChange) {
      onInputChange(value, value.trim() ? emailRegex.test(value.trim()) : false);
    }
  };

  const validateAndAddEmail = (email: string) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      // setError(t(I18N_KEYS.SHARE_WORKFLOW_MODAL.INVALID_EMAIL));
      return;
    }

    if (emails.includes(trimmedEmail)) {
      const errMsg = `${trimmedEmail} has already been added`;
      setError(errMsg);
      return;
    }

    onSetEmails([...emails, trimmedEmail]);
    setInputValue('');
    setError('');
    setSelectedEmail(null);

    // Notify parent of empty input after adding email
    if (onInputChange) {
      onInputChange('', false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      return validateAndAddEmail(inputValue);
    }

    // Handle backspace when input is empty
    if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      e.preventDefault();
      const lastEmail = emails[emails.length - 1];

      if (selectedEmail === lastEmail) {
        // Second backspace - delete the email
        const newEmails = emails.filter((email) => email !== lastEmail);
        onSetEmails(newEmails);
        setSelectedEmail(null);
      } else {
        // First backspace - select the email
        setSelectedEmail(lastEmail);
      }
    }
  };

  const handleDoubleClick = (email: string) => {
    if (inputValue.trim()) {
      return;
    }

    setInputValue(email);
    const newEmails = emails.filter((e) => e !== email);
    onSetEmails(newEmails);
    setSelectedEmail(null);

    // Notify parent of input change
    if (onInputChange) {
      onInputChange(email, emailRegex.test(email));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedEmails = pastedText.split(/[,\s]+/);

    pastedEmails.forEach((email) => {
      validateAndAddEmail(email);
    });
    setSelectedEmail(null);
  };

  const handleDelete = useCallback(
    (emailToDelete) => {
      const newEmails = emails.filter((email) => email !== emailToDelete);
      onSetEmails(newEmails);
      setSelectedEmail(null);
    },
    [emails, onSetEmails],
  );

  // Clear selection when clicking outside
  const handleContainerClick = () => setSelectedEmail(null);

  return (
    <Box onClick={handleContainerClick} sx={{ flex: 1 }}>
      <StyledPaper
        sx={{ width: '100%' }}
        elevation={0}
        variant="outlined"
        isFilled={emails.length > 0}
        isFocused={isInputFocused}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
      >
        <Flex sx={{ flexWrap: 'wrap', gap: 1, width: inputW }}>
          {emails.map((email) => (
            <Chip
              key={email}
              label={email}
              onDelete={() => handleDelete(email)}
              onDoubleClick={() => handleDoubleClick(email)}
              variant="outlined"
              size="small"
              deleteIcon={<XIcon width={16} height={16} />}
              sx={{
                transition: 'all 0.3s ease',
                borderColor: color.White16_T,
                fontSize: '12px',
                fontWeight: 400,
                ...(selectedEmail === email && {
                  backgroundColor: color.White16_T,
                  borderColor: color.White40_T,
                  color: 'error.contrastText',
                  '& .MuiChip-deleteIcon': {
                    color: 'error.contrastText',
                  },
                }),
              }}
            />
          ))}
          <ChipsInput
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={emails.length === 0 ? t(I18N_KEYS.SHARE_WORKFLOW_MODAL.EMAIL_PLACEHOLDER) : ''}
            error={!!error}
            autoComplete="off"
            inputProps={{ type: 'email' }}
          />
        </Flex>
        {isShowRoleSelection && (
          <FlexCenVer sx={{ position: 'absolute', top: emails.length > 0 ? 4 : -1, right: 3, height: 32 }}>
            <RoleSelect currentRole={currentRole} updateMemberRole={(newRole) => onSetRole?.(newRole)} />
          </FlexCenVer>
        )}
      </StyledPaper>
      {error && (
        <Typography color={color.Weavy_Error} variant="body-xs-rg">
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default EmailChipsInput;
