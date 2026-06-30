import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import AppBrand from '@/components/AppBrand';
import ImagePickerField from '@/components/ImagePickerField';
import { Colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/layout';
import { useTheme, useThemedColors, useThemedStyles } from '@/theme/ThemeContext';

const PRESET_QUESTIONS = [
  'Qual o nome do seu primeiro pet?',
  'Em qual cidade você nasceu?',
  'Qual era seu apelido de infância?',
  'Qual é o seu livro favorito?',
  'Qual o nome de solteira da sua mãe?',
  'Qual o modelo do seu primeiro carro?',
];
const CUSTOM_QUESTION_OPTION = 'Outra pergunta...';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut, updateUser, updatePassword, setSecurityQuestions } =
    useAuth();
  const { mode, toggle } = useTheme();
  const colors = useThemedColors();
  const styles = useThemedStyles(createStyles);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [securityQ1, setSecurityQ1] = useState(PRESET_QUESTIONS[0]);
  const [securityA1, setSecurityA1] = useState('');
  const [securityQ2, setSecurityQ2] = useState(PRESET_QUESTIONS[1]);
  const [securityA2, setSecurityA2] = useState('');
  const [customQ1, setCustomQ1] = useState('');
  const [customQ2, setCustomQ2] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [picking, setPicking] = useState<1 | 2 | null>(null);

  const initials = (user?.name ?? '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleSaveName() {
    if (!nameInput.trim()) {
      setNameError('O nome não pode ser vazio.');
      return;
    }
    setNameError('');
    setIsSavingName(true);
    try {
      await updateUser({ name: nameInput.trim() });
      setIsEditingName(false);
    } catch {
      setNameError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSavingName(false);
    }
  }

  function cancelNameEdit() {
    setIsEditingName(false);
    setNameInput(user?.name ?? '');
    setNameError('');
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Preencha todos os campos.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('As novas senhas não coincidem.');
      return;
    }
    setPasswordError('');
    setIsSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setPasswordError(
        code === 'auth/wrong-password'
          ? 'Senha atual incorreta.'
          : 'Erro ao alterar senha. Tente novamente.'
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  function cancelPasswordChange() {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
  }

  function startEditingSecurity() {
    setSecurityQ1(PRESET_QUESTIONS[0]);
    setSecurityQ2(PRESET_QUESTIONS[1]);
    setSecurityA1('');
    setSecurityA2('');
    setCustomQ1('');
    setCustomQ2('');
    setSecurityError('');
    setIsEditingSecurity(true);
  }

  function cancelSecurityEdit() {
    setIsEditingSecurity(false);
    setSecurityError('');
  }

  function pickQuestion(slot: 1 | 2, value: string) {
    if (slot === 1) setSecurityQ1(value);
    else setSecurityQ2(value);
    setPicking(null);
  }

  async function handleSaveSecurity() {
    const finalQ1 =
      securityQ1 === CUSTOM_QUESTION_OPTION ? customQ1.trim() : securityQ1;
    const finalQ2 =
      securityQ2 === CUSTOM_QUESTION_OPTION ? customQ2.trim() : securityQ2;

    if (!finalQ1 || !finalQ2) {
      setSecurityError('Escreva as duas perguntas personalizadas.');
      return;
    }
    if (finalQ1.toLowerCase() === finalQ2.toLowerCase()) {
      setSecurityError('As duas perguntas precisam ser diferentes.');
      return;
    }
    if (!securityA1.trim() || !securityA2.trim()) {
      setSecurityError('Responda as duas perguntas.');
      return;
    }

    setSecurityError('');
    setIsSavingSecurity(true);
    try {
      await setSecurityQuestions([
        { question: finalQ1, answer: securityA1 },
        { question: finalQ2, answer: securityA2 },
      ]);
      setIsEditingSecurity(false);
      Alert.alert('Tudo certo', 'Perguntas de segurança salvas com sucesso.');
    } catch {
      setSecurityError('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSavingSecurity(false);
    }
  }

  async function handlePhotoChange(newUri: string | null) {
    try {
      await updateUser({ photoUri: newUri });
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a foto. Tente novamente.');
    }
  }

  function handleSignOut() {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppBrand />

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <ImagePickerField
              variant="avatar"
              size={80}
              uri={user?.photoUri}
              onChange={(newUri) => void handlePhotoChange(newUri)}
              fallback={<Text style={styles.avatarText}>{initials}</Text>}
            />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Perfil</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>Nome</Text>
            {!isEditingName && (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setNameInput(user?.name ?? '');
                  setIsEditingName(true);
                }}
              >
                <Text style={styles.actionLink}>Editar</Text>
              </Pressable>
            )}
          </View>

          {isEditingName ? (
            <>
              <TextInput
                style={styles.input}
                value={nameInput}
                onChangeText={setNameInput}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
              />
              {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
              <View style={styles.rowEnd}>
                <Pressable style={styles.cancelBtn} onPress={cancelNameEdit}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, isSavingName && styles.btnDisabled]}
                  onPress={() => void handleSaveName()}
                  disabled={isSavingName}
                >
                  {isSavingName ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.fieldValue}>{user?.name}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Segurança</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>Senha</Text>
            {!isChangingPassword && (
              <Pressable hitSlop={8} onPress={() => setIsChangingPassword(true)}>
                <Text style={styles.actionLink}>Alterar</Text>
              </Pressable>
            )}
          </View>

          {isChangingPassword ? (
            <>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Senha atual"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nova senha (mínimo 6 caracteres)"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="Confirmar nova senha"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!passwordError && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}
              <View style={styles.rowEnd}>
                <Pressable style={styles.cancelBtn} onPress={cancelPasswordChange}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, isSavingPassword && styles.btnDisabled]}
                  onPress={() => void handleChangePassword()}
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.fieldValue}>••••••••</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Perguntas de segurança</Text>
        <View
          style={[
            styles.card,
            styles.securityCard,
            !user?.hasSecurityQuestions && !isEditingSecurity && styles.alertCard,
          ]}
        >
          {!isEditingSecurity ? (
            <>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>
                    {user?.hasSecurityQuestions
                      ? 'Configuradas ✓'
                      : 'Ainda não configuradas'}
                  </Text>
                  <Text style={styles.helperLine}>
                    {user?.hasSecurityQuestions
                      ? 'Suas perguntas protegem a recuperação da senha.'
                      : 'Configure 2 perguntas para proteger a recuperação da senha.'}
                  </Text>
                </View>
                <Pressable hitSlop={8} onPress={startEditingSecurity}>
                  <Text style={styles.actionLink}>
                    {user?.hasSecurityQuestions ? 'Alterar' : 'Configurar'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <SecuritySlot
                label="Pergunta 1"
                question={securityQ1}
                customValue={customQ1}
                onCustomChange={setCustomQ1}
                onPick={() => setPicking(1)}
                answer={securityA1}
                onAnswerChange={setSecurityA1}
              />
              <SecuritySlot
                label="Pergunta 2"
                question={securityQ2}
                customValue={customQ2}
                onCustomChange={setCustomQ2}
                onPick={() => setPicking(2)}
                answer={securityA2}
                onAnswerChange={setSecurityA2}
              />
              {!!securityError && (
                <Text style={styles.errorText}>{securityError}</Text>
              )}
              <Text style={styles.helperLine}>
                As respostas ignoram maiúsculas/minúsculas e espaços no início e
                no fim.
              </Text>
              <View style={styles.rowEnd}>
                <Pressable style={styles.cancelBtn} onPress={cancelSecurityEdit}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, isSavingSecurity && styles.btnDisabled]}
                  onPress={() => void handleSaveSecurity()}
                  disabled={isSavingSecurity}
                >
                  {isSavingSecurity ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Preferências</Text>
        <Pressable
          style={styles.navRow}
          onPress={() => navigation.navigate('Categories')}
        >
          <Ionicons name="pricetags-outline" size={20} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navRowTitle}>Categorias</Text>
            <Text style={styles.navRowSubtitle}>
              Crie e edite categorias com cor e ícone próprios.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.navRow}
          onPress={() => navigation.navigate('Goals')}
        >
          <Ionicons name="flag-outline" size={20} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navRowTitle}>Metas</Text>
            <Text style={styles.navRowSubtitle}>
              Defina metas semanais ou mensais por categoria.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.navRow}>
          <Ionicons
            name={mode === 'dark' ? 'moon' : 'sunny-outline'}
            size={20}
            color={colors.primaryDark}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.navRowTitle}>Tema escuro</Text>
            <Text style={styles.navRowSubtitle}>
              {mode === 'dark' ? 'Ativado' : 'Desativado'}
            </Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggle}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={mode === 'dark' ? colors.primaryDark : colors.surface}
          />
        </View>

        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={picking !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPicking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Escolha a pergunta</Text>
            {[...PRESET_QUESTIONS, CUSTOM_QUESTION_OPTION].map((q) => {
              const current = picking === 1 ? securityQ1 : securityQ2;
              const selected = current === q;
              return (
                <Pressable
                  key={q}
                  style={[
                    styles.questionOption,
                    selected && styles.questionOptionSelected,
                  ]}
                  onPress={() => picking && pickQuestion(picking, q)}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selected ? colors.primaryDark : colors.textSecondary}
                  />
                  <Text style={styles.questionOptionText}>{q}</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setPicking(null)}
            >
              <Text style={styles.modalCancelText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type SecuritySlotProps = {
  label: string;
  question: string;
  customValue: string;
  onCustomChange: (v: string) => void;
  onPick: () => void;
  answer: string;
  onAnswerChange: (v: string) => void;
};

function SecuritySlot({
  label,
  question,
  customValue,
  onCustomChange,
  onPick,
  answer,
  onAnswerChange,
}: SecuritySlotProps) {
  const isCustom = question === CUSTOM_QUESTION_OPTION;
  const colors = useThemedColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.questionPickerButton} onPress={onPick}>
        <Text style={styles.questionPickerText} numberOfLines={2}>
          {question}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
      {isCustom && (
        <TextInput
          style={styles.input}
          value={customValue}
          onChangeText={onCustomChange}
          placeholder="Escreva sua pergunta"
          placeholderTextColor={colors.textSecondary}
        />
      )}
      <TextInput
        style={styles.input}
        value={answer}
        onChangeText={onAnswerChange}
        placeholder="Sua resposta"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
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
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  avatarWrapper: {
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: spacing.md,
  },
  securityCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    elevation: 0,
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fieldValue: {
    fontSize: 15,
    color: colors.text,
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
  errorText: {
    fontSize: 13,
    color: '#C0392B',
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
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
  },
  logoutButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E8A0A0',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C0392B',
  },
  alertCard: {
    borderWidth: 1,
    borderColor: '#E8A0A0',
    backgroundColor: '#FFF6F6',
  },
  helperLine: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  questionPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  questionPickerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
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
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  questionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  questionOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  questionOptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  modalCancelButton: {
    backgroundColor: colors.surfaceSoft,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  navRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  navRowSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  });
}
