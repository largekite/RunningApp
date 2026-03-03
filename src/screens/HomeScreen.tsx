import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Divider } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { getTodayDate, getDynamicWeekNumber } from '../utils/dateHelpers';
import NutritionService from '../services/nutrition.service';
import { getSleepRecommendation } from '../constants/sleepGuidelines';
import { DailyWorkout } from '../context/types';

export function HomeScreen({ navigation }: any) {
  const { state } = useApp();
  const today = getTodayDate();

  // Get today's workout
  const todayWorkout = useMemo(() => {
    if (!state.trainingPlan) return null;

    for (const week of state.trainingPlan.weeks) {
      const workout = week.workouts.find((w) => w.date === today);
      if (workout) return workout;
    }
    return null;
  }, [state.trainingPlan, today]);

  // Get today's check-in if it exists
  const todayCheckIn = state.checkIns[today];

  // Get nutrition tip
  const nutritionTip = useMemo(() => {
    if (!todayWorkout) return null;
    return NutritionService.getTipForWorkout(todayWorkout.type);
  }, [todayWorkout]);

  // Get sleep recommendation
  const sleepRecommendation = useMemo(() => {
    if (!state.trainingPlan) return null;

    const dynamicWeek = getDynamicWeekNumber(state.trainingPlan.startDate, state.trainingPlan.totalWeeks);
    const currentWeek = state.trainingPlan.weeks.find((w) => w.weekNumber === dynamicWeek);
    const weeklyMileage = currentWeek?.totalMileage || 0;

    // Get tomorrow's workout
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    let tomorrowWorkout: DailyWorkout | undefined;
    for (const week of state.trainingPlan.weeks) {
      tomorrowWorkout = week.workouts.find((w) => w.date === tomorrowDate);
      if (tomorrowWorkout) break;
    }

    const recentSleep = todayCheckIn?.sleepHours;

    return getSleepRecommendation(weeklyMileage, tomorrowWorkout, recentSleep);
  }, [state.trainingPlan, todayCheckIn]);

  // Workout type label
  const getWorkoutTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!todayWorkout) {
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>No Workout Planned</Title>
            <Paragraph>
              You don't have a training plan set up yet. Complete onboarding to get started!
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Today's Workout Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title>Today's Workout</Title>
            <Chip mode="outlined">{getWorkoutTypeLabel(todayWorkout.type)}</Chip>
          </View>

          {todayWorkout.modified && (
            <Card style={styles.modifiedCard}>
              <Card.Content>
                <Paragraph style={styles.modifiedText}>
                  ⚠️ Workout adjusted: {todayWorkout.modificationReason}
                </Paragraph>
              </Card.Content>
            </Card>
          )}

          {todayWorkout.type !== 'rest' ? (
            <>
              <View style={styles.workoutDetails}>
                {todayWorkout.targetDistance && (
                  <View style={styles.detail}>
                    <Paragraph style={styles.detailLabel}>Distance</Paragraph>
                    <Title>{todayWorkout.targetDistance} miles</Title>
                  </View>
                )}

                {todayWorkout.targetPace && todayWorkout.targetPace !== '0:00' && (
                  <View style={styles.detail}>
                    <Paragraph style={styles.detailLabel}>Avg Pace</Paragraph>
                    <Title>{todayWorkout.targetPace} /mi</Title>
                  </View>
                )}
              </View>

              {todayWorkout.segments && todayWorkout.segments.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Paragraph style={styles.segmentsLabel}>Workout Breakdown</Paragraph>
                  {todayWorkout.segments.map((seg, idx) => (
                    <View key={idx} style={styles.segmentRow}>
                      <View style={styles.segmentIndex}>
                        <Paragraph style={styles.segmentIndexText}>{idx + 1}</Paragraph>
                      </View>
                      <View style={styles.segmentBody}>
                        <View style={styles.segmentHeader}>
                          <Paragraph style={styles.segmentName}>{seg.name}</Paragraph>
                          <View style={styles.segmentMeta}>
                            {seg.distance != null && (
                              <Paragraph style={styles.segmentStat}>{seg.distance} mi</Paragraph>
                            )}
                            {seg.duration != null && !seg.distance && (
                              <Paragraph style={styles.segmentStat}>{seg.duration} min</Paragraph>
                            )}
                            {seg.pace && seg.pace !== '0:00' && (
                              <Paragraph style={styles.segmentPace}>@ {seg.pace}/mi</Paragraph>
                            )}
                          </View>
                        </View>
                        <Paragraph style={styles.segmentDesc}>{seg.description}</Paragraph>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {todayWorkout.notes && (
                <>
                  <Divider style={styles.divider} />
                  <Paragraph style={styles.notes}>{todayWorkout.notes}</Paragraph>
                </>
              )}
            </>
          ) : (
            <Paragraph style={styles.restDay}>
              🛌 Rest day! Focus on recovery, sleep, and nutrition.
            </Paragraph>
          )}
        </Card.Content>

        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('CheckIn', { workout: todayWorkout })}
            disabled={!!todayCheckIn}
          >
            {todayCheckIn ? '✓ Checked In' : 'Check In'}
          </Button>
        </Card.Actions>
      </Card>

      {/* Nutrition Tip Card */}
      {nutritionTip && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>🥗 Nutrition Tip</Title>
            <Paragraph style={styles.tipTitle}>{nutritionTip.title}</Paragraph>
            <Paragraph>{nutritionTip.description}</Paragraph>

            {nutritionTip.timing && (
              <Chip style={styles.chip} icon="clock-outline">
                {nutritionTip.timing}
              </Chip>
            )}

            {nutritionTip.recommendations && (
              <View style={styles.recommendations}>
                {nutritionTip.recommendations.map((rec, idx) => (
                  <Paragraph key={idx} style={styles.recommendation}>
                    • {rec}
                  </Paragraph>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Sleep Recommendation Card */}
      {sleepRecommendation && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>😴 Sleep Recommendation</Title>
            <View style={styles.sleepTarget}>
              <Paragraph style={styles.sleepLabel}>Tonight's Target</Paragraph>
              <Title style={styles.sleepHours}>{sleepRecommendation.targetHours} hours</Title>
            </View>
            <Paragraph style={styles.sleepReason}>{sleepRecommendation.reason}</Paragraph>

            {sleepRecommendation.tips && (
              <View style={styles.recommendations}>
                {sleepRecommendation.tips.map((tip, idx) => (
                  <Paragraph key={idx} style={styles.recommendation}>
                    • {tip}
                  </Paragraph>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Weekly Progress Summary */}
      {state.trainingPlan && (() => {
        const dynWeek = getDynamicWeekNumber(state.trainingPlan.startDate, state.trainingPlan.totalWeeks);
        const weekData = state.trainingPlan.weeks[dynWeek - 1];
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Title>This Week</Title>
              <View style={styles.weeklyStats}>
                <View style={styles.stat}>
                  <Paragraph style={styles.statLabel}>Week</Paragraph>
                  <Title>{dynWeek} / {state.trainingPlan.totalWeeks}</Title>
                </View>
                <View style={styles.stat}>
                  <Paragraph style={styles.statLabel}>Target Miles</Paragraph>
                  <Title>{weekData?.totalMileage || 0}</Title>
                </View>
                <View style={styles.stat}>
                  <Paragraph style={styles.statLabel}>Phase</Paragraph>
                  <Paragraph style={styles.phaseText}>
                    {weekData?.focus.replace(/ \(Recovery\)$/, '') || ''}
                  </Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>
        );
      })()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modifiedCard: {
    backgroundColor: '#fff3cd',
    marginBottom: 12,
  },
  modifiedText: {
    color: '#856404',
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  detail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  notes: {
    fontStyle: 'italic',
    color: '#666',
  },
  restDay: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  tipTitle: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  chip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  recommendations: {
    marginTop: 12,
  },
  recommendation: {
    marginVertical: 2,
    color: '#444',
  },
  sleepTarget: {
    alignItems: 'center',
    marginVertical: 12,
  },
  sleepLabel: {
    fontSize: 12,
    color: '#666',
  },
  sleepHours: {
    fontSize: 32,
    color: '#6200ea',
  },
  sleepReason: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  phaseText: {
    fontSize: 12,
    color: '#6200ea',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  segmentsLabel: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#444',
    marginTop: 4,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  segmentIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6200ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  segmentIndexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  segmentBody: {
    flex: 1,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  segmentName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
  },
  segmentMeta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  segmentStat: {
    fontSize: 12,
    color: '#555',
    fontWeight: 'bold',
  },
  segmentPace: {
    fontSize: 12,
    color: '#6200ea',
    fontWeight: 'bold',
  },
  segmentDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
});
