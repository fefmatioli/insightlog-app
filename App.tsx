import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { ActivitiesProvider } from './src/context/ActivitiesContext';
import { AuthProvider } from './src/context/AuthContext';
import { CategoriesProvider } from './src/context/CategoriesContext';
import { GoalsProvider } from './src/context/GoalsContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { configureNotificationsAsync } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CategoriesProvider>
            <ActivitiesProvider>
              <GoalsProvider>
                <AppNavigator />
              </GoalsProvider>
            </ActivitiesProvider>
          </CategoriesProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
