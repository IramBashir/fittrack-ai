// src/components/CalorieRing.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, typography } from '../utils/theme';

export default function CalorieRing({ consumed, goal, remaining }) {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const isOver = consumed > goal;
  const ringColor = isOver ? colors.danger : colors.accent;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={isOver ? colors.danger : colors.accent} />
            <Stop offset="100%" stopColor={isOver ? colors.orange : colors.purple} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.centerText}>
        <Text style={styles.consumed}>{consumed}</Text>
        <Text style={styles.unit}>kcal eaten</Text>
        <View style={styles.divider} />
        <Text style={[styles.remaining, isOver && styles.over]}>
          {isOver ? `+${Math.abs(remaining)}` : remaining}
        </Text>
        <Text style={styles.remainLabel}>{isOver ? 'over goal' : 'remaining'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  consumed: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  divider: {
    width: 30,
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  remaining: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.accent,
  },
  over: {
    color: colors.danger,
  },
  remainLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
