import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useActivities } from '../context/ActivitiesContext';
import { ActivityCategory, ActivityStatus } from '../data/mockActivities';
import {
  normalizeDateInput,
  toISODate,
  toShortDisplayDate,
} from '../utils/date';
import ScreenHeader from '@/components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
type PeriodFilter = 'Dia' | 'Semana' | 'Mês' | 'Personalizado';

const statusColors: Record<ActivityStatus, string> = {
  Pendente: '#E8E1EE',
  'Em andamento': '#DCEBFF',
  Concluída: '#DDF3E7',
  Adiada: '#FCE8DC',
};

const categoryColors: Record<ActivityCategory, string> = {
  Estudo: colors.primary,
  Saúde: colors.mint,
  Social: colors.rose,
};

const statuses: ActivityStatus[] = [
  'Pendente',
  'Em andamento',
  'Concluída',
  'Adiada',
];

const completedStatus: ActivityStatus = 'Concluída';

function isSameDay(date: Date, reference: Date) {
  return (
    date.getDate() === reference.getDate() &&
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear()
  );
}

function isWithinLast7Days(date: Date, reference: Date) {
  const diff = reference.getTime() - date.getTime();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return diff >= 0 && diff <= sevenDaysInMs;
}

function isSameMonth(date: Date, reference: Date) {
  return (
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear()
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function countCompletionStreak(dates: string[], reference: Date) {
  const completedDays = new Set(
    dates.map((date) => startOfDay(new Date(date)).toDateString())
  );

  let streak = 0;
  let cursor = startOfDay(reference);

  while (completedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export default function DashboardScreen({ navigation }: Props) {
  const { activities } = useActivities();
  const now = new Date();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('Mês');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const filteredActivities = useMemo(() => {
    if (periodFilter === 'Personalizado') {
      const startISO = toISODate(customStartDate);
      const endISO = toISODate(customEndDate);

      const start = startISO ? new Date(startISO) : null;
      const end = endISO ? new Date(endISO) : null;

      if (!start || !end) return activities;

      return activities.filter((item) => {
        const date = new Date(item.createdAt);

        const startDate = startOfDay(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        return date >= startDate && date <= endDate;
      });
    }

    return activities.filter((item) => {
      const date = new Date(item.createdAt);

      if (periodFilter === 'Dia') return isSameDay(date, now);
      if (periodFilter === 'Semana') return isWithinLast7Days(date, now);
      if (periodFilter === 'Mês') return isSameMonth(date, now);

      return true;
    });
  }, [activities, periodFilter, customStartDate, customEndDate, now]);

  const total = filteredActivities.length;
  const completed = filteredActivities.filter(
    (item) => item.status === completedStatus
  ).length;
  const inProgress = filteredActivities.filter(
    (item) => item.status === 'Em andamento'
  ).length;
  const postponed = filteredActivities.filter(
    (item) => item.status === 'Adiada'
  ).length;
  const pending = filteredActivities.filter(
    (item) => item.status === 'Pendente'
  ).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const postponementRate =
    total > 0 ? Math.round((postponed / total) * 100) : 0;

  const activeDays = new Set(
    filteredActivities.map((item) => new Date(item.createdAt).toDateString())
  ).size;

  const categories: ActivityCategory[] = ['Estudo', 'Saúde', 'Social'];

  const categoryProgress = categories.map((category) => {
    const categoryActivities = filteredActivities.filter(
      (item) => item.category === category
    );
    const categoryCompleted = categoryActivities.filter(
      (item) => item.status === completedStatus
    ).length;

    const progress =
      categoryActivities.length > 0
        ? Math.round((categoryCompleted / categoryActivities.length) * 100)
        : 0;

    return {
      category,
      total: categoryActivities.length,
      completed: categoryCompleted,
      progress,
    };
  });

  const topCategory = [...categoryProgress].sort((a, b) => b.total - a.total)[0];

  const statusCounts = statuses.map((status) => ({
    status,
    count: filteredActivities.filter((item) => item.status === status).length,
  }));

  const maxStatusCount = Math.max(...statusCounts.map((item) => item.count), 1);

  const completedDates = activities
    .filter((item) => item.status === completedStatus)
    .map((item) => {
      const completedEntry =
        [...item.history]
          .reverse()
          .find((entry) => entry.status === completedStatus) ?? null;

      return completedEntry?.changedAt ?? item.createdAt;
    });

  const completionStreak = countCompletionStreak(completedDates, now);

  const currentWeekStart = startOfDay(addDays(now, -6));
  const previousWeekStart = startOfDay(addDays(now, -13));
  const previousWeekEnd = currentWeekStart;

  const completedThisWeek = activities.filter((item) => {
    if (item.status !== completedStatus) return false;

    const completedEntry =
      [...item.history]
        .reverse()
        .find((entry) => entry.status === completedStatus) ?? null;

    const completedAt = new Date(completedEntry?.changedAt ?? item.createdAt);
    return completedAt >= currentWeekStart && completedAt <= now;
  }).length;

  const completedLastWeek = activities.filter((item) => {
    if (item.status !== completedStatus) return false;

    const completedEntry =
      [...item.history]
        .reverse()
        .find((entry) => entry.status === completedStatus) ?? null;

    const completedAt = new Date(completedEntry?.changedAt ?? item.createdAt);
    return completedAt >= previousWeekStart && completedAt < previousWeekEnd;
  }).length;

  const weeklyDelta = completedThisWeek - completedLastWeek;
  const weeklyDeltaLabel =
    weeklyDelta > 0
      ? `+${weeklyDelta} vs semana anterior`
      : weeklyDelta < 0
        ? `${weeklyDelta} vs semana anterior`
        : 'mesmo ritmo da semana anterior';

  const oldPending = activities.filter((item) => {
    if (item.status !== 'Pendente') return false;

    const createdAt = startOfDay(new Date(item.createdAt));
    const ageInDays =
      (startOfDay(now).getTime() - createdAt.getTime()) /
      (1000 * 60 * 60 * 24);

    return ageInDays >= 7;
  }).length;

  const activitiesByDay = useMemo(() => {
    const grouped = filteredActivities.reduce<Record<string, number>>(
      (acc, item) => {
        const key = new Date(item.createdAt).toLocaleDateString('pt-BR');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split('/');
        const [db, mb, yb] = b.date.split('/');
        return (
          new Date(Number(ya), Number(ma) - 1, Number(da)).getTime() -
          new Date(Number(yb), Number(mb) - 1, Number(db)).getTime()
        );
      })
      .slice(-7);
  }, [filteredActivities]);

  const maxDayCount = Math.max(...activitiesByDay.map((item) => item.count), 1);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ScreenHeader title="Métricas" onBack={() => navigation.goBack()} />
      </View>

      <Text style={styles.pageSubtitle}>
        Acompanhe progresso, consistência e comportamento das suas atividades.
      </Text>

      <View style={styles.filterRow}>
        {(['Dia', 'Semana', 'Mês', 'Personalizado'] as PeriodFilter[]).map(
          (filter) => {
            const selected = periodFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setPeriodFilter(filter)}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextSelected,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      {periodFilter === 'Personalizado' && (
        <View style={styles.customFilterCard}>
          <Text style={styles.customFilterTitle}>Intervalo personalizado</Text>

          <TextInput
            style={styles.customDateInput}
            placeholder="Data inicial: dd/mm/aaaa"
            placeholderTextColor={colors.textSecondary}
            value={customStartDate}
            onChangeText={(value) => setCustomStartDate(normalizeDateInput(value))}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.customDateInput}
            placeholder="Data final: dd/mm/aaaa"
            placeholderTextColor={colors.textSecondary}
            value={customEndDate}
            onChangeText={(value) => setCustomEndDate(normalizeDateInput(value))}
            keyboardType="numeric"
          />
        </View>
      )}

      <View style={styles.topCardsGrid}>
        <MetricCard
          title="Total"
          value={String(total)}
          subtitle="atividades"
          backgroundColor={colors.primarySoft}
        />
        <MetricCard
          title="Concluídas"
          value={String(completed)}
          subtitle={`${completionRate}% de conclusão`}
          backgroundColor="#DDF3E7"
        />
        <MetricCard
          title="Em andamento"
          value={String(inProgress)}
          subtitle="em progresso"
          backgroundColor="#DCEBFF"
        />
        <MetricCard
          title="Adiadas"
          value={String(postponed)}
          subtitle={`${postponementRate}% do total`}
          backgroundColor="#FCE8DC"
        />
      </View>

      <View style={styles.topCardsGrid}>
        <MetricCard
          title="Dias ativos"
          value={String(activeDays)}
          subtitle="dias com atividade"
          backgroundColor="#E8F6F2"
        />
        <MetricCard
          title="Categoria foco"
          value={topCategory?.category ?? '-'}
          subtitle={`${topCategory?.total ?? 0} atividades`}
          backgroundColor="#F2ECFA"
        />
      </View>

      <View style={styles.topCardsGrid}>
        <MetricCard
          title="Sequência"
          value={String(completionStreak)}
          subtitle={
            completionStreak === 1 ? 'dia concluindo' : 'dias concluindo'
          }
          backgroundColor="#FFF1CC"
        />
        <MetricCard
          title="Ritmo semanal"
          value={String(completedThisWeek)}
          subtitle={weeklyDeltaLabel}
          backgroundColor="#EAF4FF"
        />
      </View>

      <View style={styles.topCardsGrid}>
        <MetricCard
          title="Pendentes antigos"
          value={String(oldPending)}
          subtitle="há 7 dias ou mais"
          backgroundColor="#FCE8E6"
          fullWidth
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Progresso Geral</Text>

        <View style={styles.progressHeader}>
          <Text style={styles.progressBig}>{completionRate}%</Text>
          <Text style={styles.progressCaption}>
            {completed} concluídas • {pending} pendentes
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Atividades por Dia</Text>
        <Text style={styles.sectionHint}>Últimos dias dentro do filtro</Text>

        <View style={styles.miniChartRow}>
          {activitiesByDay.length > 0 ? (
            activitiesByDay.map((item) => {
              const height =
                item.count > 0 ? (item.count / maxDayCount) * 110 : 8;

              return (
                <View key={item.date} style={styles.dayBarGroup}>
                  <View style={styles.dayBarArea}>
                    <View style={[styles.dayBar, { height }]} />
                  </View>
                  <Text style={styles.dayBarValue}>{item.count}</Text>
                  <Text style={styles.dayBarLabel}>
                    {toShortDisplayDate(
                      new Date(item.date.split('/').reverse().join('-')).toISOString()
                    )}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyChartText}>Sem dados no período.</Text>
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Progresso por Categoria</Text>

        {categoryProgress.map((item) => (
          <View key={item.category} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleRow}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: categoryColors[item.category] },
                  ]}
                />
                <Text style={styles.categoryTitle}>{item.category}</Text>
              </View>

              <Text style={styles.categoryNumbers}>
                {item.completed}/{item.total}
              </Text>
            </View>

            <View style={styles.progressTrackSmall}>
              <View
                style={[
                  styles.progressFillSmall,
                  {
                    width: `${item.progress}%`,
                    backgroundColor: categoryColors[item.category],
                  },
                ]}
              />
            </View>

            <Text style={styles.categoryProgressText}>
              {item.progress}% de conclusão
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Distribuição por Status</Text>

        <View style={styles.statusChartRow}>
          {statusCounts.map((item) => {
            const barHeight =
              item.count > 0 ? (item.count / maxStatusCount) * 110 : 8;

            return (
              <View key={item.status} style={styles.barGroup}>
                <View style={styles.barArea}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: statusColors[item.status],
                      },
                    ]}
                  />
                </View>

                <Text style={styles.barValue}>{item.count}</Text>
                <Text style={styles.barLabel}>{item.status}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  backgroundColor: string;
  fullWidth?: boolean;
};

function MetricCard({
  title,
  value,
  subtitle,
  backgroundColor,
  fullWidth = false,
}: MetricCardProps) {
  return (
    <View
      style={[
        styles.metricCard,
        fullWidth && styles.metricCardFull,
        { backgroundColor },
      ]}
    >
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    backgroundColor: colors.surfaceSoft,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  filterChipSelected: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: colors.primaryDark,
  },
  customFilterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  customFilterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  customDateInput: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '48%',
    borderRadius: radius.xl,
    padding: spacing.lg,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  metricCardFull: {
    width: '100%',
  },
  metricTitle: {
    fontSize: 14,
    color: colors.text,
  },
  metricValue: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 36,
  },
  metricSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressHeader: {
    marginBottom: spacing.md,
  },
  progressBig: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 42,
  },
  progressCaption: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  miniChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    minHeight: 180,
  },
  dayBarGroup: {
    alignItems: 'center',
    width: 42,
  },
  dayBarArea: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  dayBar: {
    width: 18,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  dayBarValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  dayBarLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyChartText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoryBlock: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  categoryNumbers: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressTrackSmall: {
    height: 10,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: radius.pill,
  },
  categoryProgressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 180,
  },
  barGroup: {
    alignItems: 'center',
    width: 72,
  },
  barArea: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  bar: {
    width: 30,
    borderRadius: 10,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
