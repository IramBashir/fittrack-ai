// app/index.tsx
import { colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { isLoading, isOnboarded } = useApp();

  // Show loading screen while AsyncStorage loads
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <View style={styles.iconWrap}>
          <Ionicons name="leaf" size={32} color={colors.bg} />
        </View>
        <Text style={styles.appName}>FitTrack AI</Text>
        <ActivityIndicator
          size="small"
          color={colors.accent}
          style={{ marginTop: 32 }}
        />
      </View>
    );
  }

  // Redirect based on onboarding status
  // Redirect component does this without any visible flash
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
});
