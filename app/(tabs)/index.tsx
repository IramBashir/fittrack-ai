// app/(tabs)/index.tsx
import CalorieRing from "@/components/CalorieRing";
import Card from "@/components/Card";
import MealItem from "@/components/MealItem";
import StepsTracker from "@/components/StepsTracker";
import WaterTracker from "@/components/WaterTracker";
import { colors, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── MACRO BAR ────────────────────────────────────────────
// Small horizontal progress bar for protein/carbs/fat
// Defined here since it's only used on this screen

type MacroBarProps = {
  label: string;
  value: number; // current grams
  goal: number; // target grams
  color: string;
};

function MacroBar({ label, value, goal, color }: MacroBarProps) {
  const percent = Math.min((value / goal) * 100, 100);
  return (
    <View style={macroStyles.row}>
      <Text style={macroStyles.label}>{label}</Text>
      <View style={macroStyles.barBg}>
        <View
          style={[
            macroStyles.barFill,
            { width: `${percent}%`, backgroundColor: color },
            // width as percentage string — React Native supports this!
          ]}
        />
      </View>
      <Text style={macroStyles.value}>{value}g</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  label: {
    width: 55,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: "hidden",
    // overflow hidden ensures the fill bar
    // doesn't spill outside the rounded container
  },
  barFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  value: {
    width: 36,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
  },
});

// ─── MAIN SCREEN ──────────────────────────────────────────
export default function DashboardScreen() {
  const { state, totalCaloriesToday, remainingCalories } = useApp();

  const { user, meals, streak } = state;

  // Sample macro data
  // In V2 this would come from meal nutrition data
  const macros = [
    { label: "Protein", value: 82, goal: 120, color: colors.purple },
    { label: "Carbs", value: 165, goal: 200, color: colors.accent },
    { label: "Fat", value: 44, goal: 55, color: colors.orange },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{user.name} 👋</Text>
          </View>

          {/* Streak badge — color intensity grows with streak */}
          <TouchableOpacity
            style={[
              styles.streakBadge,
              streak >= 7 && {
                borderColor: colors.warning + "60",
                backgroundColor: colors.warning + "15",
              },
              streak >= 14 && {
                borderColor: colors.accent + "60",
                backgroundColor: colors.accent + "15",
              },
              // low streak = orange, week+ = yellow, 2weeks+ = green
            ]}
            onPress={() => {}}
            // future: tap to see streak history
          >
            <Ionicons
              name={streak > 0 ? "flame" : "flame-outline"}
              size={15}
              color={
                streak >= 14
                  ? colors.accent
                  : streak >= 7
                    ? colors.warning
                    : streak > 0
                      ? colors.orange
                      : colors.textMuted
              }
            />
            <Text
              style={[
                styles.streakText,
                streak >= 14 && { color: colors.accent },
                streak >= 7 && streak < 14 && { color: colors.warning },
              ]}
            >
              {streak > 0 ? `${streak} day streak` : "No streak yet"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date */}
        <Text style={styles.date}>{dayjs().format("dddd, MMMM D")}</Text>

        {/* ── Calorie Ring Card ── */}
        <Card style={styles.ringCard}>
          <View style={styles.ringRow}>
            {/* The big SVG ring */}
            <CalorieRing
              consumed={totalCaloriesToday}
              goal={user.calorieGoal}
              remaining={remainingCalories}
            />

            {/* Stats to the right of the ring */}
            <View style={styles.ringStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.calorieGoal}</Text>
                <Text style={styles.statLabel}>Daily Goal</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalCaloriesToday}</Text>
                <Text style={styles.statLabel}>Consumed</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    remainingCalories < 0 && { color: colors.danger },
                  ]}
                >
                  {Math.abs(remainingCalories)}
                </Text>
                <Text style={styles.statLabel}>
                  {remainingCalories < 0 ? "Over" : "Left"}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ── Recovery Mode ── */}
        {/* Only shows when user exceeds calorie goal */}
        {remainingCalories < 0 && (
          <Card style={styles.recoveryCard}>
            <View style={styles.recoveryHeader}>
              <Ionicons name="bulb-outline" size={16} color={colors.warning} />
              <Text style={styles.recoveryTitle}>Recovery Mode 💡</Text>
            </View>
            <Text style={styles.recoveryText}>
              You're {Math.abs(remainingCalories)} kcal over today. Try a
              lighter dinner — a soup or salad (~300 kcal) will help balance
              things out.
            </Text>
          </Card>
        )}

        {/* ── Macros Card ── */}
        <Card style={styles.macrosCard}>
          <Text style={styles.sectionTitle}>Macros Today</Text>
          {macros.map((m) => (
            <MacroBar key={m.label} {...m} />
          ))}
        </Card>

        {/* ── Meals Header ── */}
        <View style={styles.mealsHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/add-meal")}
            // router.push() navigates to a screen by its file path
            // '/add-meal' = app/add-meal.tsx
          >
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* ── Meals List ── */}
        <Card style={styles.mealsCard}>
          {meals.length === 0 ? (
            // Empty state — shown when no meals logged yet
            <View style={styles.emptyState}>
              <Ionicons
                name="restaurant-outline"
                size={32}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>No meals logged yet</Text>
              <Text style={styles.emptySubtext}>
                Tap Add to log your first meal
              </Text>
            </View>
          ) : (
            meals.map((meal, index) => (
              <MealItem
                key={meal.id}
                meal={meal}
                isLast={index === meals.length - 1}
              />
            ))
          )}
        </Card>

        {/* ── Water Tracker ── */}
        <WaterTracker />

        {/* ── Steps Tracker ── */}
        <StepsTracker />
      </ScrollView>

      {/* ── Floating Action Button (FAB) ── */}
      {/* The big green + button at the bottom right */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-meal")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: 60, // space for status bar
    paddingBottom: 100, // space so FAB doesn't cover last card
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.orangeDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.orange + "40",
  },

  streakText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.orange,
  },

  date: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    marginTop: 2,
  },

  // ── Calorie Ring Card ──
  ringCard: {
    marginBottom: spacing.md,
  },

  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },

  ringStats: {
    flex: 1,
    gap: 10,
  },

  statItem: {
    alignItems: "center",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  statDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // ── Recovery Card ──
  recoveryCard: {
    marginBottom: spacing.md,
    borderColor: colors.warning + "40",
    backgroundColor: colors.warning + "10",
  },

  recoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },

  recoveryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warning,
  },

  recoveryText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ── Macros Card ──
  macrosCard: {
    marginBottom: spacing.md,
    gap: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  // ── Meals Section ──
  mealsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentMid,
  },

  addBtnText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
  },

  mealsCard: {
    padding: 0, // remove card padding so rows go edge to edge
    overflow: "hidden", // clip rows to card's rounded corners
    marginBottom: spacing.md,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 8,
  },

  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
  },

  // ── FAB ──
  fab: {
    position: "absolute",
    bottom: 90, // above the tab bar
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    // Shadow for iOS
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 8,
  },
});
