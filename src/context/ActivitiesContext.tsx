import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  mockActivities,
  Activity,
  ActivityCategory,
  ActivityStatus,
  ActivityHistoryEntry,
} from '../data/mockActivities';
import {
  cancelScheduledActivityReminder,
  scheduleActivityReminder,
} from '@/services/notifications';
import {
  loadStoredActivities,
  saveStoredActivities,
} from '@/services/activityStorage';

const COMPLETED_STATUS: ActivityStatus = 'Concluída';

type NewActivityInput = {
  title: string;
  description?: string;
  category: ActivityCategory;
  createdAt: string;
  activityTime?: string;
  status: ActivityStatus;
  reminderEnabled: boolean;
  reminderOffsetMinutes?: number;
};

type ActivitiesContextValue = {
  activities: Activity[];
  isHydrated: boolean;
  addActivity: (input: NewActivityInput) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
  updateActivity: (id: string, input: NewActivityInput) => Promise<void>;
  updateActivityStatus: (
    id: string,
    status: ActivityStatus,
    note?: string,
    postponedUntil?: string
  ) => Promise<void>;
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
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function hydrateActivities() {
      const storedActivities = await loadStoredActivities();

      if (storedActivities && storedActivities.length > 0) {
        setActivities(storedActivities);
      }

      setIsHydrated(true);
    }

    void hydrateActivities();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    void saveStoredActivities(activities);
  }, [activities, isHydrated]);

  async function addActivity(input: NewActivityInput) {
    const baseActivity: Activity = {
      id: String(Date.now()),
      title: input.title.trim(),
      description: input.description?.trim() || '',
      category: input.category,
      createdAt: input.createdAt,
      activityTime: input.activityTime,
      status: input.status,
      reminderEnabled: input.reminderEnabled,
      reminderOffsetMinutes: input.reminderOffsetMinutes,
      notificationId: undefined,
      history: [
        buildHistoryEntry(input.status, input.createdAt, 'Atividade criada'),
      ],
    };

    const notificationId = await scheduleActivityReminder(baseActivity);

    setActivities((prev) => [
      {
        ...baseActivity,
        notificationId,
      },
      ...prev,
    ]);
  }

  async function removeActivity(id: string) {
    const activity = activities.find((item) => item.id === id);

    await cancelScheduledActivityReminder(activity?.notificationId);

    setActivities((prev) => prev.filter((item) => item.id !== id));
  }

  async function updateActivity(id: string, input: NewActivityInput) {
    const currentActivity = activities.find((item) => item.id === id);

    if (!currentActivity) return;

    await cancelScheduledActivityReminder(currentActivity.notificationId);

    const statusChanged = currentActivity.status !== input.status;

    const updatedActivity: Activity = {
      ...currentActivity,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      category: input.category,
      createdAt: input.createdAt,
      activityTime: input.activityTime,
      status: input.status,
      reminderEnabled: input.reminderEnabled,
      reminderOffsetMinutes: input.reminderOffsetMinutes,
      notificationId: undefined,
      history: statusChanged
        ? [
            ...currentActivity.history,
            buildHistoryEntry(
              input.status,
              new Date().toISOString(),
              'Status alterado na edição'
            ),
          ]
        : currentActivity.history,
    };

    const notificationId =
      updatedActivity.status === COMPLETED_STATUS
        ? undefined
        : await scheduleActivityReminder(updatedActivity);

    setActivities((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...updatedActivity,
              notificationId,
            }
          : item
      )
    );
  }

  async function updateActivityStatus(
    id: string,
    status: ActivityStatus,
    note?: string,
    postponedUntil?: string
  ) {
    const currentActivity = activities.find((item) => item.id === id);

    if (!currentActivity || currentActivity.status === status) return;

    await cancelScheduledActivityReminder(currentActivity.notificationId);

    const updatedActivity: Activity = {
      ...currentActivity,
      status,
      notificationId: undefined,
      history: [
        ...currentActivity.history,
        buildHistoryEntry(status, new Date().toISOString(), note, postponedUntil),
      ],
    };

    const notificationId =
      status === COMPLETED_STATUS
        ? undefined
        : await scheduleActivityReminder(updatedActivity);

    setActivities((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...updatedActivity,
              notificationId,
            }
          : item
      )
    );
  }

  const value = useMemo(
    () => ({
      activities,
      isHydrated,
      addActivity,
      removeActivity,
      updateActivity,
      updateActivityStatus,
    }),
    [activities, isHydrated]
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
