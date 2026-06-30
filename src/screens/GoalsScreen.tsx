import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../navigation/AppNavigator';
import { useActivities } from '../context/ActivitiesContext';
import { useCategories } from '../context/CategoriesContext';
import { useGoals } from '../context/GoalsContext';
import { GoalPeriod } from '../services/goalDatabase';
import { countCompletedInPeriod } from '../utils/goals';
import { Colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useThemedColors, useThemedStyles } from '../theme/ThemeContext';
import { readableTextOn } from '../theme/contrast';
import ScreenHeader from '@/components/ScreenHeader';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Goals'>;

export default function GoalsScreen({ navigation }: Props) {
  const { categories } = useCategories();
  const { goals, saveGoal, removeGoal } = useGoals();
  const { activities } = useActivities();
  const colors = useThemedColors();
  const styles = useThemedStyles(createStyles);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPeriod, setDraftPeriod] = useState<GoalPeriod>('week');
  const [draftTarget, setDraftTarget] = useState('');
  const [error, setError] = useState('');

  const goalByCategory = useMemo(() => {
    const map = new Map<string, (typeof goals)[number]>();
    for (const g of goals) map.set(g.categoryId, g);
    return map;
  }, [goals]);

  function startEdit(categoryId: string) {
    const existing = goalByCategory.get(categoryId);
    setDraftPeriod(existing?.period ?? 'week');
    setDraftTarget(existing ? String(existing.target) : '');
    setError('');
    setEditingId(categoryId);
  }

  async function handleSave(categoryId: string) {
    const target = Number(draftTarget);
    if (!Number.isInteger(target) || target <= 0) {
      setError('Informe um número inteiro maior que zero.');
      return;
    }
    try {
      await saveGoal(categoryId, draftPeriod, target);
      setEditingId(null);
    } catch {
      setError('Não foi possível salvar.');
    }
  }

  function handleRemove(categoryId: string, label: string) {
    Alert.alert('Remover meta', `Remover a meta de "${label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => void removeGoal(categoryId),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Metas" onBack={() => navigation.goBack()} />
        <Text style={styles.pageSubtitle}>
          Defina uma meta semanal ou mensal de atividades concluídas para cada
          categoria.
        </Text>

        {categories.map((category) => {
          const goal = goalByCategory.get(category.id);
          const isEditing = editingId === category.id;
          const done = goal
            ? countCompletedInPeriod(activities, category.id, goal.period)
            : 0;
          const percent =
            goal && goal.target > 0
              ? Math.min(100, Math.round((done / goal.target) * 100))
              : 0;

          return (
            <View key={category.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[styles.badge, { backgroundColor: category.color }]}
                >
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={readableTextOn(category.color)}
                  />
                </View>
                <Text style={styles.cardTitle}>{category.name}</Text>
                {!isEditing && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => startEdit(category.id)}
                  >
                    <Text style={styles.actionLink}>
                      {goal ? 'Editar' : 'Definir'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {isEditing ? (
                <>
                  <Text style={styles.label}>Período</Text>
                  <View style={styles.rowWrap}>
                    {(['week', 'month'] as GoalPeriod[]).map((p) => (
                      <Pressable
                        key={p}
                        onPress={() => setDraftPeriod(p)}
                        style={[
                          styles.chip,
                          draftPeriod === p && styles.chipSelected,
                        ]}
                      >
                        <Text style={styles.chipText}>
                          {p === 'week' ? 'Por semana' : 'Por mês'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.label}>Quantas atividades concluídas?</Text>
                  <TextInput
                    style={styles.input}
                    value={draftTarget}
                    onChangeText={setDraftTarget}
                    placeholder="Ex.: 5"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                  />

                  {!!error && <Text style={styles.errorText}>{error}</Text>}

                  <View style={styles.rowEnd}>
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setEditingId(null)}
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.saveBtn}
                      onPress={() => void handleSave(category.id)}
                    >
                      <Text style={styles.saveBtnText}>Salvar</Text>
                    </Pressable>
                  </View>
                </>
              ) : goal ? (
                <>
                  <Text style={styles.goalLine}>
                    {done} / {goal.target} concluída(s){' '}
                    {goal.period === 'week' ? 'esta semana' : 'este mês'}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: category.color,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.rowEnd}>
                    <Pressable
                      hitSlop={6}
                      onPress={() => handleRemove(category.id, category.name)}
                    >
                      <Text style={styles.removeText}>Remover meta</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>Sem meta definida.</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
  },
  chipSelected: {
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  errorText: { fontSize: 13, color: '#C0392B', fontWeight: '500' },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
  },
  goalLine: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C0392B',
  },
  });
}
