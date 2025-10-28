import { Box, Avatar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { User } from '@/types/auth.types';
import ProfileProperty from './ProfileProperty';

interface ProfileProps {
  user: User;
}

function Profile({ user }: ProfileProps) {
  const { t } = useTranslation();

  return (
    <FlexCol sx={{ flex: 1, gap: 4 }}>
      <Avatar alt="user image" src={user.photoURL || ''} sx={{ width: '86px', height: '86px', mr: 1 }} />
      <Box data-testid="profile-name-container">
        <ProfileProperty label={t(I18N_KEYS.SETTINGS.PROFILE.FORM.NAME)} value={user.displayName || ''} />
      </Box>
      <Box data-testid="profile-email-container">
        <ProfileProperty label={t(I18N_KEYS.SETTINGS.PROFILE.FORM.EMAIL)} value={user.email || ''} />
      </Box>
    </FlexCol>
  );
}

export default Profile;
