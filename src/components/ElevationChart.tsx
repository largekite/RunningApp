import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface Coordinate {
  altitude?: number;
}

interface Props {
  coordinates: Coordinate[];
  height?: number;
}

const METERS_TO_FEET = 3.28084;

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, start + window);
    const slice = values.slice(start, end);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}

export default function ElevationChart({ coordinates, height = 160 }: Props) {
  const chartWidth = Dimensions.get('window').width - 32;

  // Filter coordinates with altitude data
  const withAlt = coordinates.filter((c) => c.altitude != null) as { altitude: number }[];

  if (withAlt.length < 3) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyTitle}>No Elevation Data</Text>
        <Text style={styles.emptySubtitle}>GPS altitude not recorded for this route</Text>
      </View>
    );
  }

  // Convert to feet and smooth
  const altFeet = withAlt.map((c) => c.altitude * METERS_TO_FEET);
  const smoothed = movingAverage(altFeet, 5);

  // Downsample to at most 50 points for chart performance
  const maxPoints = 50;
  const step = Math.max(1, Math.floor(smoothed.length / maxPoints));
  const sampled: number[] = [];
  for (let i = 0; i < smoothed.length; i += step) {
    sampled.push(Math.round(smoothed[i]));
  }
  // Always include the last point
  if (sampled[sampled.length - 1] !== Math.round(smoothed[smoothed.length - 1])) {
    sampled.push(Math.round(smoothed[smoothed.length - 1]));
  }

  // Build sparse labels (only first and last)
  const labels = sampled.map((_, i) => {
    if (i === 0) return 'Start';
    if (i === sampled.length - 1) return 'End';
    return '';
  });

  const minAlt = Math.min(...sampled);
  const maxAlt = Math.max(...sampled);
  const range = maxAlt - minAlt;

  const chartData = {
    labels,
    datasets: [
      {
        data: sampled,
        color: (opacity = 1) => `rgba(98, 0, 234, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(minAlt).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Min (ft)</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(maxAlt).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Max (ft)</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(range).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Range (ft)</Text>
        </View>
      </View>

      <LineChart
        data={chartData}
        width={chartWidth}
        height={height}
        chartConfig={{
          backgroundColor: '#0d0d1a',
          backgroundGradientFrom: '#1a0a2e',
          backgroundGradientTo: '#0d1b3e',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(180, 120, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(180, 180, 200, ${opacity})`,
          fillShadowGradient: '#6200ea',
          fillShadowGradientOpacity: 0.3,
          propsForDots: {
            r: '0',
          },
          propsForBackgroundLines: {
            stroke: 'rgba(255,255,255,0.06)',
          },
        }}
        bezier
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        style={styles.chart}
      />

      <Text style={styles.footnote}>Elevation in feet · smoothed 5-point average</Text>
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
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    gap: 6,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#6200ea',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 4,
  },
  footnote: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
