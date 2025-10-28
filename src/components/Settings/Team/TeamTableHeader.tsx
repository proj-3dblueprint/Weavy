import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenVer } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { PlusIcon } from '@/UI/Icons';

interface TeamTableHeaderProps {
  membersCount: number;
  onOpenInviteMemberModal: () => void;
  showInviteBtn: boolean;
}

export const TeamTableHeader = ({
  membersCount,
  onOpenInviteMemberModal,
  showInviteBtn = false,
}: TeamTableHeaderProps) => {
  const { t } = useTranslation();

  return (
    <FlexCenVer sx={{ height: 32, justifyContent: 'space-between' }}>
      {membersCount ? (
        <Typography variant="body-lg-md" sx={{ position: 'relative', top: '-3px' }}>
          {membersCount} {t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.TABLE_TITLE_SUFFIX)}
        </Typography>
      ) : null}
      {showInviteBtn ? (
        <ButtonContained onClick={onOpenInviteMemberModal} startIcon={<PlusIcon width={16} height={16} />}>
          {t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.ADD_MEMBERS_BUTTON)}
        </ButtonContained>
      ) : null}
    </FlexCenVer>
  );
};
