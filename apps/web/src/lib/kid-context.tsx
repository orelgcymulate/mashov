'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { kids as kidsHooks } from './hooks/useEntities';
import type { Kid } from '@mashov/shared';

interface KidCtx {
  kids: Kid[];
  loading: boolean;
  activeKidId: string;
  setActiveKidId: (id: string) => void;
  selectedKids: Kid[];
}

const Ctx = createContext<KidCtx | null>(null);

const STORAGE_KEY = 'mashov.kid';

export function KidProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = kidsHooks.useList();
  const [activeKidId, setActiveKidIdInner] = useState<string>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActiveKidIdInner(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setActiveKidId = (id: string) => {
    setActiveKidIdInner(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const list = data ?? [];
  const selectedKids =
    activeKidId === 'all' ? list : list.filter((k) => k._id === activeKidId);

  return (
    <Ctx.Provider
      value={{
        kids: list,
        loading: isLoading,
        activeKidId: list.length === 1 ? list[0]._id : activeKidId,
        setActiveKidId,
        selectedKids: list.length === 1 ? list : selectedKids,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useKidCtx(): KidCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useKidCtx outside KidProvider');
  return v;
}
