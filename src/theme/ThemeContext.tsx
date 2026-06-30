import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors, darkColors, lightColors } from './colors';

const STORAGE_KEY = '@insightlog:themeMode';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'dark' || value === 'light') setModeState(value);
      })
      .catch(() => {
        /* mantém light como padrão */
      });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* preferência best-effort */
    });
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
      setMode,
      toggle: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/** Atalho para componentes que só precisam das cores. */
export function useThemedColors(): Colors {
  return useTheme().colors;
}

/**
 * Atalho ergonômico: recebe um factory `(colors) => styles` e devolve
 * o objeto de estilos memoizado conforme a paleta atual.
 */
export function useThemedStyles<T>(factory: (colors: Colors) => T): T {
  const colors = useThemedColors();
  return useMemo(() => factory(colors), [colors, factory]);
}
