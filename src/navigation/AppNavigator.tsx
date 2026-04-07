import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ActivitiesScreen from '../screens/ActivitiesScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import DashboardScreen from '../screens/DashboardScreen';

export type RootStackParamList = {
  Activities: undefined;
  CreateActivity: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Activities">
        <Stack.Screen
          name="Activities"
          component={ActivitiesScreen}
          options={{ title: 'Atividades' }}
        />
        <Stack.Screen
          name="CreateActivity"
          component={CreateActivityScreen}
          options={{ title: 'Nova Atividade' }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Indicadores' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}