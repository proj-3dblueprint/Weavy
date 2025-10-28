import { toggleButtonClasses } from '@mui/material/ToggleButton';
import { AppToggleButton } from '@/UI/AppToggleButtons/AppToggleButton';
import { LinkBreakIcon } from '@/UI/Icons/LinkBreakIcon';
import { LinkIcon } from '@/UI/Icons/LinkIcon';
import { color } from '@/colors';

interface LockAspectRatioButtonProps {
  isLocked: boolean;
  onChange: (isLocked: boolean) => void;
}

export const LockAspectRatioButton = ({ isLocked, onChange }: LockAspectRatioButtonProps) => {
  const toggleLockAspectRatio = () => {
    onChange(!isLocked);
  };

  return (
    <AppToggleButton
      btnH={24}
      btnW={24}
      value={isLocked}
      onChange={toggleLockAspectRatio}
      selected={isLocked}
      isIcon
      sx={{
        border: 'none',
        [`&.${toggleButtonClasses.selected}`]: {
          border: `1px solid ${color.White08_T}`,
        },
      }}
    >
      {isLocked ? <LinkIcon style={{ width: 16, height: 16 }} /> : <LinkBreakIcon style={{ width: 16, height: 16 }} />}
    </AppToggleButton>
  );
};
