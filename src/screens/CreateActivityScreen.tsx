import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useThemedColors, useThemedStyles } from '../theme/ThemeContext';
import {
  ActivityCategory,
  ActivityStatus,
} from '../data/mockActivities';
import { useActivities } from '../context/ActivitiesContext';
import { useCategories } from '../context/CategoriesContext';
import {
  isValidTime,
  normalizeDateInput,
  normalizeTimeInput,
  toDisplayDate,
  toISODate,
} from '../utils/date';
import ScreenHeader from '@/components/ScreenHeader';
import ImagePickerField from '@/components/ImagePickerField';
import StarRating from '@/components/StarRating';
import { getCurrentLocation, CapturedLocation } from '@/services/location';
import { readableTextOn } from '@/theme/contrast';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateActivity'>;
type Category = ActivityCategory;
type Status = ActivityStatus;

const reminderOffsetOptions = [
  { label: 'No horario', value: 0 },
  { label: '15 min antes', value: 15 },
  { label: '30 min antes', value: 30 },
  { label: '1h antes', value: 60 },
  { label: '2h antes', value: 120 },
] as const;

export default function CreateActivityScreen({
  navigation,
  route,
}: Props) {
  const { activities, addActivity, updateActivity } = useActivities();
  const { categories } = useCategories();
  const colors = useThemedColors();
  const styles = useThemedStyles(createStyles);

  const activityId = route.params?.activityId;

  const activityToEdit = useMemo(
    () => activities.find((item) => item.id === activityId),
    [activities, activityId]
  );

  const isEditing = !!activityToEdit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(categories[0]?.id ?? 'Estudo');
  const [status, setStatus] = useState<Status>('Pendente');
  const [dateTime, setDateTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [activityTime, setActivityTime] = useState('');
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState<
    number | undefined
  >(undefined);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [rating, setRating] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title);
      setDescription(activityToEdit.description || '');
      setCategory(activityToEdit.category);
      setStatus(activityToEdit.status);
      setDateTime(toDisplayDate(activityToEdit.createdAt));
      setReminderEnabled(activityToEdit.reminderEnabled);
      setActivityTime(activityToEdit.activityTime || '');
      setReminderOffsetMinutes(activityToEdit.reminderOffsetMinutes);
      setPhotoUri(activityToEdit.photoUri ?? null);
      setLocation(
        activityToEdit.latitude != null && activityToEdit.longitude != null
          ? {
              latitude: activityToEdit.latitude,
              longitude: activityToEdit.longitude,
              label: activityToEdit.locationLabel ?? 'Local registrado',
            }
          : null
      );
      setRating(activityToEdit.rating);
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0]?.id ?? 'Estudo');
      setStatus('Pendente');
      setDateTime(toDisplayDate(new Date().toISOString()));
      setReminderEnabled(false);
      setActivityTime('');
      setReminderOffsetMinutes(undefined);
      setPhotoUri(null);
      setLocation(null);
      setRating(undefined);
    }
  }, [activityToEdit, categories]);

  async function handleCaptureLocation() {
    setIsLocating(true);
    try {
      const captured = await getCurrentLocation();
      setLocation(captured);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      Alert.alert(
        'Localização indisponível',
        code === 'LOCATION_PERMISSION_DENIED'
          ? 'Permita o acesso à localização para registrar onde a atividade acontece.'
          : 'Não foi possível obter sua localização agora. Tente novamente.'
      );
    } finally {
      setIsLocating(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Preencha o título da atividade.');
      return;
    }

    const parsedDate = toISODate(dateTime);

    if (!parsedDate) {
      Alert.alert('Data inválida', 'Informe a data no formato dd/mm/aaaa.');
      return;
    }

    if (activityTime && !isValidTime(activityTime)) {
      Alert.alert('Horario invalido', 'Informe o horario no formato HH:mm.');
      return;
    }

    const payload = {
      title,
      description,
      category,
      status,
      createdAt: parsedDate,
      activityTime: activityTime || undefined,
      reminderEnabled,
      reminderOffsetMinutes,
      photoUri: photoUri ?? undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationLabel: location?.label,
      rating,
    };

    try {
      if (isEditing && activityToEdit) {
        await updateActivity(activityToEdit.id, payload);
      } else {
        await addActivity(payload);
      }
      navigation.goBack();
    } catch (error) {
      console.warn('Falha ao salvar a atividade.', error);
      Alert.alert(
        'Erro ao salvar',
        'Não foi possível salvar a atividade. Tente novamente.'
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={isEditing ? 'Editar Atividade' : 'Nova Atividade'}
          onBack={() => navigation.goBack()}
        />

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
            {categories.map((cat) => (
              <SelectChip
                key={cat.id}
                label={cat.name}
                selected={category === cat.id}
                onPress={() => setCategory(cat.id)}
                backgroundColor={cat.color}
              />
            ))}
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

          <Text style={styles.label}>Foto</Text>
          <ImagePickerField uri={photoUri} onChange={setPhotoUri} />
          <Text style={styles.helperText}>
            Opcional: registre uma foto da atividade pela câmera ou galeria.
          </Text>

          <Text style={styles.label}>Localização</Text>
          {location ? (
            <View style={styles.locationBox}>
              <Ionicons name="location" size={18} color={colors.primaryDark} />
              <Text style={styles.locationText} numberOfLines={1}>
                {location.label}
              </Text>
              <Pressable hitSlop={8} onPress={() => setLocation(null)}>
                <Text style={styles.locationRemove}>Remover</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[
                styles.locationButton,
                isLocating && styles.locationButtonDisabled,
              ]}
              onPress={() => void handleCaptureLocation()}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator color={colors.primaryDark} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primaryDark}
                  />
                  <Text style={styles.locationButtonText}>
                    Usar localização atual
                  </Text>
                </>
              )}
            </Pressable>
          )}
          <Text style={styles.helperText}>
            Opcional: registra onde a atividade acontece para aparecer no mapa.
          </Text>

          <Text style={styles.label}>Avaliação</Text>
          <View style={styles.ratingRow}>
            <StarRating value={rating} onChange={setRating} />
            {rating != null && (
              <Text style={styles.ratingValue}>{rating} / 5</Text>
            )}
          </View>
          <Text style={styles.helperText}>
            Opcional: dê uma nota para acompanhar a satisfação nas métricas.
          </Text>

          <Text style={styles.label}>Data</Text>
          <TextInput
            style={styles.input}
            value={dateTime}
            onChangeText={(value) => setDateTime(normalizeDateInput(value))}
            placeholder="dd/mm/aaaa"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Lembrete</Text>
          <View style={styles.reminderRow}>
          <View style={styles.reminderTextBlock}>
              <Text style={styles.reminderTitle}>
                Receber lembrete desta atividade
              </Text>
              <Text style={styles.reminderCaption}>
                Defina um horario da atividade e, se quiser, quanto tempo antes
                a notificacao deve chegar.
              </Text>
            </View>

            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{
                false: colors.border,
                true: colors.primarySoft,
              }}
              thumbColor={
                reminderEnabled ? colors.primaryDark : colors.surface
              }
            />
          </View>

          {reminderEnabled ? (
            <>
              <Text style={styles.label}>Horario da atividade</Text>
              <TextInput
                style={styles.input}
                placeholder="Opcional - HH:mm"
                placeholderTextColor={colors.textSecondary}
                value={activityTime}
                onChangeText={(value) => setActivityTime(normalizeTimeInput(value))}
                keyboardType="numeric"
              />

              <Text style={styles.helperText}>
                Se nenhum horario for informado, o lembrete usa o padrao das
                09:00 no dia da atividade.
              </Text>

              <Text style={styles.label}>Notificar</Text>
              <View style={styles.rowWrap}>
                {reminderOffsetOptions.map((option) => (
                  <SelectChip
                    key={option.label}
                    label={option.label}
                    selected={reminderOffsetMinutes === option.value}
                    onPress={() => setReminderOffsetMinutes(option.value)}
                    backgroundColor="#F3EDF7"
                  />
                ))}
                <SelectChip
                  label="Sem ajuste"
                  selected={reminderOffsetMinutes === undefined}
                  onPress={() => setReminderOffsetMinutes(undefined)}
                  backgroundColor={colors.surfaceSoft}
                />
              </View>

              <Text style={styles.helperText}>
                O aviso antes so vale quando houver horario informado.
              </Text>
            </>
          ) : null}

          <Pressable style={styles.saveButton} onPress={() => void handleSave()}>
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
    </SafeAreaView>
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
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor },
        selected && styles.chipSelected,
      ]}
    >
      <Text style={[styles.chipText, { color: readableTextOn(backgroundColor) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  reminderRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
  },
  reminderTextBlock: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reminderCaption: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helperText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  locationRemove: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C0392B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
}
