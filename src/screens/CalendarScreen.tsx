import React from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { DailyWorkout } from '../context/types';
import { getWeekStart, getWeekDates, formatDate } from '../utils/dateHelpers';
import { PlanOverview } from '../components/PlanOverview';

export function CalendarScreen() {
  const { state } = useApp();

  // Get current week
  const today = new Date();
  const weekStart = getWeekStart(today, 0); // Sunday
  const weekDates = getWeekDates(weekStart);

  // Build a lookup of all workouts by date
  const workoutsByDate = React.useMemo(() => {
    const map: Record<string, DailyWorkout> = {};
    state.trainingPlan?.weeks.forEach((week) => {
      week.workouts.forEach((w) => {
        map[w.date] = w;
      });
    });
    return map;
  }, [state.trainingPlan]);

  // Find which training week the current calendar week falls in
  const currentWeek = state.trainingPlan?.weeks.find((w) =>
    w.workouts.some((workout) => weekDates.includes(workout.date))
  );

  const getWorkoutForDate = (date: string) => {
    return workoutsByDate[date];
  };

  const getCheckInForDate = (date: string) => {
    return state.checkIns[date];
  };

  const getStatusIcon = (date: string) => {
    const checkIn = getCheckInForDate(date);
    const workout = getWorkoutForDate(date);

    if (!workout) return '—';
    if (!checkIn) return '📅'; // Planned
    if (checkIn.completed) return '✅'; // Completed
    return '❌'; // Skipped
  };

  const getDayName = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const renderDay = ({ item: date }: { item: string }) => {
    const workout = getWorkoutForDate(date);
    const checkIn = getCheckInForDate(date);
    const isToday = date === formatDate(today);

    return (
      <Card style={[styles.dayCard, isToday && styles.todayCard]}>
        <Card.Content>
          <View style={styles.dayHeader}>
            <Paragraph style={styles.dayName}>{getDayName(date)}</Paragraph>
            <Paragraph style={styles.statusIcon}>{getStatusIcon(date)}</Paragraph>
          </View>

          {workout ? (
            <>
              <Chip mode="outlined" style={styles.workoutChip}>
                {workout.type.replace(/_/g, ' ')}
              </Chip>

              {workout.type !== 'rest' && (
                <Paragraph style={styles.distance}>
                  {workout.targetDistance?.toFixed(1)} mi
                </Paragraph>
              )}

              {checkIn && checkIn.completed && (
                <Paragraph style={styles.actual}>
                  Actual: {checkIn.actualDistance?.toFixed(1)} mi
                </Paragraph>
              )}
            </>
          ) : (
            <Paragraph style={styles.noWorkout}>No workout</Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {state.trainingPlan && (
        <PlanOverview
          trainingPlan={state.trainingPlan}
          checkIns={state.checkIns}
        />
      )}

      <Card style={styles.headerCard}>
        <Card.Content>
          <Title>This Week</Title>
          {currentWeek && (
            <>
              <Paragraph>Week {currentWeek.weekNumber} - {currentWeek.focus}</Paragraph>
              <Paragraph>Target: {currentWeek.totalMileage} miles</Paragraph>
            </>
          )}
        </Card.Content>
      </Card>

      <FlatList
        data={weekDates}
        renderItem={renderDay}
        keyExtractor={(item) => item}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  dayCard: {
    marginBottom: 12,
  },
  todayCard: {
    borderColor: '#6200ea',
    borderWidth: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIcon: {
    fontSize: 20,
  },
  workoutChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  actual: {
    fontSize: 12,
    color: '#6200ea',
    fontStyle: 'italic',
  },
  noWorkout: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
