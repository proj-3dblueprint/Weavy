import { ButtonBase } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { I18N_KEYS } from '@/language/keys';
import SettingsDrawer from '@/components/Settings/SettingsDrawer';
import Profile from '@/components/Settings/Profile/Profile';
import Team from '@/components/Settings/Team/Team';
import { ModelManagement } from '@/components/Settings/ModelManagement/ModelManagement';
import { SettingsPageSections } from '@/enums/settings-page-sections.enum';
import { Flex, FlexCenHor, FlexCenVer, FlexCol } from '@/UI/styles';
import { WorkspaceSettings } from '@/components/Settings/WorkspaceSettings/WorkspaceSettings';
import { User, WorkspaceRole } from '@/types/auth.types';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import useWorkspacesStore from '@/state/workspaces.state';
import { ReloadAlert } from '@/UI/ReloadAlert/ReloadAlert';
import { useSettingsStore } from '@/state/settings.state';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';

interface SettingsProps {
  user: User;
}

export function Settings({ user }: SettingsProps) {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState<SettingsPageSections | undefined>();

  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const workspaceName = useWorkspacesStore((state) => state.activeWorkspace.workspaceName);
  const workspaceId = useWorkspacesStore((state) => state.activeWorkspace.workspaceId);
  const userRole = useWorkspacesStore((state) => state.activeWorkspace.role);
  const loadWorkspaceModels = useSettingsStore((state) => state.loadWorkspaceModels);
  const resetSettingsState = useSettingsStore((state) => state.resetSettingsState);
  const { modelBlockingPermissions } = useSubscriptionPermissions();
  const section = searchParams.get('section') as SettingsPageSections;

  const backToHome = () => nav('/');

  useEffect(() => {
    return () => {
      resetSettingsState();
    };
  }, [resetSettingsState]);

  useEffect(() => {
    setSelectedSection(section || SettingsPageSections.PROFILE);
  }, [section]);

  useEffect(() => {
    // Load workspace models when Model Management section is selected
    if (selectedSection === SettingsPageSections.MODEL_MANAGEMENT && workspaceId) {
      const abortController = new AbortController();
      void loadWorkspaceModels(workspaceId, abortController.signal);

      return () => {
        abortController.abort();
      };
    }
  }, [selectedSection, workspaceId, loadWorkspaceModels]);

  const menuItems = useMemo(() => {
    const items = [
      {
        menuLabel: t(I18N_KEYS.SETTINGS.MENU.PROFILE),
        icon: <img src="/icons/profile.svg" alt="profile" className="wea-menu-icon" />,
        section: SettingsPageSections.PROFILE,
      },
      {
        menuLabel: t(I18N_KEYS.SETTINGS.MENU.WORKSPACE_SETTINGS),
        icon: <img src="/icons/settings.svg" alt="workspace-settings" className="wea-menu-icon" />,
        section: SettingsPageSections.WORKSPACE_SETTINGS,
      },
      {
        menuLabel: t(I18N_KEYS.SETTINGS.MENU.MEMBERS),
        icon: <img src="/icons/members.svg" alt="members" className="wea-menu-icon" />,
        section: SettingsPageSections.TEAM,
      },
    ];

    if (userRole === WorkspaceRole.Admin && modelBlockingPermissions.action) {
      items.push({
        menuLabel: t(I18N_KEYS.SETTINGS.MENU.MODEL_MANAGEMENT),
        icon: <img src="/icons/sparkle.svg" alt="model-management" className="wea-menu-icon" />,
        section: SettingsPageSections.MODEL_MANAGEMENT,
      });
    }

    return items;
  }, [modelBlockingPermissions.action, t, userRole]);

  const renderContent = () => {
    switch (selectedSection) {
      case SettingsPageSections.PROFILE:
        return <Profile user={user} />;
      case SettingsPageSections.WORKSPACE_SETTINGS:
        return <WorkspaceSettings />;
      case SettingsPageSections.TEAM:
        return <Team currentUser={user} />;
      case SettingsPageSections.MODEL_MANAGEMENT:
        return userRole === WorkspaceRole.Admin ? <ModelManagement /> : null;
      default:
        return null;
    }
  };

  const setSection = (section: SettingsPageSections) => nav(`?section=${section}`);

  return (
    <>
      <Flex sx={{ height: '100%', pt: 16, px: '10vw', gap: '60px' }}>
        <FlexCol sx={{ gap: 8 }}>
          <FlexCenVer>
            <ButtonBase onClick={backToHome}>
              <img
                src="/icons/arrow.svg"
                alt="arrow"
                style={{ transform: 'rotate(90deg)', height: '24px', width: '24px' }}
              />
            </ButtonBase>
            <EllipsisText component="div" maxWidth="180px" sx={{ ml: 2 }} variant="body-lg-md">
              {workspaceName}
            </EllipsisText>
          </FlexCenVer>
          <SettingsDrawer settingsList={menuItems} selectedSection={selectedSection} setSelectedSection={setSection} />
        </FlexCol>
        <FlexCenHor sx={{ width: '100%', height: '100%', overflowY: 'auto' }}>
          <Flex sx={{ width: '750px' }}>{renderContent()}</Flex>
        </FlexCenHor>
      </Flex>
      <ReloadAlert />
    </>
  );
}
