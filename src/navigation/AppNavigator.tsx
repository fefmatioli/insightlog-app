import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ActivitiesScreen from '../screens/ActivitiesScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Activities: undefined;
  CreateActivity: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Activities"
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitle: '',
        }}
      >
        <Stack.Screen
          name="Activities"
          component={ActivitiesScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CreateActivity"
          component={CreateActivityScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}