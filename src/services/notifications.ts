import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { ActivityStatus } from '@/data/mockActivities';

const CHANNEL_ID = 'activity-reminders';
const COMPLETED_STATUS: ActivityStatus = 'Concluída';
const isExpoGo = Constants.executionEnvironment === 'storeClient';

type NotificationsModule = typeof import('expo-notifications');

type ReminderActivity = {
  id: string;
  title: string;
  createdAt: string;
  activityTime?: string;
  status: ActivityStatus;
  reminderEnabled: boolean;
  reminderOffsetMinutes?: number;
};

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isExpoGo) {
    return null;
  }

  try {
    return await import('expo-notifications');
  } catch (error) {
    console.warn('Não foi possível carregar o módulo de notificações.', error);
    return null;
  }
}

function buildReminderDate(
  activityDate: string,
  activityTime?: string,
  reminderOffsetMinutes?: number
) {
  const reminderDate = new Date(activityDate);

  if (activityTime) {
    const [hours, minutes] = activityTime.split(':').map(Number);
    reminderDate.setHours(hours, minutes, 0, 0);

    if (reminderOffsetMinutes) {
      reminderDate.setMinutes(
        reminderDate.getMinutes() - reminderOffsetMinutes
      );
    }
  } else {
    reminderDate.setHours(9, 0, 0, 0);
  }

  return reminderDate;
}

async function ensureNotificationPermission(
  Notifications: NotificationsModule
) {
  const currentPermissions = await Notifications.getPermissionsAsync();

  if (currentPermissions.granted) return true;

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.granted;
}

export async function configureNotificationsAsync() {
  const Notifications = await getNotificationsModule();

  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembretes de atividades',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#B79CED',
  });
}

export async function scheduleActivityReminder(activity: ReminderActivity) {
  try {
    if (!activity.reminderEnabled || activity.status === COMPLETED_STATUS) {
      return undefined;
    }

    const Notifications = await getNotificationsModule();

    if (!Notifications) {
      return undefined;
    }

    const reminderDate = buildReminderDate(
      activity.createdAt,
      activity.activityTime,
      activity.reminderOffsetMinutes
    );

    if (reminderDate.getTime() <= Date.now()) {
      return undefined;
    }

    const permissionGranted = await ensureNotificationPermission(Notifications);

    if (!permissionGranted) {
      return undefined;
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lembrete de atividade',
        body: activity.activityTime
          ? `${activity.title} está prevista para ${activity.activityTime}.`
          : `${activity.title} está programada para hoje.`,
        sound: true,
        data: {
          activityId: activity.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: CHANNEL_ID,
      },
    });
  } catch (error) {
    console.warn('Não foi possível agendar o lembrete da atividade.', error);
    return undefined;
  }
}

export async function cancelScheduledActivityReminder(
  notificationId?: string
) {
  if (!notificationId) return;

  try {
    const Notifications = await getNotificationsModule();

    if (!Notifications) return;

    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Não foi possível cancelar o lembrete da atividade.', error);
  }
}
