import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { Card, Title, Paragraph, Button, List, TextInput, HelperText, Divider } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import NotificationService from '../services/notification.service';

export function SettingsScreen() {
  const { state, updateUser, resetApp } = useApp();
  const [editing, setEditing] = useState(false);

  // Notification state
  const [notifEnabled, setNotifEnabled] = useState(
    state.user?.preferences?.notificationsEnabled ?? false
  );
  const [reminderTime, setReminderTime] = useState(
    state.user?.preferences?.reminderTime || '07:00'
  );
  const [notifSaving, setNotifSaving] = useState(false);

  const [name, setName] = useState(state.user?.name || '');
  const [currentMileage, setCurrentMileage] = useState(
    state.user?.currentWeeklyMileage?.toString() || ''
  );
  const [longestRun, setLongestRun] = useState(
    state.user?.longestRun?.toString() || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const startEdit = () => {
    setName(state.user?.name || '');
    setCurrentMileage(state.user?.currentWeeklyMileage?.toString() || '');
    setLongestRun(state.user?.longestRun?.toString() || '');
    setErrors({});
    setEditing(true);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!currentMileage || parseFloat(currentMileage) <= 0)
      newErrors.currentMileage = 'Enter a valid mileage';
    if (!longestRun || parseFloat(longestRun) <= 0)
      newErrors.longestRun = 'Enter a valid distance';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await updateUser({
      name: name.trim(),
      currentWeeklyMileage: parseFloat(currentMileage),
      longestRun: parseFloat(longestRun),
    });
    setEditing(false);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotifEnabled(value);
    if (!value) {
      await NotificationService.cancelAll();
      await updateUser({
        preferences: { ...state.user!.preferences, notificationsEnabled: false },
      });
    } else {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        setNotifEnabled(false);
        Alert.alert('Permission Denied', 'Enable notifications in your device Settings to use this feature.');
        return;
      }
      await NotificationService.scheduleWorkoutReminder(reminderTime);
      await NotificationService.scheduleEveningNudge();
      await updateUser({
        preferences: { ...state.user!.preferences, notificationsEnabled: true, reminderTime },
      });
    }
  };

  const handleSaveReminderTime = async () => {
    const valid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderTime);
    if (!valid) {
      Alert.alert('Invalid Time', 'Enter time in HH:MM format (e.g. 07:00)');
      return;
    }
    setNotifSaving(true);
    try {
      await NotificationService.scheduleWorkoutReminder(reminderTime);
      await updateUser({
        preferences: { ...state.user!.preferences, notificationsEnabled: true, reminderTime },
      });
      Alert.alert('Saved', `Reminder set for ${reminderTime} daily.`);
    } finally {
      setNotifSaving(false);
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'Are you sure you want to reset all data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => { await resetApp(); } },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Profile</Title>
            {!editing && (
              <Button compact mode="outlined" onPress={startEdit}>Edit</Button>
            )}
          </View>

          {editing ? (
            <>
              <TextInput
                label="Your Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
              />
              <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>

              <TextInput
                label="Current Weekly Mileage (miles)"
                value={currentMileage}
                onChangeText={setCurrentMileage}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
                error={!!errors.currentMileage}
              />
              <HelperText type="error" visible={!!errors.currentMileage}>{errors.currentMileage}</HelperText>

              <TextInput
                label="Longest Recent Run (miles)"
                value={longestRun}
                onChangeText={setLongestRun}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
                error={!!errors.longestRun}
              />
              <HelperText type="error" visible={!!errors.longestRun}>{errors.longestRun}</HelperText>

              <View style={styles.editActions}>
                <Button mode="contained" onPress={handleSave} style={styles.saveButton}>Save</Button>
                <Button mode="outlined" onPress={() => setEditing(false)}>Cancel</Button>
              </View>
            </>
          ) : (
            state.user && (
              <>
                <List.Item title="Name" description={state.user.name} left={() => <List.Icon icon="account" />} />
                <Divider />
                <List.Item
                  title="Experience"
                  description={state.user.experienceLevel.charAt(0).toUpperCase() + state.user.experienceLevel.slice(1)}
                  left={() => <List.Icon icon="medal" />}
                />
                <Divider />
                <List.Item
                  title="Weekly Mileage"
                  description={`${state.user.currentWeeklyMileage} miles/week`}
                  left={() => <List.Icon icon="run" />}
                />
                <Divider />
                <List.Item
                  title="Longest Run"
                  description={`${state.user.longestRun} miles`}
                  left={() => <List.Icon icon="map-marker-distance" />}
                />
              </>
            )
          )}
        </Card.Content>
      </Card>

      {/* Training Plan */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Training Plan</Title>
          {state.trainingPlan ? (
            <>
              <List.Item
                title="Goal Distance"
                description={`${state.trainingPlan.goalDistance} miles`}
                left={() => <List.Icon icon="flag-checkered" />}
              />
              <Divider />
              <List.Item
                title="Race Date"
                description={new Date(state.trainingPlan.raceDate).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                })}
                left={() => <List.Icon icon="calendar" />}
              />
              <Divider />
              <List.Item
                title="Plan Length"
                description={`${state.trainingPlan.totalWeeks} weeks`}
                left={() => <List.Icon icon="clock-outline" />}
              />
              <Divider />
              <List.Item
                title="Peak Weekly Mileage"
                description={`${state.trainingPlan.peakWeeklyMileage} miles`}
                left={() => <List.Icon icon="chart-line" />}
              />
            </>
          ) : (
            <Paragraph>No training plan set up</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Notifications */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Notifications</Title>

          <View style={styles.notifRow}>
            <Paragraph>Daily workout reminder</Paragraph>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: '#6200ea' }}
            />
          </View>

          {notifEnabled && (
            <>
              <Paragraph style={styles.notifHint}>Reminder time (HH:MM)</Paragraph>
              <View style={styles.notifTimeRow}>
                <TextInput
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  mode="outlined"
                  keyboardType="numbers-and-punctuation"
                  style={styles.notifTimeInput}
                  placeholder="07:00"
                />
                <Button
                  mode="contained"
                  onPress={handleSaveReminderTime}
                  loading={notifSaving}
                  disabled={notifSaving}
                  style={styles.notifSaveButton}
                >
                  Save
                </Button>
              </View>
              <Paragraph style={styles.notifHint}>
                You'll also get a 9 PM nudge if you haven't logged your workout.
              </Paragraph>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Danger Zone</Title>
          <Paragraph style={styles.dangerText}>
            Deletes all your data including your training plan and workout history.
          </Paragraph>
          <Button mode="outlined" onPress={handleResetApp} style={styles.resetButton} textColor="#d32f2f">
            Reset All Data
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Paragraph style={styles.version}>RunningApp v1.0.0</Paragraph>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
    marginTop: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
  },
  dangerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  resetButton: {
    borderColor: '#d32f2f',
  },
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  notifTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  notifTimeInput: {
    flex: 1,
    height: 44,
  },
  notifSaveButton: {
    marginTop: 4,
  },
  notifHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: '#ccc',
  },
});
