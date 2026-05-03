// app/(tabs)/_layout.tsx
import { colors, radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

// ─── TAB ICON ─────────────────────────────────────────────
// We wrap each icon in a small rounded square
// Active tab gets a faint green background behind the icon

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Tab bar styling
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent, // active = green
        tabBarInactiveTintColor: colors.textMuted, // inactive = grey
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "bar-chart" : "bar-chart-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
    // Shadow above tab bar
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapActive: {
    backgroundColor: colors.accentDim,
    // faint green background on active tab icon
  },
});
