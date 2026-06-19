import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import AppBrand from '@/components/AppBrand';
import ImagePickerField from '@/components/ImagePickerField';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/layout';

export default function ProfileScreen() {
  const { user, signOut, updateUser, updatePassword } = useAuth();

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

        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
