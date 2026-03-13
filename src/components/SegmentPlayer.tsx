import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { WorkoutSegment } from '../context/types';

interface Props {
  segments: WorkoutSegment[];
  currentIndex: number;
  secondsRemaining: number | null;
  onAdvance: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function segmentDetail(segment: WorkoutSegment): string {
  const parts: string[] = [];
  if (segment.distance != null) {
    parts.push(`${segment.distance} ${segment.distance === 1 ? 'mile' : 'miles'}`);
  }
  if (segment.duration != null) {
    const m = Math.floor(segment.duration / 60);
    const s = segment.duration % 60;
    parts.push(s > 0 ? `${m}m ${s}s` : `${m} min`);
  }
  if (segment.pace) {
    parts.push(`@ ${segment.pace}/mi`);
  }
  return parts.length > 0 ? parts.join(' · ') : segment.description;
}

export default function SegmentPlayer({ segments, currentIndex, secondsRemaining, onAdvance }: Props) {
  const current = segments[currentIndex];
  const next = segments[currentIndex + 1] ?? null;
  const isLast = currentIndex >= segments.length - 1;

  if (!current) return null;

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {segments.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentIndex && styles.dotCompleted,
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Segment counter */}
      <Text style={styles.segmentCounter}>
        Segment {currentIndex + 1} of {segments.length}
      </Text>

      {/* Current segment name */}
      <Text style={styles.segmentName}>{current.name}</Text>

      {/* Countdown if applicable */}
      {secondsRemaining != null && (
        <Text style={styles.countdown}>{formatDuration(secondsRemaining)}</Text>
      )}

      {/* Segment detail */}
      <Text style={styles.segmentDetail}>{segmentDetail(current)}</Text>

      {/* Description */}
      {current.description.length > 0 && current.description !== segmentDetail(current) && (
        <Text style={styles.segmentDescription}>{current.description}</Text>
      )}

      {/* Next segment preview */}
      {next && (
        <View style={styles.nextContainer}>
          <Text style={styles.nextLabel}>UP NEXT</Text>
          <Text style={styles.nextName}>{next.name}</Text>
          <Text style={styles.nextDetail}>{segmentDetail(next)}</Text>
        </View>
      )}

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={onAdvance} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip to Next Segment ›</Text>
        </TouchableOpacity>
      )}

      {isLast && (
        <View style={styles.finalBadge}>
          <Text style={styles.finalBadgeText}>FINAL SEGMENT</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotCompleted: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 20,
  },
  segmentCounter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  segmentName: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  countdown: {
    color: '#ffcc00',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 8,
  },
  segmentDetail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  segmentDescription: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  nextContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    width: '100%',
    alignItems: 'center',
  },
  nextLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  nextName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextDetail: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    textAlign: 'center',
  },
  skipButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  finalBadge: {
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(98,0,234,0.5)',
  },
  finalBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
