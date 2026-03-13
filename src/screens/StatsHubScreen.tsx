import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import TrainingLoadService from '../services/trainingLoad.service';
import { calculatePacesFromGoalTime } from '../utils/paceCalculator';

const PRIMARY = '#6200ea';
const FALLBACK_FTP = '9:30';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(dateStr + 'T00:00:00');
  return Math.round((race.getTime() - today.getTime()) / 86400000);
}

function getFtpPace(goalFinishTime?: string): string {
  if (!goalFinishTime) return FALLBACK_FTP;
  try {
    const paces = calculatePacesFromGoalTime(goalFinishTime, 50);
    return paces.tempo ?? FALLBACK_FTP;
  } catch {
    return FALLBACK_FTP;
  }
}

interface HubCardProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  detail?: React.ReactNode;
  onPress: () => void;
}

function HubCard({ icon, iconColor, title, subtitle, detail, onPress }: HubCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Card style={styles.hubCard}>
        <Card.Content style={styles.hubCardContent}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '22' }]}>
            <Icon name={icon} size={26} color={iconColor} />
          </View>
          <View style={styles.hubCardText}>
            <Text style={styles.hubCardTitle}>{title}</Text>
            <Text style={styles.hubCardSubtitle}>{subtitle}</Text>
            {detail}
          </View>
          <Icon name="chevron-right" size={22} color="#ccc" />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

interface Props {
  navigation: any;
}

