import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { appAssets } from '@/assets';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';

type ScreenHeaderProps = {
  title: string;
  onBack: () => void;
};

export default function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
      </View>

      <Image
        source={appAssets.logo}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: {
    flexShrink: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  backText: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  logo: {
    width: 46,
    height: 46,
  },
});
