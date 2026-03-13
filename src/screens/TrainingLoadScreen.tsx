import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import TrainingLoadService from '../services/trainingLoad.service';
import TrainingLoadChart from '../components/TrainingLoadChart';
import { calculatePacesFromGoalTime } from '../utils/paceCalculator';
import { getTSBLabel } from '../utils/tssCalculator';

const PRIMARY = '#6200ea';
const FALLBACK_FTP = '9:30';

function getFtpPace(goalFinishTime?: string, goalDistance?: number): string {
  if (!goalFinishTime) return FALLBACK_FTP;
  try {
    const paces = calculatePacesFromGoalTime(goalFinishTime, goalDistance ?? 26.2);
    return paces.tempo ?? FALLBACK_FTP;
  } catch {
    return FALLBACK_FTP;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TrainingLoadScreen() {
  const { state } = useApp();
  const checkIns = Object.values(state.checkIns);
  const ftpPace = getFtpPace(state.user?.goalFinishTime, state.trainingPlan?.goalDistance);

  const { currentLoad, loadHistory, tssHistory } = useMemo(() => {
    if (checkIns.length === 0) {
      return { currentLoad: null, loadHistory: [], tssHistory: [] };
    }
    const cur = TrainingLoadService.getCurrentLoad(checkIns, ftpPace);
    const hist = TrainingLoadService.getLoadHistory(checkIns, ftpPace, 60);
    const tss = TrainingLoadService.buildTSSHistory(checkIns, ftpPace).slice(-7).reverse();
    return { currentLoad: cur, loadHistory: hist, tssHistory: tss };
  }, [checkIns, ftpPace]);

  if (state.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  if (checkIns.length === 0 || !currentLoad) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Training Load Data</Text>
        <Text style={styles.emptyText}>Log workouts to see training load</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* TSB Badge */}
      <Card style={styles.tsbCard}>
        <Card.Content style={styles.tsbCardContent}>
          <View style={[styles.tsbBadge, { backgroundColor: currentLoad.color }]}>
            <Text style={styles.tsbLabel}>{currentLoad.label}</Text>
            <Text style={styles.tsbValue}>{currentLoad.tsb > 0 ? '+' : ''}{currentLoad.tsb.toFixed(1)}</Text>
          </View>
          <Text style={styles.tsbDescription}>{currentLoad.description}</Text>
        </Card.Content>
      </Card>

      {/* ATL / CTL Numbers */}
      <View style={styles.metricsRow}>
        <Card style={[styles.metricCard, { borderTopColor: '#ff9800' }]}>
          <Card.Content style={styles.metricContent}>
            <Text style={styles.metricValue}>{currentLoad.atl.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Fatigue (ATL)</Text>
            <Text style={styles.metricSub}>7-day load</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.metricCard, { borderTopColor: '#2196f3' }]}>
          <Card.Content style={styles.metricContent}>
            <Text style={styles.metricValue}>{currentLoad.ctl.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Fitness (CTL)</Text>
            <Text style={styles.metricSub}>42-day load</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Chart */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Load History (60 Days)</Title>
          <TrainingLoadChart data={loadHistory} height={200} />
        </Card.Content>
      </Card>

      {/* Explainer */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>What Does This Mean?</Title>
          <View style={styles.explainerRow}>
            <View style={[styles.explainerDot, { backgroundColor: '#2196f3' }]} />
            <Text style={styles.explainerText}>
              <Text style={styles.bold}>Fitness (CTL)</Text> — Your long-term training adaptation.
              Rises slowly as you train consistently over weeks.
            </Text>
          </View>
          <View style={styles.explainerRow}>
            <View style={[styles.explainerDot, { backgroundColor: '#ff9800' }]} />
            <Text style={styles.explainerText}>
              <Text style={styles.bold}>Fatigue (ATL)</Text> — Your short-term training load.
              Rises quickly with hard workouts and drops fast with rest.
            </Text>
          </View>
          <View style={styles.explainerRow}>
            <View style={[styles.explainerDot, { backgroundColor: PRIMARY }]} />
            <Text style={styles.explainerText}>
              <Text style={styles.bold}>Form (TSB)</Text> = Fitness − Fatigue. Positive means
              fresh; negative means building. Aim to be positive on race day.
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 7-day TSS list */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Last 7 Days</Title>
          {tssHistory.length === 0 ? (
            <Paragraph style={styles.noData}>No recent activity</Paragraph>
          ) : (
            tssHistory.map((entry, i) => {
              return (
                <View key={entry.date}>
                  <View style={styles.tssRow}>
                    <Text style={styles.tssDate}>{formatDate(entry.date)}</Text>
                    <View style={styles.tssBarContainer}>
                      <View
                        style={[
                          styles.tssBar,
                          { width: `${Math.min(100, (entry.tss / 150) * 100)}%`, backgroundColor: PRIMARY },
                        ]}
                      />
                    </View>
                    <Chip
                      style={[styles.tssChip, { backgroundColor: entry.tss > 80 ? '#f44336' : entry.tss > 40 ? '#ff9800' : '#4caf50' }]}
                      textStyle={styles.tssChipText}
                    >
                      {entry.tss.toFixed(0)}
                    </Chip>
                  </View>
                  {i < tssHistory.length - 1 && <Divider style={styles.divider} />}
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptyText: { fontSize: 15, color: '#666', textAlign: 'center' },
  tsbCard: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 3,
  },
  tsbCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  tsbBadge: {
    borderRadius: 50,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tsbLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tsbValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  tsbDescription: {
    color: '#555',
    fontSize: 15,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
    borderTopWidth: 4,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  metricSub: {
    fontSize: 11,
    color: '#888',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  lastCard: { marginBottom: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#222' },
  explainerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  explainerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  explainerText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  bold: { fontWeight: '700', color: '#333' },
  noData: { color: '#888', fontStyle: 'italic' },
  tssRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  tssDate: {
    width: 70,
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  tssBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tssBar: {
    height: '100%',
    borderRadius: 4,
  },
  tssChip: {
    height: 26,
    borderRadius: 13,
  },
  tssChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  divider: { marginVertical: 0 },
});
