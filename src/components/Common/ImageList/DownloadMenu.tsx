import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { MenuAction } from '@/components/Menu/Actions';
import { DownloadBtn } from '@/components/DownloadBtn/DownloadBtn';

interface DownloadMenuP {
  selected: number;
  downloadMenuAnchorEl: HTMLElement | null;
  disabled: boolean;
  isAddCopyBtn?: boolean;
  setDownloadMenuAnchorEl: (anchorEl: HTMLElement | null) => void;
  handleDownload: (index: number) => Promise<void>;
  handleDownloadAll: () => Promise<void>;
  handleCopyImage: (index: number) => Promise<void>;
}

const DownloadMenu = ({
  selected,
  downloadMenuAnchorEl,
  disabled,
  isAddCopyBtn,
  setDownloadMenuAnchorEl,
  handleDownload,
  handleDownloadAll,
  handleCopyImage,
}: DownloadMenuP) => {
  const { t } = useTranslation();

  const onDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    void handleDownload(selected);
    setDownloadMenuAnchorEl(null);
  };

  const onDownloadAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    void handleDownloadAll();
    setDownloadMenuAnchorEl(null);
  };

  const onCopyImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    void handleCopyImage(selected);
    setDownloadMenuAnchorEl(null);
  };

  const items: MenuAction[] = [
    {
      name: t(I18N_KEYS.GENERAL.DOWNLOAD),
      action: onDownload,
    },
    {
      name: t(I18N_KEYS.NODE_IMAGE_LIST.CONTEXT_MENU.DOWNLOAD_ALL),
      action: onDownloadAll,
    },
  ];

  if (isAddCopyBtn) {
    items.push({
      name: t(I18N_KEYS.NODE_IMAGE_LIST.CONTEXT_MENU.COPY_IMAGE),
      action: onCopyImage,
    });
  }

  return (
    <>
      <DownloadBtn disabled={disabled} setDownloadMenuAnchorEl={setDownloadMenuAnchorEl} />
      <AppContextMenu
        width="140px"
        data-testid="node-gallery-download-menu"
        open={downloadMenuAnchorEl !== null}
        onClose={(e: React.MouseEvent) => {
          if ('stopPropagation' in e) {
            e.stopPropagation();
          }
          setDownloadMenuAnchorEl(null);
        }}
        anchorEl={downloadMenuAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        items={items}
      />
    </>
  );
};

export default DownloadMenu;
