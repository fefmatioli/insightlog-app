import { useState } from 'react';
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

export default function CreateActivityScreen({ navigation }: Props) {
  const { addActivity } = useActivities();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Estudo');

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Preencha o título da atividade.');
      return;
    }

    addActivity({
      title,
      description,
      category,
    });

    setTitle('');
    setDescription('');
    setCategory('Estudo');

    navigation.goBack();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.header}>
        <Text style={styles.pageTitle}>Nova Atividade</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
      </View>

      <Text style={styles.pageSubtitle}>
        Registre uma nova atividade para acompanhar seus dados.
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
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>Gerada automaticamente ao salvar</Text>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Salvar Atividade</Text>
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
  dateBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  dateText: {
    color: colors.text,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});