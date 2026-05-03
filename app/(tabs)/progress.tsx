// app/(tabs)/progress.tsx
import Card from "@/components/Card";
import { colors, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Polyline,
    Stop,
    Text as SvgText,
} from "react-native-svg";

// ─── SCREEN WIDTH ─────────────────────────────────────────
// We need the actual device width to size our chart correctly
// Subtract horizontal padding (spacing.md × 2) and card padding (spacing.md × 2)
const SCREEN_W = Dimensions.get("window").width;
const CHART_W = SCREEN_W - spacing.md * 2 - spacing.md * 2;
// spacing.md*2 for screen padding, spacing.md*2 for card padding

const CHART_H = 160; // fixed chart height

// Chart padding — space for axis labels inside the SVG canvas
const PAD = {
  top: 20,
  bottom: 30, // space for X axis day labels
  left: 38, // space for Y axis weight labels
  right: 16,
};

// ─── WEIGHT CHART ─────────────────────────────────────────
type WeightEntry = { date: string; weight: number };

type WeightChartProps = {
  data: WeightEntry[];
};

function WeightChart({ data }: WeightChartProps) {
  if (!data || data.length < 2) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>
          Log at least 2 days to see your trend
        </Text>
      </View>
    );
  }

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights) - 0.5; // a bit below min so line isn't at edge
  const maxW = Math.max(...weights) + 0.5; // a bit above max

  // Convert data index → X pixel position
  const toX = (i: number) =>
    PAD.left + (i / (data.length - 1)) * (CHART_W - PAD.left - PAD.right);

  // Convert weight value → Y pixel position
  // Note: SVG Y=0 is at TOP, so higher weight = lower Y value = closer to top
  const toY = (w: number) =>
    PAD.top +
    (1 - (w - minW) / (maxW - minW)) * (CHART_H - PAD.top - PAD.bottom);

  // Build the polyline points string: "x1,y1 x2,y2 x3,y3 ..."
  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.weight)}`).join(" ");

  // Build SVG path for the area fill under the line
  // M = move to, L = line to, Z = close path
  const areaPath = [
    `M ${toX(0)},${CHART_H - PAD.bottom}`, // bottom left
    ...data.map((d, i) => `L ${toX(i)},${toY(d.weight)}`), // up along the line
    `L ${toX(data.length - 1)},${CHART_H - PAD.bottom}`, // back down to bottom right
    "Z", // close the shape
  ].join(" ");

  // Y axis tick values — 3 evenly spaced reference lines
  const yTicks = [minW + 0.5, (minW + maxW) / 2, maxW - 0.5].map(
    (v) => Math.round(v * 10) / 10,
  ); // round to 1 decimal

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        {/* Gradient for the area fill under the line */}
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          {/* Fades from faint green at top to transparent at bottom */}
        </LinearGradient>
      </Defs>

      {/* ── Y axis grid lines + labels ── */}
      {yTicks.map((tick) => (
        <React.Fragment key={tick}>
          {/* Horizontal dashed grid line */}
          <Line
            x1={PAD.left}
            y1={toY(tick)}
            x2={CHART_W - PAD.right}
            y2={toY(tick)}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="3 4"
            // "3 4" = 3px dash, 4px gap — creates dashed line
          />
          {/* Weight label on the left */}
          <SvgText
            x={PAD.left - 6}
            y={toY(tick) + 4} // +4 to vertically center text on the line
            fontSize={10}
            fill={colors.textMuted}
            textAnchor="end" // right-align the text
          >
            {tick}
          </SvgText>
        </React.Fragment>
      ))}

      {/* ── X axis day labels ── */}
      {data.map((d, i) => (
        <SvgText
          key={i}
          x={toX(i)}
          y={CHART_H - 8}
          fontSize={9}
          fill={colors.textMuted}
          textAnchor="middle"
        >
          {dayjs(d.date).format("ddd")}
          {/* 'ddd' = short day name: Mon, Tue, Wed... */}
        </SvgText>
      ))}

      {/* ── Area fill under the line ── */}
      <Path d={areaPath} fill="url(#areaGrad)" />

      {/* ── The line itself ── */}
      <Polyline
        points={linePoints}
        fill="none"
        stroke={colors.accent}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Data point dots ── */}
      {data.map((d, i) => (
        <Circle
          key={i}
          cx={toX(i)}
          cy={toY(d.weight)}
          r={4} // radius of dot
          fill={colors.bg} // dark fill matches background
          stroke={colors.accent} // green border
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}

const chartStyles = StyleSheet.create({
  empty: {
    height: CHART_H,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

// ─── CALORIE BAR ──────────────────────────────────────────
// Horizontal bar for each day's calorie total in weekly summary

type CalorieBarProps = {
  label: string; // day name: Mon, Tue...
  value: number; // calories that day
  goal: number; // daily target
};

function CalorieBar({ label, value, goal }: CalorieBarProps) {
  const over = value > goal;
  const pct = Math.min((value / goal) * 100, 100);
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.barBg}>
        <View
          style={[
            barStyles.barFill,
            {
              width: `${pct}%`,
              backgroundColor: over ? colors.danger : colors.accent,
            },
          ]}
        />
      </View>
      <Text style={[barStyles.value, over && { color: colors.danger }]}>
        {value}
      </Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    width: 30,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  value: {
    width: 40,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
  },
});

// ─── MAIN SCREEN ──────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProgressScreen() {
  const { state, dispatch } = useApp();
  const { weightLog, weeklyCalories, user, streak } = state;

  const [weightInput, setWeightInput] = useState("");

  // ── Computed stats ──────────────────────────────────────

  // Latest logged weight
  const latestWeight = weightLog[weightLog.length - 1]?.weight;

  // First weight in the log (7 days ago)
  const firstWeight = weightLog[0]?.weight;

  // Change over the week
  const weightChange =
    latestWeight != null && firstWeight != null
      ? Number((latestWeight - firstWeight).toFixed(1))
      : null;

  // Average daily calories this week
  const avgCalories = Math.round(
    weeklyCalories.reduce((a, b) => a + b, 0) / weeklyCalories.length,
  );

  // What % of days were under the calorie goal
  const consistency = Math.round(
    (weeklyCalories.filter((c) => c <= user.calorieGoal).length /
      weeklyCalories.length) *
      100,
  );

  // ── Handler ─────────────────────────────────────────────

  const handleLogWeight = () => {
    const w = parseFloat(weightInput);
    // parseFloat handles decimals: "58.5" → 58.5

    if (isNaN(w) || w < 20 || w > 300) {
      Alert.alert("Invalid weight", "Please enter a weight between 20–300 kg.");
      return;
    }

    dispatch({ type: "LOG_WEIGHT", payload: w });
    setWeightInput("");
    Alert.alert("Logged! ✅", `${w} kg saved for today.`);
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* ── Screen Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Your 7-day overview</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── 3 Stat Cards ── */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{latestWeight ?? "—"}</Text>
            <Text style={styles.statLabel}>Current kg</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                weightChange !== null &&
                  weightChange < 0 && { color: colors.accent },
                weightChange !== null &&
                  weightChange > 0 && { color: colors.danger },
                // green = lost weight, red = gained weight
              ]}
            >
              {weightChange !== null
                ? weightChange > 0
                  ? `+${weightChange}` // show + sign for gains
                  : weightChange
                : "—"}
            </Text>
            <Text style={styles.statLabel}>7-day kg</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{streak} 🔥</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </Card>
        </View>

        {/* ── Weight Trend Chart ── */}
        <Card style={styles.chartCard}>
          <Text style={styles.cardTitle}>Weight Trend</Text>
          <WeightChart data={weightLog} />
        </Card>

        {/* ── Log Weight Form ── */}
        <Card style={styles.logCard}>
          <Text style={styles.cardTitle}>Log Today's Weight</Text>
          <View style={styles.logRow}>
            <TextInput
              style={styles.weightInput}
              placeholder="e.g. 58.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              // decimal-pad shows number keyboard with decimal point
              value={weightInput}
              onChangeText={setWeightInput}
              returnKeyType="done"
            />
            <Text style={styles.kgLabel}>kg</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleLogWeight}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── Weekly Calorie Summary ── */}
        <Card style={styles.weekCard}>
          <Text style={styles.cardTitle}>Weekly Calories</Text>

          {/* 3 summary numbers */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{avgCalories}</Text>
              <Text style={styles.summaryLabel}>Avg kcal/day</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>
                {consistency}%
              </Text>
              <Text style={styles.summaryLabel}>On target</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{user.calorieGoal}</Text>
              <Text style={styles.summaryLabel}>Daily goal</Text>
            </View>
          </View>

          {/* Bar per day */}
          <View style={{ marginTop: spacing.md }}>
            {weeklyCalories.map((cal, i) => (
              <CalorieBar
                key={i}
                label={DAYS[i]}
                value={cal}
                goal={user.calorieGoal}
              />
            ))}
          </View>
        </Card>

        {/* ── AI Insight Card ── */}
        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="sparkles" size={16} color={colors.purple} />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Your strongest days are{" "}
            <Text style={{ color: colors.accent, fontWeight: "600" }}>
              Monday and Tuesday
            </Text>
            . You tend to go over on{" "}
            <Text style={{ color: colors.danger, fontWeight: "600" }}>
              Wednesday–Thursday
            </Text>
            . Try meal prepping on Sunday to stay consistent all week! 💪
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },

  // ── Stat Cards ──
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    textAlign: "center",
  },

  // ── Chart ──
  chartCard: {
    marginBottom: spacing.md,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  // ── Log Weight ──
  logCard: {
    marginBottom: spacing.md,
  },

  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },

  weightInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  kgLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },

  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.bg,
  },

  // ── Weekly Summary ──
  weekCard: {
    marginBottom: spacing.md,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  summaryItem: {
    alignItems: "center",
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  // ── Insight Card ──
  insightCard: {
    marginBottom: spacing.md,
    borderColor: colors.purple + "40",
    backgroundColor: colors.purple + "10",
  },

  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },

  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.purple,
  },

  insightText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
