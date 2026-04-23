import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  mockActivities,
  Activity,
  ActivityCategory,
  ActivityStatus,
  ActivityHistoryEntry,
} from '../data/mockActivities';

type NewActivityInput = {
  title: string;
  description?: string;
  category: ActivityCategory;
  createdAt: string;
  status: ActivityStatus;
};

type ActivitiesContextValue = {
  activities: Activity[];
  addActivity: (input: NewActivityInput) => void;
  removeActivity: (id: string) => void;
  updateActivity: (id: string, input: NewActivityInput) => void;
  updateActivityStatus: (
    id: string,
    status: ActivityStatus,
    note?: string,
    postponedUntil?: string
  ) => void;
};

const ActivitiesContext = createContext<ActivitiesContextValue | undefined>(
  undefined
);

function buildHistoryEntry(
  status: ActivityStatus,
  changedAt: string,
  note?: string,
  postponedUntil?: string
): ActivityHistoryEntry {
  return {
    id: String(Date.now() + Math.random()),
    status,
    changedAt,
    note,
    postponedUntil,
  };
}

export function ActivitiesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  function addActivity(input: NewActivityInput) {
    const activity: Activity = {
      id: String(Date.now()),
      title: input.title.trim(),
      description: input.description?.trim() || '',
      category: input.category,
      createdAt: input.createdAt,
      status: input.status,
      history: [
        buildHistoryEntry(
          input.status,
          input.createdAt,
          'Atividade criada'
        ),
      ],
    };

    setActivities((prev) => [activity, ...prev]);
  }

  function removeActivity(id: string) {
    setActivities((prev) => prev.filter((item) => item.id !== id));
  }

  function updateActivity(id: string, input: NewActivityInput) {
    setActivities((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const statusChanged = item.status !== input.status;

        return {
          ...item,
          title: input.title.trim(),
          description: input.description?.trim() || '',
          category: input.category,
          createdAt: input.createdAt,
          status: input.status,
          history: statusChanged
            ? [
                ...item.history,
                buildHistoryEntry(
                  input.status,
                  new Date().toISOString(),
                  'Status alterado na edição'
                ),
              ]
            : item.history,
        };
      })
    );
  }

  function updateActivityStatus(
    id: string,
    status: ActivityStatus,
    note?: string,
    postponedUntil?: string
  ) {
    setActivities((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.status === status) return item;

        return {
          ...item,
          status,
          history: [
            ...item.history,
            buildHistoryEntry(
              status,
              new Date().toISOString(),
              note,
              postponedUntil
            ),
          ],
        };
      })
    );
  }

  const value = useMemo(
    () => ({
      activities,
      addActivity,
      removeActivity,
      updateActivity,
      updateActivityStatus,
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
    throw new Error(
      'useActivities must be used within an ActivitiesProvider'
    );
  }

  return context;
}