import { useCallback, useState } from 'react';
import { GroupContextMenu } from '../Menu/GroupContextMenu';

interface GroupContextMenuState {
  x: number | null;
  y: number | null;
  isOpen: boolean;
  groupNodeId: string | null;
}

export const useGroupContextMenu = () => {
  const [groupContextMenu, setGroupContextMenu] = useState<GroupContextMenuState>({
    x: null,
    y: null,
    isOpen: false,
    groupNodeId: null,
  });

  const openGroupContextMenu = useCallback((x: number, y: number, groupNodeId: string) => {
    setGroupContextMenu({
      x: x,
      y: y,
      isOpen: true,
      groupNodeId,
    });
  }, []);

  const closeGroupContextMenu = useCallback(() => {
    setGroupContextMenu((current) => ({ ...current, isOpen: false }));
  }, []);

  const groupContextMenuComponent =
    groupContextMenu.isOpen &&
    groupContextMenu.x !== null &&
    groupContextMenu.y !== null &&
    groupContextMenu.groupNodeId ? (
      <GroupContextMenu
        positionX={groupContextMenu.x}
        positionY={groupContextMenu.y}
        isOpen={groupContextMenu.isOpen}
        onClose={closeGroupContextMenu}
        groupNodeId={groupContextMenu.groupNodeId}
      />
    ) : null;

  return {
    openGroupContextMenu,
    groupContextMenuComponent,
  };
};
