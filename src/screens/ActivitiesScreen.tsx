import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { Activity, ActivityCategory, ActivityStatus } from '../data/mockActivities';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useActivities } from '../context/ActivitiesContext';
import { isToday, normalizeDateInput, toDisplayDate, toISODate } from '../utils/date';
import AppBrand from '../components/AppBrand';

type Props = NativeStackScreenProps<RootStackParamList, 'Activities'>;
type StatusFilter = ActivityStatus | 'Todas';
type CategoryFilter = ActivityCategory | 'Todas';
type DateFilter = 'Todas' | 'Hoje' | '7 dias' | '30 dias' | 'Personalizado';

const categoryColors: Record<ActivityCategory, string> = {
  Estudo: colors.lavender,
  Saúde: colors.mint,
  Social: colors.rose,
};

const statusStyles: Record<
  ActivityStatus,
  { backgroundColor: string; textColor: string }
> = {
  Pendente: {
    backgroundColor: '#EEE8F5',
    textColor: '#6A5E78',
  },
  'Em andamento': {
    backgroundColor: '#E3EEFF',
    textColor: '#3B68A5',
  },
  Concluída: {
    backgroundColor: '#DFF2E7',
    textColor: '#2F7D57',
  },
  Adiada: {
    backgroundColor: '#FBE9DF',
    textColor: '#A35E35',
  },
};

const statusOptions: ActivityStatus[] = [
  'Pendente',
  'Em andamento',
  'Concluída',
  'Adiada',
];

const statusFilterOptions: StatusFilter[] = [
  'Todas',
  'Pendente',
  'Em andamento',
  'Concluída',
  'Adiada',
];

const categoryFilterOptions: CategoryFilter[] = [
  'Todas',
  'Estudo',
  'Saúde',
  'Social',
];

const dateFilterOptions: DateFilter[] = [
  'Todas',
  'Hoje',
  '7 dias',
  '30 dias',
  'Personalizado',
];

function getLatestPostponedEntry(activity: Activity) {
  const postponedEntries = activity.history.filter(
    (entry) => entry.status === 'Adiada'
  );

  if (postponedEntries.length === 0) return null;

  return postponedEntries[postponedEntries.length - 1];
}

function getReminderLabel(activity: Activity) {
  if (!activity.reminderEnabled) return null;

  if (!activity.activityTime) {
    return 'Lembrete 09:00';
  }

  if (activity.reminderOffsetMinutes === undefined) {
    return `Lembrete ${activity.activityTime}`;
  }

  if (activity.reminderOffsetMinutes === 0) {
    return `No horario ${activity.activityTime}`;
  }

  if (activity.reminderOffsetMinutes < 60) {
    return `${activity.reminderOffsetMinutes} min antes`;
  }

  const hours = activity.reminderOffsetMinutes / 60;
  return `${hours}h antes`;
}

