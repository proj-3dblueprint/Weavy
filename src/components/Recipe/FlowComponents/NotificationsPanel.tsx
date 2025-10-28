import { ReactNode } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { color } from '@/colors';
import { FlexCenVer } from '@/UI/styles';
import { useWithLoader } from '@/hooks/useWithLoader';
import { ButtonContained } from '@/UI/Buttons/AppButton';

interface NotificationsPanelProps {
  width: number;
  height: number;
  content: {
    text: string;
    icon?: ReactNode;
    action?: {
      text: string;
      onClick: () => void | Promise<void>;
    };
  };
}
export const NotificationsPanel = ({ height, content: { text, icon, action } }: NotificationsPanelProps) => {
  const onAction = async () => await action?.onClick();

  const { isLoading, execute: handleAction } = useWithLoader(onAction, { sync: true });

  return (
    <Alert
      variant="filled"
      icon={icon || false}
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: color.Black84,
        py: 1.5,
        pl: 2,
        pr: action ? 1 : 2,
        borderRadius: 2,
        border: `1px solid ${color.White04_T}`,
        mb: 1,
        color: color.White100,
        fontSize: '0.75rem',
        fontWeight: 400,
        whiteSpace: 'nowrap',
      }}
      slotProps={{ icon: { sx: { mr: icon ? 1 : 0 } } }}
    >
      <FlexCenVer sx={{ gap: 2 }}>
        {text}
        {action && (
          <ButtonContained
            size="small"
            onClick={handleAction}
            endIcon={isLoading ? <CircularProgress size={12} color="inherit" sx={{ mr: 0.5 }} /> : null}
            disabled={isLoading}
          >
            {action.text}
          </ButtonContained>
        )}
      </FlexCenVer>
    </Alert>
  );
};
