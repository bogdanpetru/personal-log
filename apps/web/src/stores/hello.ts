import { create } from "zustand";

interface HelloState {
  count: number;
  bump: () => void;
}

export const useHello = create<HelloState>((set) => ({
  count: 0,
  bump: () => set((s) => ({ count: s.count + 1 })),
}));
