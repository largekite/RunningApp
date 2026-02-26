/**
 * 50-Mile Training App
 * Adaptive ultramarathon training with nutrition and sleep tracking
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import NotificationService from './src/services/notification.service';

function AppWithNotifications() {
  const { state } = useApp();

  useEffect(() => {
    const prefs = state.user?.preferences;
    if (!prefs?.notificationsEnabled || !prefs?.reminderTime) return;

    // Re-schedule on app launch to keep notifications fresh
    NotificationService.scheduleWorkoutReminder(prefs.reminderTime);
    NotificationService.scheduleEveningNudge();
  }, [state.user?.preferences?.notificationsEnabled]);

  return null;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <PaperProvider>
          <AppProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <AppWithNotifications />
            <AppNavigator />
          </AppProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
