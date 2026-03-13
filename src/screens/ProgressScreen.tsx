import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, Button } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { getDynamicWeekNumber } from '../utils/dateHelpers';
import { paceToSeconds } from '../utils/paceCalculator';

let TrainingLoadService: any = null;
try { TrainingLoadService = require('../services/trainingLoad.service').default; } catch {}

// Standard distances for PR tracking
const PR_DISTANCES = [
  { label: '1 Mile', miles: 1.0 },
  { label: '5K', miles: 3.1 },
  { label: '10K', miles: 6.2 },
  { label: 'Half', miles: 13.1 },
  { label: 'Marathon', miles: 26.2 },
];

export function ProgressScreen({ navigation }: any) {
  const { state } = useApp();

  const dynamicWeek = state.trainingPlan
    ? getDynamicWeekNumber(state.trainingPlan.startDate, state.trainingPlan.totalWeeks)
    : 1;

  // Calculate stats
  const stats = useMemo(() => {
    const checkInArray = Object.values(state.checkIns);
    const completed = checkInArray.filter((c) => c.completed);

    const totalMiles = completed.reduce((sum, c) => sum + (c.actualDistance || 0), 0);
    const longestRun = Math.max(...completed.map((c) => c.actualDistance || 0), 0);
    const completionRate = checkInArray.length > 0
      ? (completed.length / checkInArray.length) * 100 : 0;
    const averageRPE = completed.length > 0
      ? completed.reduce((sum, c) => sum + (c.perceivedEffort || 0), 0) / completed.length : 0;
    const averageSleep = checkInArray.length > 0
      ? checkInArray.reduce((sum, c) => sum + (c.sleepHours || 0), 0) / checkInArray.length : 0;

    // Streak: count consecutive days with a completed check-in ending today or yesterday
    const sortedDates = Object.keys(state.checkIns).sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let expected = new Date(today);
    for (const date of sortedDates) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((expected.getTime() - d.getTime()) / 86400000);
      if (diffDays === 0 && state.checkIns[date].completed) {
        streak++;
        expected.setDate(expected.getDate() - 1);
      } else if (diffDays === 1 && streak === 0) {
        // Allow starting streak from yesterday if today not yet logged
        expected = new Date(d);
        if (state.checkIns[date].completed) {
          streak++;
          expected.setDate(expected.getDate() - 1);
        } else break;
      } else break;
    }

    return {
      totalMiles: totalMiles.toFixed(1),
      longestRun: longestRun.toFixed(1),
      completionRate: completionRate.toFixed(0),
      workoutsCompleted: completed.length,
      totalWorkouts: checkInArray.length,
      averageRPE: averageRPE.toFixed(1),
      averageSleep: averageSleep.toFixed(1),
      streak,
    };
  }, [state.checkIns]);

  // Race predictor using Riegel's formula: T2 = T1 * (D2/D1)^1.06
  const racePrediction = useMemo(() => {
    if (!state.trainingPlan) return null;
    const goalDistance = state.trainingPlan.goalDistance;

    const completed = Object.values(state.checkIns).filter(
      c => c.completed && c.actualDistance && c.actualDistance >= 1 && c.actualPace
    );
    if (completed.length === 0) return null;

    // Use the longest run for the most reliable projection
    const best = completed.reduce((prev, curr) =>
      (curr.actualDistance || 0) > (prev.actualDistance || 0) ? curr : prev
    );

    const d1 = best.actualDistance!;
    const t1Minutes = (d1 * paceToSeconds(best.actualPace!)) / 60;
    const t2Minutes = t1Minutes * Math.pow(goalDistance / d1, 1.06);

    const totalSecs = Math.round(t2Minutes * 60);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const predictedTime = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Compare to goal
    const goalTime: string | undefined = state.user?.goalFinishTime;
    let delta: string | null = null;
    let faster = false;
    if (goalTime) {
      const parts = goalTime.split(':').map(Number);
      const goalSecs = parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
      const diffSecs = Math.abs(totalSecs - goalSecs);
      const dh = Math.floor(diffSecs / 3600);
      const dm = Math.floor((diffSecs % 3600) / 60);
      const ds = diffSecs % 60;
      delta = dh > 0
        ? `${dh}h ${dm}m ${ds}s`
        : dm > 0 ? `${dm}m ${ds}s` : `${ds}s`;
      faster = totalSecs < goalSecs;
    }

    return { predictedTime, basedOn: `${d1.toFixed(1)} mi @ ${best.actualPace}/mi`, delta, faster, goalTime };
  }, [state.checkIns, state.trainingPlan, state.user]);

  // Per-distance PRs
  const prsByDistance = useMemo(() => {
    const completed = Object.values(state.checkIns).filter(c => c.completed && c.actualDistance && c.actualPace);
    return PR_DISTANCES.map(({ label, miles }) => {
      const qualifying = completed.filter(c => (c.actualDistance ?? 0) >= miles);
      if (qualifying.length === 0) return { label, miles, pr: null };
      const best = qualifying.reduce((prev, curr) =>
        paceToSeconds(curr.actualPace!) < paceToSeconds(prev.actualPace!) ? curr : prev
      );
      const totalSecs = miles * paceToSeconds(best.actualPace!);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = Math.round(totalSecs % 60);
      const time = h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
      return { label, miles, pr: { pace: best.actualPace!, time, date: best.date } };
    });
  }, [state.checkIns]);

  // Training load
  const trainingLoad = useMemo(() => {
    if (!TrainingLoadService) return null;
    try {
      const checkIns = Object.values(state.checkIns).filter(c => c.completed);
      if (checkIns.length === 0) return null;
      return TrainingLoadService.getCurrentLoad(checkIns, '9:30');
    } catch { return null; }
  }, [state.checkIns]);

  // Latest body weight
  const latestWeight = state.bodyWeightEntries.length > 0
    ? state.bodyWeightEntries[state.bodyWeightEntries.length - 1]
    : null;
  const firstWeight = state.bodyWeightEntries.length > 1
    ? state.bodyWeightEntries[0]
    : null;

  // Active injuries
  const activeInjuries = state.injuries.filter(i => !i.resolved);

  // Recent workout history (last 10 completed check-ins)
  const recentHistory = useMemo(() => {
    return Object.entries(state.checkIns)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10);
  }, [state.checkIns]);

  const getWorkoutLabel = (date: string) => {
    const plan = state.trainingPlan;
    if (!plan) return '';
    for (const week of plan.weeks) {
      const w = week.workouts.find((wo) => wo.date === date);
      if (w) return w.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return '';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Training Progress</Title>
          {state.trainingPlan && (
            <Paragraph>
              Week {dynamicWeek} of {state.trainingPlan.totalWeeks} —{' '}
              {state.trainingPlan.weeks[dynamicWeek - 1]?.focus.replace(/ \(Recovery\)$/, '')}
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Streak */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Paragraph style={styles.bigNumber}>{stats.streak}</Paragraph>
              <Paragraph style={styles.label}>Day Streak 🔥</Paragraph>
            </View>
            <View style={styles.column}>
              <Paragraph style={styles.bigNumber}>{stats.completionRate}%</Paragraph>
              <Paragraph style={styles.label}>Completion Rate</Paragraph>
              <Paragraph style={styles.subLabel}>
                {stats.workoutsCompleted} of {stats.totalWorkouts} workouts
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Distance stats */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Paragraph style={styles.number}>{stats.totalMiles}</Paragraph>
              <Paragraph style={styles.label}>Total Miles</Paragraph>
            </View>
            <View style={styles.column}>
              <Paragraph style={styles.number}>{stats.longestRun}</Paragraph>
              <Paragraph style={styles.label}>Longest Run</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Avg RPE & Sleep */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Paragraph style={styles.number}>{stats.averageRPE}</Paragraph>
              <Paragraph style={styles.label}>Avg RPE</Paragraph>
            </View>
            <View style={styles.column}>
              <Paragraph style={styles.number}>{stats.averageSleep}</Paragraph>
              <Paragraph style={styles.label}>Avg Sleep (hrs)</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Race Predictor */}
      {racePrediction && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Race Predictor</Title>
            <Paragraph style={styles.predictorSub}>
              Based on: {racePrediction.basedOn}
            </Paragraph>
            <View style={styles.predictorRow}>
              <View style={styles.column}>
                <Paragraph style={styles.number}>{racePrediction.predictedTime}</Paragraph>
                <Paragraph style={styles.label}>Predicted Finish</Paragraph>
              </View>
              {racePrediction.goalTime && racePrediction.delta && (
                <View style={styles.column}>
                  <Paragraph style={[styles.deltaNumber, { color: racePrediction.faster ? '#2e7d32' : '#c62828' }]}>
                    {racePrediction.faster ? '-' : '+'}{racePrediction.delta}
                  </Paragraph>
                  <Paragraph style={styles.label}>vs Goal</Paragraph>
                </View>
              )}
            </View>
            {!racePrediction.goalTime && (
              <Paragraph style={styles.predictorHint}>
                Set a goal finish time in onboarding to see how you compare.
              </Paragraph>
            )}
          </Card.Content>
        </Card>
      )}

      {/* PR Dashboard */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.injuryHeader}>
            <Title>Personal Records</Title>
            <Button compact mode="outlined" onPress={() => navigation.navigate('PRDashboard')}>
              Full PR Table
            </Button>
          </View>
          {prsByDistance.map(({ label, pr }) => (
            <View key={label} style={styles.prRow}>
              <View style={styles.prDistLabel}>
                <Paragraph style={styles.prDist}>{label}</Paragraph>
              </View>
              {pr ? (
                <View style={styles.prData}>
                  <Paragraph style={styles.prPace}>{pr.pace}/mi</Paragraph>
                  <Paragraph style={styles.prTime}>{pr.time}</Paragraph>
                </View>
              ) : (
                <Paragraph style={styles.prEmpty}>—</Paragraph>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Training Load */}
      {trainingLoad && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.injuryHeader}>
              <Title>Training Load</Title>
              <Button compact mode="outlined" onPress={() => navigation.navigate('TrainingLoad')}>
                Details
              </Button>
            </View>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <Paragraph style={[styles.number, { color: trainingLoad.color }]}>
                  {trainingLoad.tsb > 0 ? '+' : ''}{Math.round(trainingLoad.tsb)}
                </Paragraph>
                <Paragraph style={styles.label}>Form (TSB)</Paragraph>
                <Paragraph style={[styles.subLabel, { color: trainingLoad.color }]}>{trainingLoad.label}</Paragraph>
              </View>
              <View style={styles.column}>
                <Paragraph style={styles.number}>{Math.round(trainingLoad.ctl)}</Paragraph>
                <Paragraph style={styles.label}>Fitness (CTL)</Paragraph>
              </View>
              <View style={styles.column}>
                <Paragraph style={styles.number}>{Math.round(trainingLoad.atl)}</Paragraph>
                <Paragraph style={styles.label}>Fatigue (ATL)</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Body Weight */}
      {latestWeight && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.injuryHeader}>
              <Title>Body Weight</Title>
              <Button compact mode="outlined" onPress={() => navigation.navigate('BodyWeight')}>
                Log / Chart
              </Button>
            </View>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <Paragraph style={styles.number}>{latestWeight.weightKg.toFixed(1)}</Paragraph>
                <Paragraph style={styles.label}>kg (latest)</Paragraph>
              </View>
              {firstWeight && firstWeight.date !== latestWeight.date && (
                <View style={styles.column}>
                  {(() => {
                    const delta = latestWeight.weightKg - firstWeight.weightKg;
                    const color = delta < 0 ? '#2e7d32' : delta > 0 ? '#c62828' : '#666';
                    return (
                      <>
                        <Paragraph style={[styles.number, { color }]}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                        </Paragraph>
                        <Paragraph style={styles.label}>kg change</Paragraph>
                      </>
                    );
                  })()}
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Injury Log */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.injuryHeader}>
            <Title>Injury Log</Title>
            <Button
              mode="outlined"
              compact
              onPress={() => navigation.navigate('Injuries')}
            >
              {activeInjuries.length > 0 ? `${activeInjuries.length} Active` : 'View / Log'}
            </Button>
          </View>
          {activeInjuries.length > 0 ? (
            activeInjuries.map(injury => (
              <Chip
                key={injury.id}
                icon="alert-circle"
                style={styles.injuryChip}
                textStyle={styles.injuryChipText}
              >
                {injury.bodyPart.replace(/_/g, ' ')} — {injury.severity}
              </Chip>
            ))
          ) : (
            <Paragraph style={styles.noInjury}>No active injuries. Stay healthy!</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Workout History */}
      {recentHistory.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Recent Workouts</Title>
            {recentHistory.map(([date, checkIn], index) => (
              <View key={date}>
                {index > 0 && <Divider />}
                <View style={styles.historyRow}>
                  <View style={styles.historyInfo}>
                    <Paragraph style={styles.historyDate}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </Paragraph>
                    <Paragraph style={styles.historyWorkout}>{getWorkoutLabel(date)}</Paragraph>
                  </View>
                  <View style={styles.historyStats}>
                    {checkIn.completed ? (
                      <>
                        <Paragraph style={styles.historyMiles}>
                          {checkIn.actualDistance?.toFixed(1)} mi
                        </Paragraph>
                        <Chip compact mode="flat" style={styles.completedChip} textStyle={styles.completedChipText}>
                          Done
                        </Chip>
                      </>
                    ) : (
                      <Chip compact mode="outlined" style={styles.skippedChip} textStyle={styles.skippedChipText}>
                        Skipped
                      </Chip>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
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
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  column: {
    alignItems: 'center',
  },
  bigNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: 'bold',
    color: '#6200ea',
    textAlign: 'center',
  },
  number: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
    color: '#6200ea',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  subLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  predictorSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 12,
  },
  predictorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  deltaNumber: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  predictorHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  injuryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  injuryChip: {
    backgroundColor: '#fff3e0',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  injuryChipText: {
    color: '#e65100',
    textTransform: 'capitalize',
  },
  noInjury: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  historyWorkout: {
    fontSize: 12,
    color: '#666',
  },
  historyStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyMiles: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  completedChip: {
    backgroundColor: '#e8f5e9',
  },
  completedChipText: {
    color: '#2e7d32',
    fontSize: 11,
  },
  skippedChip: {
    borderColor: '#ffcdd2',
  },
  skippedChipText: {
    color: '#c62828',
    fontSize: 11,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  prDistLabel: {
    width: 80,
  },
  prDist: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  prData: {
    alignItems: 'flex-end',
  },
  prPace: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  prTime: {
    fontSize: 12,
    color: '#888',
  },
  prEmpty: {
    fontSize: 14,
    color: '#ccc',
  },
});
