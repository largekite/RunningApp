import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  Chip,
  Divider,
  HelperText,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import uuid from 'react-native-uuid';
import { useApp } from '../context/AppContext';

const uuidv4 = uuid.v4;
import { ActivityCheckIn, DailyWorkout, RPE, QualityScore } from '../context/types';
import { calculatePace } from '../utils/paceCalculator';
import AdaptationService from '../services/adaptation.service';
import { getDynamicWeekNumber } from '../utils/dateHelpers';

interface Props {
  route: {
    params: {
      workout: DailyWorkout;
    };
  };
  navigation: any;
}

export function CheckInScreen({ route, navigation }: Props) {
  const { workout } = route.params;
  const { state, addCheckIn, updateTrainingPlan } = useApp();

  // Form state
  const [completed, setCompleted] = useState(true);
  const [distance, setDistance] = useState(workout.targetDistance?.toString() || '');
  const [duration, setDuration] = useState('');
  const [rpe, setRpe] = useState<RPE>(3);
  const [sleepHours, setSleepHours] = useState('7.5');
  const [sleepQuality, setSleepQuality] = useState<QualityScore>(3);
  const [nutritionScore, setNutritionScore] = useState<QualityScore>(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculated pace
  const calculatedPace = distance && duration
    ? calculatePace(parseFloat(distance), parseFloat(duration))
    : null;

  const handleSubmit = async () => {
    // Validation
    if (completed && workout.type !== 'rest' && (!distance || !duration)) {
      Alert.alert('Missing Information', 'Please enter distance and duration for completed workout.');
      return;
    }

    setLoading(true);

    try {
      // Create check-in
      const checkIn: ActivityCheckIn = {
        id: uuidv4() as string,
        date: workout.date,
        workoutId: workout.id,
        completed,
        actualDistance: completed ? parseFloat(distance) : undefined,
        actualDuration: completed ? parseFloat(duration) : undefined,
        actualPace: calculatedPace || undefined,
        perceivedEffort: completed ? rpe : undefined,
        sleepHours: parseFloat(sleepHours),
        sleepQuality,
        nutritionScore,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save check-in
      await addCheckIn(checkIn);

      // If completed, run adaptation algorithm for future workouts
      if (completed && state.trainingPlan) {
        adaptFutureWorkouts(checkIn);
      }

      Alert.alert(
        'Success!',
        completed ? 'Workout logged successfully!' : 'Workout marked as skipped.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving check-in:', error);
      Alert.alert('Error', 'Failed to save check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const adaptFutureWorkouts = (checkIn: ActivityCheckIn) => {
    if (!state.trainingPlan) return;

    // Get recent check-ins for adaptation
    const recentDates = Object.keys(state.checkIns).sort().slice(-7);
    const recentCheckIns = recentDates.map((date) => state.checkIns[date]).concat([checkIn]);

    // Find tomorrow's workout and its position in the plan
    const tomorrow = new Date(workout.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    let tomorrowWorkout: DailyWorkout | undefined;
    let weekIndex = -1;
    let workoutIndex = -1;

    for (let wi = 0; wi < state.trainingPlan.weeks.length; wi++) {
      const woi = state.trainingPlan.weeks[wi].workouts.findIndex((w) => w.date === tomorrowDate);
      if (woi !== -1) {
        tomorrowWorkout = state.trainingPlan.weeks[wi].workouts[woi];
        weekIndex = wi;
        workoutIndex = woi;
        break;
      }
    }

    if (!tomorrowWorkout || weekIndex === -1) return;

    const dynamicWeek = getDynamicWeekNumber(state.trainingPlan.startDate, state.trainingPlan.totalWeeks);
    const result = AdaptationService.adaptWorkout({
      plannedWorkout: tomorrowWorkout,
      recentCheckIns,
      currentWeek: dynamicWeek,
      totalWeeks: state.trainingPlan.totalWeeks,
      weeklyMileage: state.trainingPlan.weeks.map((w) => w.totalMileage),
    });

    if (result.adjustedWorkout.modified) {
      const updatedWeeks = state.trainingPlan.weeks.map((week, wi) => {
        if (wi !== weekIndex) return week;
        return {
          ...week,
          workouts: week.workouts.map((wo, woi) =>
            woi === workoutIndex ? result.adjustedWorkout : wo
          ),
        };
      });
      updateTrainingPlan({ weeks: updatedWeeks });
    }
  };

  const getRpeLabel = (value: number) => {
    const labels = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard'];
    return labels[value];
  };

  const getQualityLabel = (value: number) => {
    const labels = ['', 'Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
    return labels[value];
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Log Workout</Title>
          <Chip mode="outlined" style={styles.chip}>
            {workout.type.replace(/_/g, ' ').toUpperCase()}
          </Chip>

          {workout.targetDistance && (
            <Paragraph>Target: {workout.targetDistance} miles @ {workout.targetPace || 'easy pace'}</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Completion Toggle */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Did you complete this workout?</Title>
          <View style={styles.buttonRow}>
            <Button
              mode={completed ? 'contained' : 'outlined'}
              onPress={() => setCompleted(true)}
              style={styles.toggleButton}
            >
              Yes
            </Button>
            <Button
              mode={!completed ? 'contained' : 'outlined'}
              onPress={() => setCompleted(false)}
              style={styles.toggleButton}
            >
              No, I skipped it
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Workout Details (if completed and not a rest day) */}
      {completed && workout.type !== 'rest' && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Workout Details</Title>

            <TextInput
              label="Distance (miles)"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Duration (minutes)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
            />

            {calculatedPace && (
              <HelperText type="info">
                Average Pace: {calculatedPace} /mile
              </HelperText>
            )}

            <Divider style={styles.divider} />

            <Paragraph>Rate of Perceived Effort (RPE): {getRpeLabel(rpe)}</Paragraph>
            <Slider
              value={rpe}
              onValueChange={(value) => setRpe(Math.round(value) as RPE)}
              minimumValue={1}
              maximumValue={5}
              step={1}
              minimumTrackTintColor="#6200ea"
              maximumTrackTintColor="#ccc"
              thumbTintColor="#6200ea"
            />
            <View style={styles.sliderLabels}>
              <Paragraph style={styles.sliderLabel}>Very Easy</Paragraph>
              <Paragraph style={styles.sliderLabel}>Very Hard</Paragraph>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Sleep Tracking */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Sleep (Last Night)</Title>

          <TextInput
            label="Hours of Sleep"
            value={sleepHours}
            onChangeText={setSleepHours}
            keyboardType="decimal-pad"
            mode="outlined"
            style={styles.input}
          />

          <Paragraph style={styles.sliderTitle}>
            Sleep Quality: {getQualityLabel(sleepQuality)}
          </Paragraph>
          <Slider
            value={sleepQuality}
            onValueChange={(value) => setSleepQuality(Math.round(value) as QualityScore)}
            minimumValue={1}
            maximumValue={5}
            step={1}
            minimumTrackTintColor="#6200ea"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#6200ea"
          />
          <View style={styles.sliderLabels}>
            <Paragraph style={styles.sliderLabel}>Very Poor</Paragraph>
            <Paragraph style={styles.sliderLabel}>Excellent</Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Nutrition Tracking */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Nutrition</Title>

          <Paragraph style={styles.sliderTitle}>
            How well did you fuel? {getQualityLabel(nutritionScore)}
          </Paragraph>
          <Slider
            value={nutritionScore}
            onValueChange={(value) => setNutritionScore(Math.round(value) as QualityScore)}
            minimumValue={1}
            maximumValue={5}
            step={1}
            minimumTrackTintColor="#6200ea"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#6200ea"
          />
          <View style={styles.sliderLabels}>
            <Paragraph style={styles.sliderLabel}>Very Poor</Paragraph>
            <Paragraph style={styles.sliderLabel}>Excellent</Paragraph>
          </View>

          <HelperText type="info">
            Consider pre-run fuel, during-run nutrition, and post-run recovery
          </HelperText>
        </Card.Content>
      </Card>

      {/* Notes */}
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="How did you feel? Weather conditions? Anything notable?"
          />
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        Save Check-In
      </Button>
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
  chip: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  toggleButton: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  sliderTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    marginVertical: 24,
  },
});
