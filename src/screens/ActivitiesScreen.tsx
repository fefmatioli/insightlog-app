import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Activity, ActivityStatus } from '../data/mockActivities';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useActivities } from '../context/ActivitiesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Activities'>;

const categoryColors = {
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

function formatDateTimeLocal(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatDateTimeInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 8);

  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
}

function parseDateBR(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) return null;

  const [, day, month, year] = match;

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (isNaN(date.getTime())) return null;

  return date.toISOString();
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

function getLatestPostponedEntry(activity: Activity) {
  const postponedEntries = activity.history.filter(
    (entry) => entry.status === 'Adiada'
  );

  if (postponedEntries.length === 0) return null;

  return postponedEntries[postponedEntries.length - 1];
}

export default function ActivitiesScreen({ navigation }: Props) {
  const { activities, removeActivity, updateActivityStatus } = useActivities();

  const [search, setSearch] = useState('');
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus>('Pendente');
  const [postponeNote, setPostponeNote] = useState('');
  const [postponeUntil, setPostponeUntil] = useState('');

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!term) return sortedActivities;

    return sortedActivities.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(term);
      const categoryMatch = item.category.toLowerCase().includes(term);
      const descriptionMatch = item.description?.toLowerCase().includes(term);
      const statusMatch = item.status.toLowerCase().includes(term);

      return titleMatch || categoryMatch || descriptionMatch || statusMatch;
    });
  }, [activities, search]);

  const totalActivities = activities.length;
  const todayActivities = activities.filter((item) => isToday(item.createdAt)).length;

  function openStatusModal(activity: Activity) {
    setSelectedActivity(activity);
    setSelectedStatus(activity.status);

    const latestPostponedEntry = getLatestPostponedEntry(activity);

    if (activity.status === 'Adiada' && latestPostponedEntry) {
      setPostponeNote(latestPostponedEntry.note || '');

      if (latestPostponedEntry.postponedUntil) {
        setPostponeUntil(
          formatDateTimeLocal(latestPostponedEntry.postponedUntil)
        );
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

  function handleConfirmStatusUpdate() {
    if (!selectedActivity) return;

    let note =
      selectedStatus === 'Adiada'
        ? postponeNote.trim() || 'Atividade adiada'
        : `Status alterado para ${selectedStatus}`;

    let postponedUntilISO: string | undefined = undefined;

    if (selectedStatus === 'Adiada') {
      const parsedPostponeDate = parseDateBR(postponeUntil);

      if (!parsedPostponeDate) {
        return;
      }

      postponedUntilISO = parsedPostponeDate;
      note = postponeNote.trim() || 'Atividade adiada para outra data';
    }

    updateActivityStatus(
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

    return (
      <View style={[styles.activityCard, isCompleted && styles.completedCard]}>
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

            <Text style={styles.activityDate}>{formatDate(item.createdAt)}</Text>
          </View>

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
                  Adiada para:{' '}
                  {formatDateTimeLocal(latestPostponedEntry.postponedUntil)}
                </Text>
              )}
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              onPress={() =>
                navigation.navigate('CreateActivity', {
                  activityId: item.id,
                })
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
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('CreateActivity')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

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

            {selectedStatus === 'Adiada' && (
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
                    setPostponeUntil(formatDateTimeInput(value))
                  }
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeStatusModal}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmStatusUpdate}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  completedCard: {
    opacity: 0.92,
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
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  postponeInfoBox: {
    backgroundColor: '#FDF3EC',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  postponeInfoText: {
    fontSize: 12,
    color: '#8A5A3C',
    marginBottom: 2,
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