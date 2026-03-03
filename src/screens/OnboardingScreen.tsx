import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, Title, Paragraph, TextInput, Button, RadioButton, Text, Chip, HelperText } from 'react-native-paper';
import uuid from 'react-native-uuid';
import { useApp } from '../context/AppContext';

const uuidv4 = uuid.v4;
import { UserProfile, ExperienceLevel } from '../context/types';
import { generateTrainingPlan } from '../utils/trainingPlanGenerator';

export function OnboardingScreen({ navigation }: any) {
  const { setUser, setTrainingPlan, completeOnboarding } = useApp();

  const [name, setName] = useState('');
  const [goalDistance, setGoalDistance] = useState(50);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [currentMileage, setCurrentMileage] = useState('');
  const [longestRun, setLongestRun] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [easyPace, setEasyPace] = useState('9:00');
  const [goalFinishTime, setGoalFinishTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const distanceOptions = [
    { label: '5K', value: 3.1 },
    { label: '10K', value: 6.2 },
    { label: 'Half Marathon', value: 13.1 },
    { label: 'Marathon', value: 26.2 },
    { label: '50K', value: 31 },
    { label: '50 Miles', value: 50 },
    { label: '100K', value: 62 },
  ];

  // Auto-format date as user types: inserts dashes at YYYY-MM-DD positions
  const handleDateChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    if (digits.length > 6) formatted = formatted.slice(0, 7) + '-' + digits.slice(6);
    setRaceDate(formatted);
    if (submitted) validateFields({ raceDate: formatted });
  };

  // Auto-format goal time as user types: inserts colons at H:MM:SS positions
  const handleGoalTimeChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    let formatted = digits;
    if (digits.length > 1) formatted = digits.slice(0, 1) + ':' + digits.slice(1);
    if (digits.length > 3) formatted = formatted.slice(0, 4) + ':' + digits.slice(3);
    setGoalFinishTime(formatted);
    if (submitted) validateFields({ goalFinishTime: formatted });
  };

  const validateFields = (overrides: Record<string, string> = {}) => {
    const vals = { name, currentMileage, longestRun, raceDate, easyPace, goalFinishTime, ...overrides };
    const newErrors: Record<string, string> = {};

    if (!vals.name.trim()) newErrors.name = 'Name is required';
    if (!vals.currentMileage) newErrors.currentMileage = 'Weekly mileage is required';
    else if (isNaN(parseFloat(vals.currentMileage)) || parseFloat(vals.currentMileage) <= 0)
      newErrors.currentMileage = 'Enter a valid mileage';
    if (!vals.longestRun) newErrors.longestRun = 'Longest run is required';
    else if (isNaN(parseFloat(vals.longestRun)) || parseFloat(vals.longestRun) <= 0)
      newErrors.longestRun = 'Enter a valid distance';
    if (!vals.raceDate || vals.raceDate.length < 10) newErrors.raceDate = 'Enter a valid date (YYYY-MM-DD)';
    else {
      const race = new Date(vals.raceDate);
      if (isNaN(race.getTime())) newErrors.raceDate = 'Invalid date';
      else if (race <= new Date()) newErrors.raceDate = 'Race date must be in the future';
    }
    if (vals.easyPace && !/^\d+:\d{2}$/.test(vals.easyPace))
      newErrors.easyPace = 'Format must be M:SS (e.g. 9:30)';
    if (vals.goalFinishTime && !/^\d:\d{2}:\d{2}$/.test(vals.goalFinishTime))
      newErrors.goalFinishTime = 'Format must be H:MM:SS (e.g. 3:45:00)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!validateFields()) return;

    setLoading(true);
    try {
      const userProfile: UserProfile = {
        id: uuidv4() as string,
        name: name.trim(),
        experienceLevel,
        currentWeeklyMileage: parseFloat(currentMileage),
        longestRun: parseFloat(longestRun),
        goalFinishTime: goalFinishTime || undefined,
        preferences: {
          units: 'miles',
          startDay: 0,
          notificationsEnabled: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const trainingPlan = generateTrainingPlan({
        raceDate,
        goalDistance,
        currentWeeklyMileage: parseFloat(currentMileage),
        longestRun: parseFloat(longestRun),
        experienceLevel,
        easyPace,
        goalFinishTime: goalFinishTime || undefined,
      });

      await setUser(userProfile);
      await setTrainingPlan(trainingPlan);
      await completeOnboarding();

      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error creating profile:', error);
      setErrors({ submit: 'Failed to create your profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const hasError = (field: string) => submitted && !!errors[field];

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Welcome to Race Training!</Title>
            <Paragraph>
              Let's set up your personalized training plan for your goal race.
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Goal Distance */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Goal Race Distance</Title>
            <View style={styles.chipRow}>
              {distanceOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  mode={goalDistance === opt.value ? 'flat' : 'outlined'}
                  selected={goalDistance === opt.value}
                  onPress={() => setGoalDistance(opt.value)}
                  style={[
                    styles.distanceChip,
                    goalDistance === opt.value && styles.distanceChipSelected,
                  ]}
                  textStyle={goalDistance === opt.value ? styles.distanceChipTextSelected : undefined}
                >
                  {opt.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* About You */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>About You</Title>

            <TextInput
              label="Your Name"
              value={name}
              onChangeText={(v) => { setName(v); if (submitted) validateFields({ name: v }); }}
              mode="outlined"
              style={styles.input}
              error={hasError('name')}
            />
            <HelperText type="error" visible={hasError('name')}>{errors.name}</HelperText>

            <Paragraph style={styles.label}>Experience Level</Paragraph>
            <RadioButton.Group
              onValueChange={(value) => setExperienceLevel(value as ExperienceLevel)}
              value={experienceLevel}
            >
              <View style={styles.radioItem}>
                <RadioButton value="beginner" />
                <Text>Beginner - New to distance running</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="intermediate" />
                <Text>Intermediate - Have run marathons</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="advanced" />
                <Text>Advanced - Experienced ultrarunner</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Current Fitness */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Current Fitness</Title>

            <TextInput
              label="Current Weekly Mileage (miles)"
              value={currentMileage}
              onChangeText={(v) => { setCurrentMileage(v); if (submitted) validateFields({ currentMileage: v }); }}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 25"
              error={hasError('currentMileage')}
            />
            <HelperText type="error" visible={hasError('currentMileage')}>{errors.currentMileage}</HelperText>

            <TextInput
              label="Longest Recent Run (miles)"
              value={longestRun}
              onChangeText={(v) => { setLongestRun(v); if (submitted) validateFields({ longestRun: v }); }}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 13"
              error={hasError('longestRun')}
            />
            <HelperText type="error" visible={hasError('longestRun')}>{errors.longestRun}</HelperText>

            <TextInput
              label="Easy Run Pace (min:sec per mile)"
              value={easyPace}
              onChangeText={(v) => { setEasyPace(v); if (submitted) validateFields({ easyPace: v }); }}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 9:30"
              error={hasError('easyPace')}
            />
            <HelperText type="error" visible={hasError('easyPace')}>{errors.easyPace}</HelperText>

            <TextInput
              label="Goal Finish Time (optional)"
              value={goalFinishTime}
              onChangeText={handleGoalTimeChange}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 3:45:00"
              keyboardType="numeric"
              maxLength={7}
              error={hasError('goalFinishTime')}
            />
            <HelperText type={hasError('goalFinishTime') ? 'error' : 'info'} visible>
              {hasError('goalFinishTime') ? errors.goalFinishTime : 'Target finish time — calibrates your training paces'}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Race Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Race Information</Title>

            <TextInput
              label="Race Date"
              value={raceDate}
              onChangeText={handleDateChange}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
              maxLength={10}
              error={hasError('raceDate')}
            />
            <HelperText type={hasError('raceDate') ? 'error' : 'info'} visible>
              {hasError('raceDate') ? errors.raceDate : 'Type digits — dashes added automatically'}
            </HelperText>
          </Card.Content>
        </Card>

        {errors.submit && (
          <HelperText type="error" visible style={styles.submitError}>
            {errors.submit}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Create My Training Plan
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  label: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  distanceChip: {
    marginBottom: 4,
  },
  distanceChipSelected: {
    backgroundColor: '#6200ea',
  },
  distanceChipTextSelected: {
    color: '#fff',
  },
  submitButton: {
    marginVertical: 24,
  },
  submitError: {
    textAlign: 'center',
    fontSize: 14,
  },
});
