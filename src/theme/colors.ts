export const lightColors = {
  background: '#F6F4F7',
  surface: '#FFFFFF',
  surfaceSoft: '#F1EEF4',

  primary: '#B79CED',
  primaryDark: '#9B7FE0',
  primarySoft: '#E9DFFD',

  mint: '#CFEFE4',
  rose: '#F3DDEA',
  lavender: '#DCCFF5',

  text: '#2F2A33',
  textSecondary: '#7B7483',
  border: '#E6E0E8',
  shadow: 'rgba(80, 60, 100, 0.08)',

  success: '#6FBF9F',
  warning: '#E2B96B',
};

export const darkColors: typeof lightColors = {
  background: '#1A1721',
  surface: '#262130',
  surfaceSoft: '#2F2939',

  primary: '#B79CED',
  primaryDark: '#9B7FE0',
  primarySoft: '#3A2F58',

  // Tons de categoria mais profundos para legibilidade no escuro.
  mint: '#3A6F60',
  rose: '#7A4760',
  lavender: '#5A4880',

  text: '#F1EDF5',
  textSecondary: '#9C95A8',
  border: '#3A3548',
  shadow: 'rgba(0, 0, 0, 0.4)',

  success: '#6FBF9F',
  warning: '#E2B96B',
};

export type Colors = typeof lightColors;

/**
 * Compat: módulos que ainda não foram migrados para o hook `useThemedColors()`
 * continuam consumindo a paleta clara. Componentes refatorados devem
 * preferir o hook (atualiza com o tema).
 */
export const colors = lightColors;
