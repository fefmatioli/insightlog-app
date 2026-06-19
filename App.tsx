import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { ActivitiesProvider } from './src/context/ActivitiesContext';
import { AuthProvider } from './src/context/AuthContext';
import { configureNotificationsAsync } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ActivitiesProvider>
          <AppNavigator />
        </ActivitiesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
