import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useActivities } from '../context/ActivitiesContext';
import { useCategories } from '../context/CategoriesContext';
import { Colors } from '../theme/colors';
import { spacing } from '../theme/layout';
import { useThemedColors, useThemedStyles } from '../theme/ThemeContext';
import AppBrand from '../components/AppBrand';

export default function MapScreen() {
  const { activities } = useActivities();
  const { getCategory } = useCategories();
  const colors = useThemedColors();
  const styles = useThemedStyles(createStyles);

  const located = useMemo(
    () =>
      activities.filter(
        (item) => item.latitude != null && item.longitude != null
      ),
    [activities]
  );

  const initialRegion = useMemo(() => {
    const first = located[0];
    if (!first || first.latitude == null || first.longitude == null) {
      return undefined;
    }
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [located]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <AppBrand
          subtitle={`${located.length} ${
            located.length === 1 ? 'atividade no mapa' : 'atividades no mapa'
          }`}
        />
      </View>

      {located.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="map-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nenhuma atividade no mapa</Text>
          <Text style={styles.emptyText}>
            Adicione uma localização ao criar ou editar uma atividade para vê-la
            aqui.
          </Text>
        </View>
      ) : (
        <MapView style={styles.map} initialRegion={initialRegion}>
          {located.map((item) => {
            const cat = getCategory(item.category);
            return (
              <Marker
                key={item.id}
                coordinate={{
                  latitude: item.latitude as number,
                  longitude: item.longitude as number,
                }}
                title={item.title}
                description={`${cat.name} • ${item.status}`}
                pinColor={cat.color}
              />
            );
          })}
        </MapView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  map: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  });
}
