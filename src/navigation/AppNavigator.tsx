import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useApp } from '../context/AppContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { InjuryScreen } from '../screens/InjuryScreen';
import { ShoesScreen } from '../screens/ShoesScreen';
import { LiveRunScreen } from '../screens/LiveRunScreen';

import { RootStackParamList, MainTabParamList } from '../context/types';

// Lazy imports for new screens (graceful if files don't exist yet)
import StatsHubScreen from '../screens/StatsHubScreen';
import TrainingLoadScreen from '../screens/TrainingLoadScreen';
import StrengthScreen from '../screens/StrengthScreen';
import RaceCalendarScreen from '../screens/RaceCalendarScreen';
import HydrationScreen from '../screens/HydrationScreen';
import BenchmarkScreen from '../screens/BenchmarkScreen';
import BodyWeightScreen from '../screens/BodyWeightScreen';
import PRDashboardScreen from '../screens/PRDashboardScreen';
import SavedRoutesScreen from '../screens/SavedRoutesScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ea',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Icon name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Icon name="chart-line" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsHubScreen}
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <Icon name="view-dashboard" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Icon name="cog" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { state } = useApp();

  if (state.isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!state.hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'Welcome' }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Log Workout' }} />
            <Stack.Screen name="Injuries" component={InjuryScreen} options={{ title: 'Injury Log' }} />
            <Stack.Screen name="Shoes" component={ShoesScreen} options={{ title: 'My Shoes' }} />
            <Stack.Screen name="TrainingLoad" component={TrainingLoadScreen} options={{ title: 'Training Load' }} />
            <Stack.Screen name="Strength" component={StrengthScreen} options={{ title: 'Strength & Mobility' }} />
            <Stack.Screen name="RaceCalendar" component={RaceCalendarScreen} options={{ title: 'Race Calendar' }} />
            <Stack.Screen name="Hydration" component={HydrationScreen} options={{ title: 'Hydration' }} />
            <Stack.Screen name="Benchmark" component={BenchmarkScreen} options={{ title: 'Benchmarks' }} />
            <Stack.Screen name="BodyWeight" component={BodyWeightScreen} options={{ title: 'Body Weight' }} />
            <Stack.Screen name="PRDashboard" component={PRDashboardScreen} options={{ title: 'Personal Records' }} />
            <Stack.Screen name="SavedRoutes" component={SavedRoutesScreen} options={{ title: 'Saved Routes' }} />
            <Stack.Screen name="LiveRun" component={LiveRunScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
