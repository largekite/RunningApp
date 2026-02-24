import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { TrainingPlan, ActivityCheckIn } from '../context/types';
import { getDaysUntil, getDynamicWeekNumber } from '../utils/dateHelpers';

const screenWidth = Dimensions.get('window').width;

interface PlanOverviewProps {
  trainingPlan: TrainingPlan;
  checkIns: Record<string, ActivityCheckIn>;
}

interface PhaseInfo {
  name: string;
  startWeek: number;
  endWeek: number;
  isCurrent: boolean;
}

export function PlanOverview({ trainingPlan }: PlanOverviewProps) {
  const daysUntilRace = getDaysUntil(trainingPlan.raceDate);
  const currentWeek = getDynamicWeekNumber(trainingPlan.startDate, trainingPlan.totalWeeks);
  const progress = currentWeek / trainingPlan.totalWeeks;
  const currentPhase = trainingPlan.weeks[currentWeek - 1]?.focus.replace(/ \(Recovery\)$/, '') || '';

  const raceDateFormatted = new Date(trainingPlan.raceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Mileage chart data
  const chartData = useMemo(() => {
    const mileageData = trainingPlan.weeks.map(w => w.totalMileage);
    const labels = trainingPlan.weeks.map((w, i) => {
      if (i === 0 || i === trainingPlan.weeks.length - 1 || (i + 1) % 4 === 0) {
        return `W${w.weekNumber}`;
      }
      return '';
    });
    return { mileageData, labels };
  }, [trainingPlan.weeks]);

  // Phase breakdown
  const phases = useMemo(() => {
    const result: PhaseInfo[] = [];
    let current: PhaseInfo | null = null;

    trainingPlan.weeks.forEach((week) => {
      const phaseName = week.focus.replace(/ \(Recovery\)$/, '');

      if (!current || current.name !== phaseName) {
        if (current) result.push(current);
        current = {
          name: phaseName,
          startWeek: week.weekNumber,
          endWeek: week.weekNumber,
          isCurrent: false,
        };
      } else {
        current.endWeek = week.weekNumber;
      }
    });
    if (current) result.push(current);

    result.forEach(phase => {
      phase.isCurrent = currentWeek >= phase.startWeek && currentWeek <= phase.endWeek;
    });

    return result;
  }, [trainingPlan.weeks, currentWeek]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(98, 0, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
  };

  return (
    <View>
      {/* Race Countdown */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Paragraph style={styles.bigNumber}>
                {Math.max(0, daysUntilRace)}
              </Paragraph>
              <Paragraph style={styles.label}>Days to Race</Paragraph>
            </View>
            <View style={styles.column}>
              <Paragraph style={styles.bigNumber}>
                {trainingPlan.goalDistance}
              </Paragraph>
              <Paragraph style={styles.label}>Mile Goal</Paragraph>
            </View>
          </View>
          <Paragraph style={styles.raceDate}>Race Day: {raceDateFormatted}</Paragraph>
        </Card.Content>
      </Card>

      {/* Plan Progress */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Plan Progress</Title>
          <View style={styles.progressContainer}>
            <ProgressChart
              data={{ data: [Math.min(progress, 1)] }}
              width={screenWidth - 64}
              height={160}
              strokeWidth={16}
              radius={50}
              chartConfig={chartConfig}
              hideLegend
            />
          </View>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Paragraph style={styles.statValue}>Week {currentWeek} of {trainingPlan.totalWeeks}</Paragraph>
            </View>
            <View style={styles.column}>
              <Paragraph style={styles.statValue}>{currentPhase}</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Mileage Progression */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Mileage Progression</Title>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.mileageData, strokeWidth: 2 }],
            }}
            width={screenWidth - 64}
            height={220}
            yAxisSuffix=" mi"
            fromZero
            bezier
            chartConfig={{
              ...chartConfig,
              propsForDots: { r: '3', strokeWidth: '1', stroke: '#6200ea' },
              fillShadowGradientFrom: '#6200ea',
              fillShadowGradientFromOpacity: 0.2,
              fillShadowGradientTo: '#6200ea',
              fillShadowGradientToOpacity: 0,
            }}
            getDotColor={(_dataPoint, index) =>
              index === currentWeek - 1 ? '#6200ea' : '#b39ddb'
            }
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Phase Breakdown */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Training Phases</Title>
          {phases.map((phase, index) => (
            <View
              key={phase.name}
              style={[
                styles.phaseRow,
                index < phases.length - 1 && styles.phaseRowBorder,
              ]}
            >
              <View>
                <Paragraph style={styles.phaseName}>{phase.name}</Paragraph>
                <Paragraph style={styles.phaseWeeks}>
                  Weeks {phase.startWeek}–{phase.endWeek}
                </Paragraph>
              </View>
              {phase.isCurrent && (
                <Chip mode="flat" compact style={styles.currentChip} textStyle={styles.currentChipText}>
                  Current
                </Chip>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  raceDate: {
    textAlign: 'center',
    marginTop: 12,
    color: '#444',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
    marginTop: 8,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  phaseRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  phaseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  phaseWeeks: {
    fontSize: 12,
    color: '#666',
  },
  currentChip: {
    backgroundColor: '#ede7f6',
  },
  currentChipText: {
    color: '#6200ea',
    fontSize: 12,
  },
});
