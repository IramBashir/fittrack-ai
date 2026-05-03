// components/CalorieRing.tsx
import { colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

// ─── TYPES ────────────────────────────────────────────────
type CalorieRingProps = {
  consumed: number; // how many kcal eaten today
  goal: number; // daily calorie target
  remaining: number; // goal - consumed (can be negative if over)
};

// ─── CONSTANTS ────────────────────────────────────────────
const SIZE = 200; // total SVG canvas size (width & height)
const STROKE_WIDTH = 14; // thickness of the ring
// Radius of the circle — must account for stroke so it fits inside canvas
const RING_RADIUS = (SIZE - STROKE_WIDTH) / 2;
// Circumference = 2 × π × radius (full circle length in pixels)
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function CalorieRing({
  consumed,
  goal,
  remaining,
}: CalorieRingProps) {
  // How full is the ring? 0 = empty, 1 = completely full
  const progress = Math.min(consumed / goal, 1);

  // strokeDashoffset controls how much of the ring is "hidden"
  // Full offset = completely empty ring
  // Zero offset = completely full ring
  // So: offset = circumference × (1 - progress)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const isOver = consumed > goal;

  // Ring color changes based on whether user exceeded goal
  const ringStartColor = isOver ? colors.danger : colors.accent;
  const ringEndColor = isOver ? colors.orange : colors.purple;

  return (
    <View style={styles.container}>
      {/* SVG Canvas — this is where we draw the ring */}
      <Svg width={SIZE} height={SIZE}>
        {/* Defs = definitions — reusable stuff like gradients */}
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={ringStartColor} />
            <Stop offset="100%" stopColor={ringEndColor} />
          </LinearGradient>
        </Defs>

        {/* Track — the grey background circle (full circle, always visible) */}
        {/* // Track circle — change stroke color */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RING_RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />

        {/* Progress ring — the colored circle that fills up */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RING_RADIUS}
          stroke="url(#ringGrad)" // use the gradient we defined above
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round" // rounded ends on the arc
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          // dasharray = "dash length, gap length"
          // Setting both to circumference = one long dash that covers full circle
          strokeDashoffset={strokeDashoffset}
          // offset pushes the dash forward, hiding part of it
          // This is the classic SVG progress ring trick
          transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
          // SVG starts at 3 o'clock (right side)
          // We rotate -90° so it starts at 12 o'clock (top)
        />
      </Svg>

      {/* Center Text — sits on top of the SVG using absolute positioning */}
      <View style={styles.centerText}>
        <Text style={styles.consumedNumber}>{consumed}</Text>
        <Text style={styles.consumedLabel}>kcal eaten</Text>

        {/* Thin divider line */}
        <View style={styles.divider} />

        <Text
          style={[
            styles.remainingNumber,
            isOver && styles.overColor, // turn red if over goal
          ]}
        >
          {/* Show + sign if over goal */}
          {isOver ? `+${Math.abs(remaining)}` : remaining}
        </Text>

        <Text style={styles.remainingLabel}>
          {isOver ? "over goal" : "remaining"}
        </Text>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // needed so children can use absolute positioning
  },

  // Sits on top of the SVG, perfectly centered
  centerText: {
    position: "absolute", // float on top of the SVG
    alignItems: "center",
  },

  consumedNumber: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -1, // tight spacing looks modern
  },

  consumedLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  divider: {
    width: 30,
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },

  remainingNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.accent, // green by default
  },

  overColor: {
    color: colors.danger, // red when over goal
  },

  remainingLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
