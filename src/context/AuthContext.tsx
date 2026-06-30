import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { deleteStoredImage } from '@/services/imagePicker';

const USERS_KEY = '@insightlog:users';
const SESSION_KEY = '@insightlog:session';

export type LocalUser = {
  id: string;
  name: string;
  email: string;
  photoUri?: string;
  /** Flag derivada para a UI saber se a conta tem perguntas configuradas. */
  hasSecurityQuestions: boolean;
};

export type SecurityQuestion = {
  question: string;
  /** Sempre armazenado normalizado (lowercase + trim). */
  answer: string;
};

type StoredUser = Omit<LocalUser, 'hasSecurityQuestions'> & {
  password: string;
  securityQuestions?: SecurityQuestion[];
};

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function toLocalUser(stored: StoredUser): LocalUser {
  return {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    photoUri: stored.photoUri,
    hasSecurityQuestions:
      Array.isArray(stored.securityQuestions) &&
      stored.securityQuestions.length > 0,
  };
}

type AuthContextValue = {
  user: LocalUser | null;
  isAuthReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: {
    name?: string;
    email?: string;
    photoUri?: string | null;
  }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Configura/atualiza as 2 perguntas de segurança do usuário logado. */
  setSecurityQuestions: (questions: SecurityQuestion[]) => Promise<void>;
  /**
   * Retorna apenas as perguntas (sem respostas) de uma conta.
   * - array → conta existe e tem perguntas
   * - []    → conta existe mas não configurou perguntas (cair no fluxo simples)
   * - null  → conta não encontrada
   */
  getSecurityQuestionsForEmail: (email: string) => Promise<string[] | null>;
  /** Reset direto, só para contas que ainda não têm perguntas configuradas. */
  resetPasswordByEmail: (email: string, newPassword: string) => Promise<void>;
  /** Reset protegido por perguntas de segurança. */
  resetPasswordWithSecurityAnswers: (
    email: string,
    answers: string[],
    newPassword: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function getStoredUsers(): Promise<StoredUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

async function saveUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const sessionId = await AsyncStorage.getItem(SESSION_KEY);
        if (sessionId) {
          const users = await getStoredUsers();
          const found = users.find((u) => u.id === sessionId);
          if (found) {
            setUser(toLocalUser(found));
          }
        }
      } finally {
        setIsAuthReady(true);
      }
    }
    void restoreSession();
  }, []);

  async function signIn(email: string, password: string) {
    const users = await getStoredUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );
    if (!found) {
      throw { code: 'auth/invalid-credential' };
    }
    await AsyncStorage.setItem(SESSION_KEY, found.id);
    setUser(toLocalUser(found));
  }

  async function signUp(email: string, password: string, displayName: string) {
    const users = await getStoredUsers();
    const exists = users.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) {
      throw { code: 'auth/email-already-in-use' };
    }
    const newUser: StoredUser = {
      id: String(Date.now()),
      name: displayName.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    await saveUsers([...users, newUser]);
    await AsyncStorage.setItem(SESSION_KEY, newUser.id);
    setUser(toLocalUser(newUser));
  }

  async function signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  async function updateUser(data: {
    name?: string;
    email?: string;
    photoUri?: string | null;
  }) {
    if (!user) return;
    const users = await getStoredUsers();

    if (data.email) {
      const emailTaken = users.some(
        (u) => u.id !== user.id && u.email.toLowerCase() === data.email!.toLowerCase()
      );
      if (emailTaken) {
        throw { code: 'auth/email-already-in-use' };
      }
    }

    const nextPhotoUri =
      data.photoUri === undefined
        ? user.photoUri
        : data.photoUri === null
          ? undefined
          : data.photoUri;

    // Remove a imagem anterior quando a foto muda, evitando arquivos órfãos.
    if (
      data.photoUri !== undefined &&
      user.photoUri &&
      user.photoUri !== nextPhotoUri
    ) {
      deleteStoredImage(user.photoUri);
    }

    const updated = users.map((u) =>
      u.id === user.id
        ? {
            ...u,
            name: data.name ?? u.name,
            email: data.email?.toLowerCase() ?? u.email,
            photoUri: nextPhotoUri,
          }
        : u
    );
    await saveUsers(updated);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            name: data.name ?? prev.name,
            email: data.email ?? prev.email,
            photoUri: nextPhotoUri,
          }
        : prev
    );
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    if (!user) return;
    const users = await getStoredUsers();
    const found = users.find((u) => u.id === user.id);
    if (!found || found.password !== currentPassword) {
      throw { code: 'auth/wrong-password' };
    }
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, password: newPassword } : u
    );
    await saveUsers(updated);
  }

  // Redefinição direta — só permitida para contas SEM perguntas configuradas.
  // Quem optou por proteger a conta com perguntas precisa passar por elas.
  async function resetPasswordByEmail(email: string, newPassword: string) {
    const normalized = email.trim().toLowerCase();
    const users = await getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalized);
    if (!found) {
      throw { code: 'auth/user-not-found' };
    }
    if (found.securityQuestions && found.securityQuestions.length > 0) {
      throw { code: 'auth/security-questions-required' };
    }
    const updated = users.map((u) =>
      u.id === found.id ? { ...u, password: newPassword } : u
    );
    await saveUsers(updated);
  }

  async function setSecurityQuestions(questions: SecurityQuestion[]) {
    if (!user) return;
    const cleaned = questions
      .map((q) => ({
        question: q.question.trim(),
        answer: normalizeAnswer(q.answer),
      }))
      .filter((q) => q.question && q.answer);

    if (cleaned.length !== 2) {
      throw { code: 'auth/invalid-security-questions' };
    }

    const users = await getStoredUsers();
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, securityQuestions: cleaned } : u
    );
    await saveUsers(updated);
    const updatedSelf = updated.find((u) => u.id === user.id);
    if (updatedSelf) setUser(toLocalUser(updatedSelf));
  }

  async function getSecurityQuestionsForEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const users = await getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalized);
    if (!found) return null;
    return found.securityQuestions?.map((q) => q.question) ?? [];
  }

  async function resetPasswordWithSecurityAnswers(
    email: string,
    answers: string[],
    newPassword: string
  ) {
    const normalized = email.trim().toLowerCase();
    const users = await getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalized);
    if (!found) {
      throw { code: 'auth/user-not-found' };
    }
    const expected = found.securityQuestions ?? [];
    if (expected.length === 0) {
      throw { code: 'auth/no-security-questions' };
    }
    if (answers.length !== expected.length) {
      throw { code: 'auth/wrong-security-answer' };
    }
    const allMatch = expected.every(
      (q, i) => q.answer === normalizeAnswer(answers[i] ?? '')
    );
    if (!allMatch) {
      throw { code: 'auth/wrong-security-answer' };
    }
    const updated = users.map((u) =>
      u.id === found.id ? { ...u, password: newPassword } : u
    );
    await saveUsers(updated);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        signIn,
        signUp,
        signOut,
        updateUser,
        updatePassword,
        setSecurityQuestions,
        getSecurityQuestionsForEmail,
        resetPasswordByEmail,
        resetPasswordWithSecurityAnswers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
