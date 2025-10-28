import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeId } from 'web';
import { log } from '@/logger/logger.ts';
import { PreviewData } from '@/types/node';
import { I18N_KEYS } from '@/language/keys';
import { Menu, MenuItem } from '@/UI/Menu/Menu';
import { useVirtualElement } from '@/hooks/useVirtualElement';
import { useUserWorkflowRole, useWorkflowStore } from '@/state/workflow.state';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { InputViewer } from '../Shared/FileViewer';

const logger = log.getLogger('PreviewNode');

function PreviewNodeV2({ id, data }: { id: NodeId; data: PreviewData }) {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();
  const setRecipePoster = useWorkflowStore((s) => s.setRecipePoster);
  const editable = data.isLocked !== true && role === 'editor';
  const { inputNode } = data;
  const [virtualElement, setVirtualElement] = useVirtualElement();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      setMenuOpen(true);
      setVirtualElement(event.clientX, event.clientY);
    },
    [setVirtualElement],
  );

  const handleClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleSetPoster = useCallback(async () => {
    try {
      handleClose();
      const url = inputNode?.file?.url;
      if (url) {
        await setRecipePoster(url);
      }
    } catch (error) {
      logger.error('error saving as cover from preview node', error);
    }
  }, [handleClose, inputNode?.file?.url, setRecipePoster]);

  const MENU_ITEMS = useMemo(
    () => [
      {
        name: t(I18N_KEYS.RECIPE_MAIN.NODES.PREVIEW_NODE.SET_AS_COVER),
        action: () => void handleSetPoster(),
      },
    ],
    [handleSetPoster, t],
  );

  return (
    <>
      <DynamicNode2 id={id} data={data} className="preview">
        <InputViewer input={inputNode} id={id} handleContextMenu={editable ? handleContextMenu : undefined} />
      </DynamicNode2>
      {inputNode?.file?.type === 'image' && (
        <Menu open={menuOpen} onClose={handleClose} anchorEl={virtualElement}>
          {MENU_ITEMS.map((item, index) => (
            <MenuItem key={index} onClick={item.action}>
              {item.name}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}

export default PreviewNodeV2;
