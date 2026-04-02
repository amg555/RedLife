import { create } from 'zustand';
import type { HistoryItem } from '../types';

interface HistoryStore {
  items: HistoryItem[];
  addItem: (item: HistoryItem) => void;
  removeItem: (sessionId: string) => void;
  getItem: (sessionId: string) => HistoryItem | undefined;
}

const STORAGE_KEY = 'redlife_history';

function loadFromStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
  } catch {
    // ignore
  }
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  items: loadFromStorage(),

  addItem: (item) => {
    const items = [item, ...get().items.filter(i => i.session_id !== item.session_id)];
    saveToStorage(items);
    set({ items });
  },

  removeItem: (sessionId) => {
    const items = get().items.filter(i => i.session_id !== sessionId);
    saveToStorage(items);
    set({ items });
  },

  getItem: (sessionId) => get().items.find(i => i.session_id === sessionId),
}));
