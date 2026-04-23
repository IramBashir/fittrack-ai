// src/components/MealItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../utils/theme';
import { useApp } from '../context/AppContext';

const CATEGORY_CONFIG = {
  breakfast: { icon: 'sunny-outline', color: colors.warning },
  lunch: { icon: 'restaurant-outline', color: colors.accent },
  dinner: { icon: 'moon-outline', color: colors.purple },
  snack: { icon: 'nutrition-outline', color: colors.orange },
};

export default function MealItem({ meal }) {
  const { dispatch } = useApp();
  const config = CATEGORY_CONFIG[meal.category] || CATEGORY_CONFIG.snack;

  const handleDelete = () => {
    Alert.alert('Remove meal?', meal.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_MEAL', payload: meal.id }) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.time}>{meal.time}</Text>
      </View>
      <Text style={styles.calories}>{meal.calories}</Text>
      <Text style={styles.kcal}>kcal</Text>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  calories: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  kcal: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: -6,
  },
  deleteBtn: {
    marginLeft: 4,
  },
});
