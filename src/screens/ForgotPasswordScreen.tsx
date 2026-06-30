import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../navigation/AppNavigator';
import AppBrand from '@/components/AppBrand';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/layout';
import { useThemedColors, useThemedStyles } from '@/theme/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

type Step = 'email' | 'questions' | 'newPassword';

function getErrorMessage(code: string) {
  switch (code) {
    case 'auth/user-not-found':
      return 'Não existe conta cadastrada com este e-mail.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/wrong-security-answer':
      return 'As respostas não conferem. Tente novamente.';
    default:
      return 'Não foi possível redefinir a senha. Tente novamente.';
  }
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const {
    getSecurityQuestionsForEmail,
    resetPasswordByEmail,
    resetPasswordWithSecurityAnswers,
  } = useAuth();
  const colors = useThemedColors();
  const styles = useThemedStyles(createStyles);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function reset() {
    setStep('email');
    setQuestions([]);
    setAnswers([]);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  async function handleEmailStep() {
    if (!email.trim()) {
      setError('Informe o e-mail cadastrado.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const found = await getSecurityQuestionsForEmail(email.trim());
      if (found === null) {
        setError(getErrorMessage('auth/user-not-found'));
        return;
      }
      if (found.length === 0) {
        // Conta sem perguntas configuradas → fluxo direto.
        setStep('newPassword');
      } else {
        setQuestions(found);
        setAnswers(new Array(found.length).fill(''));
        setStep('questions');
      }
    } catch {
      setError(getErrorMessage(''));
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuestionsStep() {
    if (answers.some((a) => !a.trim())) {
      setError('Responda todas as perguntas.');
      return;
    }
    setError('');
    setStep('newPassword');
  }

  async function handlePasswordStep() {
    if (!newPassword || !confirmPassword) {
      setError('Preencha a nova senha e a confirmação.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      if (questions.length > 0) {
        await resetPasswordWithSecurityAnswers(
          email.trim(),
          answers,
          newPassword
        );
      } else {
        await resetPasswordByEmail(email.trim(), newPassword);
      }
      Alert.alert(
        'Senha redefinida',
        'Sua senha foi alterada. Use a nova senha para entrar.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/wrong-security-answer') {
        setStep('questions');
        setAnswers(new Array(questions.length).fill(''));
      }
      setError(getErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <AppBrand subtitle="Redefina sua senha em poucos passos." />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Esqueci minha senha</Text>
            <Text style={styles.stepHint}>
              Etapa {step === 'email' ? 1 : step === 'questions' ? 2 : 3} de{' '}
              {questions.length > 0 || step !== 'email' ? 3 : 2}
            </Text>

            {step === 'email' && (
              <>
                <Text style={styles.cardHint}>
                  Informe o e-mail da sua conta. Se ela tiver perguntas de
                  segurança configuradas, vamos pedi-las antes de liberar a
                  redefinição.
                </Text>
                <View style={styles.field}>
                  <Text style={styles.label}>E-mail cadastrado</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {!!error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={() => void handleEmailStep()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.buttonText}>Continuar</Text>
                  )}
                </Pressable>
              </>
            )}

            {step === 'questions' && (
              <>
                <Text style={styles.cardHint}>
                  Responda às perguntas de segurança que você cadastrou. As
                  respostas não diferenciam maiúsculas de minúsculas.
                </Text>
                {questions.map((question, index) => (
                  <View key={index} style={styles.field}>
                    <Text style={styles.label}>{question}</Text>
                    <TextInput
                      style={styles.input}
                      value={answers[index] ?? ''}
                      onChangeText={(v) => updateAnswer(index, v)}
                      placeholder="Sua resposta"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                ))}
                {!!error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable
                  style={styles.button}
                  onPress={handleQuestionsStep}
                >
                  <Text style={styles.buttonText}>Continuar</Text>
                </Pressable>
                <Pressable onPress={reset} hitSlop={8} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Trocar e-mail</Text>
                </Pressable>
              </>
            )}

            {step === 'newPassword' && (
              <>
                <Text style={styles.cardHint}>
                  {questions.length > 0
                    ? 'Defina a nova senha que você usará para entrar.'
                    : 'Essa conta ainda não tem perguntas de segurança. Após entrar, configure no Perfil para aumentar a proteção.'}
                </Text>
                <View style={styles.field}>
                  <Text style={styles.label}>Nova senha</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                    >
                      <Text style={styles.eyeText}>
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Confirmar nova senha</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repita a nova senha"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {!!error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={() => void handlePasswordStep()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.buttonText}>Redefinir senha</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
              <Text style={styles.footerLink}>Voltar para o login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  stepHint: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -spacing.sm,
  },
  cardHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  field: { gap: spacing.xs },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
  passwordContainer: { position: 'relative' },
  passwordInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: 80,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  });
}
