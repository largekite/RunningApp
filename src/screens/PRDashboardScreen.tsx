import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { Card, Title, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import { ActivityCheckIn } from '../context/types';

const PRIMARY = '#6200ea';

interface DistancePR {
  label: string;
  miles: number;
  emoji: string;
  color: string;
  worldRecord: string; // for fun context
}

const PR_DISTANCES: DistancePR[] = [
  { label: '1 Mile', miles: 1.0, emoji: '🏃', color: '#f44336', worldRecord: '3:43' },
  { label: '5K', miles: 3.1, emoji: '🏅', color: '#ff9800', worldRecord: '12:35' },
  { label: '10K', miles: 6.2, emoji: '🥈', color: '#2196f3', worldRecord: '26:17' },
  { label: 'Half Marathon', miles: 13.1, emoji: '🥇', color: '#9c27b0', worldRecord: '57:31' },
  { label: 'Marathon', miles: 26.2, emoji: '🏆', color: '#4caf50', worldRecord: '2:00:35' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function paceToSeconds(pace: string): number {
  const parts = pace.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
  return 9999;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes * 60) % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PREntry {
  pace: string;
  date: string;
  distance: number;
  totalTime: string;
}

function findBestForDistance(
  checkIns: ActivityCheckIn[],
  targetMiles: number,
): PREntry | null {
  const candidates = checkIns.filter(
    (c) =>
      c.completed &&
      c.actualDistance != null &&
      c.actualDistance >= targetMiles &&
      c.actualPace != null &&
      c.actualPace.trim().length > 0,
  );

  if (candidates.length === 0) return null;

  let best: ActivityCheckIn = candidates[0];
  for (const c of candidates) {
    if (paceToSeconds(c.actualPace!) < paceToSeconds(best.actualPace!)) {
      best = c;
    }
  }

  const durationTotal = (best.actualDuration ?? 0);
  return {
    pace: best.actualPace!,
    date: best.date,
    distance: best.actualDistance!,
    totalTime: minutesToTime(durationTotal),
  };
}

export default function PRDashboardScreen() {
  const { state } = useApp();
  const checkIns = Object.values(state.checkIns);

  const prs = useMemo(() => {
    return PR_DISTANCES.map((d) => ({
      ...d,
      pr: findBestForDistance(checkIns, d.miles),
    }));
  }, [checkIns]);

  const longestRun = useMemo(() => {
    const completed = checkIns.filter(
      (c) => c.completed && c.actualDistance != null && c.actualDistance > 0,
    );
    if (completed.length === 0) return null;
    return completed.reduce((max, c) =>
      (c.actualDistance ?? 0) > (max.actualDistance ?? 0) ? c : max,
    );
  }, [checkIns]);

  const mostElevation = useMemo(() => {
    const withElevation = checkIns.filter(
      (c) => c.completed && c.elevationGainFt != null && c.elevationGainFt > 0,
    );
    if (withElevation.length === 0) return null;
    return withElevation.reduce((max, c) =>
      (c.elevationGainFt ?? 0) > (max.elevationGainFt ?? 0) ? c : max,
    );
  }, [checkIns]);

  const isEmpty = prs.every((p) => p.pr === null) && !longestRun && !mostElevation;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Personal Records</Text>
      <Text style={styles.pageSubtitle}>
        Best paces from completed check-ins across standard distances.
      </Text>

      {isEmpty && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No PRs yet</Text>
            <Text style={styles.emptyText}>
              Complete runs and log check-ins with actual distance and pace to populate your
              personal records dashboard.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* PR table for standard distances */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Best Paces by Distance</Title>
          {prs.map((item, i) => (
            <View key={item.label}>
              <View style={styles.prRow}>
                <View style={[styles.distanceBadge, { backgroundColor: item.color + '22' }]}>
                  <Text style={styles.distanceEmoji}>{item.emoji}</Text>
                  <Text style={[styles.distanceLabel, { color: item.color }]}>{item.label}</Text>
                  <Text style={styles.distanceMiles}>{item.miles} mi</Text>
                </View>

                <View style={styles.prInfo}>
                  {item.pr ? (
                    <>
                      <Text style={[styles.prPace, { color: item.color }]}>
                        {item.pr.pace}
                        <Text style={styles.prPaceUnit}>/mi</Text>
                      </Text>
                      <Text style={styles.prDate}>{formatDate(item.pr.date)}</Text>
                      <Text style={styles.prTime}>Finish: {item.pr.totalTime}</Text>
                    </>
                  ) : (
                    <Text style={styles.noPR}>No PR yet</Text>
                  )}
                </View>

                <View style={styles.wrContainer}>
                  <Text style={styles.wrLabel}>WR</Text>
                  <Text style={styles.wrValue}>{item.worldRecord}</Text>
                </View>
              </View>
              {i < prs.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Special records */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Special Records</Title>

          <View style={styles.specialRow}>
            <Icon name="map-marker-distance" size={24} color={PRIMARY} />
            <View style={styles.specialInfo}>
              <Text style={styles.specialLabel}>Longest Run</Text>
              {longestRun ? (
                <Text style={styles.specialValue}>
                  {longestRun.actualDistance?.toFixed(2)} mi on {formatDate(longestRun.date)}
                </Text>
              ) : (
                <Text style={styles.noData}>No data yet</Text>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.specialRow}>
            <Icon name="image-filter-hdr" size={24} color="#ff9800" />
            <View style={styles.specialInfo}>
              <Text style={styles.specialLabel}>Most Elevation Gain</Text>
              {mostElevation ? (
                <Text style={styles.specialValue}>
                  {mostElevation.elevationGainFt?.toLocaleString()} ft on{' '}
                  {formatDate(mostElevation.date)}
                  {mostElevation.actualDistance
                    ? ` (${mostElevation.actualDistance.toFixed(1)} mi)`
                    : ''}
                </Text>
              ) : (
                <Text style={styles.noData}>No elevation data recorded</Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Fun context card */}
      <Card style={[styles.card, styles.contextCard]}>
        <Card.Content>
          <View style={styles.contextHeader}>
            <Icon name="information-outline" size={18} color={PRIMARY} />
            <Text style={styles.contextTitle}>World Records Context</Text>
          </View>
          <Text style={styles.contextText}>
            World records shown are the men's outdoor road/track world records as of 2025.
            These are the absolute limits of human performance — provided purely for fun perspective,
            not comparison! Every runner's journey is unique.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#222', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18 },
  emptyCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  emptyContent: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#222' },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  distanceBadge: {
    width: 76,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  distanceEmoji: { fontSize: 18 },
  distanceLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  distanceMiles: { fontSize: 10, color: '#999', textAlign: 'center' },
  prInfo: { flex: 1 },
  prPace: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  prPaceUnit: { fontSize: 13, fontWeight: '500' },
  prDate: { fontSize: 11, color: '#888', marginTop: 1 },
  prTime: { fontSize: 12, color: '#555', marginTop: 1 },
  noPR: { fontSize: 14, color: '#bbb', fontStyle: 'italic' },
  wrContainer: { alignItems: 'center' },
  wrLabel: { fontSize: 9, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  wrValue: { fontSize: 12, color: '#888', fontWeight: '600' },
  divider: { marginVertical: 0 },
  specialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  specialInfo: { flex: 1 },
  specialLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  specialValue: { fontSize: 13, color: '#555', marginTop: 2 },
  noData: { fontSize: 13, color: '#bbb', fontStyle: 'italic', marginTop: 2 },
  contextCard: { backgroundColor: '#f3e5ff', elevation: 0 },
  contextHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  contextTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  contextText: { fontSize: 12, color: '#666', lineHeight: 18 },
});
