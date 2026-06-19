import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { appAssets } from '../assets';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';

type AppBrandProps = {
  subtitle?: string;
  onLogout?: () => void;
};

export default function AppBrand({ subtitle, onLogout }: AppBrandProps) {
  return (
    <View style={styles.brandRow}>
      <View>
        <Text style={styles.appTitle}>InsightLog</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightSide}>
        {!!onLogout && (
          <Pressable onPress={onLogout} hitSlop={8} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        )}
        <Image
          source={appAssets.logo}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoutButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  logo: {
    width: 46,
    height: 46,
  },
});
