import { useEffect, useState, useRef, ChangeEvent, MouseEvent, useCallback, KeyboardEvent } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { AppMenuItem } from '@/UI/AppContextMenu/AppMenu.styles';
import { Input } from '@/UI/Input/Input';
import { SearchIcon } from '@/UI/Icons/SearchIcon';
import { I18N_KEYS } from '@/language/keys';
import { useNodeFiltersStore } from '@/state/nodes/nodes.state';
import { MenuCategory, ModelItem } from '@/state/nodes/nodes.types';
import { flattenMenuData, filterNodesBySearch, filterNodesByInputOutputTypes } from '@/state/nodes/nodes.utils';
import { useHotkeyScope } from '@/hooks/useHotkeyScope';
import { MENU_ITEM_ID_TEXT_MAP } from '../FlowComponents/LeftPanelSections/MenuItemIdTextsMap';
import { getOppositeHandleKeyForConnection } from '../utils';
import ParentMenuItem from './ParentMenuItem';
import type { AddNewNodeOptions } from '../flowTypes';
import type { Connection } from '../FlowComponents/FlowTour/ConnectionContext';

interface FloatMenuProps {
  positionX: number;
  positionY: number;
  isOpen: boolean;
  connection?: Connection;
  addNewNode: ({ action, dropX, dropY, connection }: AddNewNodeOptions) => void;
  onClose: () => void;
}

