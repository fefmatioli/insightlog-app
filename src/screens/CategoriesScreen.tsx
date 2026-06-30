import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../navigation/AppNavigator';
import { Category, CATEGORY_COLOR_PRESETS, CATEGORY_ICON_PRESETS } from '../data/categories';
import { useCategories } from '../context/CategoriesContext';
import { Colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useThemedColors, useThemedStyles } from '../theme/ThemeContext';
import { readableTextOn } from '../theme/contrast';
import ScreenHeader from '@/components/ScreenHeader';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Categories'>;

type EditingState =
  | { mode: 'idle' }
  | { mode: 'create' }
  | { mode: 'edit'; id: string };

export default function CategoriesScreen({ navigation }: Props) {
  const { categories, addCategory, updateCategory, removeCategory } =
    useCategories();
  const colors = useThemedColors();
  const styles = useThemedStyles(createStyles);

  const [editing, setEditing] = useState<EditingState>({ mode: 'idle' });
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLOR_PRESETS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICON_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const editingCategory = useMemo(
    () =>
      editing.mode === 'edit'
        ? categories.find((c) => c.id === editing.id)
        : undefined,
    [editing, categories]
  );

  function openCreate() {
    setName('');
    setColor(CATEGORY_COLOR_PRESETS[0]);
    setIcon(CATEGORY_ICON_PRESETS[0]);
    setError('');
    setEditing({ mode: 'create' });
  }

  function openEdit(category: Category) {
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon);
    setError('');
    setEditing({ mode: 'edit', id: category.id });
  }

  function cancelEdit() {
    setEditing({ mode: 'idle' });
    setError('');
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Informe um nome para a categoria.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      if (editing.mode === 'edit') {
        await updateCategory(editing.id, { name, color, icon });
      } else {
        await addCategory({ name, color, icon });
      }
      setEditing({ mode: 'idle' });
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleRemove(category: Category) {
    Alert.alert(
      'Excluir categoria',
      `Deseja excluir "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCategory(category.id);
            } catch (err: unknown) {
              const code = (err as { code?: string }).code ?? '';
              const count = (err as { count?: number }).count ?? 0;
              const message =
                code === 'categories/in-use'
                  ? `Existem ${count} atividade(s) nesta categoria. Mova-as antes de excluir.`
                  : code === 'categories/cannot-remove-last'
                    ? 'Você precisa de pelo menos uma categoria.'
                    : 'Não foi possível excluir. Tente novamente.';
              Alert.alert('Não foi possível excluir', message);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader title="Categorias" onBack={() => navigation.goBack()} />
        <Text style={styles.pageSubtitle}>
          Crie e edite categorias com nome, cor e ícone próprios.
        </Text>

        {editing.mode !== 'idle' ? (
          <View style={styles.card}>
            <Text style={styles.editingTitle}>
              {editing.mode === 'edit' ? 'Editar categoria' : 'Nova categoria'}
            </Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Trabalho"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Cor</Text>
            <View style={styles.swatchRow}>
              {CATEGORY_COLOR_PRESETS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    color === c && styles.swatchSelected,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.label}>Ícone</Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICON_PRESETS.map((i) => (
                <Pressable
                  key={i}
                  onPress={() => setIcon(i)}
                  style={[
                    styles.iconChoice,
                    icon === i && styles.iconChoiceSelected,
                  ]}
                >
                  <Ionicons
                    name={i as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={icon === i ? colors.primaryDark : colors.text}
                  />
                </Pressable>
              ))}
            </View>

            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Pré-visualização</Text>
              <View style={styles.previewChip}>
                <View
                  style={[styles.previewBadge, { backgroundColor: color }]}
                >
                  <Ionicons
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={readableTextOn(color)}
                  />
                </View>
                <Text style={styles.previewText}>{name || 'Sem nome'}</Text>
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.rowEnd}>
              <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                onPress={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={openCreate}>
            <Ionicons name="add" size={20} color={colors.primaryDark} />
            <Text style={styles.addButtonText}>Nova categoria</Text>
          </Pressable>
        )}

        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isBeingEdited =
              editing.mode === 'edit' && editing.id === item.id;
            if (isBeingEdited) return null;
            return (
              <View style={styles.categoryRow}>
                <View
                  style={[styles.categoryBadge, { backgroundColor: item.color }]}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={readableTextOn(item.color)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  {item.isDefault && (
                    <Text style={styles.categoryMeta}>Categoria padrão</Text>
                  )}
                </View>
                <Pressable hitSlop={8} onPress={() => openEdit(item)}>
                  <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  hitSlop={8}
                  style={{ marginLeft: spacing.md }}
                  onPress={() => handleRemove(item)}
                >
                  <Ionicons name="trash" size={18} color="#C0392B" />
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  editingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.primaryDark,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconChoiceSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  preview: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    fontWeight: '500',
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
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
    minWidth: 72,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.surfaceSoft,
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  listContent: { paddingBottom: spacing.xxl },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  categoryMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  });
}
