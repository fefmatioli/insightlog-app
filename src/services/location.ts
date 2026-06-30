import * as Location from 'expo-location';

export type CapturedLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

/**
 * Obtém a localização atual do dispositivo (GPS) e tenta um rótulo legível
 * via geocodificação reversa. Lança erros tratáveis pela tela chamadora.
 */
export async function getCurrentLocation(): Promise<CapturedLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('LOCATION_PERMISSION_DENIED');
  }

  const position =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }));

  if (!position) {
    throw new Error('LOCATION_UNAVAILABLE');
  }

  const { latitude, longitude } = position.coords;

  let label = 'Local registrado';
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = addresses[0];
    if (address) {
      const primary =
        address.city || address.district || address.subregion || address.name;
      const secondary = address.region || address.country;
      label = [primary, secondary].filter(Boolean).join(', ') || label;
    }
  } catch {
    // Mantém o rótulo padrão se a geocodificação falhar.
  }

  return { latitude, longitude, label };
}
