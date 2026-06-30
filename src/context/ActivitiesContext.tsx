import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  ActivityCategory,
  ActivityStatus,
  ActivityHistoryEntry,
} from '../data/mockActivities';
import {
  cancelScheduledActivityReminder,
  scheduleActivityReminder,
} from '@/services/notifications';
import { useAuth } from '@/context/AuthContext';
import {
  initActivityDatabase,
  getAllActivities,
  upsertActivity,
  deleteActivity as deleteActivityFromDb,
} from '@/services/activityDatabase';
import { deleteStoredImage } from '@/services/imagePicker';

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
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  rating?: number;
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
  const { user } = useAuth();
  const userId = user?.id;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrateActivities() {
      if (!userId) {
        setActivities([]);
        setIsHydrated(true);
        return;
      }
      setIsHydrated(false);
      try {
        await initActivityDatabase();
        const stored = await getAllActivities(userId);
        if (active) setActivities(stored);
      } catch (error) {
        console.warn('Não foi possível carregar as atividades.', error);
        if (active) setActivities([]);
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    void hydrateActivities();
    return () => {
      active = false;
    };
  }, [userId]);

  async function addActivity(input: NewActivityInput) {
    if (!userId) return;
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
      photoUri: input.photoUri,
      latitude: input.latitude,
      longitude: input.longitude,
      locationLabel: input.locationLabel,
      rating: input.rating,
      history: [
        buildHistoryEntry(input.status, input.createdAt, 'Atividade criada'),
      ],
    };

    const notificationId = await scheduleActivityReminder(baseActivity);
    const persisted: Activity = { ...baseActivity, notificationId };

    await upsertActivity(persisted, userId);

    setActivities((prev) => [persisted, ...prev]);
  }

  async function removeActivity(id: string) {
    const activity = activities.find((item) => item.id === id);

    await cancelScheduledActivityReminder(activity?.notificationId);
    deleteStoredImage(activity?.photoUri);
    await deleteActivityFromDb(id);

    setActivities((prev) => prev.filter((item) => item.id !== id));
  }

  async function updateActivity(id: string, input: NewActivityInput) {
    const currentActivity = activities.find((item) => item.id === id);

    if (!currentActivity || !userId) return;

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
      photoUri: input.photoUri,
      latitude: input.latitude,
      longitude: input.longitude,
      locationLabel: input.locationLabel,
      rating: input.rating,
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
    const persisted: Activity = { ...updatedActivity, notificationId };

    await upsertActivity(persisted, userId);

    setActivities((prev) =>
      prev.map((item) => (item.id === id ? persisted : item))
    );
  }

  async function updateActivityStatus(
    id: string,
    status: ActivityStatus,
    note?: string,
    postponedUntil?: string
  ) {
    const currentActivity = activities.find((item) => item.id === id);

    if (!currentActivity || currentActivity.status === status || !userId) return;

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
    const persisted: Activity = { ...updatedActivity, notificationId };

    await upsertActivity(persisted, userId);

    setActivities((prev) =>
      prev.map((item) => (item.id === id ? persisted : item))
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
    [activities, isHydrated, userId]
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
