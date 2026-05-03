// app/add-meal.tsx
import {
    FOOD_CATEGORIES,
    FoodCategory,
    FoodItem,
    PAKISTANI_FOODS,
    searchFoods,
} from "@/constants/pakistaniFoods";
import { colors, radius, spacing } from "@/constants/theme";
import { MealCategory, useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// ─── MEAL CATEGORIES ──────────────────────────────────────
// (for the meal log — breakfast/lunch/dinner/snack)
// separate from food database categories

type MealCategoryOption = {
  key: MealCategory;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
};

const MEAL_CATEGORIES: MealCategoryOption[] = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: "sunny-outline",
    color: colors.warning,
  },
  {
    key: "lunch",
    label: "Lunch",
    icon: "restaurant-outline",
    color: colors.accent,
  },
  {
    key: "dinner",
    label: "Dinner",
    icon: "moon-outline",
    color: colors.purple,
  },
  {
    key: "snack",
    label: "Snack",
    icon: "nutrition-outline",
    color: colors.orange,
  },
];

// ─── COMPONENT ────────────────────────────────────────────
export default function AddMealScreen() {
  const { dispatch } = useApp();

  // ── Form state ──
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [mealCategory, setMealCategory] = useState<MealCategory>("lunch");
  const [time, setTime] = useState(dayjs().format("HH:mm"));

  // ── Search/browse state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFoodCategory, setActiveFoodCategory] = useState<
    FoodCategory | "all"
  >("all");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showFoodBrowser, setShowFoodBrowser] = useState(true);
  // showFoodBrowser toggles between food browser and manual entry

  // ── Filtered food list ──────────────────────────────────
  // useMemo = only recalculate when searchQuery or activeFoodCategory changes
  // Without useMemo this would run on every single render (wasteful)

  const filteredFoods = useMemo(() => {
    let results = searchQuery.trim()
      ? searchFoods(searchQuery)
      : PAKISTANI_FOODS;

    if (activeFoodCategory !== "all") {
      results = results.filter((f) => f.category === activeFoodCategory);
    }

    return results;
  }, [searchQuery, activeFoodCategory]);

  // ── Handlers ────────────────────────────────────────────

  const handleSelectFood = (food: FoodItem) => {
    // Auto-fill form with selected food
    setMealName(food.name);
    setCalories(String(food.calories));
    setSelectedFood(food);
    setShowFoodBrowser(false);
    // Switch to form view after selecting
  };

  const handleClearFood = () => {
    setMealName("");
    setCalories("");
    setSelectedFood(null);
    setShowFoodBrowser(true);
  };

  const handleSubmit = () => {
    if (!mealName.trim()) {
      Alert.alert("Missing info", "Please enter or select a food.");
      return;
    }

    const calorieNumber = Number(calories);
    if (!calories || isNaN(calorieNumber) || calorieNumber < 0) {
      Alert.alert("Missing info", "Please enter a valid calorie amount.");
      return;
    }

    dispatch({
      type: "ADD_MEAL",
      payload: {
        name: mealName.trim(),
        calories: calorieNumber,
        category: mealCategory,
        time,
      },
    });

    router.back();
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log a Meal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Meal Category (breakfast/lunch/dinner/snack) ── */}
        <Text style={styles.label}>Meal Type</Text>
        <View style={styles.categoryRow}>
          {MEAL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catBtn,
                mealCategory === cat.key && {
                  borderColor: cat.color,
                  backgroundColor: cat.color + "18",
                },
              ]}
              onPress={() => setMealCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon}
                size={15}
                color={mealCategory === cat.key ? cat.color : colors.textMuted}
              />
              <Text
                style={[
                  styles.catLabel,
                  mealCategory === cat.key && { color: cat.color },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Toggle: Food Browser vs Manual Entry ── */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, showFoodBrowser && styles.toggleActive]}
            onPress={() => setShowFoodBrowser(true)}
          >
            <Ionicons
              name="search-outline"
              size={14}
              color={showFoodBrowser ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.toggleText,
                showFoodBrowser && { color: colors.accent },
              ]}
            >
              Browse Foods
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, !showFoodBrowser && styles.toggleActive]}
            onPress={() => setShowFoodBrowser(false)}
          >
            <Ionicons
              name="create-outline"
              size={14}
              color={!showFoodBrowser ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.toggleText,
                !showFoodBrowser && { color: colors.accent },
              ]}
            >
              Manual Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════
            FOOD BROWSER
        ══════════════════════════════════════════════════ */}
        {showFoodBrowser ? (
          <View>
            {/* Search bar */}
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.textMuted}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search biryani, paratha, chai..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Food category filter tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {/* "All" tab */}
              <TouchableOpacity
                style={[
                  styles.foodCatTab,
                  activeFoodCategory === "all" && styles.foodCatTabActive,
                ]}
                onPress={() => setActiveFoodCategory("all")}
              >
                <Text
                  style={[
                    styles.foodCatTabText,
                    activeFoodCategory === "all" && styles.foodCatTabTextActive,
                  ]}
                >
                  🍽️ All
                </Text>
              </TouchableOpacity>

              {/* One tab per food category */}
              {(Object.keys(FOOD_CATEGORIES) as FoodCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.foodCatTab,
                    activeFoodCategory === cat && styles.foodCatTabActive,
                  ]}
                  onPress={() => setActiveFoodCategory(cat)}
                >
                  <Text
                    style={[
                      styles.foodCatTabText,
                      activeFoodCategory === cat && styles.foodCatTabTextActive,
                    ]}
                  >
                    {FOOD_CATEGORIES[cat].emoji} {FOOD_CATEGORIES[cat].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Results count */}
            <Text style={styles.resultsCount}>
              {filteredFoods.length} foods found
            </Text>

            {/* Food list */}
            {filteredFoods.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.foodRow}
                onPress={() => handleSelectFood(food)}
                activeOpacity={0.7}
              >
                <View style={styles.foodRowLeft}>
                  <Text style={styles.foodRowEmoji}>
                    {FOOD_CATEGORIES[food.category].emoji}
                  </Text>
                  <View style={styles.foodRowInfo}>
                    <Text style={styles.foodRowName}>{food.name}</Text>
                    <Text style={styles.foodRowServing}>{food.serving}</Text>
                  </View>
                </View>
                <View style={styles.foodRowRight}>
                  <Text style={styles.foodRowCal}>{food.calories}</Text>
                  <Text style={styles.foodRowCalLabel}>kcal</Text>
                </View>
              </TouchableOpacity>
            ))}

            {filteredFoods.length === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsEmoji}>🔍</Text>
                <Text style={styles.noResultsText}>
                  No foods found for "{searchQuery}"
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setMealName(searchQuery);
                    setShowFoodBrowser(false);
                  }}
                >
                  <Text style={styles.noResultsAction}>
                    Add "{searchQuery}" manually →
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* ══════════════════════════════════════════════════
            MANUAL ENTRY FORM
        ══════════════════════════════════════════════════ */
          <View>
            {/* Selected food info card */}
            {selectedFood && (
              <View style={styles.selectedCard}>
                <View style={styles.selectedCardHeader}>
                  <Text style={styles.selectedCardTitle}>
                    {FOOD_CATEGORIES[selectedFood.category].emoji}{" "}
                    {selectedFood.name}
                  </Text>
                  <TouchableOpacity onPress={handleClearFood}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.selectedCardServing}>
                  Per serving: {selectedFood.serving}
                </Text>

                {/* Macros row */}
                {selectedFood.protein !== undefined && (
                  <View style={styles.macrosRow}>
                    <View style={styles.macroChip}>
                      <Text
                        style={[
                          styles.macroChipValue,
                          { color: colors.purple },
                        ]}
                      >
                        {selectedFood.protein}g
                      </Text>
                      <Text style={styles.macroChipLabel}>Protein</Text>
                    </View>
                    <View style={styles.macroChip}>
                      <Text
                        style={[
                          styles.macroChipValue,
                          { color: colors.accent },
                        ]}
                      >
                        {selectedFood.carbs}g
                      </Text>
                      <Text style={styles.macroChipLabel}>Carbs</Text>
                    </View>
                    <View style={styles.macroChip}>
                      <Text
                        style={[
                          styles.macroChipValue,
                          { color: colors.orange },
                        ]}
                      >
                        {selectedFood.fat}g
                      </Text>
                      <Text style={styles.macroChipLabel}>Fat</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Food name input */}
            <Text style={styles.label}>Food name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chicken biryani"
              placeholderTextColor={colors.textMuted}
              value={mealName}
              onChangeText={(text) => {
                setMealName(text);
                setSelectedFood(null);
                // clear selected food if user edits name manually
              }}
              returnKeyType="next"
            />

            {/* Calories input */}
            <Text style={styles.label}>Calories (kcal)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. 420"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
                returnKeyType="done"
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitText}>kcal</Text>
              </View>
            </View>

            {/* Time input */}
            <Text style={styles.label}>Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              value={time}
              onChangeText={setTime}
              returnKeyType="done"
              maxLength={5}
            />
          </View>
        )}

        {/* ── Submit button — always visible ── */}
        {!showFoodBrowser && (
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!mealName || !calories) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={!mealName || !calories}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={colors.bg}
            />
            <Text style={styles.submitText}>Add to Log</Text>
          </TouchableOpacity>
        )}
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  scroll: {
    padding: spacing.md,
    paddingBottom: 48,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: spacing.md,
  },

  // ── Meal category ──
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },

  catLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // ── Toggle ──
  toggleRow: {
    flexDirection: "row",
    marginTop: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },

  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },

  toggleActive: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentMid,
  },

  toggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  },

  // ── Search ──
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginTop: spacing.md,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // ── Food category tabs ──
  categoryScroll: {
    marginTop: spacing.sm,
  },

  categoryScrollContent: {
    gap: 8,
    paddingRight: spacing.md,
  },

  foodCatTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },

  foodCatTabActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accentMid,
  },

  foodCatTabText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },

  foodCatTabTextActive: {
    color: colors.accent,
  },

  resultsCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: 4,
  },

  // ── Food row ──
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },

  foodRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  foodRowEmoji: {
    fontSize: 22,
  },

  foodRowInfo: {
    flex: 1,
  },

  foodRowName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },

  foodRowServing: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  foodRowRight: {
    alignItems: "flex-end",
  },

  foodRowCal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent,
  },

  foodRowCalLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // ── No results ──
  noResults: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 8,
  },

  noResultsEmoji: {
    fontSize: 32,
  },

  noResultsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  noResultsAction: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600",
    marginTop: 4,
  },

  // ── Selected food card ──
  selectedCard: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentMid,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: 4,
  },

  selectedCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  selectedCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },

  selectedCardServing: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  macrosRow: {
    flexDirection: "row",
    gap: 8,
  },

  macroChip: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  macroChipValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  macroChipLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  // ── Manual entry inputs ──
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  unitBadge: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  unitText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // ── Submit ──
  submitBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  submitBtnDisabled: {
    opacity: 0.4,
  },

  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.bg,
  },
});
