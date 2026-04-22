import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Activity } from '../data/mockActivities';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useActivities } from '../context/ActivitiesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Activities'>;

const categoryColors = {
  Estudo: colors.lavender,
  Saúde: colors.mint,
  Social: colors.rose,
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return (
    date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }) +
    ' • ' +
    date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function ActivitiesScreen({ navigation }: Props) {
  const { activities, removeActivity } = useActivities();
  const [search, setSearch] = useState('');

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();

    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!term) return sortedActivities;

    return sortedActivities.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(term);
      const categoryMatch = item.category.toLowerCase().includes(term);
      const descriptionMatch = item.description?.toLowerCase().includes(term);

      return titleMatch || categoryMatch || descriptionMatch;
    });
  }, [activities, search]);

  const totalActivities = activities.length;
  const todayActivities = activities.filter((item) => isToday(item.createdAt)).length;

  function renderItem({ item }: { item: Activity }) {
    return (
      <View style={styles.activityCard}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: categoryColors[item.category] },
          ]}
        />

        <View style={styles.activityContent}>
          <View style={styles.topRow}>
            <View style={styles.textBlock}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityCategory}>{item.category}</Text>
            </View>

            <Text style={styles.activityDate}>{formatDate(item.createdAt)}</Text>
          </View>

          {!!item.description && (
            <Text style={styles.activityDescription}>{item.description}</Text>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              onPress={() =>
                navigation.navigate('CreateActivity', {
                  activityId: item.id,
                } as never)
              }
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => removeActivity(item.id)}
            >
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.appTitle}>InsightLog</Text>
          <Text style={styles.subtitle}>Monitore suas atividades com leveza</Text>
        </View>

        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>IL</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar atividades..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: colors.primarySoft }]}>
          <Text style={styles.metricLabel}>Total</Text>
          <Text style={styles.metricValue}>{totalActivities}</Text>
          <Text style={styles.metricCaption}>atividades</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.mint }]}>
          <Text style={styles.metricLabel}>Hoje</Text>
          <Text style={styles.metricValue}>{todayActivities}</Text>
          <Text style={styles.metricCaption}>registros</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Atividades recentes</Text>
        <Pressable onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.linkText}>Ver métricas</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nada encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Tente buscar por outro termo.
            </Text>
          </View>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('CreateActivity')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 16,
  },
  searchInput: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  metricCaption: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  linkText: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    marginRight: spacing.md,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  textBlock: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activityCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  activityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 86,
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  editButton: {
    backgroundColor: colors.primarySoft,
  },
  deleteButton: {
    backgroundColor: '#FBE4E3',
  },
  editButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#C94B46',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: colors.surface,
    lineHeight: 30,
  },
});