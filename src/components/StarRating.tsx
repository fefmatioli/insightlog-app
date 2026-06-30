import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedColors } from '@/theme/ThemeContext';

type Props = {
  value?: number;
  onChange?: (next: number | undefined) => void;
  size?: number;
  /** Quando true, ignora toques (modo somente leitura). */
  readonly?: boolean;
};

export default function StarRating({
  value,
  onChange,
  size = 26,
  readonly = false,
}: Props) {
  const colors = useThemedColors();
  function handlePress(star: number) {
    if (readonly || !onChange) return;
    // Tocar na estrela já marcada limpa a avaliação (volta a "sem nota").
    onChange(value === star ? undefined : star);
  }

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value != null && star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => handlePress(star)}
            disabled={readonly}
            hitSlop={6}
            style={styles.star}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? '#E2B96B' : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: { padding: 2 },
});
