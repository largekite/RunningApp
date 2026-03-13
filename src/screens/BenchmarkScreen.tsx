import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Card, Title, Button, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import { BenchmarkResult } from '../context/types';
import { BENCHMARK_DEFINITIONS, BenchmarkDefinition } from '../constants/benchmarkWorkouts';
import { calculatePaceZones } from '../utils/paceCalculator';

const PRIMARY = '#6200ea';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

/**
 * Parse a MM:SS or HH:MM:SS duration string to total minutes.
 */
function parseDurationToMinutes(str: string): number | null {
  const parts = str.trim().split(':').map(Number);
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 2) {
    return parts[0] + parts[1] / 60;
  }
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  return null;
}

/**
 * Format minutes as MM:SS.
 */
function minutesToMMSS(minutes: number): string {
  const totalSecs = Math.round(minutes * 60);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculate pace per mile from distance (miles) and duration (minutes).
 */
function computePace(distanceMiles: number, durationMinutes: number): string {
  if (distanceMiles <= 0) return '--:--';
  const paceMinutes = durationMinutes / distanceMiles;
  return minutesToMMSS(paceMinutes);
}

interface PacePreview {
  easy: string;
  tempo: string;
  interval: string;
  longRun: string;
}

function previewPaces(paceStr: string): PacePreview | null {
  try {
    const zones = calculatePaceZones(paceStr);
    return {
      easy: zones.easy,
      tempo: zones.tempo,
      interval: zones.interval,
      longRun: zones.longRun,
    };
  } catch {
    return null;
  }
}

interface LogFormState {
  definitionId: string;
  duration: string;
  date: string;
  notes: string;
}

const DEFAULT_FORM: LogFormState = {
  definitionId: BENCHMARK_DEFINITIONS[0].id,
  duration: '',
  date: todayStr(),
  notes: '',
};

export default function BenchmarkScreen() {
  const { state, addBenchmark, deleteBenchmark } = useApp();
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState<LogFormState>(DEFAULT_FORM);
  const [pacePreview, setPacePreview] = useState<PacePreview | null>(null);
  const [expandedDef, setExpandedDef] = useState<string | null>(null);

  const selectedDef = BENCHMARK_DEFINITIONS.find((d) => d.id === form.definitionId) ?? BENCHMARK_DEFINITIONS[0];

  // Compute pace preview whenever duration changes
  function updateDuration(val: string) {
    setForm((f) => ({ ...f, duration: val }));
    const mins = parseDurationToMinutes(val);
    if (mins != null && mins > 0) {
      const pace = computePace(selectedDef.distanceMiles, mins);
      setPacePreview(previewPaces(pace));
    } else {
      setPacePreview(null);
    }
  }

  async function handleLog() {
    const mins = parseDurationToMinutes(form.duration);
    if (mins == null || mins <= 0) {
      Alert.alert('Invalid Duration', 'Enter duration as MM:SS or HH:MM:SS.');
      return;
    }
    const pace = computePace(selectedDef.distanceMiles, mins);
    const result: BenchmarkResult = {
      id: Date.now().toString(),
      date: form.date,
      distanceMiles: selectedDef.distanceMiles,
      durationMinutes: mins,
      pacePerMile: pace,
      notes: form.notes.trim() || undefined,
    };
    await addBenchmark(result);
    setShowLog(false);
    setForm(DEFAULT_FORM);
    setPacePreview(null);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete Result', 'Remove this benchmark result?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBenchmark(id) },
    ]);
  }

  // Group results by definition
  const resultsByDef = useMemo(() => {
    const map: Record<string, BenchmarkResult[]> = {};
    for (const def of BENCHMARK_DEFINITIONS) {
      map[def.id] = state.benchmarkResults
        .filter((r) => Math.abs(r.distanceMiles - def.distanceMiles) < 0.05)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [state.benchmarkResults]);

  // Best pace per definition
  function bestPace(results: BenchmarkResult[]): BenchmarkResult | null {
    if (results.length === 0) return null;
    return results.reduce((best, r) => {
      const bestSecs = parseDurationToMinutes(best.pacePerMile) ?? 9999;
      const rSecs = parseDurationToMinutes(r.pacePerMile) ?? 9999;
      return rSecs < bestSecs ? r : best;
    });
  }

  function improvementText(results: BenchmarkResult[]): string | null {
    if (results.length < 2) return null;
    const first = results[results.length - 1];
    const latest = results[0];
    const firstSecs = (parseDurationToMinutes(first.pacePerMile) ?? 0) * 60;
    const latestSecs = (parseDurationToMinutes(latest.pacePerMile) ?? 0) * 60;
    const diff = firstSecs - latestSecs;
    if (diff === 0) return 'No change';
    const abs = Math.abs(diff);
    const sign = diff > 0 ? '-' : '+';
    return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}/mi since first attempt`;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Benchmark definition cards */}
        {BENCHMARK_DEFINITIONS.map((def) => {
          const results = resultsByDef[def.id] ?? [];
          const best = bestPace(results);
          const improvement = improvementText(results);
          const isExpanded = expandedDef === def.id;

          return (
            <Card key={def.id} style={styles.card}>
              <Card.Content>
                <TouchableOpacity
                  onPress={() => setExpandedDef(isExpanded ? null : def.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.defHeader}>
                    <View style={styles.defInfo}>
                      <Text style={styles.defName}>{def.name}</Text>
                      <Text style={styles.defMeta}>
                        {def.distanceMiles} mi · {def.frequency}
                      </Text>
                    </View>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#888"
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <>
                    <Divider style={styles.divider} />
                    <Text style={styles.defDescription}>{def.description}</Text>
                    <Text style={styles.instructionsTitle}>Instructions</Text>
                    {def.instructions.map((step, i) => (
                      <View key={i} style={styles.stepRow}>
                        <View style={styles.stepNum}>
                          <Text style={styles.stepNumText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </>
                )}

                <Divider style={styles.divider} />

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{results.length}</Text>
                    <Text style={styles.statLabel}>Attempts</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: PRIMARY }]}>
                      {best ? best.pacePerMile + '/mi' : '--'}
                    </Text>
                    <Text style={styles.statLabel}>Best Pace</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { fontSize: 12, color: '#4caf50' }]}>
                      {improvement ?? '--'}
                    </Text>
                    <Text style={styles.statLabel}>Progress</Text>
                  </View>
                </View>

                {/* History table */}
                {results.length > 0 && (
                  <View style={styles.historyTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableCell, styles.tableHeaderText]}>Date</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderText]}>Time</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderText]}>Pace</Text>
                      <View style={{ width: 28 }} />
                    </View>
                    {results.slice(0, 5).map((r) => (
                      <View key={r.id} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{formatDate(r.date)}</Text>
                        <Text style={styles.tableCell}>{minutesToMMSS(r.durationMinutes)}</Text>
                        <Text style={[styles.tableCell, { color: PRIMARY, fontWeight: '600' }]}>
                          {r.pacePerMile}
                        </Text>
                        <TouchableOpacity onPress={() => confirmDelete(r.id)}>
                          <Icon name="trash-can-outline" size={16} color="#f44336" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <Button
                  mode="outlined"
                  onPress={() => {
                    setForm({ ...DEFAULT_FORM, definitionId: def.id, date: todayStr() });
                    setPacePreview(null);
                    setShowLog(true);
                  }}
                  style={styles.logBtn}
                  textColor={PRIMARY}
                >
                  Log Result
                </Button>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      {/* Log Result Modal */}
      <Modal visible={showLog} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Benchmark</Text>
            <TouchableOpacity onPress={() => setShowLog(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Definition selector */}
          <Text style={styles.fieldLabel}>Benchmark Type</Text>
          {BENCHMARK_DEFINITIONS.map((def) => (
            <TouchableOpacity
              key={def.id}
              style={[
                styles.defOption,
                form.definitionId === def.id && styles.defOptionActive,
              ]}
              onPress={() => {
                setForm((f) => ({ ...f, definitionId: def.id }));
                setPacePreview(null);
              }}
            >
              <Text
                style={[
                  styles.defOptionText,
                  form.definitionId === def.id && styles.defOptionTextActive,
                ]}
              >
                {def.name} ({def.distanceMiles} mi)
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.fieldLabel}>Duration (MM:SS or HH:MM:SS)</Text>
          <TextInput
            style={styles.input}
            value={form.duration}
            onChangeText={updateDuration}
            placeholder="e.g. 8:45 or 24:30"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor="#aaa"
          />

          {pacePreview && (
            <Card style={styles.pacePreviewCard}>
              <Card.Content>
                <Text style={styles.pacePreviewTitle}>Calculated Pace & Suggested Training Zones</Text>
                <Text style={styles.pacePreviewNote}>
                  (For reference only — tap "Update Training Paces" in Settings to apply)
                </Text>
                <View style={styles.paceGrid}>
                  {[
                    { label: 'Easy', value: pacePreview.easy },
                    { label: 'Long Run', value: pacePreview.longRun },
                    { label: 'Tempo', value: pacePreview.tempo },
                    { label: 'Intervals', value: pacePreview.interval },
                  ].map((p) => (
                    <View key={p.label} style={styles.paceItem}>
                      <Text style={styles.paceValue}>{p.value}</Text>
                      <Text style={styles.paceLabel}>{p.label}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput
            style={styles.input}
            value={form.date}
            onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Conditions, how you felt..."
            multiline
            numberOfLines={3}
            placeholderTextColor="#aaa"
          />

          <Button mode="contained" onPress={handleLog} style={styles.saveBtn} buttonColor={PRIMARY}>
            Save Result
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowLog(false)}
            textColor="#666"
            style={styles.cancelBtn}
          >
            Cancel
          </Button>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  defHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  defInfo: { flex: 1 },
  defName: { fontSize: 17, fontWeight: '700', color: '#222' },
  defMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { marginVertical: 12 },
  defDescription: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 12 },
  instructionsTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: '700', color: PRIMARY },
  stepText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 19 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#888' },
  historyTable: { marginBottom: 12 },
  tableHeader: { flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHeaderText: { fontWeight: '700', color: '#888', fontSize: 11, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  tableCell: { flex: 1, fontSize: 13, color: '#444' },
  logBtn: { borderColor: PRIMARY, borderRadius: 8 },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#222' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  defOption: { padding: 12, borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', marginBottom: 8, backgroundColor: '#fafafa' },
  defOptionActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + '10' },
  defOptionText: { fontSize: 14, color: '#555', fontWeight: '500' },
  defOptionTextActive: { color: PRIMARY, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#222', backgroundColor: '#fafafa' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  pacePreviewCard: { marginTop: 12, backgroundColor: '#f3e5ff', elevation: 0, borderRadius: 10 },
  pacePreviewTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY, marginBottom: 4 },
  pacePreviewNote: { fontSize: 11, color: '#888', marginBottom: 10, fontStyle: 'italic' },
  paceGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  paceItem: { alignItems: 'center', gap: 3 },
  paceValue: { fontSize: 16, fontWeight: '800', color: '#222' },
  paceLabel: { fontSize: 11, color: '#666' },
  saveBtn: { marginTop: 24, borderRadius: 8 },
  cancelBtn: { marginTop: 10, borderRadius: 8 },
});