export default function ActivitiesScreen({ navigation }: Props) {
  const { activities, removeActivity, updateActivityStatus } = useActivities();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todas');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Todas');
  const [dateFilter, setDateFilter] = useState<DateFilter>('Todas');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus>('Pendente');
  const [postponeNote, setPostponeNote] = useState('');
  const [postponeUntil, setPostponeUntil] = useState('');
  const longPressHandledRef = useRef<string | null>(null);

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();
    const customStartISO =
      dateFilter === 'Personalizado' ? toISODate(customStartDate) : null;
    const customEndISO =
      dateFilter === 'Personalizado' ? toISODate(customEndDate) : null;

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedActivities.filter((item) => {
      const createdAt = new Date(item.createdAt);
      const titleMatch = item.title.toLowerCase().includes(term);
      const itemCategoryMatch = item.category.toLowerCase().includes(term);
      const descriptionMatch =
        item.description?.toLowerCase().includes(term) ?? false;
      const itemStatusMatch = item.status.toLowerCase().includes(term);

      const matchesSearch =
        !term ||
        titleMatch ||
        itemCategoryMatch ||
        descriptionMatch ||
        itemStatusMatch;

      const matchesStatus =
        statusFilter === 'Todas' || item.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'Todas' || item.category === categoryFilter;

      let matchesDate = true;

      if (dateFilter === 'Hoje') {
        matchesDate = isToday(item.createdAt);
      } else if (dateFilter === '7 dias') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        matchesDate = createdAt >= sevenDaysAgo && createdAt <= now;
      } else if (dateFilter === '30 dias') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        matchesDate = createdAt >= thirtyDaysAgo && createdAt <= now;
      } else if (
        dateFilter === 'Personalizado' &&
        customStartISO &&
        customEndISO
      ) {
        const startDate = new Date(customStartISO);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(customEndISO);
        endDate.setHours(23, 59, 59, 999);

        matchesDate = createdAt >= startDate && createdAt <= endDate;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [
    activities,
    search,
    statusFilter,
    categoryFilter,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const totalActivities = filteredActivities.length;
  const todayActivities = filteredActivities.filter((item) =>
    isToday(item.createdAt)
  ).length;
  const hasActiveFilters =
    !!search.trim() ||
    statusFilter !== 'Todas' ||
    categoryFilter !== 'Todas' ||
    dateFilter !== 'Todas';
  const activeFilterCount = [
    statusFilter !== 'Todas',
    categoryFilter !== 'Todas',
    dateFilter !== 'Todas',
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch('');
    setStatusFilter('Todas');
    setCategoryFilter('Todas');
    setDateFilter('Todas');
    setCustomStartDate('');
    setCustomEndDate('');
  }

  function openStatusModal(activity: Activity) {
    setSelectedActivity(activity);
    setSelectedStatus(activity.status);

    const latestPostponedEntry = getLatestPostponedEntry(activity);

    if (activity.status === 'Adiada' && latestPostponedEntry) {
      setPostponeNote(latestPostponedEntry.note || '');

      if (latestPostponedEntry.postponedUntil) {
        setPostponeUntil(toDisplayDate(latestPostponedEntry.postponedUntil));
      } else {
        setPostponeUntil('');
      }
    } else {
      setPostponeNote('');
      setPostponeUntil('');
    }

    setIsStatusModalVisible(true);
  }

  function closeStatusModal() {
    setIsStatusModalVisible(false);
    setSelectedActivity(null);
    setPostponeNote('');
    setPostponeUntil('');
  }

  function confirmDeleteActivity(activity: Activity) {
    Alert.alert(
      'Excluir atividade',
      `Deseja realmente excluir "${activity.title}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void removeActivity(activity.id);
          },
        },
      ]
    );
  }

  function openActivityActions(activity: Activity) {
    Alert.alert(
      activity.title,
      'Escolha uma ação para esta atividade.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => confirmDeleteActivity(activity),
        },
      ]
    );
  }

  async function handleConfirmStatusUpdate() {
    if (!selectedActivity) return;

    let note =
      selectedStatus === 'Adiada'
        ? postponeNote.trim() || 'Atividade adiada'
        : `Status alterado para ${selectedStatus}`;

    let postponedUntilISO: string | undefined;

    if (selectedStatus === 'Adiada') {
      const parsedPostponeDate = toISODate(postponeUntil);

      if (!parsedPostponeDate) {
        Alert.alert('Data inválida', 'Informe uma nova data válida para o adiamento.');
        return;
      }

      postponedUntilISO = parsedPostponeDate;
      note = postponeNote.trim() || 'Atividade adiada para outra data';
    }

    await updateActivityStatus(
      selectedActivity.id,
      selectedStatus,
      note,
      postponedUntilISO
    );

    closeStatusModal();
  }

  function renderItem({ item }: { item: Activity }) {
    const currentStatusStyle = statusStyles[item.status];
    const isCompleted = item.status === 'Concluída';
    const latestPostponedEntry = getLatestPostponedEntry(item);
    const reminderLabel = getReminderLabel(item);

    return (
      <Pressable
        onPress={() => {
          if (longPressHandledRef.current === item.id) {
            longPressHandledRef.current = null;
            return;
          }

          navigation.navigate('CreateActivity', {
            activityId: item.id,
          });
        }}
        onLongPress={() => {
          longPressHandledRef.current = item.id;
          openActivityActions(item);
        }}
        style={({ pressed }) => [
          styles.activityCard,
          isCompleted && styles.completedCard,
          pressed && styles.activityCardPressed,
        ]}
      >
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: categoryColors[item.category] },
          ]}
        />

        <View style={styles.activityContent}>
          <View style={styles.topRow}>
            <View style={styles.textBlock}>
              <Text
                style={[
                  styles.activityTitle,
                  isCompleted && styles.completedTitle,
                ]}
              >
                {item.title}
              </Text>
              <Text style={styles.activityCategory}>{item.category}</Text>
            </View>

            <Text style={styles.activityDate}>
              {toDisplayDate(item.createdAt)}
              {item.activityTime ? `\n${item.activityTime}` : ''}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Pressable
              onPress={() => openStatusModal(item)}
              style={[
                styles.statusBadge,
                { backgroundColor: currentStatusStyle.backgroundColor },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: currentStatusStyle.textColor },
                ]}
              >
                {item.status}
              </Text>
            </Pressable>

            {reminderLabel ? (
              <View style={styles.reminderBadge}>
                <Text style={styles.reminderBadgeText}>{reminderLabel}</Text>
              </View>
            ) : null}
          </View>

          {!!item.description && (
            <Text style={styles.activityDescription}>{item.description}</Text>
          )}

          {item.status === 'Adiada' && latestPostponedEntry && (
            <View style={styles.postponeInfoBox}>
              {!!latestPostponedEntry.note && (
                <Text style={styles.postponeInfoText}>
                  Motivo: {latestPostponedEntry.note}
                </Text>
              )}

              {!!latestPostponedEntry.postponedUntil && (
                <Text style={styles.postponeInfoText}>
                  Adiada para: {toDisplayDate(latestPostponedEntry.postponedUntil)}
                </Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <AppBrand
          subtitle={`${totalActivities} ${totalActivities === 1 ? 'atividade' : 'atividades'}`}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar atividades..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filtersBar}>
          <Pressable
            style={styles.filtersButton}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Text style={styles.filtersButtonText}>
              {activeFilterCount > 0
                ? `Filtros (${activeFilterCount})`
                : 'Filtrar resultados'}
            </Text>
          </Pressable>

          {hasActiveFilters ? (
            <Pressable onPress={resetFilters}>
              <Text style={styles.clearFiltersText}>Limpar</Text>
            </Pressable>
          ) : null}
        </View>

        {activeFilterCount > 0 ? (
          <View style={styles.activeFiltersRow}>
            {statusFilter !== 'Todas' ? (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterText}>{statusFilter}</Text>
              </View>
            ) : null}

            {categoryFilter !== 'Todas' ? (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterText}>{categoryFilter}</Text>
              </View>
            ) : null}

            {dateFilter !== 'Todas' ? (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterText}>
                  {dateFilter === 'Personalizado' &&
                  customStartDate &&
                  customEndDate
                    ? `${customStartDate} - ${customEndDate}`
                    : dateFilter}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

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
        />

        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('CreateActivity')}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>

        <Modal
          visible={isFilterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.filtersHeader}>
                <Text style={styles.modalTitle}>Filtrar atividades</Text>
                {hasActiveFilters ? (
                  <Pressable onPress={resetFilters}>
                    <Text style={styles.clearFiltersText}>Limpar</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.modalSubtitle}>
                Refine a lista sem ocupar a tela principal.
              </Text>

              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptionsRow}>
                {statusFilterOptions.map((option) => {
                  const selected = statusFilter === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => setStatusFilter(option)}
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
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.filterLabel}>Categoria</Text>
              <View style={styles.filterOptionsRow}>
                {categoryFilterOptions.map((option) => {
                  const selected = categoryFilter === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => setCategoryFilter(option)}
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
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.filterLabel}>Data</Text>
              <View style={styles.filterOptionsRow}>
                {dateFilterOptions.map((option) => {
                  const selected = dateFilter === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => setDateFilter(option)}
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
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {dateFilter === 'Personalizado' ? (
                <View style={styles.customDateRow}>
                  <TextInput
                    style={[styles.searchInput, styles.customDateInput]}
                    placeholder="Início: dd/mm/aaaa"
                    placeholderTextColor={colors.textSecondary}
                    value={customStartDate}
                    onChangeText={(value) =>
                      setCustomStartDate(normalizeDateInput(value))
                    }
                    keyboardType="numeric"
                  />

                  <TextInput
                    style={[styles.searchInput, styles.customDateInput]}
                    placeholder="Fim: dd/mm/aaaa"
                    placeholderTextColor={colors.textSecondary}
                    value={customEndDate}
                    onChangeText={(value) =>
                      setCustomEndDate(normalizeDateInput(value))
                    }
                    keyboardType="numeric"
                  />
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setIsFilterModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Fechar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isStatusModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeStatusModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Alterar status</Text>
              <Text style={styles.modalSubtitle}>
                Selecione o novo status da atividade.
              </Text>

              <View style={styles.modalOptions}>
                {statusOptions.map((status) => {
                  const visual = statusStyles[status];
                  const isSelected = selectedStatus === status;

                  return (
                    <Pressable
                      key={status}
                      onPress={() => setSelectedStatus(status)}
                      style={[
                        styles.modalStatusOption,
                        { backgroundColor: visual.backgroundColor },
                        isSelected && styles.modalStatusOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalStatusOptionText,
                          { color: visual.textColor },
                        ]}
                      >
                        {status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedStatus === 'Adiada' ? (
                <>
                  <Text style={styles.noteLabel}>Motivo do adiamento</Text>
                  <TextInput
                    style={[styles.searchInput, styles.noteInput]}
                    placeholder="Ex.: sem tempo hoje, retomar amanhã"
                    placeholderTextColor={colors.textSecondary}
                    value={postponeNote}
                    onChangeText={setPostponeNote}
                    multiline
                  />

                  <Text style={styles.noteLabel}>Adiada para</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor={colors.textSecondary}
                    value={postponeUntil}
                    onChangeText={(value) =>
                      setPostponeUntil(normalizeDateInput(value))
                    }
                    keyboardType="numeric"
                  />
                </>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={closeStatusModal}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={() => void handleConfirmStatusUpdate()}
                >
                  <Text style={styles.modalConfirmText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
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
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  filtersButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  activeFilterPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  customDateRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customDateInput: {
    marginBottom: 0,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryDark,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.primaryDark,
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
    paddingBottom: 120,
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
  activityCardPressed: {
    opacity: 0.86,
  },
  completedCard: {
    opacity: 0.94,
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
  completedTitle: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  activityCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 86,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reminderBadge: {
    backgroundColor: '#FFF6D9',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  reminderBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D6C14',
  },
  activityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  postponeInfoBox: {
    backgroundColor: '#FDF3EC',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  postponeInfoText: {
    fontSize: 12,
    color: '#8A5A3C',
    marginBottom: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 28, 45, 0.35)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalStatusOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  modalStatusOptionSelected: {
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  modalStatusOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  modalCancelButton: {
    backgroundColor: colors.surfaceSoft,
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: colors.surface,
    fontWeight: '700',
  },
});