export default function StatsHubScreen({ navigation }: Props) {
  const { state } = useApp();
  const today = todayStr();

  // Hydration summary for today
  const todayHydration = useMemo(() => {
    const log = state.hydrationLogs[today];
    if (!log) return { total: 0, goal: 2500, progress: 0 };
    const total = log.entries.reduce((s, e) => s + e.amountMl, 0);
    return { total, goal: log.goalMl, progress: Math.min(1, total / log.goalMl) };
  }, [state.hydrationLogs, today]);

  // Latest body weight entry
  const latestWeight = useMemo(() => {
    const sorted = [...state.bodyWeightEntries].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0] ?? null;
  }, [state.bodyWeightEntries]);

  // Current training load
  const trainingLoad = useMemo(() => {
    const checkIns = Object.values(state.checkIns);
    if (checkIns.length === 0) return null;
    const ftpPace = getFtpPace(state.user?.goalFinishTime);
    return TrainingLoadService.getCurrentLoad(checkIns, ftpPace);
  }, [state.checkIns, state.user]);

  // Next A race
  const nextARace = useMemo(() => {
    const upcoming = state.raceEvents
      .filter((r) => r.priority === 'A' && r.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }, [state.raceEvents, today]);

  // Latest benchmark result
  const latestBenchmark = useMemo(() => state.benchmarkResults[0] ?? null, [state.benchmarkResults]);

  const routeCount = state.savedRoutes.length;
  const completedRuns = Object.values(state.checkIns).filter((c) => c.completed).length;
  const activeInjuries = state.injuries.filter((i) => !i.resolved).length;
  const activeShoes = state.shoes.filter((s) => !s.retired).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Stats Hub</Text>
      <Text style={styles.pageSubtitle}>Your training analytics at a glance.</Text>

      {/* Hydration */}
      <HubCard
        icon="water"
        iconColor="#2196f3"
        title="Hydration"
        subtitle="Today's intake"
        detail={
          <View style={styles.progressRow}>
            <ProgressBar
              progress={todayHydration.progress}
              color={todayHydration.progress >= 1 ? '#4caf50' : '#2196f3'}
              style={styles.miniProgress}
            />
            <Text style={styles.progressLabel}>
              {todayHydration.total} ml / {todayHydration.goal} ml
            </Text>
          </View>
        }
        onPress={() => navigation.navigate('Hydration')}
      />

      {/* Body Weight */}
      <HubCard
        icon="scale-bathroom"
        iconColor="#9c27b0"
        title="Body Weight"
        subtitle={
          latestWeight
            ? `Last: ${(latestWeight.weightKg * 2.20462).toFixed(1)} lbs · ${latestWeight.date}`
            : 'No entries yet'
        }
        onPress={() => navigation.navigate('BodyWeight')}
      />

      {/* Training Load */}
      <HubCard
        icon="chart-line"
        iconColor={trainingLoad?.color ?? '#888'}
        title="Training Load"
        subtitle={
          trainingLoad
            ? `TSB: ${trainingLoad.tsb > 0 ? '+' : ''}${trainingLoad.tsb.toFixed(1)} · ${trainingLoad.label}`
            : 'Log workouts to see load'
        }
        detail={
          trainingLoad ? (
            <Text style={[styles.loadDetail, { color: trainingLoad.color }]}>
              {trainingLoad.description}
            </Text>
          ) : undefined
        }
        onPress={() => navigation.navigate('TrainingLoad')}
      />

      {/* Race Calendar */}
      <HubCard
        icon="flag-checkered"
        iconColor={PRIMARY}
        title="Race Calendar"
        subtitle={
          nextARace
            ? `${nextARace.name} in ${daysUntil(nextARace.date)} days`
            : state.raceEvents.length > 0
            ? `${state.raceEvents.length} race${state.raceEvents.length !== 1 ? 's' : ''} scheduled`
            : 'Add your goal race'
        }
        detail={
          nextARace ? (
            <View style={styles.raceBadge}>
              <Text style={styles.raceBadgeText}>A Race · {nextARace.distance} mi</Text>
            </View>
          ) : undefined
        }
        onPress={() => navigation.navigate('RaceCalendar')}
      />

      {/* Benchmarks */}
      <HubCard
        icon="timer-outline"
        iconColor="#ff9800"
        title="Benchmarks"
        subtitle={
          latestBenchmark
            ? `Last: ${latestBenchmark.pacePerMile}/mi on ${latestBenchmark.date}`
            : state.benchmarkResults.length > 0
            ? `${state.benchmarkResults.length} result${state.benchmarkResults.length !== 1 ? 's' : ''} logged`
            : 'No time trials yet'
        }
        onPress={() => navigation.navigate('Benchmark')}
      />

      {/* Personal Records */}
      <HubCard
        icon="trophy"
        iconColor="#f44336"
        title="Personal Records"
        subtitle={
          completedRuns > 0
            ? `From ${completedRuns} completed run${completedRuns !== 1 ? 's' : ''}`
            : 'No PRs yet — log your runs!'
        }
        onPress={() => navigation.navigate('PRDashboard')}
      />

      {/* Saved Routes */}
      <HubCard
        icon="map-marker-path"
        iconColor="#4caf50"
        title="Saved Routes"
        subtitle={
          routeCount > 0
            ? `${routeCount} saved route${routeCount !== 1 ? 's' : ''}`
            : 'No routes saved yet'
        }
        onPress={() => navigation.navigate('SavedRoutes')}
      />

      {/* Strength & Mobility */}
      <HubCard
        icon="dumbbell"
        iconColor="#795548"
        title="Strength & Mobility"
        subtitle="Pre/post-run exercise library for runners"
        onPress={() => navigation.navigate('Strength', {})}
      />

      {/* Injury Log */}
      <HubCard
        icon="bandage"
        iconColor="#f44336"
        title="Injury Log"
        subtitle={
          activeInjuries > 0
            ? `${activeInjuries} active issue${activeInjuries !== 1 ? 's' : ''}`
            : 'No active injuries'
        }
        onPress={() => navigation.navigate('Injuries')}
      />

      {/* Shoes */}
      <HubCard
        icon="shoe-sneaker"
        iconColor="#607d8b"
        title="Running Shoes"
        subtitle={
          activeShoes > 0
            ? `${activeShoes} active pair${activeShoes !== 1 ? 's' : ''}`
            : 'No shoes logged'
        }
        onPress={() => navigation.navigate('Shoes')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#222', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  hubCard: {
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  hubCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hubCardText: { flex: 1, gap: 2 },
  hubCardTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  hubCardSubtitle: { fontSize: 12, color: '#777', lineHeight: 17 },
  progressRow: { marginTop: 6, gap: 3 },
  miniProgress: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: '#888' },
  loadDetail: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  raceBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: PRIMARY + '22',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  raceBadgeText: { fontSize: 10, color: PRIMARY, fontWeight: '700' },
});
