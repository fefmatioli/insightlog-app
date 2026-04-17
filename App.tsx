import AppNavigator from './src/navigation/AppNavigator';
import { ActivitiesProvider } from './src/context/ActivitiesContext';

export default function App() {
  return (
    <ActivitiesProvider>
      <AppNavigator />
    </ActivitiesProvider>
  );
}