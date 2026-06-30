import { colors } from '@/theme/colors';

export type Category = {
  id: string;
  name: string;
  /** Hex color (background do badge). */
  color: string;
  /** Nome de um ícone Ionicons. */
  icon: string;
  /** Categorias padrão sempre existem e podem ser editadas mas não removidas. */
  isDefault: boolean;
};

/**
 * Categorias semente, geradas POR USUÁRIO. Os ids são prefixados com o
 * userId para serem únicos entre contas diferentes (isolamento de dados).
 */
export function defaultCategoriesFor(userId: string): Category[] {
  return [
    {
      id: `${userId}-estudo`,
      name: 'Estudo',
      color: colors.lavender,
      icon: 'book',
      isDefault: true,
    },
    {
      id: `${userId}-saude`,
      name: 'Saúde',
      color: colors.mint,
      icon: 'heart',
      isDefault: true,
    },
    {
      id: `${userId}-social`,
      name: 'Social',
      color: colors.rose,
      icon: 'people',
      isDefault: true,
    },
  ];
}

/** Usada apenas como último recurso quando uma atividade aponta para uma
 * categoria que não existe mais (não deve acontecer no fluxo normal). */
export const FALLBACK_CATEGORY: Category = {
  id: '__fallback__',
  name: 'Sem categoria',
  color: colors.surfaceSoft,
  icon: 'pricetag',
  isDefault: true,
};

export const CATEGORY_COLOR_PRESETS = [
  colors.lavender,
  colors.mint,
  colors.rose,
  '#FFD9A8',
  '#A8D8FF',
  '#C8E6A0',
  '#FFB3BA',
  '#D0BCFF',
];

export const CATEGORY_ICON_PRESETS = [
  'book',
  'heart',
  'people',
  'briefcase',
  'fitness',
  'restaurant',
  'musical-notes',
  'home',
  'airplane',
  'cart',
  'pencil',
  'star',
];
