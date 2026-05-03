// app/onboarding.tsx
import { colors, radius, spacing } from "@/constants/theme";
import { Gender, useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── STEP INDICATOR ───────────────────────────────────────
// Shows which step user is on: ● ● ○

type StepIndicatorProps = {
  total: number;
  current: number;
};

function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <View style={indicatorStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            indicatorStyles.dot,
            i === current && indicatorStyles.dotActive,
            i < current && indicatorStyles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    // active dot is wider — pill shape
    backgroundColor: colors.accent,
  },
  dotDone: {
    backgroundColor: colors.accentMid,
  },
});

// ─── INPUT FIELD ──────────────────────────────────────────
// Reusable labeled input for the onboarding form

type OnboardInputProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  unit?: string;
};

function OnboardInput({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  unit,
}: OnboardInputProps) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={inputStyles.row}>
        <TextInput
          style={[inputStyles.input, unit && { flex: 1 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          returnKeyType="next"
        />
        {unit && (
          <View style={inputStyles.unitBadge}>
            <Text style={inputStyles.unitText}>{unit}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    width: "100%",
  },
  unitBadge: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  unitText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
});

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function OnboardingScreen() {
  const { dispatch } = useApp();

  // Which step are we on (0, 1, 2)
  const [step, setStep] = useState(0);

  // Step 1 — personal info
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("female");

  // Step 2 — body measurements
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Step 3 — goals
  const [calorieGoal, setCalorieGoal] = useState("1500");
  const [waterGoal, setWaterGoal] = useState("8");
  const [stepsGoal, setStepsGoal] = useState("8000");

  // ── Validation ────────────────────────────────────────

  const validateStep = (currentStep: number): string | null => {
    // Returns an error message if invalid, null if valid
    if (currentStep === 0) {
      if (!name.trim()) return "Please enter your name.";
      if (!age || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 100)
        return "Please enter a valid age (10–100).";
    }
    if (currentStep === 1) {
      if (
        !height ||
        isNaN(Number(height)) ||
        Number(height) < 100 ||
        Number(height) > 250
      )
        return "Please enter a valid height (100–250 cm).";
      if (
        !weight ||
        isNaN(Number(weight)) ||
        Number(weight) < 20 ||
        Number(weight) > 300
      )
        return "Please enter a valid weight (20–300 kg).";
    }
    return null; // valid
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      // Simple inline error — we'll show it in the UI
      setErrorMsg(error);
      return;
    }
    setErrorMsg("");
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((s) => s - 1);
  };

  const [errorMsg, setErrorMsg] = useState("");

  // ── Complete onboarding ───────────────────────────────

  const handleComplete = () => {
    const error = validateStep(2);
    if (error) {
      setErrorMsg(error);
      return;
    }

    // Save all user data
    dispatch({
      type: "UPDATE_USER",
      payload: {
        name: name.trim(),
        age: parseInt(age),
        gender,
        heightCm: parseInt(height),
        currentWeight: parseFloat(weight),
        calorieGoal: parseInt(calorieGoal) || 1500,
        waterGoal: parseInt(waterGoal) || 8,
        stepsGoal: parseInt(stepsGoal) || 8000,
      },
    });

    // Log initial weight
    dispatch({
      type: "LOG_WEIGHT",
      payload: parseFloat(weight),
    });

    // Mark onboarding complete
    dispatch({ type: "COMPLETE_ONBOARDING" });

    // Navigate to main app
    router.replace("/(tabs)");
    // replace() instead of push() so user can't go back to onboarding
  };

  // ── Render ────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo / App Name ── */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="leaf" size={28} color={colors.bg} />
          </View>
          <Text style={styles.logoText}>FitTrack AI</Text>
        </View>

        {/* ── Step Indicator ── */}
        <StepIndicator total={3} current={step} />

        {/* ══════════════════════════════════════════
            STEP 0 — Welcome + Basic Info
        ══════════════════════════════════════════ */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.stepTitle}>Welcome!</Text>
            <Text style={styles.stepSubtitle}>
              Let's set up your profile so FitTrack can give you personalized
              recommendations.
            </Text>

            <OnboardInput
              label="Your name"
              value={name}
              onChange={setName}
              placeholder="e.g. Iram"
            />

            <OnboardInput
              label="Age"
              value={age}
              onChange={setAge}
              placeholder="e.g. 22"
              keyboardType="numeric"
              unit="years"
            />

            {/* Gender selector */}
            <Text style={styles.genderLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(
                [
                  { key: "female", label: "Female", emoji: "👩" },
                  { key: "male", label: "Male", emoji: "👨" },
                  { key: "other", label: "Other", emoji: "🧑" },
                ] as { key: Gender; label: string; emoji: string }[]
              ).map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[
                    styles.genderBtn,
                    gender === g.key && styles.genderBtnActive,
                  ]}
                  onPress={() => setGender(g.key)}
                >
                  <Text style={styles.genderEmoji}>{g.emoji}</Text>
                  <Text
                    style={[
                      styles.genderText,
                      gender === g.key && { color: colors.accent },
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════
            STEP 1 — Body Measurements
        ══════════════════════════════════════════ */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>📏</Text>
            <Text style={styles.stepTitle}>Your Body</Text>
            <Text style={styles.stepSubtitle}>
              We use these to calculate your BMI and daily calorie needs (TDEE).
            </Text>

            <OnboardInput
              label="Height"
              value={height}
              onChange={setHeight}
              placeholder="e.g. 162"
              keyboardType="numeric"
              unit="cm"
            />

            <OnboardInput
              label="Current weight"
              value={weight}
              onChange={setWeight}
              placeholder="e.g. 58.5"
              keyboardType="decimal-pad"
              unit="kg"
            />

            {/* Live BMI preview */}
            {height &&
              weight &&
              !isNaN(Number(height)) &&
              !isNaN(Number(weight)) && (
                <View style={styles.bmiPreview}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.bmiPreviewText}>
                    Your BMI:{" "}
                    <Text style={{ color: colors.accent, fontWeight: "700" }}>
                      {(
                        Number(weight) / Math.pow(Number(height) / 100, 2)
                      ).toFixed(1)}
                    </Text>{" "}
                    — will be calculated fully on your profile
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* ══════════════════════════════════════════
            STEP 2 — Goals
        ══════════════════════════════════════════ */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>Your Goals</Text>
            <Text style={styles.stepSubtitle}>
              These are your daily targets. You can always change them later in
              Profile.
            </Text>

            <OnboardInput
              label="🔥 Daily calorie goal"
              value={calorieGoal}
              onChange={setCalorieGoal}
              placeholder="e.g. 1500"
              keyboardType="numeric"
              unit="kcal"
            />

            {/* Calorie goal suggestions */}
            <View style={styles.suggestionsRow}>
              {[
                { label: "Lose weight", value: "1200" },
                { label: "Maintain", value: "1600" },
                { label: "Gain weight", value: "2000" },
              ].map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={[
                    styles.suggestionChip,
                    calorieGoal === s.value && styles.suggestionChipActive,
                  ]}
                  onPress={() => setCalorieGoal(s.value)}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      calorieGoal === s.value && { color: colors.accent },
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text
                    style={[
                      styles.suggestionValue,
                      calorieGoal === s.value && { color: colors.accent },
                    ]}
                  >
                    {s.value} kcal
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <OnboardInput
              label="💧 Daily water goal"
              value={waterGoal}
              onChange={setWaterGoal}
              placeholder="e.g. 8"
              keyboardType="numeric"
              unit="glasses"
            />

            <OnboardInput
              label="👟 Daily steps goal"
              value={stepsGoal}
              onChange={setStepsGoal}
              placeholder="e.g. 8000"
              keyboardType="numeric"
              unit="steps"
            />
          </View>
        )}

        {/* ── Error message ── */}
        {errorMsg !== "" && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.danger}
            />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* ── Navigation buttons ── */}
        <View style={styles.btnRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 2 ? (
            <TouchableOpacity
              style={[styles.nextBtn, step === 0 && { marginLeft: "auto" }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.bg} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, styles.completeBtn]}
              onPress={handleComplete}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Let's Go! 🚀</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step counter text */}
        <Text style={styles.stepCounter}>Step {step + 1} of 3</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: 70,
    paddingBottom: 48,
  },

  // ── Logo ──
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: spacing.xl,
  },

  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // ── Step content ──
  stepContainer: {
    marginBottom: spacing.lg,
  },

  stepEmoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: spacing.md,
  },

  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  stepSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  // ── Gender ──
  genderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  genderRow: {
    flexDirection: "row",
    gap: 8,
  },

  genderBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },

  genderBtnActive: {
    borderColor: colors.accentMid,
    backgroundColor: colors.accentDim,
  },

  genderEmoji: {
    fontSize: 22,
  },

  genderText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // ── BMI preview ──
  bmiPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentMid,
    padding: spacing.md,
    marginTop: 4,
  },

  bmiPreviewText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Calorie suggestions ──
  suggestionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },

  suggestionChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },

  suggestionChipActive: {
    borderColor: colors.accentMid,
    backgroundColor: colors.accentDim,
  },

  suggestionText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },

  suggestionValue: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // ── Error ──
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.dangerDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + "40",
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },

  // ── Navigation buttons ──
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: spacing.md,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },

  backBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },

  completeBtn: {
    backgroundColor: colors.accent,
  },

  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.bg,
  },

  stepCounter: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
});
