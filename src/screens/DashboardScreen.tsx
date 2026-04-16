import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockActivities } from '../data/mockActivities';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const totalActivities = mockActivities.length;

  const categoryCounts = {
    Estudo: mockActivities.filter((item) => item.category === 'Estudo').length,
    Saúde: mockActivities.filter((item) => item.category === 'Saúde').length,
    Social: mockActivities.filter((item) => item.category === 'Social').length,
  };

  const averagePerCategory = (
    totalActivities / Object.keys(categoryCounts).length
  ).toFixed(1);

  const maxCategoryValue = Math.max(
    categoryCounts.Estudo,
    categoryCounts.Saúde,
    categoryCounts.Social
  );

  const temporalPoints = [40, 58, 45, 35, 52, 68, 56];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Métricas</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
      </View>

      <View style={styles.topCardsRow}>
        <View style={[styles.topCard, { backgroundColor: colors.primarySoft }]}>
          <Text style={styles.topCardLabel}>Total Registros</Text>
          <Text style={styles.topCardValue}>{totalActivities}</Text>
          <Text style={styles.topCardCaption}>Atividades</Text>
        </View>

        <View style={[styles.topCard, { backgroundColor: colors.mint }]}>
          <Text style={styles.topCardLabel}>Média por Categoria</Text>
          <Text style={styles.topCardValue}>{averagePerCategory}</Text>
          <Text style={styles.topCardCaption}>Eventos</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Atividades por Categoria</Text>

        <View style={styles.chartRow}>
          <CategoryBarGroup
            label="Estudo"
            value={categoryCounts.Estudo}
            maxValue={maxCategoryValue}
            color={colors.primary}
          />
          <CategoryBarGroup
            label="Saúde"
            value={categoryCounts.Saúde}
            maxValue={maxCategoryValue}
            color={colors.mint}
          />
          <CategoryBarGroup
            label="Social"
            value={categoryCounts.Social}
            maxValue={maxCategoryValue}
            color={colors.rose}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Distribuição Temporal</Text>

        <View style={styles.lineArea}>
          <View style={styles.lineTrack} />
          <View style={styles.pointsRow}>
            {temporalPoints.map((point, index) => (
              <View
                key={`${point}-${index}`}
                style={[
                  styles.point,
                  {
                    bottom: point,
                    backgroundColor:
                      index % 2 === 0 ? colors.primary : colors.mint,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.daysRow}>
          <Text style={styles.dayLabel}>S</Text>
          <Text style={styles.dayLabel}>T</Text>
          <Text style={styles.dayLabel}>Q</Text>
          <Text style={styles.dayLabel}>Q</Text>
          <Text style={styles.dayLabel}>S</Text>
          <Text style={styles.dayLabel}>S</Text>
          <Text style={styles.dayLabel}>D</Text>
        </View>
      </View>
    </ScrollView>
  );
}

type CategoryBarGroupProps = {
  label: string;
  value: number;
  maxValue: number;
  color: string;
};

function CategoryBarGroup({
  label,
  value,
  maxValue,
  color,
}: CategoryBarGroupProps) {
  const barHeight = maxValue === 0 ? 0 : (value / maxValue) * 110;

  return (
    <View style={styles.barGroup}>
      <View style={styles.barArea}>
        <View
          style={[
            styles.bar,
            {
              height: barHeight,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      <Text style={styles.barValue}>{value}</Text>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  topCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    minHeight: 135,
    justifyContent: 'space-between',
  },
  topCardLabel: {
    fontSize: 14,
    color: colors.text,
  },
  topCardValue: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 46,
  },
  topCardCaption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 180,
  },
  barGroup: {
    alignItems: 'center',
    width: 80,
  },
  barArea: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  bar: {
    width: 32,
    borderRadius: 10,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  lineArea: {
    height: 140,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  lineTrack: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: colors.border,
    top: '50%',
  },
  pointsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  point: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'relative',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});