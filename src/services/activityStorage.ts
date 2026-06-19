import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Activity,
  ActivityCategory,
  ActivityStatus,
} from '@/data/mockActivities';

const ACTIVITIES_STORAGE_KEY = '@insightlog:activities';

type StoredActivity = Partial<Activity> & {
  id?: unknown;
  title?: unknown;
  category?: unknown;
  createdAt?: unknown;
  status?: unknown;
};

function isValidCategory(category: unknown): category is ActivityCategory {
  return ['Estudo', 'Saúde', 'Social'].includes(String(category));
}

function isValidStatus(status: unknown): status is ActivityStatus {
  return ['Pendente', 'Em andamento', 'Concluída', 'Adiada'].includes(
    String(status)
  );
}

function normalizeActivities(data: unknown): Activity[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is StoredActivity => !!item && typeof item === 'object')
    .filter(
      (item) =>
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        isValidCategory(item.category) &&
        typeof item.createdAt === 'string' &&
        isValidStatus(item.status)
    )
    .map((item) => ({
      id: item.id as string,
      title: item.title as string,
      category: item.category as ActivityCategory,
      description:
        typeof item.description === 'string' ? item.description : undefined,
      createdAt: item.createdAt as string,
      activityTime:
        typeof item.activityTime === 'string' ? item.activityTime : undefined,
      status: item.status as ActivityStatus,
      reminderEnabled: Boolean(item.reminderEnabled),
      reminderOffsetMinutes:
        typeof item.reminderOffsetMinutes === 'number'
          ? item.reminderOffsetMinutes
          : undefined,
      notificationId:
        typeof item.notificationId === 'string' ? item.notificationId : undefined,
      photoUri: typeof item.photoUri === 'string' ? item.photoUri : undefined,
      history: Array.isArray(item.history) ? item.history : [],
    }));
}

export async function loadStoredActivities() {
  try {
    const rawValue = await AsyncStorage.getItem(ACTIVITIES_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    return normalizeActivities(JSON.parse(rawValue));
  } catch (error) {
    console.warn('Não foi possível carregar as atividades salvas.', error);
    return null;
  }
}

export async function saveStoredActivities(activities: Activity[]) {
  try {
    await AsyncStorage.setItem(
      ACTIVITIES_STORAGE_KEY,
      JSON.stringify(activities)
    );
  } catch (error) {
    console.warn('Não foi possível salvar as atividades localmente.', error);
  }
}
