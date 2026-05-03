// app/(tabs)/profile.tsx
import Card from "@/components/Card";
import { colors, radius, spacing } from "@/constants/theme";
import {
    calculateBMI,
    calculateTDEE,
    Gender,
    getBMICategory,
    getBMIColor,
    useApp,
} from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── BADGE DATA ───────────────────────────────────────────
type Badge = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description: string;
  color: string;
  requiredStreak: number;
};

const BADGES: Badge[] = [
  {
    icon: "flame",
    label: "On Fire",
    description: "3-day streak",
    color: colors.orange,
    requiredStreak: 3,
  },
  {
    icon: "star",
    label: "Week Win",
    description: "7-day streak",
    color: colors.warning,
    requiredStreak: 7,
  },
  {
    icon: "trophy",
    label: "Consistent",
    description: "14-day streak",
    color: colors.accent,
    requiredStreak: 14,
  },
  {
    icon: "diamond",
    label: "Dedicated",
    description: "30-day streak",
    color: colors.purple,
    requiredStreak: 30,
  },
];

// ─── EDIT MODAL ───────────────────────────────────────────
// A reusable modal for editing a single text field
// Used for name, age, height, weight, goals

type EditModalProps = {
  visible: boolean;
  title: string;
  value: string;
  unit?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  onClose: () => void;
  onSave: (value: string) => void;
};

function EditModal({
  visible,
  title,
  value,
  unit,
  keyboardType = "default",
  onClose,
  onSave,
}: EditModalProps) {
  const [input, setInput] = useState(value);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Semi-transparent backdrop */}
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.title}>{title}</Text>

          <View style={modalStyles.inputRow}>
            <TextInput
              style={modalStyles.input}
              value={input}
              onChangeText={setInput}
              keyboardType={keyboardType}
              autoFocus
              // autoFocus opens keyboard immediately when modal appears
              selectTextOnFocus
              // selectTextOnFocus highlights existing text so user
              // can just start typing to replace it
              placeholderTextColor={colors.textMuted}
            />
            {unit && <Text style={modalStyles.unit}>{unit}</Text>}
          </View>

          <View style={modalStyles.btnRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.saveBtn}
              onPress={() => {
                onSave(input);
                onClose();
              }}
            >
              <Text style={modalStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    // rgba = red, green, blue, alpha(opacity)
    // 0.7 = 70% black overlay
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  box: {
    width: "100%",
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  unit: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.bg,
  },
});

// ─── PROFILE ROW ──────────────────────────────────────────
// Reusable row for editable profile fields
// Shows label + value + edit icon

type ProfileRowProps = {
  label: string;
  value: string;
  onPress: () => void;
  valueColor?: string;
};

function ProfileRow({ label, value, onPress, valueColor }: ProfileRowProps) {
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress}>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.right}>
        <Text
          style={[rowStyles.value, valueColor ? { color: valueColor } : {}]}
        >
          {value}
        </Text>
        <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});

