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
import { Card, Title, Button, Chip, Divider, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import { RaceEvent, RacePriority } from '../context/types';

const PRIMARY = '#6200ea';

const PRIORITY_COLORS: Record<RacePriority, string> = {
  A: '#6200ea',
  B: '#2196f3',
  C: '#9e9e9e',
};

const PRIORITY_LABELS: Record<RacePriority, string> = {
  A: 'A Race',
  B: 'B Race',
  C: 'C Race',
};

const DISTANCE_PRESETS = [
  { label: '5K', miles: 3.1 },
  { label: '10K', miles: 6.2 },
  { label: 'Half', miles: 13.1 },
  { label: 'Marathon', miles: 26.2 },
  { label: '50K', miles: 31.0 },
  { label: '50M', miles: 50.0 },
  { label: 'Custom', miles: 0 },
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(dateStr + 'T00:00:00');
  return Math.round((race.getTime() - today.getTime()) / 86400000);
}

function distanceLabel(miles: number): string {
  const preset = DISTANCE_PRESETS.find((p) => p.miles === miles);
  if (preset && preset.label !== 'Custom') return `${preset.label} (${miles} mi)`;
  return `${miles} mi`;
}

interface FormState {
  name: string;
  date: string;
  distancePreset: number;
  customDistance: string;
  priority: RacePriority;
  notes: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  date: '',
  distancePreset: 26.2,
  customDistance: '',
  priority: 'B',
  notes: '',
};

function RaceCard({
  event,
  faded,
  onEdit,
  onDelete,
}: {
  event: RaceEvent;
  faded?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const days = daysUntil(event.date);
  const color = PRIORITY_COLORS[event.priority];
  return (
    <TouchableOpacity onPress={onEdit} activeOpacity={0.75}>
      <Card style={[styles.raceCard, faded && styles.racePast]}>
        <Card.Content>
          <View style={styles.raceHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: color }]}>
              <Text style={styles.priorityText}>{event.priority}</Text>
            </View>
            <View style={styles.raceInfo}>
              <Text style={[styles.raceName, faded && styles.fadedText]}>{event.name}</Text>
              <Text style={styles.raceMeta}>
                {formatDate(event.date)} · {distanceLabel(event.distance)}
              </Text>
            </View>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="trash-can-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
          {!faded && days >= 0 && (
            <View style={styles.daysRow}>
              <Icon name="calendar-clock" size={14} color={color} />
              <Text style={[styles.daysText, { color }]}>
                {days === 0 ? 'Race day!' : days === 1 ? '1 day to go' : `${days} days to go`}
              </Text>
            </View>
          )}
          {event.notes ? <Text style={styles.raceNotes}>{event.notes}</Text> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

export default function RaceCalendarScreen() {
  const { state, addRaceEvent, updateRaceEvent, deleteRaceEvent } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const today = todayStr();

  const { upcoming, past } = useMemo(() => {
    const sorted = [...state.raceEvents].sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter((r) => r.date >= today),
      past: sorted.filter((r) => r.date < today).reverse(),
    };
  }, [state.raceEvents, today]);

  const nextARace = useMemo(() => upcoming.find((r) => r.priority === 'A') ?? null, [upcoming]);

  function openAddForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(event: RaceEvent) {
    setForm({
      name: event.name,
      date: event.date,
      distancePreset: DISTANCE_PRESETS.some((p) => p.miles === event.distance)
        ? event.distance
        : 0,
      customDistance: String(event.distance),
      priority: event.priority,
      notes: event.notes ?? '',
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      Alert.alert('Error', 'Race name is required.');
      return;
    }
    if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Error', 'Date must be in YYYY-MM-DD format.');
      return;
    }
    const miles =
      form.distancePreset === 0 ? parseFloat(form.customDistance) : form.distancePreset;
    if (isNaN(miles) || miles <= 0) {
      Alert.alert('Error', 'Please enter a valid distance.');
      return;
    }

    if (editingId) {
      const existing = state.raceEvents.find((e) => e.id === editingId);
      if (existing) {
        await updateRaceEvent({
          ...existing,
          name,
          date: form.date,
          distance: miles,
          priority: form.priority,
          notes: form.notes.trim() || undefined,
        });
      }
    } else {
      await addRaceEvent({
        id: Date.now().toString(),
        name,
        date: form.date,
        distance: miles,
        priority: form.priority,
        notes: form.notes.trim() || undefined,
      });
    }
    setShowForm(false);
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete Race', `Remove "${name}" from your calendar?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRaceEvent(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Next A Race countdown */}
        {nextARace && (
          <Card style={[styles.card, styles.heroCard]}>
            <Card.Content style={styles.heroContent}>
              <Text style={styles.heroLabel}>NEXT A RACE</Text>
              <Text style={styles.heroName}>{nextARace.name}</Text>
              <Text style={styles.heroDate}>{formatDate(nextARace.date)}</Text>
              <View style={styles.heroCountdown}>
                <Text style={styles.heroCountdownNum}>{daysUntil(nextARace.date)}</Text>
                <Text style={styles.heroCountdownLabel}>days away</Text>
              </View>
              <Text style={styles.heroDistance}>{distanceLabel(nextARace.distance)}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Priority note */}
        <Card style={styles.noteCard}>
          <Card.Content>
            <Text style={styles.noteText}>
              <Text style={styles.noteBold}>A races</Text> are your goal events.{' '}
              <Text style={styles.noteBold}>B/C races</Text> are tune-ups and do not affect
              your training plan.
            </Text>
          </Card.Content>
        </Card>

        {/* Upcoming races */}
        <Text style={styles.sectionHeader}>Upcoming ({upcoming.length})</Text>
        {upcoming.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No upcoming races. Tap + to add your goal race.</Text>
            </Card.Content>
          </Card>
        ) : (
          upcoming.map((r) => (
            <RaceCard
              key={r.id}
              event={r}
              onEdit={() => openEditForm(r)}
              onDelete={() => confirmDelete(r.id, r.name)}
            />
          ))
        )}

        {/* Past races */}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, styles.pastHeader]}>
              Past Races ({past.length})
            </Text>
            {past.map((r) => (
              <RaceCard
                key={r.id}
                event={r}
                faded
                onEdit={() => openEditForm(r)}
                onDelete={() => confirmDelete(r.id, r.name)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={openAddForm} color="#fff" />

      {/* Add / Edit Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Race' : 'Add Race'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Race Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. Boston Marathon"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.date}
            onChangeText={(v) => setForm({ ...form, date: v })}
            placeholder="2026-04-20"
            placeholderTextColor="#aaa"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Distance</Text>
          <View style={styles.distanceGrid}>
            {DISTANCE_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.distanceBtn,
                  form.distancePreset === p.miles && styles.distanceBtnActive,
                ]}
                onPress={() => setForm({ ...form, distancePreset: p.miles })}
              >
                <Text
                  style={[
                    styles.distanceBtnText,
                    form.distancePreset === p.miles && styles.distanceBtnTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {form.distancePreset === 0 && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={form.customDistance}
              onChangeText={(v) => setForm({ ...form, customDistance: v })}
              placeholder="Distance in miles"
              keyboardType="decimal-pad"
              placeholderTextColor="#aaa"
            />
          )}

          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['A', 'B', 'C'] as RacePriority[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityBtn,
                  { borderColor: PRIORITY_COLORS[p] },
                  form.priority === p && { backgroundColor: PRIORITY_COLORS[p] },
                ]}
                onPress={() => setForm({ ...form, priority: p })}
              >
                <Text
                  style={[
                    styles.priorityBtnText,
                    form.priority === p && { color: '#fff' },
                  ]}
                >
                  {PRIORITY_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            placeholder="Goals, course info, logistics..."
            multiline
            numberOfLines={3}
            placeholderTextColor="#aaa"
          />

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveBtn}
            buttonColor={PRIMARY}
          >
            {editingId ? 'Save Changes' : 'Add Race'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowForm(false)}
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
  content: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  heroCard: { backgroundColor: PRIMARY },
  heroContent: { alignItems: 'center', paddingVertical: 12 },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  heroDate: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  heroCountdown: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  heroCountdownNum: { color: '#fff', fontSize: 52, fontWeight: '900', lineHeight: 56 },
  heroCountdownLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600' },
  heroDistance: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  noteCard: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff8e1',
    elevation: 0,
  },
  noteText: { fontSize: 13, color: '#666', lineHeight: 18 },
  noteBold: { fontWeight: '700', color: '#444' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  pastHeader: { marginTop: 16, color: '#bbb' },
  emptyCard: { borderRadius: 12, elevation: 1 },
  emptyText: { color: '#aaa', textAlign: 'center', paddingVertical: 12 },
  raceCard: { marginBottom: 8, borderRadius: 12, elevation: 2 },
  racePast: { opacity: 0.5 },
  raceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  raceInfo: { flex: 1 },
  raceName: { fontSize: 16, fontWeight: '700', color: '#222' },
  fadedText: { color: '#999' },
  raceMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 42,
  },
  daysText: { fontSize: 12, fontWeight: '600' },
  raceNotes: { fontSize: 12, color: '#888', marginTop: 6, marginLeft: 42 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: PRIMARY },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#222' },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  distanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  distanceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  distanceBtnActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + '15' },
  distanceBtnText: { fontSize: 13, fontWeight: '600', color: '#666' },
  distanceBtnTextActive: { color: PRIMARY },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityBtnText: { fontSize: 14, fontWeight: '700', color: '#555' },
  saveBtn: { marginTop: 24, borderRadius: 8 },
  cancelBtn: { marginTop: 10, borderRadius: 8 },
});
