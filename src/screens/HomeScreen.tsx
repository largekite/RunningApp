import React, { useMemo, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Divider, ProgressBar } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { getTodayDate, getDynamicWeekNumber, formatDate } from '../utils/dateHelpers';
import NutritionService from '../services/nutrition.service';
import { getSleepRecommendation } from '../constants/sleepGuidelines';
import WeatherService, { WeatherData } from '../services/weather.service';
import { DailyWorkout } from '../context/types';

// Lazy load training load service
let TrainingLoadService: any = null;
try { TrainingLoadService = require('../services/trainingLoad.service').default; } catch {}

export function HomeScreen({ navigation }: any) {
  const { state } = useApp();
  const today = getTodayDate();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    WeatherService.getWeather().then(data => {
      if (!cancelled) { setWeather(data); setWeatherLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  // Training load (TSB)
  const trainingLoad = useMemo(() => {
    if (!TrainingLoadService) return null;
    try {
      const ftpPace = state.user?.goalFinishTime ? undefined : '9:30';
      const checkIns = Object.values(state.checkIns).filter(c => c.completed);
      if (checkIns.length === 0) return null;
      return TrainingLoadService.getCurrentLoad(checkIns, ftpPace ?? '9:30');
    } catch { return null; }
  }, [state.checkIns, state.user]);

  // Today's hydration
  const todayHydration = state.hydrationLogs[today];
  const hydratedMl = todayHydration?.entries.reduce((s, e) => s + e.amountMl, 0) ?? 0;
  const hydrationGoalMl = todayHydration?.goalMl ?? 2500;
  const hydrationRatio = Math.min(hydratedMl / hydrationGoalMl, 1);

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

    // Get tomorrow's workout (use formatDate to get local date, not UTC)
    const tomorrowLocal = new Date();
    tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
    const tomorrowDate = formatDate(tomorrowLocal);

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
    const hasActivePlan = !!state.trainingPlan;
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{hasActivePlan ? 'No Workout Today' : 'Get Started'}</Title>
            <Paragraph>
              {hasActivePlan
                ? "Today is outside your training plan window. Check the Calendar to see your full schedule."
                : "You don't have a training plan yet. Go through onboarding to build your personalized plan."}
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

        <Card.Actions style={styles.cardActions}>
          {todayWorkout.type !== 'rest' && !todayCheckIn && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('LiveRun', { workout: todayWorkout })}
              style={styles.startRunBtn}
              icon="run"
            >
              Start Run
            </Button>
          )}
          {!todayCheckIn ? (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('CheckIn', { workout: todayWorkout })}
            >
              Log Manually
            </Button>
          ) : (
            <Button mode="outlined" disabled icon="check">
              Done
            </Button>
          )}
        </Card.Actions>
      </Card>

      {/* Weather Card */}
      {!weatherLoading && weather && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.weatherHeader}>
              <Title>
                {weather.icon} {weather.condition}
              </Title>
              <Title style={styles.weatherTemp}>{weather.temperature}°F</Title>
            </View>

            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Paragraph style={styles.weatherStatLabel}>Feels like</Paragraph>
                <Paragraph style={styles.weatherStatValue}>{weather.feelsLike}°F</Paragraph>
              </View>
              <View style={styles.weatherStat}>
                <Paragraph style={styles.weatherStatLabel}>Humidity</Paragraph>
                <Paragraph style={styles.weatherStatValue}>{weather.humidity}%</Paragraph>
              </View>
              <View style={styles.weatherStat}>
                <Paragraph style={styles.weatherStatLabel}>Wind</Paragraph>
                <Paragraph style={styles.weatherStatValue}>{weather.windSpeed} mph</Paragraph>
              </View>
            </View>

            <View style={[styles.adviceBanner, { backgroundColor: weather.adviceColor + '22' }]}>
              <Paragraph style={[styles.adviceText, { color: weather.adviceColor }]}>
                {weather.runningAdvice}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>
      )}

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

      {/* Training Load Card */}
      {trainingLoad && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Title>Training Load</Title>
              <Button compact mode="text" onPress={() => navigation.navigate('TrainingLoad')}>
                Details
              </Button>
            </View>
            <View style={styles.weeklyStats}>
              <View style={styles.stat}>
                <Paragraph style={styles.statLabel}>Form (TSB)</Paragraph>
                <Title style={{ color: trainingLoad.color }}>
                  {trainingLoad.tsb > 0 ? '+' : ''}{Math.round(trainingLoad.tsb)}
                </Title>
                <Paragraph style={[styles.phaseText, { color: trainingLoad.color }]}>
                  {trainingLoad.label}
                </Paragraph>
              </View>
              <View style={styles.stat}>
                <Paragraph style={styles.statLabel}>Fitness (CTL)</Paragraph>
                <Title>{Math.round(trainingLoad.ctl)}</Title>
              </View>
              <View style={styles.stat}>
                <Paragraph style={styles.statLabel}>Fatigue (ATL)</Paragraph>
                <Title>{Math.round(trainingLoad.atl)}</Title>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Hydration Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title>Hydration</Title>
            <Button compact mode="text" onPress={() => navigation.navigate('Hydration')}>
              Log
            </Button>
          </View>
          <View style={styles.hydrationRow}>
            <Paragraph style={styles.hydrationMl}>
              {hydratedMl >= 1000 ? `${(hydratedMl / 1000).toFixed(1)}L` : `${hydratedMl}ml`}
              {' / '}
              {hydrationGoalMl >= 1000 ? `${(hydrationGoalMl / 1000).toFixed(1)}L` : `${hydrationGoalMl}ml`}
            </Paragraph>
            <Paragraph style={styles.hydrationPct}>{Math.round(hydrationRatio * 100)}%</Paragraph>
          </View>
          <ProgressBar
            progress={hydrationRatio}
            color={hydrationRatio >= 1 ? '#2e7d32' : '#2196f3'}
            style={styles.hydrationBar}
          />
        </Card.Content>
      </Card>

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
  cardActions: {
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  startRunBtn: {
    flex: 1,
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
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTemp: {
    fontSize: 28,
    color: '#6200ea',
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weatherStat: {
    alignItems: 'center',
  },
  weatherStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  weatherStatValue: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
  },
  adviceBanner: {
    borderRadius: 6,
    padding: 10,
  },
  adviceText: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  hydrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hydrationMl: {
    fontSize: 14,
    color: '#444',
  },
  hydrationPct: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  hydrationBar: {
    height: 8,
    borderRadius: 4,
  },
});