// ─── MAIN SCREEN ──────────────────────────────────────────
export default function ProfileScreen() {
  const { state, dispatch } = useApp();
  const { user, streak } = state;

  // ── Modal state ──
  // We use one modal with different config based on which field is being edited
  type ModalConfig = {
    title: string;
    value: string;
    unit?: string;
    keyboardType?: "default" | "numeric" | "decimal-pad";
    onSave: (val: string) => void;
  };

  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Helper to open modal with specific config
  const openModal = (config: ModalConfig) => {
    setModalConfig(config);
    setModalVisible(true);
  };

  // ── Computed values ──
  const bmi = calculateBMI(user);
  const bmiColor = getBMIColor(bmi);
  const bmiCat = getBMICategory(bmi);
  const tdee = calculateTDEE(user);

  // Deficit = difference between TDEE and calorie goal
  // Negative = deficit (losing weight), Positive = surplus (gaining)
  const deficit = tdee - user.calorieGoal;
  const weeklyChange = Number(((deficit * 7) / 7700).toFixed(2));
  // 7700 kcal ≈ 1kg of body fat
  // weeklyChange = how many kg gained/lost per week at current goal

  // ── Dispatch helpers ──
  const updateUser = (field: string, value: string | number) => {
    dispatch({
      type: "UPDATE_USER",
      payload: { [field]: value },
      // computed property name — [field] uses the variable as key
    });
  };

  const validateAndSave = (
    field: string,
    raw: string,
    min: number,
    max: number,
    isFloat = false,
  ) => {
    const val = isFloat ? parseFloat(raw) : parseInt(raw);
    if (isNaN(val) || val < min || val > max) {
      Alert.alert(
        "Invalid value",
        `Please enter a value between ${min} and ${max}.`,
      );
      return;
    }
    updateUser(field, val);
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {user.name[0].toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              openModal({
                title: "Your Name",
                value: user.name,
                onSave: (val) => {
                  if (val.trim().length < 1) return;
                  updateUser("name", val.trim());
                },
              })
            }
          >
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.editNameHint}>tap to edit</Text>
          </TouchableOpacity>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={14} color={colors.orange} />
            <Text style={styles.streakPillText}>{streak}-day streak</Text>
          </View>
        </View>

        {/* ── Body Stats ── */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Body Stats</Text>

          {/* Gender selector — not a text edit, special UI */}
          <View style={styles.genderRow}>
            <Text style={rowStyles.label}>Gender</Text>
            <View style={styles.genderBtns}>
              {(["female", "male", "other"] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    user.gender === g && styles.genderBtnActive,
                  ]}
                  onPress={() => updateUser("gender", g)}
                >
                  <Text
                    style={[
                      styles.genderBtnText,
                      user.gender === g && styles.genderBtnTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                    {/* capitalize first letter */}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ProfileRow
            label="Age"
            value={`${user.age} years`}
            onPress={() =>
              openModal({
                title: "Age",
                value: String(user.age),
                unit: "years",
                keyboardType: "numeric",
                onSave: (val) => validateAndSave("age", val, 10, 100),
              })
            }
          />

          <ProfileRow
            label="Height"
            value={`${user.heightCm} cm`}
            onPress={() =>
              openModal({
                title: "Height",
                value: String(user.heightCm),
                unit: "cm",
                keyboardType: "numeric",
                onSave: (val) => validateAndSave("heightCm", val, 100, 250),
              })
            }
          />

          <ProfileRow
            label="Weight"
            value={`${user.currentWeight} kg`}
            onPress={() =>
              openModal({
                title: "Current Weight",
                value: String(user.currentWeight),
                unit: "kg",
                keyboardType: "decimal-pad",
                onSave: (val) => {
                  validateAndSave("currentWeight", val, 20, 300, true);
                  // also log to weight history
                  const w = parseFloat(val);
                  if (!isNaN(w)) {
                    dispatch({ type: "LOG_WEIGHT", payload: w });
                  }
                },
              })
            }
          />
        </Card>

        {/* ── BMI Card ── */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>BMI — Body Mass Index</Text>

          <View style={styles.bmiRow}>
            {/* Big BMI number */}
            <View style={[styles.bmiCircle, { borderColor: bmiColor }]}>
              <Text style={[styles.bmiNumber, { color: bmiColor }]}>{bmi}</Text>
              <Text style={styles.bmiLabel}>BMI</Text>
            </View>

            <View style={styles.bmiInfo}>
              <Text style={[styles.bmiCategory, { color: bmiColor }]}>
                {bmiCat}
              </Text>
              <Text style={styles.bmiFormula}>
                {user.currentWeight}kg ÷ {(user.heightCm / 100).toFixed(2)}m²
              </Text>

              {/* BMI scale */}
              <View style={styles.bmiScale}>
                {[
                  { label: "<18.5", cat: "Under", color: colors.purple },
                  { label: "18.5–25", cat: "Normal", color: colors.accent },
                  { label: "25–30", cat: "Over", color: colors.warning },
                  { label: ">30", cat: "Obese", color: colors.danger },
                ].map((item) => (
                  <View key={item.cat} style={styles.bmiScaleItem}>
                    <View
                      style={[
                        styles.bmiScaleDot,
                        { backgroundColor: item.color },
                        bmiCat === item.cat && styles.bmiScaleDotActive,
                      ]}
                    />
                    <Text style={styles.bmiScaleText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* ── TDEE + Deficit Card ── */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Calorie Science</Text>

          <View style={styles.tdeeRow}>
            <View style={styles.tdeeItem}>
              <Text style={styles.tdeeValue}>{tdee}</Text>
              <Text style={styles.tdeeLabel}>TDEE kcal/day</Text>
              <Text style={styles.tdeeHint}>your body burns this</Text>
            </View>
            <View style={styles.tdeeDivider} />
            <View style={styles.tdeeItem}>
              <Text
                style={[
                  styles.tdeeValue,
                  { color: deficit > 0 ? colors.accent : colors.danger },
                ]}
              >
                {user.calorieGoal}
              </Text>
              <Text style={styles.tdeeLabel}>Your goal kcal/day</Text>
              <Text style={styles.tdeeHint}>you eat this</Text>
            </View>
          </View>

          {/* What this means */}
          <View
            style={[
              styles.deficitBox,
              {
                backgroundColor:
                  deficit > 0 ? colors.accent + "12" : colors.danger + "12",
                borderColor:
                  deficit > 0 ? colors.accent + "40" : colors.danger + "40",
              },
            ]}
          >
            <Text
              style={[
                styles.deficitTitle,
                { color: deficit > 0 ? colors.accent : colors.danger },
              ]}
            >
              {deficit > 0
                ? `${deficit} kcal deficit/day`
                : `${Math.abs(deficit)} kcal surplus/day`}
            </Text>
            <Text style={styles.deficitText}>
              {deficit > 0
                ? `At this rate you'll lose ~${weeklyChange}kg/week`
                : deficit < 0
                  ? `At this rate you'll gain ~${Math.abs(weeklyChange)}kg/week`
                  : "You're eating at maintenance"}
            </Text>
          </View>

          <Text style={styles.deficitNote}>
            💡 A 500 kcal/day deficit = ~0.5kg lost per week (healthy rate)
          </Text>

          {/* Edit calorie goal */}
          <TouchableOpacity
            style={styles.editGoalBtn}
            onPress={() =>
              openModal({
                title: "Daily Calorie Goal",
                value: String(user.calorieGoal),
                unit: "kcal",
                keyboardType: "numeric",
                onSave: (val) => {
                  validateAndSave("calorieGoal", val, 800, 5000);
                  dispatch({
                    type: "UPDATE_GOAL",
                    payload: parseInt(val),
                  });
                },
              })
            }
          >
            <Ionicons name="pencil-outline" size={14} color={colors.accent} />
            <Text style={styles.editGoalText}>Edit calorie goal</Text>
          </TouchableOpacity>
        </Card>

        {/* ── Daily Goals ── */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Daily Goals</Text>

          <ProfileRow
            label="💧 Water goal"
            value={`${user.waterGoal} glasses`}
            onPress={() =>
              openModal({
                title: "Daily Water Goal",
                value: String(user.waterGoal),
                unit: "glasses",
                keyboardType: "numeric",
                onSave: (val) => validateAndSave("waterGoal", val, 1, 20),
              })
            }
          />

          <ProfileRow
            label="👟 Steps goal"
            value={`${user.stepsGoal.toLocaleString()} steps`}
            // toLocaleString() adds commas: 8000 → "8,000"
            onPress={() =>
              openModal({
                title: "Daily Steps Goal",
                value: String(user.stepsGoal),
                unit: "steps",
                keyboardType: "numeric",
                onSave: (val) => validateAndSave("stepsGoal", val, 1000, 50000),
              })
            }
          />
        </Card>

        {/* ── Badges ── */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>
          <Text style={styles.badgesHint}>
            Stay under your calorie goal daily to build streak
          </Text>

          <View style={styles.badgeGrid}>
            {BADGES.map((badge) => {
              const earned = streak >= badge.requiredStreak;
              return (
                <View
                  key={badge.label}
                  style={[styles.badgeItem, !earned && styles.badgeItemLocked]}
                >
                  <View
                    style={[
                      styles.badgeIconWrap,
                      {
                        backgroundColor: earned
                          ? badge.color + "25"
                          : colors.bgElevated,
                      },
                    ]}
                  >
                    <Ionicons
                      name={badge.icon}
                      size={24}
                      color={earned ? badge.color : colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.badgeLabel,
                      !earned && { color: colors.textMuted },
                    ]}
                  >
                    {badge.label}
                  </Text>
                  <Text style={styles.badgeDescription}>
                    {badge.description}
                  </Text>
                  {!earned && (
                    <View style={styles.lockIcon}>
                      <Ionicons
                        name="lock-closed"
                        size={10}
                        color={colors.textMuted}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── App Info ── */}
        <View style={styles.appInfo}>
          <View style={styles.appInfoBadge}>
            <Ionicons name="leaf" size={14} color={colors.accent} />
            <Text style={styles.appInfoName}>FitTrack AI</Text>
          </View>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoSub}>Built with React Native + Expo</Text>
        </View>
      </ScrollView>

      {/* ── Edit Modal ── */}
      {modalConfig && (
        <EditModal
          visible={modalVisible}
          title={modalConfig.title}
          value={modalConfig.value}
          unit={modalConfig.unit}
          keyboardType={modalConfig.keyboardType}
          onClose={() => setModalVisible(false)}
          onSave={modalConfig.onSave}
        />
      )}
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

  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },

  card: {
    marginBottom: spacing.md,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  // ── Avatar ──
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentDim,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  avatarLetter: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.accent,
  },

  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },

  editNameHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 10,
  },

  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.orangeDim,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.orange + "40",
  },

  streakPillText: {
    fontSize: 13,
    color: colors.orange,
    fontWeight: "600",
  },

  // ── Gender ──
  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  genderBtns: {
    flexDirection: "row",
    gap: 6,
  },

  genderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },

  genderBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accentMid,
  },

  genderBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },

  genderBtnTextActive: {
    color: colors.accent,
  },

  // ── BMI ──
  bmiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 4,
  },

  bmiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgElevated,
  },

  bmiNumber: {
    fontSize: 22,
    fontWeight: "700",
  },

  bmiLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "500",
  },

  bmiInfo: {
    flex: 1,
  },

  bmiCategory: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },

  bmiFormula: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },

  bmiScale: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },

  bmiScaleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  bmiScaleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    opacity: 0.5,
  },

  bmiScaleDotActive: {
    opacity: 1,
    transform: [{ scale: 1.4 }],
  },

  bmiScaleText: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // ── TDEE ──
  tdeeRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
    marginTop: 4,
  },

  tdeeItem: {
    flex: 1,
    alignItems: "center",
  },

  tdeeDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },

  tdeeValue: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  tdeeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },

  tdeeHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: "center",
  },

  deficitBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  deficitTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  deficitText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  deficitNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  editGoalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentMid,
    marginTop: 4,
  },

  editGoalText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
  },

  // ── Badges ──
  badgesHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  badgeItem: {
    width: "47%",
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },

  badgeItemLocked: {
    opacity: 0.4,
  },

  badgeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  badgeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  badgeDescription: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  lockIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  // ── App info ──
  appInfo: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: 4,
  },

  appInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  appInfoName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  appInfoVersion: {
    fontSize: 12,
    color: colors.textMuted,
  },

  appInfoSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
