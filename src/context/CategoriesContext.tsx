import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Category, FALLBACK_CATEGORY } from '@/data/categories';
import { useAuth } from '@/context/AuthContext';
import {
  countActivitiesInCategory,
  deleteCategory as deleteCategoryFromDb,
  getAllCategories,
  initCategoryDatabase,
  seedDefaultCategories,
  upsertCategory,
} from '@/services/categoryDatabase';

type CategoriesContextValue = {
  categories: Category[];
  isHydrated: boolean;
  /** Lookup helper — sempre retorna algo (fallback se id desconhecido). */
  getCategory: (id: string) => Category;
  addCategory: (input: Omit<Category, 'id' | 'isDefault'>) => Promise<void>;
  updateCategory: (id: string, input: Omit<Category, 'id' | 'isDefault'>) => Promise<void>;
  /** Lança se houver atividades vinculadas ou se for a última categoria. */
  removeCategory: (id: string) => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextValue | undefined>(
  undefined
);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!userId) {
        setCategories([]);
        setIsHydrated(true);
        return;
      }
      setIsHydrated(false);
      try {
        await initCategoryDatabase();
        let stored = await getAllCategories(userId);
        if (stored.length === 0) {
          await seedDefaultCategories(userId);
          stored = await getAllCategories(userId);
        }
        if (active) setCategories(stored);
      } catch (error) {
        console.warn('Não foi possível carregar categorias.', error);
        if (active) setCategories([]);
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [userId]);

  const getCategory = useCallback(
    (id: string): Category =>
      categories.find((c) => c.id === id) ??
      categories[0] ??
      FALLBACK_CATEGORY,
    [categories]
  );

  async function addCategory(input: Omit<Category, 'id' | 'isDefault'>) {
    if (!userId) return;
    const newCategory: Category = {
      id: `${userId}-${Date.now()}`,
      name: input.name.trim(),
      color: input.color,
      icon: input.icon,
      isDefault: false,
    };
    await upsertCategory(newCategory, userId);
    setCategories((prev) => [...prev, newCategory]);
  }

  async function updateCategory(
    id: string,
    input: Omit<Category, 'id' | 'isDefault'>
  ) {
    if (!userId) return;
    const current = categories.find((c) => c.id === id);
    if (!current) return;
    const updated: Category = {
      ...current,
      name: input.name.trim(),
      color: input.color,
      icon: input.icon,
    };
    await upsertCategory(updated, userId);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function removeCategory(id: string) {
    if (!userId) return;
    if (categories.length <= 1) {
      throw { code: 'categories/cannot-remove-last' };
    }
    const inUse = await countActivitiesInCategory(id, userId);
    if (inUse > 0) {
      throw { code: 'categories/in-use', count: inUse };
    }
    await deleteCategoryFromDb(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  const value = useMemo(
    () => ({
      categories,
      isHydrated,
      getCategory,
      addCategory,
      updateCategory,
      removeCategory,
    }),
    [categories, isHydrated, getCategory, userId]
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return ctx;
}
