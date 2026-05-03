// components/StepsTracker.tsx
import Card from "@/components/Card";
import { colors, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function StepsTracker() {
  const { state, dispatch } = useApp();
  const { stepsToday, stepsGoal } = state.user;

  const [input, setInput] = useState("");

  const percent = Math.min(stepsToday / stepsGoal, 1);

  // Calories burned estimate from steps
  // Rough formula: steps × 0.04 kcal (average for 60kg person)
  const caloriesBurned = Math.round(stepsToday * 0.04);

  // Distance estimate: average stride = 0.762m
  const distanceKm = ((stepsToday * 0.762) / 1000).toFixed(1);

  const handleSave = () => {
    const steps = parseInt(input);
    if (isNaN(steps) || steps < 0 || steps > 100000) {
      Alert.alert("Invalid steps", "Please enter a valid step count.");
      return;
    }
    dispatch({ type: "UPDATE_STEPS", payload: steps });
    setInput("");
  };

  // Progress color changes as you get closer to goal
  const getBarColor = () => {
    if (percent >= 1) return colors.accent; // goal reached — green
    if (percent >= 0.7) return colors.warning; // close — orange
    return colors.purple; // early — purple
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>👟</Text>
          <View>
            <Text style={styles.title}>Steps Today</Text>
            <Text style={styles.subtitle}>
              Goal: {stepsGoal.toLocaleString()} steps
            </Text>
          </View>
        </View>

        {/* Steps count */}
        <View style={styles.stepsCount}>
          <Text
            style={[
              styles.stepsNumber,
              stepsToday >= stepsGoal && { color: colors.accent },
            ]}
          >
            {stepsToday.toLocaleString()}
          </Text>
          <Text style={styles.stepsLabel}>steps</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percent * 100}%`,
              backgroundColor: getBarColor(),
            },
          ]}
        />
      </View>

      {/* Percent text */}
      <Text style={styles.percentText}>
        {Math.round(percent * 100)}% of daily goal
      </Text>

      {/* Stats row — calories + distance */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={14} color={colors.orange} />
          <Text style={styles.statValue}>{caloriesBurned}</Text>
          <Text style={styles.statLabel}>kcal burned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="walk-outline" size={14} color={colors.purple} />
          <Text style={styles.statValue}>{distanceKm}</Text>
          <Text style={styles.statLabel}>km walked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="trophy-outline" size={14} color={colors.accent} />
          <Text style={styles.statValue}>
            {stepsToday >= stepsGoal
              ? "✅"
              : `${(stepsGoal - stepsToday).toLocaleString()}`}
          </Text>
          <Text style={styles.statLabel}>
            {stepsToday >= stepsGoal ? "Goal done!" : "steps left"}
          </Text>
        </View>
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Update step count..."
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={input}
          onChangeText={setInput}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          // onSubmitEditing fires when user presses "done" on keyboard
        />
        <TouchableOpacity
          style={[styles.saveBtn, !input && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!input}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Motivational message */}
      {stepsToday > 0 && stepsToday < stepsGoal && (
        <Text style={styles.motivation}>
          {percent < 0.3
            ? "Great start! Keep moving 💪"
            : percent < 0.6
              ? "Halfway there, you got this! 🔥"
              : "Almost at your goal, push through! 🏃"}
        </Text>
      )}

      {stepsToday >= stepsGoal && (
        <Text style={[styles.motivation, { color: colors.accent }]}>
          🎉 Daily step goal crushed!
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  emoji: {
    fontSize: 28,
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },

  stepsCount: {
    alignItems: "flex-end",
  },

  stepsNumber: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  stepsLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // Progress bar
  barBg: {
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: "hidden",
    marginBottom: 6,
  },

  barFill: {
    height: "100%",
    borderRadius: radius.full,
  },

  percentText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },

  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
  },

  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },

  input: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },

  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtnDisabled: {
    opacity: 0.4,
  },

  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.bg,
  },

  motivation: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
});
