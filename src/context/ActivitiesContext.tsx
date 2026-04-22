import React, { createContext, useContext, useMemo, useState } from 'react';
import { mockActivities, Activity, ActivityCategory } from '../data/mockActivities';

type NewActivityInput = {
  title: string;
  description?: string;
  category: ActivityCategory;
  createdAt: string;
};

type ActivitiesContextValue = {
  activities: Activity[];
  addActivity: (input: NewActivityInput) => void;
  removeActivity: (id: string) => void;
  updateActivity: (id: string, input: NewActivityInput) => void;
};

const ActivitiesContext = createContext<ActivitiesContextValue | undefined>(undefined);

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  function addActivity(input: NewActivityInput) {
    const newActivity: Activity = {
      id: String(Date.now()),
      title: input.title.trim(),
      description: input.description?.trim() || '',
      category: input.category,
      createdAt: input.createdAt,
    };

    setActivities((prev) => [newActivity, ...prev]);
  }

  function removeActivity(id: string) {
    setActivities((prev) => prev.filter((item) => item.id !== id));
  }

  function updateActivity(id: string, input: NewActivityInput) {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title: input.title.trim(),
              description: input.description?.trim() || '',
              category: input.category,
              createdAt: input.createdAt,
            }
          : item
      )
    );
  }

  const value = useMemo(
    () => ({
      activities,
      addActivity,
      removeActivity,
      updateActivity,
    }),
    [activities]
  );

  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivities() {
  const context = useContext(ActivitiesContext);

  if (!context) {
    throw new Error('useActivities must be used within an ActivitiesProvider');
  }

  return context;
}