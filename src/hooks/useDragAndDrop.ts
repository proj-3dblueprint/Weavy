import { useState, useCallback, DragEvent } from 'react';

interface DragAndDropState {
  isDragging: boolean;
  draggedItemId: string | null;
  draggedItemType: 'file' | 'folder' | null;
  dragOverItemId: string | null;
}

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragAndDropState>({
    isDragging: false,
    draggedItemId: null,
    draggedItemType: null,
    dragOverItemId: null,
  });

  const handleDragStart = useCallback((e: DragEvent, itemId: string, itemType: 'file' | 'folder') => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('itemId', itemId);
    e.dataTransfer.setData('itemType', itemType);

    setDragState({
      isDragging: true,
      draggedItemId: itemId,
      draggedItemType: itemType,
      dragOverItemId: null,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItemId: null,
      draggedItemType: null,
      dragOverItemId: null,
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    setDragState((prev) => ({
      ...prev,
      dragOverItemId: targetId,
    }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dragOverItemId: null,
    }));
  }, []);

  const handleDrop = useCallback(
    (
      e: DragEvent,
      targetFolderId: string,
      onMove: (itemId: string, itemType: 'file' | 'folder', targetFolderId: string) => void,
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const itemId = e.dataTransfer.getData('itemId');
      const itemType = e.dataTransfer.getData('itemType') as 'file' | 'folder';

      if (itemId && itemType && itemId !== targetFolderId) {
        onMove(itemId, itemType, targetFolderId);
      }

      setDragState({
        isDragging: false,
        draggedItemId: null,
        draggedItemType: null,
        dragOverItemId: null,
      });
    },
    [],
  );

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
