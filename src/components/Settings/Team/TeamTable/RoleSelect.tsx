import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { WorkspaceRole } from '@/types/auth.types';
import { Dropdown } from '@/UI/Dropdown/Dropdown';

interface RoleSelectProps {
  currentRole: WorkspaceRole;
  disabled?: boolean;
  updateMemberRole: (role: WorkspaceRole) => void;
}

export const RoleSelect = ({ currentRole, disabled = false, updateMemberRole }: RoleSelectProps) => {
  const { t } = useTranslation();
  const options = useMemo(() => {
    return [
      {
        id: WorkspaceRole.Admin.valueOf(),
        value: WorkspaceRole.Admin,
        label: t(I18N_KEYS.SETTINGS.TEAM.ROLES.ADMIN),
      },
      {
        id: WorkspaceRole.Member.valueOf(),
        value: WorkspaceRole.Member,
        label: t(I18N_KEYS.SETTINGS.TEAM.ROLES.MEMBER),
      },
    ];
  }, [t]);
  return (
    <Dropdown
      options={options}
      value={currentRole}
      onChange={(option) => updateMemberRole(option.value)}
      disabled={disabled}
      noBorder
      width="90px"
      size="small"
    />
  );
};
