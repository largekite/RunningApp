import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Chip, IconButton } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { DailyWorkout } from '../context/types';
import { getWeekStart, getWeekDates, formatDate } from '../utils/dateHelpers';
import { PlanOverview } from '../components/PlanOverview';
import { addDays } from 'date-fns';

export function CalendarScreen() {
  const { state } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);

  // Get the displayed week based on offset
  const today = new Date();
  const baseWeekStart = getWeekStart(today, 0); // Sunday of current week
  const weekStart = addDays(baseWeekStart, weekOffset * 7);
  const weekDates = getWeekDates(weekStart);

  const isCurrentWeek = weekOffset === 0;

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
    // Append noon to avoid UTC midnight being interpreted as previous day in negative-offset timezones
    const d = new Date(date + 'T12:00:00');
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
          <View style={styles.weekNav}>
            <IconButton icon="chevron-left" size={24} onPress={() => setWeekOffset(o => o - 1)} />
            <View style={styles.weekNavCenter}>
              <Title style={styles.weekNavTitle}>
                {isCurrentWeek ? 'This Week' : formatDate(weekStart).slice(5).replace('-', '/') + ' – ' + formatDate(addDays(weekStart, 6)).slice(5).replace('-', '/')}
              </Title>
              {currentWeek && (
                <>
                  <Paragraph style={styles.weekSubtitle}>Week {currentWeek.weekNumber} · {currentWeek.focus}</Paragraph>
                  <Paragraph style={styles.weekSubtitle}>Target: {currentWeek.totalMileage} miles</Paragraph>
                </>
              )}
            </View>
            <IconButton icon="chevron-right" size={24} onPress={() => setWeekOffset(o => o + 1)} />
          </View>
          {!isCurrentWeek && (
            <Paragraph style={styles.jumpLink} onPress={() => setWeekOffset(0)}>
              Back to current week
            </Paragraph>
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  weekNavTitle: {
    fontSize: 16,
  },
  weekSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  jumpLink: {
    fontSize: 12,
    color: '#6200ea',
    textAlign: 'center',
    marginTop: 4,
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
