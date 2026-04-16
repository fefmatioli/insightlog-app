import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockActivities, Activity } from '../data/mockActivities';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'Activities'>;

const categoryColors = {
  Estudo: colors.lavender,
  Saúde: colors.mint,
  Social: colors.rose,
};

export default function ActivitiesScreen({ navigation }: Props) {
  const totalActivities = mockActivities.length;
  const todayActivities = 2;

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
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityCategory}>{item.category}</Text>
        </View>
        <Text style={styles.activityDate}>{item.dateLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>InsightLog</Text>
      <Text style={styles.subtitle}>Monitore suas atividades com leveza</Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchText}>Pesquisar atividades...</Text>
      </View>

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
        data={mockActivities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  searchBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchText: {
    color: colors.textSecondary,
    fontSize: 14,
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
    alignItems: 'center',
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
  },
  activityContent: {
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
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
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