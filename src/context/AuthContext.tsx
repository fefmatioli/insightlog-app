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
};

type StoredUser = LocalUser & { password: string };

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
            setUser({
              id: found.id,
              name: found.name,
              email: found.email,
              photoUri: found.photoUri,
            });
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
    setUser({
      id: found.id,
      name: found.name,
      email: found.email,
      photoUri: found.photoUri,
    });
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
    setUser({ id: newUser.id, name: newUser.name, email: newUser.email });
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

  return (
    <AuthContext.Provider
      value={{ user, isAuthReady, signIn, signUp, signOut, updateUser, updatePassword }}
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
