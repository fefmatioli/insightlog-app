import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  Goal,
  GoalPeriod,
  deleteGoal as deleteGoalFromDb,
  getAllGoals,
  initGoalDatabase,
  upsertGoal,
} from '@/services/goalDatabase';

type GoalsContextValue = {
  goals: Goal[];
  isHydrated: boolean;
  /** Salva ou atualiza uma meta de uma categoria (id == categoryId). */
  saveGoal: (categoryId: string, period: GoalPeriod, target: number) => Promise<void>;
  removeGoal: (categoryId: string) => Promise<void>;
};

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!userId) {
        setGoals([]);
        setIsHydrated(true);
        return;
      }
      setIsHydrated(false);
      try {
        await initGoalDatabase();
        const stored = await getAllGoals(userId);
        if (active) setGoals(stored);
      } catch (error) {
        console.warn('Não foi possível carregar metas.', error);
        if (active) setGoals([]);
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [userId]);

  async function saveGoal(
    categoryId: string,
    period: GoalPeriod,
    target: number
  ) {
    if (!userId) return;
    const goal: Goal = { id: categoryId, categoryId, period, target };
    await upsertGoal(goal, userId);
    setGoals((prev) => {
      const without = prev.filter((g) => g.categoryId !== categoryId);
      return [...without, goal];
    });
  }

  async function removeGoal(categoryId: string) {
    await deleteGoalFromDb(categoryId);
    setGoals((prev) => prev.filter((g) => g.categoryId !== categoryId));
  }

  const value = useMemo(
    () => ({ goals, isHydrated, saveGoal, removeGoal }),
    [goals, isHydrated, userId]
  );

  return (
    <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within a GoalsProvider');
  return ctx;
}
