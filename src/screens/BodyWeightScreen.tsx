import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Card, Title, Button, Divider, Chip } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { BodyWeightEntry } from '../context/types';

const PRIMARY = '#6200ea';
const KG_TO_LBS = 2.20462;

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default function BodyWeightScreen() {
  const { state, addBodyWeight } = useApp();
  const [unit, setUnit] = useState<'kg' | 'lbs'>('lbs');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const entries = useMemo(() => {
    // Keep at most 365 entries, sorted newest first for display
    return [...state.bodyWeightEntries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 365);
  }, [state.bodyWeightEntries]);

  const entriesForChart = useMemo(() => {
    return entries.slice(0, 30).reverse();
  }, [entries]);

  function displayWeight(kg: number): string {
    if (unit === 'lbs') return `${(kg * KG_TO_LBS).toFixed(1)} lbs`;
    return `${kg.toFixed(1)} kg`;
  }

  function toKg(val: string): number {
    const n = parseFloat(val);
    if (isNaN(n)) return 0;
    return unit === 'lbs' ? n / KG_TO_LBS : n;
  }

  async function handleSave() {
    const kg = toKg(weight);
    if (kg <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }
    setSaving(true);
    const entry: BodyWeightEntry = {
      id: Date.now().toString(),
      date,
      weightKg: Math.round(kg * 100) / 100,
      notes: note.trim() || undefined,
    };
    await addBodyWeight(entry);
    setWeight('');
    setNote('');
    setDate(todayStr());
    setSaving(false);
  }

  // Trend: compare latest weight vs 30 days ago
  const trend = useMemo(() => {
    if (entries.length < 2) return null;
    const latest = entries[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];
    const old = entries.find((e) => e.date <= cutoff);
    if (!old) return null;
    const diff = latest.weightKg - old.weightKg;
    return { diff, displayDiff: displayWeight(Math.abs(diff)), isGain: diff > 0 };
  }, [entries, unit]);

  const chartLabels = entriesForChart.map((e, i) => {
    if (i === 0 || i === entriesForChart.length - 1 || i % 7 === 0) {
      const p = e.date.split('-');
      return `${parseInt(p[1])}/${parseInt(p[2])}`;
    }
    return '';
  });

  const chartValues = entriesForChart.map((e) =>
    unit === 'lbs' ? parseFloat((e.weightKg * KG_TO_LBS).toFixed(1)) : parseFloat(e.weightKg.toFixed(1))
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Unit toggle */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Body Weight</Text>
          <View style={styles.unitToggle}>
            {(['kg', 'lbs'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Log entry form */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Log Weight</Title>
            <View style={styles.inputRow}>
              <View style={styles.weightInputWrapper}>
                <TextInput
                  style={styles.weightInput}
                  placeholder={unit === 'lbs' ? 'e.g. 155.5' : 'e.g. 70.5'}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                  placeholderTextColor="#aaa"
                />
                <Text style={styles.inputUnit}>{unit}</Text>
              </View>
              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#aaa"
              />
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Optional note (e.g. post-long-run)"
              value={note}
              onChangeText={setNote}
              placeholderTextColor="#aaa"
            />
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving || !weight}
              style={styles.saveButton}
              buttonColor={PRIMARY}
            >
              Log Weight
            </Button>
          </Card.Content>
        </Card>

        {/* Chart */}
        {entriesForChart.length >= 2 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>30-Day Trend</Title>
              {trend && (
                <View style={styles.trendRow}>
                  <Text style={styles.trendText}>
                    vs 30 days ago:{' '}
                    <Text style={{ color: trend.isGain ? '#f44336' : '#4caf50', fontWeight: '700' }}>
                      {trend.isGain ? '+' : '-'}{trend.displayDiff}
                    </Text>
                  </Text>
                </View>
              )}
              <LineChart
                data={{ labels: chartLabels, datasets: [{ data: chartValues }] }}
                width={Dimensions.get('window').width - 64}
                height={180}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(98, 0, 234, ${opacity})`,
                  labelColor: () => '#888',
                  propsForDots: { r: '4', fill: PRIMARY },
                }}
                bezier
                style={styles.chart}
                fromZero={false}
                yAxisSuffix={` ${unit}`}
              />
            </Card.Content>
          </Card>
        )}

        {/* Entry history */}
        <Card style={[styles.card, styles.lastCard]}>
          <Card.Content>
            <Title style={styles.sectionTitle}>History</Title>
            {entries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⚖️</Text>
                <Text style={styles.emptyTitle}>Track your weight to monitor training adaptations</Text>
                <Text style={styles.emptyText}>
                  Weight fluctuations during training are normal. Logging consistently helps
                  you spot trends and optimize nutrition and recovery.
                </Text>
              </View>
            ) : (
              entries.map((entry, i) => (
                <View key={entry.id}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryLeft}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      {entry.notes && (
                        <Text style={styles.entryNote}>{entry.notes}</Text>
                      )}
                    </View>
                    <Text style={styles.entryWeight}>{displayWeight(entry.weightKg)}</Text>
                  </View>
                  {i < entries.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#222' },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  weightInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  weightInput: { flex: 1, fontSize: 18, fontWeight: '600', color: '#222', paddingVertical: 10 },
  inputUnit: { fontSize: 14, color: '#888', marginLeft: 4 },
  dateInput: {
    width: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  saveButton: { borderRadius: 8 },
  trendRow: { marginBottom: 10 },
  trendText: { fontSize: 14, color: '#555' },
  chart: { marginLeft: -10, borderRadius: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#444', textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  entryLeft: { flex: 1 },
  entryDate: { fontSize: 14, fontWeight: '600', color: '#333' },
  entryNote: { fontSize: 12, color: '#888', marginTop: 2 },
  entryWeight: { fontSize: 18, fontWeight: '700', color: PRIMARY },
});