function FloatMenu({ positionX, positionY, isOpen, addNewNode, onClose, connection }: FloatMenuProps) {
  const [search, setSearch] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState<ModelItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const menuItemsRef = useRef<(HTMLLIElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();

  const { menu } = useNodeFiltersStore();

  const originalFilteredItems = useRef<ModelItem[]>([]);

  useHotkeyScope('floatmenu');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);

  const handleKeyDown = useCallback(
    (e) => {
      let itemsCount: number;
      if (search || connection) {
        itemsCount = filteredMenuItems.length;
      } else {
        const recentItemCount = menu.recent?.children.length;
        const restCount = Object.keys(menu).length;
        itemsCount = restCount + recentItemCount - 1;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsKeyboardNavigating(true);
      }

      switch (e.key) {
        case 'ArrowDown':
          if (highlightedIndex === itemsCount - 1) {
            setHighlightedIndex(-1);
            searchInputRef?.current?.focus();
          } else if (highlightedIndex === -1) {
            setHighlightedIndex(0);
          } else {
            const newIndex = Math.min(highlightedIndex + 1, itemsCount - 1);
            setHighlightedIndex(newIndex);
          }
          break;
        case 'ArrowUp':
          if (highlightedIndex === -1) {
            setHighlightedIndex(itemsCount - 1);
          } else if (highlightedIndex === 0) {
            setHighlightedIndex(-1);
            searchInputRef?.current?.focus();
          } else {
            setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
          }
          if (highlightedIndex === 0) {
            // focus on search input when the selected item is the first one
            searchInputRef.current?.focus();
          }
          break;
        default:
          break;
      }
    },
    [search, connection, filteredMenuItems.length, menu, highlightedIndex],
  );

  const onSelect = useCallback(() => {
    if (highlightedIndex >= 0 && filteredMenuItems[highlightedIndex]) {
      addNewNode({ action: filteredMenuItems[highlightedIndex], dropX: positionX, dropY: positionY, connection });
      onClose();
    } else if (filteredMenuItems.length === 1) {
      addNewNode({ action: filteredMenuItems[0], dropX: positionX, dropY: positionY, connection });
      onClose();
    }
  }, [filteredMenuItems, positionX, positionY, highlightedIndex, addNewNode, onClose, connection]);

  useHotkeys(['ArrowDown', 'ArrowUp'], handleKeyDown, {
    scopes: 'floatmenu',
    enableOnContentEditable: true,
    enableOnFormTags: true,
  });

  useHotkeys(['Enter'], onSelect, {
    scopes: 'floatmenu',
    enableOnContentEditable: true,
    enableOnFormTags: true,
  });

  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') && filteredMenuItems.length !== 0) {
      return;
    }
    if (e.key === 'Escape') {
      onClose();
    }
    e.stopPropagation();
  };

  const handleItemClick = (e: MouseEvent, item: ModelItem) => {
    // if (e?.type === 'click') {
    addNewNode({ action: item, dropX: positionX, dropY: positionY, connection });
    onClose();
    // }
  };

  useEffect(() => {
    if (connection) {
      const filteredItems = filterNodesByInputOutputTypes(
        flattenMenuData(menu),
        getOppositeHandleKeyForConnection(connection.handleSide),
        connection.handleType ? [connection.handleType] : [],
      );
      setFilteredMenuItems(filteredItems);
      originalFilteredItems.current = [...filteredItems];
    }
    setHighlightedIndex(-1);
  }, [connection, menu]);

  useEffect(() => {
    if (connection && originalFilteredItems.current.length > 0) {
      const filtered = filterNodesBySearch(originalFilteredItems.current, search);
      setFilteredMenuItems(filtered);
    } else {
      setFilteredMenuItems(filterNodesBySearch(flattenMenuData(menu), search));
    }
    setHighlightedIndex(-1);
  }, [search, menu, connection]);

  // Helper type guards
  function isMenuCategory(item: MenuCategory | ModelItem): item is MenuCategory {
    return 'children' in item && Array.isArray(item.children);
  }

  function isModelItem(item: MenuCategory | ModelItem): item is ModelItem {
    return !('children' in item) || !Array.isArray(item.children);
  }

  // Helper to render menu recursively, skipping 'recent' section
  const renderMenu = (items: MenuCategory['children'], startIndex = 0) => {
    let currentIndex = startIndex;
    return items.map((item) => {
      if (!item || typeof item.id !== 'string') return null;
      if (item.id === 'recent') return null; // Skip 'recent' section here

      if (isMenuCategory(item)) {
        // Only render ParentMenuItem if it has at least one child
        if (!item.children || item.children.length === 0) return null;

        const translationKey =
          typeof item.id === 'string'
            ? (MENU_ITEM_ID_TEXT_MAP[
                item.id as keyof typeof MENU_ITEM_ID_TEXT_MAP
              ] as keyof typeof I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES)
            : undefined;
        return (
          <ParentMenuItem
            id={item.id}
            label={translationKey ? t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES[translationKey]) : item.id}
            onClose={onClose}
            key={item.id}
          >
            {renderMenu(item.children, currentIndex)}
          </ParentMenuItem>
        );
      } else if (isModelItem(item)) {
        const translationKey =
          typeof item.id === 'string'
            ? (MENU_ITEM_ID_TEXT_MAP[
                item.id as keyof typeof MENU_ITEM_ID_TEXT_MAP
              ] as keyof typeof I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES)
            : undefined;
        const element = (
          <AppMenuItem
            key={item.id}
            ref={(el) => (menuItemsRef.current[currentIndex] = el)}
            // selected={currentIndex === highlightedIndex}
            onClick={(e) => handleItemClick(e, item)}
            onMouseEnter={() => setIsKeyboardNavigating(false)}
            sx={{
              mb: 0.25,
              ...(isKeyboardNavigating ? { '&:hover': { backgroundColor: 'unset' } } : {}),
            }}
          >
            {translationKey ? t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES[translationKey]) : item.displayName}
          </AppMenuItem>
        );
        currentIndex++;
        return element;
      }
      return null;
    });
  };

  // Render recent items flat at the top
  const renderRecentItems = (recentItems: ModelItem[]) => {
    return recentItems.map((item, index) => {
      const translationKey =
        typeof item.id === 'string'
          ? (MENU_ITEM_ID_TEXT_MAP[
              item.id as keyof typeof MENU_ITEM_ID_TEXT_MAP
            ] as keyof typeof I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES)
          : undefined;
      return (
        <AppMenuItem
          key={`recent-${item.id}`}
          ref={(el) => (menuItemsRef.current[index] = el)}
          selected={index === highlightedIndex}
          onClick={(e) => handleItemClick(e, item)}
          onMouseEnter={() => setIsKeyboardNavigating(false)}
          sx={{
            mb: 0.25,
            ...(isKeyboardNavigating ? { '&:hover': { backgroundColor: 'unset' } } : {}),
          }}
        >
          {translationKey ? t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES[translationKey]) : item.displayName}
        </AppMenuItem>
      );
    });
  };

  const renderSearchResults = () => {
    return filteredMenuItems.map((item, index) => {
      const translationKey =
        typeof item.id === 'string'
          ? (MENU_ITEM_ID_TEXT_MAP[
              item.id as keyof typeof MENU_ITEM_ID_TEXT_MAP
            ] as keyof typeof I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES)
          : undefined;
      return (
        <AppMenuItem
          key={item.id || index}
          ref={(el) => (menuItemsRef.current[index] = el)}
          selected={index === highlightedIndex}
          onClick={(e) => handleItemClick(e, item)}
          onMouseEnter={() => setIsKeyboardNavigating(false)}
          sx={{
            mb: 0.25,
            ...(isKeyboardNavigating ? { '&:hover': { backgroundColor: 'unset' } } : {}),
          }}
        >
          {translationKey ? t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES[translationKey]) : item.displayName}
        </AppMenuItem>
      );
    });
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && menuItemsRef.current[highlightedIndex]) {
      menuItemsRef.current[highlightedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedIndex, search, filteredMenuItems, menu]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  return (
    <Box>
      <AppContextMenu
        open={isOpen}
        onClose={onClose}
        mouseX={positionX}
        mouseY={positionY}
        maxHeight="580px"
        onKeyDown={(event) => {
          // Disable native arrow key navigation
          if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
            event.preventDefault();
          }
        }}
      >
        <Box sx={{ p: 0, pb: 1 }}>
          <Input
            inputRef={searchInputRef}
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
            fullWidth
            sx={{
              '&.MuiInputBase-root': {
                minWidth: 'auto',
              },
            }}
            placeholder={t(I18N_KEYS.GENERAL.SEARCH)}
            startAdornment={<SearchIcon />}
          />
        </Box>
        {search || connection
          ? renderSearchResults()
          : [
              ...renderRecentItems((menu.recent?.children || []) as ModelItem[]),
              ...renderMenu(Object.values(menu) as MenuCategory['children'], menu.recent?.children?.length || 0),
            ]}
      </AppContextMenu>
    </Box>
  );
}

export default FloatMenu;
