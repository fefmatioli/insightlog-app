import { Activity } from '@/data/mockActivities';
import { GoalPeriod } from '@/services/goalDatabase';

const COMPLETED_STATUS = 'Concluída';

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 = domingo
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Conta as conclusões de uma categoria no período da meta. */
export function countCompletedInPeriod(
  activities: Activity[],
  categoryId: string,
  period: GoalPeriod,
  now: Date = new Date()
): number {
  const start = period === 'week' ? startOfWeek(now) : startOfMonth(now);

  return activities.filter((item) => {
    if (item.category !== categoryId) return false;
    if (item.status !== COMPLETED_STATUS) return false;

    // Usa a data da última transição para Concluída quando existe; caso
    // contrário, recorre à data de criação.
    const completedEntry = [...item.history]
      .reverse()
      .find((entry) => entry.status === COMPLETED_STATUS);
    const completedAt = new Date(
      completedEntry?.changedAt ?? item.createdAt
    );
    return completedAt >= start && completedAt <= now;
  }).length;
}
