import { View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme, useThemedColors } from '../theme/ThemeContext';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import GoalsScreen from '../screens/GoalsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  Activities: undefined;
  CreateActivity: { activityId?: string } | undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Categories: undefined;
  Goals: undefined;
};

type MainTabParamList = {
  ActivitiesTab: undefined;
  MetricsTab: undefined;
  MapTab: undefined;
  ProfileTab: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ActivitiesStack = createNativeStackNavigator<RootStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const hiddenHeader = { headerShown: false } as const;

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={hiddenHeader}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={hiddenHeader}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="Categories" component={CategoriesScreen} />
      <ProfileStack.Screen name="Goals" component={GoalsScreen} />
    </ProfileStack.Navigator>
  );
}

function MainNavigator() {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();

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
            MapTab: ['map', 'map-outline'],
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
        name="MapTab"
        component={MapScreen}
        options={{ tabBarLabel: 'Mapa' }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isAuthReady } = useAuth();
  const { mode } = useTheme();
  const colors = useThemedColors();

  if (!isAuthReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const navTheme =
    mode === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        };

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
