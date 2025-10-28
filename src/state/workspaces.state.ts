import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ActiveWorkspace, BaseWorkspace } from '@/types/auth.types';

interface WorkspacesState {
  activeWorkspace: ActiveWorkspace;
  updateActiveWorkspace: (workspace: Partial<ActiveWorkspace>) => void;
  workspaces: BaseWorkspace[];
  initWorkspaces: (workspaces: BaseWorkspace[]) => void;
  updateUserWorkspaces: (wid: string, workspace: Partial<BaseWorkspace>) => void;
  reset: () => void;
}

const useWorkspacesStore = create<WorkspacesState>()(
  devtools(
    (set) => ({
      // Initial state
      activeWorkspace: { preferences: {}, subscription: {} } as ActiveWorkspace,
      workspaces: [],
      // Actions to update the state
      updateActiveWorkspace: (workspaceUpdate: Partial<ActiveWorkspace>) =>
        set(
          (state) => ({
            activeWorkspace: { ...state.activeWorkspace, ...workspaceUpdate },
          }),
          false,
          'updateActiveWorkspace',
        ),
      initWorkspaces: (workspaces: BaseWorkspace[]) => set(() => ({ workspaces }), false, 'initWorkspaces'),
      updateUserWorkspaces: (wid: string, workspace: Partial<BaseWorkspace>) =>
        set(
          (state) => ({
            workspaces: state.workspaces.map((w) => (w.workspaceId === wid ? { ...w, ...workspace } : w)),
          }),
          false,
          'updateUserWorkspaces',
        ),
      reset: () =>
        set(
          () => ({ activeWorkspace: { preferences: {}, subscription: {} } as ActiveWorkspace, workspaces: [] }),
          false,
          'reset',
        ),
    }),
    {
      name: 'Workspaces Store',
      enabled: import.meta.env.DEV,
    },
  ),
);

export default useWorkspacesStore;
