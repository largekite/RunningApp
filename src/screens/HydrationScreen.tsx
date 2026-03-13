import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  ProgressBar,
  Chip,
  Button,
  Divider,
  IconButton,
  ToggleButton,
} from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { HydrationLog, HydrationEntry } from '../context/types';

const PRIMARY = '#6200ea';
const ML_PER_OZ = 29.5735;

function nowIso(): string {
  return new Date().toISOString();
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function HydrationScreen() {
  const { state, setHydrationLog } = useApp();
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const today = todayStr();

  const todayLog: HydrationLog = state.hydrationLogs[today] ?? {
    date: today,
    entries: [],
    goalMl: 2500,
  };

  const totalMl = todayLog.entries.reduce((sum, e) => sum + e.amountMl, 0);
  const goalMl = todayLog.goalMl;
  const progress = Math.min(1, totalMl / goalMl);

  function displayAmount(ml: number): string {
    if (unit === 'oz') return `${(ml / ML_PER_OZ).toFixed(0)} oz`;
    return `${ml} ml`;
  }

  function displayGoal(): string {
    if (unit === 'oz') return `${(goalMl / ML_PER_OZ).toFixed(0)} oz`;
    return `${goalMl} ml`;
  }

  function displayTotal(): string {
    if (unit === 'oz') return `${(totalMl / ML_PER_OZ).toFixed(0)} oz`;
    return `${totalMl} ml`;
  }

  async function addEntry(amountMl: number) {
    const entry: HydrationEntry = {
      id: Date.now().toString(),
      time: nowIso(),
      amountMl,
    };
    const updated: HydrationLog = {
      ...todayLog,
      entries: [...todayLog.entries, entry],
    };
    await setHydrationLog(updated);
  }

  async function deleteEntry(id: string) {
    const updated: HydrationLog = {
      ...todayLog,
      entries: todayLog.entries.filter((e) => e.id !== id),
    };
    await setHydrationLog(updated);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete Entry', 'Remove this hydration entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  }

  // Last 7 days bar chart data
  const last7 = useMemo(() => {
    const dates = getLastNDates(7);
    return dates.map((d) => {
      const log = state.hydrationLogs[d];
      const total = log ? log.entries.reduce((s, e) => s + e.amountMl, 0) : 0;
      const parts = d.split('-');
      return {
        date: d,
        label: `${parseInt(parts[1])}/${parseInt(parts[2])}`,
        total,
        goal: log?.goalMl ?? 2500,
      };
    });
  }, [state.hydrationLogs]);

  const chartData = {
    labels: last7.map((d) => d.label),
    datasets: [
      {
        data: last7.map((d) => unit === 'oz' ? Math.round(d.total / ML_PER_OZ) : d.total),
      },
    ],
  };

  const progressColor =
    progress >= 1 ? '#4caf50' : progress >= 0.6 ? '#ff9800' : '#f44336';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with unit toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today's Hydration</Text>
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitBtn, unit === 'ml' && styles.unitBtnActive]}
            onPress={() => setUnit('ml')}
          >
            <Text style={[styles.unitBtnText, unit === 'ml' && styles.unitBtnTextActive]}>ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitBtn, unit === 'oz' && styles.unitBtnActive]}
            onPress={() => setUnit('oz')}
          >
            <Text style={[styles.unitBtnText, unit === 'oz' && styles.unitBtnTextActive]}>oz</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressAmount}>{displayTotal()}</Text>
              <Text style={styles.progressGoal}>of {displayGoal()} goal</Text>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: progressColor }]}>
              <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
          <ProgressBar
            progress={progress}
            color={progressColor}
            style={styles.progressBar}
          />
          {progress >= 1 && (
            <Text style={styles.goalReached}>Goal reached! Great hydration today.</Text>
          )}
        </Card.Content>
      </Card>

      {/* Quick add buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Quick Add</Title>
          <View style={styles.quickAddRow}>
            {[
              { label: 'Cup', ml: 150, icon: '☕' },
              { label: 'Bottle', ml: 350, icon: '🍶' },
              { label: 'Large', ml: 500, icon: '💧' },
              { label: 'XL', ml: 750, icon: '🚰' },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.label}
                style={styles.quickBtn}
                onPress={() => addEntry(btn.ml)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickBtnIcon}>{btn.icon}</Text>
                <Text style={styles.quickBtnLabel}>{btn.label}</Text>
                <Text style={styles.quickBtnAmount}>{displayAmount(btn.ml)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.tipText}>
            Tip: Add ~500ml per hour of running to your daily goal.
          </Text>
        </Card.Content>
      </Card>

      {/* Today's entries */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>
            Today's Log {todayLog.entries.length > 0 && `(${todayLog.entries.length})`}
          </Title>
          {todayLog.entries.length === 0 ? (
            <Text style={styles.noData}>No entries yet. Tap a quick add button above.</Text>
          ) : (
            [...todayLog.entries].reverse().map((entry, i) => (
              <View key={entry.id}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTime}>{formatTime(entry.time)}</Text>
                  <View style={styles.entryAmountContainer}>
                    <Text style={styles.entryAmount}>{displayAmount(entry.amountMl)}</Text>
                  </View>
                  <IconButton
                    icon="trash-can-outline"
                    size={18}
                    iconColor="#f44336"
                    onPress={() => confirmDelete(entry.id)}
                    style={styles.deleteBtn}
                  />
                </View>
                {i < todayLog.entries.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* 7-day summary chart */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <Title style={styles.sectionTitle}>7-Day Summary</Title>
          <BarChart
            data={chartData}
            width={Dimensions.get('window').width - 64}
            height={160}
            yAxisLabel=""
            yAxisSuffix={unit === 'oz' ? 'oz' : ''}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(98, 0, 234, ${opacity})`,
              labelColor: () => '#888',
              barPercentage: 0.6,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: PRIMARY }]} />
            <Text style={styles.legendText}>
              Daily intake ({unit === 'oz' ? 'oz' : 'ml'}) · Goal: {displayGoal()}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#222' },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
    overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  unitBtnActive: { backgroundColor: PRIMARY },
  unitBtnText: { fontSize: 13, fontWeight: '600', color: PRIMARY },
  unitBtnTextActive: { color: '#fff' },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  lastCard: { marginBottom: 0 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressAmount: { fontSize: 28, fontWeight: '800', color: '#222' },
  progressGoal: { fontSize: 13, color: '#888' },
  percentBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  progressBar: { height: 12, borderRadius: 6 },
  goalReached: { color: '#4caf50', fontSize: 13, fontWeight: '600', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#222' },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#f3e5ff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  quickBtnIcon: { fontSize: 22 },
  quickBtnLabel: { fontSize: 11, fontWeight: '700', color: PRIMARY },
  quickBtnAmount: { fontSize: 10, color: '#666' },
  tipText: { color: '#888', fontSize: 12, marginTop: 12, fontStyle: 'italic' },
  noData: { color: '#aaa', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  entryTime: { flex: 1, fontSize: 14, color: '#555' },
  entryAmountContainer: { flex: 1, alignItems: 'flex-end' },
  entryAmount: { fontSize: 15, fontWeight: '700', color: PRIMARY },
  deleteBtn: { margin: 0 },
  chart: { marginLeft: -10, borderRadius: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#666' },
});
