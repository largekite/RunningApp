import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  zone: number;
  zoneName: string;
  color: string;
  bpm?: number;
  size?: 'small' | 'normal';
}

export default function HRZoneBadge({ zone, zoneName, color, bpm, size = 'normal' }: Props) {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, { backgroundColor: color }, isSmall && styles.containerSmall]}>
      <Text style={[styles.zoneText, isSmall && styles.zoneTextSmall]}>
        Z{zone} {zoneName}
      </Text>
      {bpm != null && (
        <Text style={[styles.bpmText, isSmall && styles.bpmTextSmall]}>{bpm} bpm</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  zoneText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  zoneTextSmall: {
    fontSize: 11,
  },
  bpmText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  bpmTextSmall: {
    fontSize: 10,
  },
});
