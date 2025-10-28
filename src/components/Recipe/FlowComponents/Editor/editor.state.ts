import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EditorState {
  clearNodeId: () => void;
  nodeId: string | null;
  isEditorOpen: boolean;
  onClose: () => void;
  updateNodeId: (nodeId: string) => void;
  updateIsEditorOpen: (isEditorOpen: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    (set) => ({
      // Initial state
      clearNodeId: () => set(() => ({ nodeId: null })),
      nodeId: null,
      isEditorOpen: false,
      onClose: () => set(() => ({ isEditorOpen: false })),
      openEditor: (nodeId: string) => set({ nodeId, isEditorOpen: true }),
    }),
    {
      name: 'Editor Store',
      enabled: import.meta.env.DEV,
    },
  ),
);
