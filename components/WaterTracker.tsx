// components/WaterTracker.tsx
import Card from "@/components/Card";
import { colors, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WaterTracker() {
  const { state, dispatch } = useApp();
  const { waterToday, waterGoal } = state.user;

  const percent = Math.min(waterToday / waterGoal, 1);

  return (
    <Card style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>💧</Text>
          <View>
            <Text style={styles.title}>Water Today</Text>
            <Text style={styles.subtitle}>Goal: {waterGoal} glasses</Text>
          </View>
        </View>
        <Text style={styles.count}>
          <Text
            style={[
              styles.countCurrent,
              waterToday >= waterGoal && { color: colors.accent },
            ]}
          >
            {waterToday}
          </Text>
          <Text style={styles.countGoal}>/{waterGoal}</Text>
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${percent * 100}%` },
            waterToday >= waterGoal && { backgroundColor: colors.accent },
          ]}
        />
      </View>

      {/* Glass icons — visual representation */}
      <View style={styles.glassRow}>
        {Array.from({ length: waterGoal }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              // tapping a glass toggles it
              if (i < waterToday) {
                dispatch({ type: "REMOVE_WATER" });
              } else if (i === waterToday) {
                dispatch({ type: "ADD_WATER" });
              }
            }}
          >
            <Ionicons
              name={i < waterToday ? "water" : "water-outline"}
              size={22}
              color={i < waterToday ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* +/- buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, waterToday === 0 && styles.btnDisabled]}
          onPress={() => dispatch({ type: "REMOVE_WATER" })}
          disabled={waterToday === 0}
        >
          <Ionicons
            name="remove"
            size={20}
            color={waterToday === 0 ? colors.textMuted : colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.glassLabel}>
          {waterToday === 0
            ? "Tap + to log a glass"
            : waterToday >= waterGoal
              ? "🎉 Goal reached!"
              : `${waterGoal - waterToday} more to go`}
        </Text>

        <TouchableOpacity
          style={[
            styles.btn,
            styles.btnAdd,
            waterToday >= waterGoal && styles.btnDisabled,
          ]}
          onPress={() => dispatch({ type: "ADD_WATER" })}
          disabled={waterToday >= waterGoal}
        >
          <Ionicons
            name="add"
            size={20}
            color={waterToday >= waterGoal ? colors.textMuted : colors.bg}
          />
        </TouchableOpacity>
      </View>
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

  count: {
    fontSize: 14,
  },

  countCurrent: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  countGoal: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Progress bar
  barBg: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: "hidden",
    marginBottom: spacing.md,
  },

  barFill: {
    height: "100%",
    backgroundColor: colors.water,
    borderRadius: radius.full,
  },

  // Glass icons row
  glassRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.md,
  },

  // Buttons
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  btnAdd: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  btnDisabled: {
    opacity: 0.4,
  },

  glassLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
});
