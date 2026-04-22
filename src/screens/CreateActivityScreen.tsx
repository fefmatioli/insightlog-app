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
import { ActivityCategory } from '../data/mockActivities';
import { useActivities } from '../context/ActivitiesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateActivity'>;
type Category = ActivityCategory;

function formatDateTimeLocal(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function parseDateTimeBR(value: string) {
  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
  );

  if (!match) return null;

  const [, day, month, year, hour, minute] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  if (isNaN(date.getTime())) return null;

  return date.toISOString();
}

export default function CreateActivityScreen({ navigation, route }: Props) {
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
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title);
      setDescription(activityToEdit.description || '');
      setCategory(activityToEdit.category);
      setDateTime(formatDateTimeLocal(activityToEdit.createdAt));
    } else {
      setTitle('');
      setDescription('');
      setCategory('Estudo');
      setDateTime(formatDateTimeLocal(new Date().toISOString()));
    }
  }, [activityToEdit]);

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Preencha o título da atividade.');
      return;
    }

    const parsedDate = parseDateTimeBR(dateTime);

    if (!parsedDate) {
      Alert.alert(
        'Data inválida',
        'Informe a data no formato dd/mm/aaaa hh:mm'
      );
      return;
    }

    const payload = {
      title,
      description,
      category,
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
        <Text style={styles.pageTitle}>
          {isEditing ? 'Editar Atividade' : 'Nova Atividade'}
        </Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
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
        <View style={styles.categoryRow}>
          <CategoryButton
            label="Estudo"
            selected={category === 'Estudo'}
            onPress={() => setCategory('Estudo')}
            color={colors.lavender}
          />
          <CategoryButton
            label="Saúde"
            selected={category === 'Saúde'}
            onPress={() => setCategory('Saúde')}
            color={colors.mint}
          />
          <CategoryButton
            label="Social"
            selected={category === 'Social'}
            onPress={() => setCategory('Social')}
            color={colors.rose}
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

        <Text style={styles.label}>Data e Hora</Text>
        <TextInput
          style={styles.input}
          value={dateTime}
          onChangeText={setDateTime}
          placeholder="dd/mm/aaaa hh:mm"
          placeholderTextColor={colors.textSecondary}
        />

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Salvar Alterações' : 'Salvar Atividade'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

type CategoryButtonProps = {
  label: Category;
  selected: boolean;
  onPress: () => void;
  color: string;
};

function CategoryButton({
  label,
  selected,
  onPress,
  color,
}: CategoryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.categoryButton,
        { backgroundColor: color },
        selected && styles.categoryButtonSelected,
      ]}
    >
      <Text style={styles.categoryButtonText}>{label}</Text>
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
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  categoryButtonSelected: {
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  categoryButtonText: {
    color: colors.text,
    fontWeight: '600',
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
});