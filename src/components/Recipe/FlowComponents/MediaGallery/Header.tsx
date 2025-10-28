import { Typography, Divider } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppPaper, Flex } from '@/UI/styles';
import { color } from '@/colors';
import DotsMenu from '@/components/Common/ImageList/DotsMenu';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { InfoIcon } from '@/UI/Icons/InfoIcon';
import { generateViewingUrl } from '@/components/Nodes/Utils';
import CopyBtnV2 from '@/components/Common/ImageList/CopyBtnV2';
import { useWorkflowStore } from '@/state/workflow.state';
import { AppToggleButton } from '@/UI/AppToggleButtons/AppToggleButton';
import { I18N_KEYS } from '@/language/keys.ts';
import { isMediaAsset, isRenderingAsset } from '@/components/Common/ImageList/utils';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';
import DownloadMenu from '@/components/Common/ImageList/DownloadMenu';
import type { UploadedAsset } from '@/types/api/assets';
import type { DeleteFunctions } from '@/components/Common/ImageList/types';

interface HeaderProps {
  nodeName: string;
  assets: UploadedAsset[];
  selectedAsset: UploadedAsset | undefined;
  selectedIndex: number;
  zoomPercentage: number;
  deletionFunctions?: DeleteFunctions;
  handleDownload: (index: number) => Promise<void>;
  handleDownloadAll: () => Promise<void>;
  onCloseGallery: () => void;
  onToggleParamsBlock: () => void;
  handleCopyImage: (index: number) => Promise<void>;
}

export const Header = ({
  nodeName,
  assets,
  selectedAsset,
  zoomPercentage,
  deletionFunctions,
  selectedIndex,
  handleDownload,
  handleDownloadAll,
  onCloseGallery,
  onToggleParamsBlock,
  handleCopyImage,
}: HeaderProps) => {
  const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [deleteMenuAnchorEl, setDeleteMenuAnchorEl] = useState<HTMLElement | null>(null);

  const { workflowRole, isGalleryParamsOpen } = useWorkflowStore();

  const showCopyBtn = selectedAsset?.type !== 'text';
  const showDownloadBtn = selectedAsset?.type !== 'text';
  const showInfoBtn = selectedAsset?.type !== 'rendering';
  const { t } = useTranslation();

  return (
    <Flex sx={{ justifyContent: 'space-between', width: '100%' }}>
      <AppPaper
        sx={{ height: '40px', width: '260px', display: 'flex', alignItems: 'center', gap: 1, p: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <AppXBtn onClick={onCloseGallery} size={20} />
        <EllipsisText variant="body-std-md" delay={1000}>
          {nodeName}
        </EllipsisText>
      </AppPaper>
      <AppPaper
        sx={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pl: selectedAsset?.type === 'image' ? 2 : 1,
          pr: 1,
          py: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedAsset?.type === 'image' && (
          <>
            <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
              {zoomPercentage}%
            </Typography>
            <Divider orientation="vertical" flexItem />
          </>
        )}
        <Flex sx={{ gap: 0.5 }}>
          {showInfoBtn && (
            <AppToggleButton
              selected={isGalleryParamsOpen}
              value={isGalleryParamsOpen}
              onClick={onToggleParamsBlock}
              isIcon
              btnW={28}
              btnH={28}
              mode="light"
              sx={{ border: 'none' }}
            >
              <InfoIcon width={20} height={20} />
            </AppToggleButton>
          )}
          {showDownloadBtn && (
            <DownloadMenu
              selected={selectedIndex}
              setDownloadMenuAnchorEl={setDownloadMenuAnchorEl}
              downloadMenuAnchorEl={downloadMenuAnchorEl}
              handleDownload={handleDownload}
              handleDownloadAll={handleDownloadAll}
              disabled={isRenderingAsset(selectedAsset)}
              isAddCopyBtn={selectedAsset?.type === 'image'}
              handleCopyImage={handleCopyImage}
            />
          )}
          {showCopyBtn && (
            <CopyBtnV2
              title={t(I18N_KEYS.GENERAL.COPY_LINK)}
              disabled={!isMediaAsset(selectedAsset)}
              text={isMediaAsset(selectedAsset) ? generateViewingUrl(selectedAsset) : ''}
              icon="link"
            />
          )}

          {workflowRole === 'editor' && selectedAsset && deletionFunctions && (
            <DotsMenu
              disabled={isRenderingAsset(selectedAsset)}
              setDeleteMenuAnchorEl={setDeleteMenuAnchorEl}
              deleteMenuAnchorEl={deleteMenuAnchorEl}
              deletionFunctions={deletionFunctions}
              isDeleteAllOthersDisabled={assets.length === 1}
            />
          )}
        </Flex>
      </AppPaper>
    </Flex>
  );
};
