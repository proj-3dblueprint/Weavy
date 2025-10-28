import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { useWorkflowStore } from '@/state/workflow.state';
import type { RenderingAsset, MediaAsset, TextAsset } from '@/types/api/assets';

interface GalleryMenuProps {
  contextMenu: {
    mouseX: number;
    mouseY: number;
  } | null;
  selectedFile: MediaAsset | TextAsset | RenderingAsset;
  rightClickedIndex: number | null;
  handleContextMenuClose: () => void;
  handleDownload: (index: number) => Promise<void>;
  handleDownloadAll: () => Promise<void>;
  handleSetAsCover: () => void;
  handleCopyImage: (index: number) => Promise<void>;
}

const GalleryMenu = ({
  contextMenu,
  selectedFile,
  rightClickedIndex,
  handleContextMenuClose,
  handleDownload,
  handleDownloadAll,
  handleSetAsCover,
  handleCopyImage,
}: GalleryMenuProps) => {
  const { t } = useTranslation();
  const { workflowRole } = useWorkflowStore();

  const onDownload = () => {
    if (rightClickedIndex === null) {
      return;
    }

    void handleDownload(rightClickedIndex);
  };

  const onDownloadAll = () => void handleDownloadAll();

  const onSetAsCover = () => handleSetAsCover();

  const onCopyImage = () => {
    if (rightClickedIndex === null) {
      return;
    }
    void handleCopyImage(rightClickedIndex);
  };

  const items = [
    {
      name: t(I18N_KEYS.NODE_IMAGE_LIST.CONTEXT_MENU.DOWNLOAD),
      action: onDownload,
    },
    {
      name: t(I18N_KEYS.NODE_IMAGE_LIST.CONTEXT_MENU.DOWNLOAD_ALL),
      action: onDownloadAll,
    },
  ];

  if (selectedFile?.type === 'image') {
    if (workflowRole === 'editor') {
      items.push({
        name: t(I18N_KEYS.NODE_IMAGE_LIST.CONTEXT_MENU.SET_AS_COVER),
        action: onSetAsCover,
      });
    }
    items.push({
      name: t(I18N_KEYS.NODE_IMAGE_LIST.CONTEXT_MENU.COPY_IMAGE),
      action: onCopyImage,
    });
  }

  return (
    <AppContextMenu
      width="160px"
      items={items}
      open={contextMenu !== null}
      onClose={handleContextMenuClose}
      mouseX={contextMenu?.mouseX}
      mouseY={contextMenu?.mouseY}
    />
  );
};

export default GalleryMenu;
