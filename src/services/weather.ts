import * as Location from 'expo-location';

export type LocalWeather = {
  locationLabel: string;
  temperature: number;
  weatherLabel: string;
  message: string;
};

function getWeatherLabel(weatherCode: number) {
  if (weatherCode === 0) return 'Céu limpo';
  if ([1, 2, 3].includes(weatherCode)) return 'Parcialmente nublado';
  if ([45, 48].includes(weatherCode)) return 'Neblina';
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Garoa';
  if ([61, 63, 65, 66, 67].includes(weatherCode)) return 'Chuva';
  if ([71, 73, 75, 77].includes(weatherCode)) return 'Neve';
  if ([80, 81, 82].includes(weatherCode)) return 'Pancadas de chuva';
  if ([85, 86].includes(weatherCode)) return 'Pancadas de neve';
  if ([95, 96, 99].includes(weatherCode)) return 'Tempestade';
  return 'Clima indefinido';
}

function getWeatherMessage(weatherCode: number) {
  if ([0, 1].includes(weatherCode)) {
    return 'Bom momento para atividades ao ar livre.';
  }

  if ([2, 3, 45, 48].includes(weatherCode)) {
    return 'Clima estável para tarefas leves fora de casa.';
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return 'Clima chuvoso: vale priorizar atividades internas.';
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return 'Tempo instável: evite atividades externas longas.';
  }

  return 'Acompanhe o clima antes de sair para sua próxima atividade.';
}

function buildLocationLabel(
  address?: Location.LocationGeocodedAddress | null
) {
  if (!address) return 'Sua região';

  const primary = address.city || address.district || address.subregion;
  const secondary = address.region || address.country;

  return [primary, secondary].filter(Boolean).join(', ') || 'Sua região';
}

export async function fetchLocalWeather() {
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
  const addresses = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
  );

  if (!response.ok) {
    throw new Error('WEATHER_REQUEST_FAILED');
  }

  const payload = await response.json();
  const currentWeather = payload.current;

  if (!currentWeather) {
    throw new Error('WEATHER_DATA_UNAVAILABLE');
  }

  const weatherCode = Number(currentWeather.weather_code ?? -1);

  return {
    locationLabel: buildLocationLabel(addresses[0] ?? null),
    temperature: Number(currentWeather.temperature_2m ?? 0),
    weatherLabel: getWeatherLabel(weatherCode),
    message: getWeatherMessage(weatherCode),
  } satisfies LocalWeather;
}
