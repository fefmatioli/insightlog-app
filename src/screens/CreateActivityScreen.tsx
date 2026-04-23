import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import {
  ActivityCategory,
  ActivityStatus,
} from '../data/mockActivities';
import { useActivities } from '../context/ActivitiesContext';
import { normalizeDateInput, toDisplayDate, toISODate } from '../utils/date';
import ScreenHeader from '@/components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateActivity'>;
type Category = ActivityCategory;
type Status = ActivityStatus;

export default function CreateActivityScreen({
  navigation,
  route,
}: Props) {
  const { activities, addActivity, updateActivity } = useActivities();

  const activityId = route.params?.activityId;

  const activityToEdit = useMemo(
    () => activities.find((item) => item.id === activityId),
    [activities, activityId]
  );

  const isEditing = !!activityToEdit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Estudo');
  const [status, setStatus] = useState<Status>('Pendente');
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title);
      setDescription(activityToEdit.description || '');
      setCategory(activityToEdit.category);
      setStatus(activityToEdit.status);
      setDateTime(toDisplayDate(activityToEdit.createdAt));
    } else {
      setTitle('');
      setDescription('');
      setCategory('Estudo');
      setStatus('Pendente');
      setDateTime(toDisplayDate(new Date().toISOString()));
    }
  }, [activityToEdit]);

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Preencha o título da atividade.');
      return;
    }

    const parsedDate = toISODate(dateTime);

    if (!parsedDate) {
      Alert.alert('Data inválida', 'Informe a data no formato dd/mm/aaaa');
      return;
    }

    const payload = {
      title,
      description,
      category,
      status,
      createdAt: parsedDate,
    };

    if (isEditing && activityToEdit) {
      updateActivity(activityToEdit.id, payload);
    } else {
      addActivity(payload);
    }

    navigation.goBack();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ScreenHeader
          title="Nova Atividade"
          onBack={() => navigation.goBack()}
        />
      </View>

      <Text style={styles.pageSubtitle}>
        {isEditing
          ? 'Atualize os dados da atividade selecionada.'
          : 'Registre uma nova atividade para acompanhar seus dados.'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Leitura de React Native"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.rowWrap}>
          <SelectChip
            label="Estudo"
            selected={category === 'Estudo'}
            onPress={() => setCategory('Estudo')}
            backgroundColor={colors.lavender}
          />
          <SelectChip
            label="Saúde"
            selected={category === 'Saúde'}
            onPress={() => setCategory('Saúde')}
            backgroundColor={colors.mint}
          />
          <SelectChip
            label="Social"
            selected={category === 'Social'}
            onPress={() => setCategory('Social')}
            backgroundColor={colors.rose}
          />
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.rowWrap}>
          <SelectChip
            label="Pendente"
            selected={status === 'Pendente'}
            onPress={() => setStatus('Pendente')}
            backgroundColor="#F3EDF7"
          />
          <SelectChip
            label="Em andamento"
            selected={status === 'Em andamento'}
            onPress={() => setStatus('Em andamento')}
            backgroundColor="#E6F0FF"
          />
          <SelectChip
            label="Concluída"
            selected={status === 'Concluída'}
            onPress={() => setStatus('Concluída')}
            backgroundColor="#E2F4EA"
          />
          <SelectChip
            label="Adiada"
            selected={status === 'Adiada'}
            onPress={() => setStatus('Adiada')}
            backgroundColor="#FCEBDE"
          />
        </View>

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Adicione uma descrição opcional..."
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Data</Text>
        <TextInput
          style={styles.input}
          value={dateTime}
          onChangeText={(value) => setDateTime(normalizeDateInput(value))}
          placeholder="dd/mm/aaaa"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Salvar Alterações' : 'Salvar Atividade'}
          </Text>
        </Pressable>

        {isEditing && activityToEdit?.history?.length ? (
          <>
            <Text style={styles.label}>Histórico</Text>
            <View style={styles.historyBox}>
              {activityToEdit.history.map((entry) => (
                <View key={entry.id} style={styles.historyItem}>
                  <Text style={styles.historyStatus}>{entry.status}</Text>
                  <Text style={styles.historyDate}>
                    {toDisplayDate(entry.changedAt)}
                  </Text>

                  {!!entry.note && (
                    <Text style={styles.historyNote}>
                      Motivo: {entry.note}
                    </Text>
                  )}

                  {!!entry.postponedUntil && (
                    <Text style={styles.historyNote}>
                      Adiada para: {toDisplayDate(entry.postponedUntil)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

type SelectChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  backgroundColor: string;
};

function SelectChip({
  label,
  selected,
  onPress,
  backgroundColor,
}: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor },
        selected && styles.chipSelected,
      ]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  rowWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  chipSelected: {
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  historyBox: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  historyItem: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  historyStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  historyNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});