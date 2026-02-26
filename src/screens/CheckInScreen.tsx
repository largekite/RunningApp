import React, { useState, useMemo } from 'react';
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
import NotificationService from '../services/notification.service';

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

  // Ghost: find last completed check-in of the same workout type
  const ghostData = useMemo(() => {
    if (workout.type === 'rest' || !state.trainingPlan) return null;

    // Build workoutId -> type map from training plan
    const workoutTypeMap: Record<string, string> = {};
    for (const week of state.trainingPlan.weeks) {
      for (const wo of week.workouts) {
        workoutTypeMap[wo.id] = wo.type;
      }
    }

    // Most recent completed check-in of the same type (excluding today)
    return Object.values(state.checkIns)
      .filter(c =>
        c.completed &&
        c.date !== workout.date &&
        workoutTypeMap[c.workoutId] === workout.type &&
        c.actualDistance != null &&
        c.actualPace != null
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }, [state.checkIns, state.trainingPlan, workout.date, workout.type]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const paceToSeconds = (pace: string) => {
    const [min, sec] = pace.split(':').map(Number);
    return min * 60 + (sec || 0);
  };

  // PR detection: best pace and longest run for this workout type
  const prData = useMemo(() => {
    if (workout.type === 'rest' || !state.trainingPlan) return null;

    const workoutTypeMap: Record<string, string> = {};
    for (const week of state.trainingPlan.weeks) {
      for (const wo of week.workouts) {
        workoutTypeMap[wo.id] = wo.type;
      }
    }

    const sameType = Object.values(state.checkIns).filter(c =>
      c.completed &&
      c.date !== workout.date &&
      workoutTypeMap[c.workoutId] === workout.type &&
      c.actualPace != null
    );
    if (sameType.length === 0) return null;

    const bestEntry = sameType.reduce((prev, curr) =>
      paceToSeconds(curr.actualPace!) < paceToSeconds(prev.actualPace!) ? curr : prev
    );
    const longestDistance = Math.max(...sameType.map(c => c.actualDistance || 0));

    return {
      bestPace: bestEntry.actualPace!,
      bestPaceSeconds: paceToSeconds(bestEntry.actualPace!),
      longestDistance,
    };
  }, [state.checkIns, state.trainingPlan, workout.date, workout.type]);

  // Readiness score based on recent sleep, RPE, and completion rate
  const readiness = useMemo(() => {
    const recent = Object.values(state.checkIns)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
    if (recent.length === 0) return null;

    let score = 100;

    const lastSleep = recent[0]?.sleepHours ?? 7;
    if (lastSleep < 6) score -= 30;
    else if (lastSleep < 7) score -= 15;

    const qualityEntries = recent.filter(c => c.sleepQuality != null);
    if (qualityEntries.length > 0) {
      const avg = qualityEntries.reduce((s, c) => s + c.sleepQuality!, 0) / qualityEntries.length;
      if (avg < 2) score -= 15;
      else if (avg < 3) score -= 8;
    }

    const lastCompleted = recent.find(c => c.completed && c.perceivedEffort != null);
    const lastRPE = lastCompleted?.perceivedEffort ?? 3;
    if (lastRPE >= 5) score -= 25;
    else if (lastRPE >= 4) score -= 15;

    let consecutiveMissed = 0;
    for (const c of recent) {
      if (!c.completed) consecutiveMissed++;
      else break;
    }
    if (consecutiveMissed >= 2) score -= 20;
    else if (consecutiveMissed === 1) score -= 5;

    score = Math.max(0, Math.min(100, score));

    if (score >= 70) return { score, label: 'High', color: '#2e7d32' };
    if (score >= 40) return { score, label: 'Moderate', color: '#e65100' };
    return { score, label: 'Low', color: '#c62828' };
  }, [state.checkIns]);

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

      // Cancel the evening nudge — workout is logged
      await NotificationService.cancelEveningNudge();

      // If completed, run adaptation algorithm for future workouts
      if (completed && state.trainingPlan) {
        adaptFutureWorkouts(checkIn);
      }

      let successMsg = completed ? 'Workout logged!' : 'Workout marked as skipped.';
      if (completed && ghostData && calculatedPace && ghostData.actualPace) {
        const diffSecs = paceToSeconds(ghostData.actualPace) - paceToSeconds(calculatedPace);
        if (diffSecs > 0) {
          const m = Math.floor(Math.abs(diffSecs) / 60);
          const s = Math.abs(diffSecs) % 60;
          successMsg += `\n\n👻 You beat your ghost by ${m > 0 ? `${m}m ` : ''}${s}s/mile!`;
        } else if (diffSecs < 0) {
          const m = Math.floor(Math.abs(diffSecs) / 60);
          const s = Math.abs(diffSecs) % 60;
          successMsg += `\n\n👻 Ghost was ${m > 0 ? `${m}m ` : ''}${s}s/mile faster. Keep chasing!`;
        } else {
          successMsg += '\n\n👻 You matched your ghost exactly!';
        }
      }

      Alert.alert('Success!', successMsg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
      {/* Readiness Score */}
      {readiness && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.readinessRow}>
              <View>
                <Paragraph style={styles.readinessLabel}>Today's Readiness</Paragraph>
                <Paragraph style={[styles.readinessScore, { color: readiness.color }]}>
                  {readiness.label}
                </Paragraph>
              </View>
              <View style={[styles.readinessBadge, { backgroundColor: readiness.color + '22' }]}>
                <Paragraph style={[styles.readinessNumber, { color: readiness.color }]}>
                  {readiness.score}
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

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

      {/* Ghost Card — previous performance for this workout type */}
      {ghostData && (
        <Card style={styles.ghostCard}>
          <Card.Content>
            <View style={styles.ghostHeader}>
              <Paragraph style={styles.ghostTitle}>👻 Your Ghost</Paragraph>
              <Paragraph style={styles.ghostDate}>
                {new Date(ghostData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Paragraph>
            </View>
            <View style={styles.ghostStats}>
              <View style={styles.ghostStat}>
                <Paragraph style={styles.ghostNumber}>{ghostData.actualDistance?.toFixed(1)}</Paragraph>
                <Paragraph style={styles.ghostLabel}>miles</Paragraph>
              </View>
              <View style={styles.ghostStat}>
                <Paragraph style={styles.ghostNumber}>{ghostData.actualPace}</Paragraph>
                <Paragraph style={styles.ghostLabel}>/mile</Paragraph>
              </View>
              {ghostData.actualDuration != null && (
                <View style={styles.ghostStat}>
                  <Paragraph style={styles.ghostNumber}>{formatDuration(ghostData.actualDuration)}</Paragraph>
                  <Paragraph style={styles.ghostLabel}>time</Paragraph>
                </View>
              )}
              {ghostData.perceivedEffort != null && (
                <View style={styles.ghostStat}>
                  <Paragraph style={styles.ghostNumber}>RPE {ghostData.perceivedEffort}</Paragraph>
                  <Paragraph style={styles.ghostLabel}>effort</Paragraph>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

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

            {calculatedPace && prData && paceToSeconds(calculatedPace) < prData.bestPaceSeconds && (
              <View style={styles.prBanner}>
                <Paragraph style={styles.prText}>🏆 New PR pace! (prev best: {prData.bestPace}/mile)</Paragraph>
              </View>
            )}

            {distance && prData && workout.type === 'long_run' && parseFloat(distance) > prData.longestDistance && (
              <View style={styles.prBanner}>
                <Paragraph style={styles.prText}>🏆 Longest run ever! (prev: {prData.longestDistance.toFixed(1)} mi)</Paragraph>
              </View>
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
  ghostCard: {
    marginBottom: 16,
    backgroundColor: '#f3e5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#6200ea',
  },
  ghostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ghostTitle: {
    fontWeight: 'bold',
    color: '#6200ea',
    fontSize: 14,
  },
  ghostDate: {
    fontSize: 12,
    color: '#999',
  },
  ghostStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  ghostStat: {
    alignItems: 'center',
  },
  ghostNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  ghostLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  readinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessLabel: {
    fontSize: 12,
    color: '#666',
  },
  readinessScore: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  readinessBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readinessNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  prBanner: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  prText: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
