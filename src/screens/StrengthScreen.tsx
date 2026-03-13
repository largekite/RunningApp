import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import {
  Card,
  Title,
  Chip,
  SegmentedButtons,
  Menu,
  Button,
  Divider,
  Banner,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WorkoutType } from '../context/types';
import {
  Exercise,
  WorkoutStrengthPlan,
  getStrengthPlan,
} from '../constants/strengthLibrary';

const PRIMARY = '#6200ea';

const WORKOUT_TYPE_OPTIONS: { label: string; value: WorkoutType }[] = [
  { label: 'Easy Run', value: 'easy_run' },
  { label: 'Long Run', value: 'long_run' },
  { label: 'Tempo', value: 'tempo' },
  { label: 'Intervals', value: 'intervals' },
  { label: 'Hill Repeats', value: 'hill_repeats' },
  { label: 'Recovery', value: 'recovery' },
  { label: 'Cross Training', value: 'cross_training' },
  { label: 'Fartlek', value: 'fartlek' },
  { label: 'Strides', value: 'strides' },
  { label: 'Benchmark', value: 'benchmark' },
];

const CATEGORY_COLORS: Record<string, string> = {
  activation: '#ff9800',
  strength: '#f44336',
  mobility: '#4caf50',
  cooldown: '#2196f3',
};

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[exercise.category] ?? '#888';

  return (
    <Card style={styles.exerciseCard} onPress={() => setExpanded(!expanded)}>
      <Card.Content>
        <View style={styles.exerciseHeader}>
          <View style={[styles.iconContainer, { backgroundColor: catColor + '22' }]}>
            <Icon name={exercise.icon} size={22} color={catColor} />
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            {exercise.sets != null && exercise.reps && (
              <Text style={styles.exerciseSetsReps}>
                {exercise.sets} × {exercise.reps}
              </Text>
            )}
          </View>
          <Chip
            style={[styles.categoryChip, { backgroundColor: catColor + '22' }]}
            textStyle={[styles.categoryChipText, { color: catColor }]}
            compact
          >
            {exercise.category}
          </Chip>
        </View>

        {expanded && (
          <>
            <Divider style={styles.expandDivider} />
            <Text style={styles.description}>{exercise.description}</Text>
            <View style={styles.muscleRow}>
              {exercise.muscleGroups.map((m) => (
                <Chip key={m} style={styles.muscleChip} textStyle={styles.muscleChipText} compact>
                  {m}
                </Chip>
              ))}
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

interface Props {
  route?: { params?: { workoutType?: WorkoutType } };
}

export default function StrengthScreen({ route }: Props) {
  const initialType: WorkoutType = route?.params?.workoutType ?? 'easy_run';
  const [selectedType, setSelectedType] = useState<WorkoutType>(initialType);
  const [tab, setTab] = useState<'pre' | 'post'>('pre');
  const [menuVisible, setMenuVisible] = useState(false);

  const plan: WorkoutStrengthPlan | null = getStrengthPlan(selectedType);

  const selectedLabel =
    WORKOUT_TYPE_OPTIONS.find((o) => o.value === selectedType)?.label ?? 'Easy Run';

  const exercises: Exercise[] = plan ? (tab === 'pre' ? plan.preRun : plan.postRun) : [];

  return (
    <View style={styles.container}>
      {/* Workout type selector */}
      <View style={styles.typeSelector}>
        <Text style={styles.typeSelectorLabel}>Workout Type</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              textColor={PRIMARY}
              style={styles.menuButton}
              icon="chevron-down"
              contentStyle={{ flexDirection: 'row-reverse' }}
            >
              {selectedLabel}
            </Button>
          }
        >
          {WORKOUT_TYPE_OPTIONS.map((opt) => (
            <Menu.Item
              key={opt.value}
              title={opt.label}
              onPress={() => {
                setSelectedType(opt.value);
                setMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {/* Tab selector */}
      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as 'pre' | 'post')}
        buttons={[
          { value: 'pre', label: `Pre-Run (${plan?.preRun.length ?? 0})` },
          { value: 'post', label: `Post-Run (${plan?.postRun.length ?? 0})` },
        ]}
        style={styles.tabs}
        theme={{ colors: { secondaryContainer: PRIMARY + '22', onSecondaryContainer: PRIMARY } }}
      />

      {/* Info banner */}
      <Banner
        visible
        icon="information-outline"
        style={styles.infoBanner}
      >
        <Text style={styles.bannerText}>
          {tab === 'pre'
            ? 'Activate key muscles before your run to improve form and prevent injury.'
            : 'Recover and rebuild after your run with targeted stretching and mobility work.'}
        </Text>
      </Banner>

      {/* Exercises list */}
      {plan === null ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No exercises for this workout type</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 ? (
            <Text style={styles.noExercises}>No exercises in this section</Text>
          ) : (
            exercises.map((exercise, i) => (
              <View key={exercise.id}>
                <ExerciseCard exercise={exercise} />
                {i < exercises.length - 1 && <View style={styles.exerciseSpacer} />}
              </View>
            ))
          )}

          {/* Mobility info card */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoCardHeader}>
                <Icon name="run-fast" size={20} color={PRIMARY} />
                <Title style={styles.infoCardTitle}>Why Mobility Matters</Title>
              </View>
              <Text style={styles.infoCardText}>
                For ultramarathon training, consistent mobility work is not optional — it is
                how you stay healthy over months of high mileage. Hip flexor tightness, IT band
                issues, and calf strains are the most common culprits that derail training plans.
                Just 10 minutes of post-run stretching dramatically reduces your injury risk and
                accelerates recovery for your next workout.
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  typeSelector: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    gap: 8,
  },
  typeSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuButton: {
    borderColor: PRIMARY,
    borderRadius: 8,
  },
  tabs: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  infoBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f3e5ff',
  },
  bannerText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  list: { flex: 1 },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  exerciseCard: {
    borderRadius: 12,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  exerciseSetsReps: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryChip: {
    height: 24,
    borderRadius: 12,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  expandDivider: { marginVertical: 10 },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleChip: {
    backgroundColor: '#e8e8e8',
    height: 24,
  },
  muscleChipText: {
    fontSize: 10,
    color: '#555',
  },
  exerciseSpacer: { height: 8 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: { color: '#888', fontSize: 15 },
  noExercises: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 14,
  },
  infoCard: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#f3e5ff',
    elevation: 0,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
  },
  infoCardText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
