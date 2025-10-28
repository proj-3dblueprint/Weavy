import { ReactNode } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { color } from '@/colors';
import { FlexCol } from '@/UI/styles';
import { SettingsPageSections } from '@/enums/settings-page-sections.enum';

interface SettingsDrawerProps {
  settingsList: {
    menuLabel: string;
    icon: ReactNode;
    section: SettingsPageSections;
    disable?: boolean;
  }[];
  selectedSection: SettingsPageSections | undefined;
  setSelectedSection: (section: SettingsPageSections) => void;
}

function SettingsDrawer({ settingsList, selectedSection, setSelectedSection }: SettingsDrawerProps) {
  return (
    <FlexCol sx={{ justifyContent: 'space-between', width: '240px' }}>
      <Box data-testid="settings-drawer-upper-container">
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0 }}>
          {settingsList.map((item) => (
            <ListItem
              key={item.menuLabel}
              disablePadding
              sx={{
                background: item.section === selectedSection ? color.Black92 : '',
                '& .MuiListItemIcon-root': { minWidth: '30px' },
              }}
            >
              <ListItemButton onClick={() => setSelectedSection(item.section)} disabled={item.disable}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.menuLabel}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: item.section === selectedSection ? 500 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </FlexCol>
  );
}

export default SettingsDrawer;
