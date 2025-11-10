import { create } from 'zustand';

export type UIState = {
  expanded: Record<string, boolean>;
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  setExpanded: (id: string, value: boolean) => void;
};

export const useChecklistUIStore = create<UIState>((set, get) => ({
  expanded: {},
  isExpanded: (id: string) => Boolean(get().expanded[id]),
  toggle: (id: string) => set((state) => ({ expanded: { ...state.expanded, [id]: !state.expanded[id] } })),
  setExpanded: (id: string, value: boolean) => set((state) => ({ expanded: { ...state.expanded, [id]: value } })),
}));
