import { Box, CircularProgress, Divider, Typography, type SxProps } from '@mui/material';
import { type MouseEvent, ReactNode, useState } from 'react';
import { log } from '@/logger/logger.ts';
import { FlexCenVer } from '@/UI/styles';
import { AppMenuItem } from '@/UI/AppContextMenu/AppMenu.styles';
import { MacCmdIcon } from '@/UI/Icons/MacCmdIcon';
import { color } from '@/colors';
import { CheckMarkIcon } from '@/UI/Icons/CheckMarkIcon';
import { getOS } from '@/utils/general';
import ParentMenuItem from '../Recipe/Menu/ParentMenuItem';

const logger = log.getLogger('Actions');

export type DividerMenuItem = {
  type: 'divider';
};

export type SectionLabel = {
  type: 'section_label';
  text: string;
};

export type Slot = {
  type: 'slot';
  el: ReactNode;
};

export type MenuAction =
  | {
      action: (e: MouseEvent<HTMLElement>) => void | Promise<void>;
      disabled?: boolean;
      name: string;
      shortcut?: ReactNode;
      shortcutKey?: string;
      icon?: ReactNode;
      withLoading?: boolean;
      children?: MenuAction[];
      selected?: boolean;
      sx?: SxProps;
      childrenOffset?: { top?: string; left?: string };
    }
  | DividerMenuItem
  | SectionLabel
  | Slot;

export const isDividerMenuItem = (item: MenuAction): item is DividerMenuItem =>
  'type' in item && item.type === 'divider';

export const isSectionLabel = (item: MenuAction): item is SectionLabel =>
  'type' in item && item.type === 'section_label';

export const isSlot = (item: MenuAction): item is Slot => 'type' in item && item.type === 'slot';
type ActionsP = {
  items: MenuAction[];
  setAnchorEl?: (anchorEl: null) => void;
  onClose?: (e: MouseEvent<HTMLElement>) => void;
  fontSize?: string;
};

const Actions = ({ items, setAnchorEl, onClose, fontSize = '0.75rem' }: ActionsP) => {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const isMac = getOS() === 'Mac';

  const onClick = async (e: MouseEvent<HTMLElement>, item: MenuAction, index: number) => {
    e.stopPropagation();
    if (isDividerMenuItem(item) || isSectionLabel(item) || isSlot(item)) {
      return;
    }

    try {
      if (item.withLoading) {
        setLoadingIndex(index);
        await item.action(e);
      } else {
        void item.action(e);
      }
    } catch (e) {
      logger.error('Error in menu actions', e);
    } finally {
      setLoadingIndex(null);
    }
    setAnchorEl?.(null);
    onClose?.(e);
  };

  const renderShortcut = (item: MenuAction) => {
    if (isDividerMenuItem(item) || isSectionLabel(item) || isSlot(item)) {
      return null;
    }

    if (item.shortcutKey) {
      return (
        <FlexCenVer sx={{ justifyContent: 'space-between', width: isMac ? '24px' : '35px' }}>
          {isMac ? (
            <MacCmdIcon width={10} height={10} />
          ) : (
            <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
              Ctrl
            </Typography>
          )}
          <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
            {item.shortcutKey}
          </Typography>
        </FlexCenVer>
      );
    }

    return item.shortcut ? <Box fontStyle="italic">{item.shortcut}</Box> : null;
  };

  return items.map((item, index) => {
    if (isDividerMenuItem(item)) {
      return <Divider key={index} sx={{ my: 1 }} />;
    }

    if (isSectionLabel(item)) {
      return (
        <Typography component="div" key={index} variant="label-xs-rg" color={color.White64_T} pl={1} my={1}>
          {item.text}
        </Typography>
      );
    }

    if (isSlot(item)) {
      return <Box key={index}>{item.el}</Box>;
    }

    // Handle items with children (submenus)
    if ((item.children?.length ?? 0) > 0) {
      return (
        <ParentMenuItem key={index} label={item.name} offset={item.childrenOffset}>
          <Actions items={item.children ?? []} fontSize={fontSize} />
        </ParentMenuItem>
      );
    }

    return (
      <AppMenuItem
        selected={item.selected}
        key={index}
        sx={{ fontSize, ...(item.sx || {}) }}
        onClick={(e) => void onClick(e, item, index)}
        disabled={item.disabled}
      >
        <FlexCenVer>
          {item.icon ? item.icon : null}
          <Box sx={{ ml: item.icon ? 1 : 'auto' }}>{item.name}</Box>
        </FlexCenVer>
        {loadingIndex === index && <CircularProgress size={16} />}
        {renderShortcut(item)}
        {item.selected && <CheckMarkIcon />}
      </AppMenuItem>
    );
  });
};

export default Actions;
