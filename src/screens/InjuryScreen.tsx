import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, TextInput, Divider } from 'react-native-paper';
import uuid from 'react-native-uuid';
import { useApp } from '../context/AppContext';
import { InjuryLog, InjurySeverity, BodyPart } from '../context/types';

const uuidv4 = uuid.v4;

const BODY_PARTS: { label: string; value: BodyPart }[] = [
  { label: 'Knee', value: 'knee' },
  { label: 'Hip', value: 'hip' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Shin', value: 'shin' },
  { label: 'Foot', value: 'foot' },
  { label: 'Calf', value: 'calf' },
  { label: 'Hamstring', value: 'hamstring' },
  { label: 'Quad', value: 'quad' },
  { label: 'Back', value: 'back' },
  { label: 'IT Band', value: 'it_band' },
  { label: 'Plantar', value: 'plantar' },
  { label: 'Other', value: 'other' },
];

const SEVERITY_OPTIONS: { label: string; value: InjurySeverity; color: string }[] = [
  { label: 'Mild', value: 'mild', color: '#2e7d32' },
  { label: 'Moderate', value: 'moderate', color: '#e65100' },
  { label: 'Severe', value: 'severe', color: '#c62828' },
];

function getRecoveryProtocol(severity: InjurySeverity, bodyPart: BodyPart): string[] {
  const base: Record<InjurySeverity, string[]> = {
    mild: [
      'Reduce weekly mileage by 20-30% for 3-5 days.',
      'Apply ice for 15 minutes after runs.',
      'Add extra stretching and mobility work.',
      'Monitor pain — if it worsens, treat as moderate.',
    ],
    moderate: [
      'Take 3-5 complete rest days from running.',
      'Apply RICE: Rest, Ice, Compression, Elevation.',
      'If pain persists beyond 5 days, see a physiotherapist.',
      'Return to running gradually — start at 50% of normal load.',
    ],
    severe: [
      'Stop running immediately.',
      'See a doctor or physiotherapist before resuming training.',
      'Do not attempt to run through severe pain.',
      'Focus on non-impact cross-training (swimming, cycling) only if pain-free.',
    ],
  };

  const specific: Partial<Record<BodyPart, string>> = {
    knee: 'Strengthen glutes and hips. Avoid downhill running initially.',
    shin: 'Check shoe wear. Avoid hard surfaces. Increase mileage no more than 10%/week.',
    it_band: 'Foam roll IT band and glutes. Side-lying leg raises to strengthen hip abductors.',
    plantar: 'Roll foot on a frozen water bottle. Calf stretches, arch support insoles.',
    hamstring: 'Avoid speed work until pain-free. Eccentric hamstring curls for rehab.',
    hip: 'Hip flexor and glute strengthening. Check running form for pelvic drop.',
    ankle: 'Balance exercises (single-leg stand). Avoid uneven terrain until healed.',
    calf: 'Eccentric calf raises on a step. Avoid hills until recovered.',
    back: 'Core strengthening. Check posture. Consider gait analysis.',
    foot: 'Rule out stress fracture with a doctor if pain is localised to bone.',
    quad: 'Avoid steep downhills. Eccentric quad strengthening.',
    other: 'Monitor carefully and seek professional advice if it does not improve.',
  };

  const protocol = [...base[severity]];
  if (specific[bodyPart]) {
    protocol.push(specific[bodyPart]!);
  }
  return protocol;
}

export function InjuryScreen() {
  const { state, addInjury, resolveInjury } = useApp();

  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<InjurySeverity | null>(null);
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const activeInjuries = state.injuries.filter(i => !i.resolved);
  const resolvedInjuries = state.injuries.filter(i => i.resolved);

  const handleLog = async () => {
    if (!selectedPart || !selectedSeverity) {
      Alert.alert('Missing Info', 'Please select a body part and severity.');
      return;
    }

    const injury: InjuryLog = {
      id: uuidv4() as string,
      date: new Date().toISOString().split('T')[0],
      bodyPart: selectedPart,
      severity: selectedSeverity,
      description: description.trim() || undefined,
      resolved: false,
    };

    await addInjury(injury);
    setSelectedPart(null);
    setSelectedSeverity(null);
    setDescription('');
    setShowForm(false);
    Alert.alert('Logged', 'Injury recorded. Check the recovery protocol below.');
  };

  const handleResolve = (id: string, label: string) => {
    Alert.alert(
      'Mark as Resolved?',
      `Mark ${label} injury as resolved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resolve', onPress: () => resolveInjury(id) },
      ]
    );
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const bodyPartLabel = (bp: BodyPart) =>
    BODY_PARTS.find(b => b.value === bp)?.label || bp;

  const severityColor = (s: InjurySeverity) =>
    SEVERITY_OPTIONS.find(o => o.value === s)?.color || '#333';

  return (
    <ScrollView style={styles.container}>
      {/* Log new injury */}
      {!showForm ? (
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setShowForm(true)}
          style={styles.logButton}
        >
          Log New Injury
        </Button>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Log Injury</Title>

            <Paragraph style={styles.sectionLabel}>Body Part</Paragraph>
            <View style={styles.chipRow}>
              {BODY_PARTS.map(bp => (
                <Chip
                  key={bp.value}
                  mode={selectedPart === bp.value ? 'flat' : 'outlined'}
                  selected={selectedPart === bp.value}
                  onPress={() => setSelectedPart(bp.value)}
                  style={[styles.chip, selectedPart === bp.value && styles.chipSelected]}
                  textStyle={selectedPart === bp.value ? styles.chipSelectedText : undefined}
                >
                  {bp.label}
                </Chip>
              ))}
            </View>

            <Paragraph style={styles.sectionLabel}>Severity</Paragraph>
            <View style={styles.severityRow}>
              {SEVERITY_OPTIONS.map(opt => (
                <Chip
                  key={opt.value}
                  mode={selectedSeverity === opt.value ? 'flat' : 'outlined'}
                  selected={selectedSeverity === opt.value}
                  onPress={() => setSelectedSeverity(opt.value)}
                  style={[
                    styles.severityChip,
                    selectedSeverity === opt.value && { backgroundColor: opt.color },
                  ]}
                  textStyle={selectedSeverity === opt.value ? styles.chipSelectedText : { color: opt.color }}
                >
                  {opt.label}
                </Chip>
              ))}
            </View>

            {/* Preview recovery protocol */}
            {selectedPart && selectedSeverity && (
              <>
                <Divider style={styles.divider} />
                <Paragraph style={styles.sectionLabel}>Recovery Protocol</Paragraph>
                {getRecoveryProtocol(selectedSeverity, selectedPart).map((tip, idx) => (
                  <Paragraph key={idx} style={styles.tip}>• {tip}</Paragraph>
                ))}
              </>
            )}

            <TextInput
              label="Notes (optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.notes}
              placeholder="Describe the pain, when it started, what aggravates it..."
            />

            <View style={styles.formButtons}>
              <Button mode="outlined" onPress={() => setShowForm(false)} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleLog} style={styles.submitButton}>
                Log Injury
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Active Injuries */}
      {activeInjuries.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Active Injuries</Title>
            {activeInjuries.map((injury, index) => (
              <View key={injury.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <View style={styles.injuryRow}>
                  <View style={styles.injuryMeta}>
                    <Paragraph style={[styles.injuryPart, { color: severityColor(injury.severity) }]}>
                      {bodyPartLabel(injury.bodyPart)}
                    </Paragraph>
                    <Chip
                      compact
                      mode="flat"
                      style={[styles.severityBadge, { backgroundColor: severityColor(injury.severity) + '22' }]}
                      textStyle={[styles.severityBadgeText, { color: severityColor(injury.severity) }]}
                    >
                      {injury.severity}
                    </Chip>
                  </View>
                  <Paragraph style={styles.injuryDate}>{formatDate(injury.date)}</Paragraph>
                </View>

                {injury.description && (
                  <Paragraph style={styles.injuryDesc}>{injury.description}</Paragraph>
                )}

                <Paragraph style={styles.protocolHeader}>Recovery Protocol:</Paragraph>
                {getRecoveryProtocol(injury.severity, injury.bodyPart).map((tip, idx) => (
                  <Paragraph key={idx} style={styles.tip}>• {tip}</Paragraph>
                ))}

                <Button
                  mode="outlined"
                  compact
                  onPress={() => handleResolve(injury.id, bodyPartLabel(injury.bodyPart))}
                  style={styles.resolveButton}
                >
                  Mark Resolved
                </Button>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {activeInjuries.length === 0 && !showForm && (
        <Card style={styles.card}>
          <Card.Content>
            <Paragraph style={styles.noInjury}>No active injuries. Keep it up!</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Resolved Injuries */}
      {resolvedInjuries.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Resolved</Title>
            {resolvedInjuries.map((injury, index) => (
              <View key={injury.id}>
                {index > 0 && <Divider />}
                <View style={[styles.injuryRow, styles.resolvedRow]}>
                  <Paragraph style={styles.resolvedPart}>
                    {bodyPartLabel(injury.bodyPart)} — {injury.severity}
                  </Paragraph>
                  <Paragraph style={styles.injuryDate}>
                    {formatDate(injury.date)}
                    {injury.resolvedDate ? ` → ${formatDate(injury.resolvedDate)}` : ''}
                  </Paragraph>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  logButton: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 13,
    color: '#444',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: '#6200ea',
  },
  chipSelectedText: {
    color: '#fff',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  severityChip: {
    flex: 1,
  },
  divider: {
    marginVertical: 12,
  },
  tip: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
    lineHeight: 19,
  },
  notes: {
    marginTop: 16,
    marginBottom: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  injuryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  injuryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  injuryPart: {
    fontWeight: 'bold',
    fontSize: 15,
    textTransform: 'capitalize',
  },
  severityBadge: {
    height: 24,
  },
  severityBadgeText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  injuryDate: {
    fontSize: 11,
    color: '#999',
  },
  injuryDesc: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  protocolHeader: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    marginTop: 4,
  },
  resolveButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  noInjury: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  resolvedRow: {
    opacity: 0.6,
  },
  resolvedPart: {
    fontSize: 13,
    color: '#555',
    textTransform: 'capitalize',
  },
});
