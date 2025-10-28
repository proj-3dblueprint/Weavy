import { Typography } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer } from '@/UI/styles';
import type { FolderResponseDto } from '@/types/folder.types';

interface BreadcrumbsProps {
  folderPath: FolderResponseDto[];
  onNavigate: (folderId?: string | null) => void;
  rootName?: string;
}

export const Breadcrumbs = ({ folderPath, onNavigate, rootName }: BreadcrumbsProps) => {
  const { t } = useTranslation();

  const handleClick = useCallback(
    (folderId?: string | null) => {
      onNavigate(folderId);
    },
    [onNavigate],
  );

  return (
    <FlexCenVer>
      {/* My Files (root) */}
      <Typography
        variant="body-std-rg"
        onClick={() => handleClick(null)}
        sx={{
          color: folderPath.length === 0 ? color.White100 : color.White80_T,
          cursor: folderPath.length === 0 ? 'default' : 'pointer',
          borderRadius: 0.5,
          transition: 'all 0.2s ease-in-out',
          px: 0.75,
          '&:hover': folderPath.length > 0 ? { color: color.White100, bgcolor: color.White08_T } : {},
        }}
      >
        {rootName || t(I18N_KEYS.NAVIGATION_DRAWER.MY_FILES)}
      </Typography>

      {folderPath.map((folder, index) => (
        <FlexCenVer key={folder.id}>
          <ChevronRight sx={{ fontSize: 16, color: color.White40_T }} />
          <Typography
            variant="body-std-rg"
            onClick={() => handleClick(folder.id)}
            sx={{
              color: index === folderPath.length - 1 ? color.White100 : color.White80_T,
              cursor: index === folderPath.length - 1 ? 'default' : 'pointer',
              borderRadius: 0.5,
              px: 0.75,
              transition: 'all 0.2s ease-in-out',
              '&:hover': index !== folderPath.length - 1 ? { color: color.White100, bgcolor: color.White08_T } : {},
            }}
          >
            {folder.name}
          </Typography>
        </FlexCenVer>
      ))}
    </FlexCenVer>
  );
};
