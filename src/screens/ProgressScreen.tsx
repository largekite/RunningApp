import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { getDynamicWeekNumber } from '../utils/dateHelpers';

export function ProgressScreen() {
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
});
