import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '@/types/auth.types';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      // Initial state
      user: null,
      // Actions to update the state
      setUser: (user: User | null) => set(() => ({ user })),
      reset: () => set(() => ({ user: null })),
    }),
    {
      name: 'User Store',
      enabled: import.meta.env.DEV,
    },
  ),
);
