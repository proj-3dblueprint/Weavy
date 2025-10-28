import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FF_CLIENT_OLD_VERSION_RELOAD } from '@/consts/featureFlags';
import { posthog } from '@/providers/posthog';
import type { NodeId } from 'web';

export interface AlertData {
  severity?: 'success' | 'error' | 'warning' | 'info';
  text: string;
  icon: React.ReactNode;
  action?: {
    text: string;
    onClick: () => void | Promise<void>;
  };
}

export interface SnackbarData extends AlertData {
  isOpen: boolean;
  duration?: number;
}

interface RenameDialogData {
  type: 'rename';
  id: NodeId;
  initialName: string;
}
export type DialogData = RenameDialogData;

interface GlobalState {
  snackbarData: SnackbarData;
  updateSnackbarData: (snackbarData: SnackbarData) => void;
  dialogData?: DialogData;
  openDialog: (dialog: DialogData) => void;
  closeDialog: () => void;
  isShortcutsPanelOpen: boolean;
  setIsShortcutsPanelOpen: (isOpen: boolean) => void;
  isShowRefreshAlert: boolean;
  setIsShowRefreshAlert: (isShow: boolean) => void;
  reset: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  devtools(
    (set) => ({
      // Initial state
      snackbarData: { text: '', isOpen: false, icon: null },
      dialogData: undefined,
      // Actions to update the state
      updateSnackbarData: (snackbarData: SnackbarData) => set(() => ({ snackbarData })),
      openDialog: (dialog: DialogData) => set(() => ({ dialogData: dialog })),
      closeDialog: () => set(() => ({ dialogData: undefined })),
      isShortcutsPanelOpen: false,
      setIsShortcutsPanelOpen: (isOpen: boolean) => set(() => ({ isShortcutsPanelOpen: isOpen })),
      isShowRefreshAlert: false,
      setIsShowRefreshAlert: (isShow: boolean) => {
        if (posthog.isFeatureEnabled(FF_CLIENT_OLD_VERSION_RELOAD)) {
          set(() => ({ isShowRefreshAlert: isShow }));
        }
      },
      reset: () =>
        set(() => ({
          snackbarData: { text: '', isOpen: false, icon: null },
          dialogData: undefined,
          isShortcutsPanelOpen: false,
          isShowRefreshAlert: false,
        })),
    }),
    {
      name: 'Global Store',
      enabled: import.meta.env.DEV,
    },
  ),
);
