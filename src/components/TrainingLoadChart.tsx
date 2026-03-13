import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface LoadDataPoint {
  date: string;
  atl: number;
  ctl: number;
  tsb: number;
}

interface Props {
  data: LoadDataPoint[];
  height?: number;
}

const WINDOW = 30;

export default function TrainingLoadChart({ data, height = 220 }: Props) {
  const chartWidth = Dimensions.get('window').width - 32;

  // Take last 30 days
  const sliced = data.slice(-WINDOW);

  if (sliced.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Not enough data to display chart</Text>
      </View>
    );
  }

  // Build labels: show every 7th day's date label
  const labels = sliced.map((d, i) => {
    if (i === 0 || i === sliced.length - 1 || i % 7 === 0) {
      const parts = d.date.split('-');
      return `${parts[1]}/${parts[2]}`;
    }
    return '';
  });

  const ctlValues = sliced.map((d) => Math.max(0, Math.round(d.ctl)));
  const atlValues = sliced.map((d) => Math.max(0, Math.round(d.atl)));
  // TSB can be negative — shift for display or clamp
  const tsbValues = sliced.map((d) => Math.round(d.tsb + 30)); // shift +30 so negatives show

  const chartData = {
    labels,
    datasets: [
      {
        data: ctlValues,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // blue - CTL/Fitness
        strokeWidth: 2,
      },
      {
        data: atlValues,
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // orange - ATL/Fatigue
        strokeWidth: 2,
      },
      {
        data: tsbValues,
        color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`, // purple - TSB/Form (shifted)
        strokeWidth: 2,
        withDots: false,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={chartWidth}
        height={height}
        chartConfig={{
          backgroundColor: '#1e1e2e',
          backgroundGradientFrom: '#1e1e2e',
          backgroundGradientTo: '#2a2a3e',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(200, 200, 220, ${opacity})`,
          propsForDots: {
            r: '3',
            strokeWidth: '1',
          },
          propsForBackgroundLines: {
            stroke: 'rgba(255,255,255,0.08)',
          },
        }}
        bezier
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        style={styles.chart}
        fromZero
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196f3' }]} />
          <Text style={styles.legendLabel}>Fitness (CTL)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
          <Text style={styles.legendLabel}>Fatigue (ATL)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9c27b0' }]} />
          <Text style={styles.legendLabel}>Form (TSB)</Text>
        </View>
      </View>
      <Text style={styles.tsbNote}>Form line shifted +30 for visibility (zero line = 30)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tsbNote: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
