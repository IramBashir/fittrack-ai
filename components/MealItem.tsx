// components/MealItem.tsx
import { Meal, useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

// Import MealCategory type too
import { MealCategory } from "@/context/AppContext";

// ─── CATEGORY CONFIG ──────────────────────────────────────
// Each meal category gets its own icon + color
// We look up the category key to get the right visual

type CategoryConfig = {
  icon: keyof typeof Ionicons.glyphMap; // must be a valid Ionicons name
  color: string;
};

const CATEGORY_CONFIG: Record<MealCategory, CategoryConfig> = {
  breakfast: { icon: "sunny-outline", color: colors.warning },
  lunch: { icon: "restaurant-outline", color: colors.accent },
  dinner: { icon: "moon-outline", color: colors.purple },
  snack: { icon: "nutrition-outline", color: colors.orange },
};

// ─── TYPES ────────────────────────────────────────────────
type MealItemProps = {
  meal: Meal;
  isLast?: boolean; // if true, don't show bottom border
};

// ─── COMPONENT ────────────────────────────────────────────
export default function MealItem({ meal, isLast = false }: MealItemProps) {
  const { dispatch } = useApp();

  // Get the right icon + color for this meal's category
  const config = CATEGORY_CONFIG[meal.category];

  const handleDelete = () => {
    // Alert.alert = native confirmation popup
    // First arg = title, Second = message, Third = buttons array
    Alert.alert("Remove meal?", `Remove "${meal.name}" from today's log?`, [
      {
        text: "Cancel",
        style: "cancel", // grey button on iOS
      },
      {
        text: "Remove",
        style: "destructive", // red button on iOS
        onPress: () => dispatch({ type: "DELETE_MEAL", payload: meal.id }),
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        !isLast && styles.withBorder, // show border except on last item
      ]}
    >
      {/* Category icon — colored square with icon inside */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: config.color + "20" },
          // Adding '20' to a hex color = 12% opacity version of that color
          // e.g. '#00E5A0' + '20' = '#00E5A020' (faint green background)
        ]}
      >
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>

      {/* Meal name + time */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.name}
        </Text>
        {/* numberOfLines={1} = truncate with ... if too long */}
        <Text style={styles.time}>{meal.time}</Text>
      </View>

      {/* Calories */}
      <Text style={styles.calories}>{meal.calories}</Text>
      <Text style={styles.kcal}>kcal</Text>

      {/* Delete button */}
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        // hitSlop expands the tappable area without changing visual size
        // Good UX — small buttons are hard to tap on mobile
      >
        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // lay children horizontally (left → right)
    alignItems: "center", // vertically center everything in the row
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    gap: 10, // space between each child (like CSS gap)
  },

  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  info: {
    flex: 1,
    // flex: 1 means "take up all remaining space"
    // The other items have fixed widths, this one fills the gap
  },

  name: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },

  time: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  calories: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  kcal: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: -6, // pull it slightly closer to the number
  },

  deleteBtn: {
    marginLeft: 4,
  },
});
