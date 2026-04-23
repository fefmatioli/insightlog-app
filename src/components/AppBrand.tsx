import { Image, StyleSheet, Text, View } from 'react-native';
import { appAssets } from '../assets';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';

type AppBrandProps = {
  subtitle?: string;
};

export default function AppBrand({ subtitle }: AppBrandProps) {
  return (
    <View style={styles.brandRow}>
      <View>
        <Text style={styles.appTitle}>InsightLog</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
  logo: {
    width: 46,
    height: 46,
  },
});
