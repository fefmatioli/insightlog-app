import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { colors } from '../theme/colors';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type RootStackParamList = {
  Activities: undefined;
  CreateActivity: { activityId?: string } | undefined;
};

type MainTabParamList = {
  ActivitiesTab: undefined;
  MetricsTab: undefined;
  ProfileTab: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ActivitiesStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const hiddenHeader = { headerShown: false } as const;

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={hiddenHeader}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function ActivitiesNavigator() {
  return (
    <ActivitiesStack.Navigator screenOptions={hiddenHeader}>
      <ActivitiesStack.Screen name="Activities" component={ActivitiesScreen} />
      <ActivitiesStack.Screen name="CreateActivity" component={CreateActivityScreen} />
    </ActivitiesStack.Navigator>
  );
}

function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // Cresce com a área segura para não invadir a barra de gestos
          // em celulares sem botão físico (e fica compacta em quem tem botão).
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            ActivitiesTab: ['list', 'list-outline'],
            MetricsTab: ['bar-chart', 'bar-chart-outline'],
            ProfileTab: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['list', 'list-outline'];
          return (
            <Ionicons
              name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <MainTab.Screen
        name="ActivitiesTab"
        component={ActivitiesNavigator}
        options={{ tabBarLabel: 'Atividades' }}
      />
      <MainTab.Screen
        name="MetricsTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Métricas' }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
