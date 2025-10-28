import { Box, Typography, Avatar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { YouTag } from '@/components/Settings/Team/TeamTable/YouTag';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { color } from '@/colors';
import { useIsHovered } from '@/hooks/useIsHovered';
import type { User } from '@/types/auth.types';

interface ShareModalUserProps {
  user: User;
  onDelete?: (uid: string) => void;
  isCurrentUser?: boolean;
}

function ShareModalUser({ user, isCurrentUser, onDelete }: ShareModalUserProps) {
  const { isHovered, ...elementProps } = useIsHovered();

  const { t } = useTranslation();

  const handleRemoveUser = () => onDelete?.(user.uid);

  return (
    <FlexCenVer
      sx={{
        gap: 1,
        justifyContent: 'space-between',
        px: 1,
        py: 0.5,
        '&:hover': { backgroundColor: color.Black84 },
        minHeight: 48,
        borderRadius: 1,
      }}
      {...elementProps}
    >
      {user && (
        <>
          <FlexCenVer sx={{ gap: 1 }}>
            {user.photoURL ? (
              <Avatar src={user.photoURL} sx={{ width: 28, height: 28 }} />
            ) : (
              <Avatar sx={{ width: 28, height: 28 }}>{user.displayName?.charAt(0).toUpperCase()}</Avatar>
            )}

            <FlexCol>
              {user.displayName && (
                <FlexCenVer>
                  <Typography variant="body-sm-rg" sx={{ mr: 1 }}>
                    {user.displayName}
                  </Typography>
                  {isCurrentUser && (
                    <Box component="span" sx={{ position: 'relative', top: '-1px' }}>
                      <YouTag />
                    </Box>
                  )}
                </FlexCenVer>
              )}
              <Typography variant="body-xs-rg" color={color.White64_T}>
                {user.email}
              </Typography>
            </FlexCol>
          </FlexCenVer>
          <FlexCenVer sx={{ position: 'relative' }}>
            {isCurrentUser ? (
              <Typography variant="body-sm-rg" sx={{ color: color.White100 }}>
                {t(I18N_KEYS.SHARE_WORKFLOW_MODAL.OWNER)}
              </Typography>
            ) : (
              isHovered && (
                <ButtonContained mode="text" onClick={handleRemoveUser} size="small">
                  {t(I18N_KEYS.SHARE_WORKFLOW_MODAL.REMOVE)}
                </ButtonContained>
              )
            )}
          </FlexCenVer>
        </>
      )}
    </FlexCenVer>
  );
}

export default ShareModalUser;
