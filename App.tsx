/**
 * App.tsx — navigation root.
 *
 * Onboarding/consent gate → a native-stack (Tabs + Settings). Bottom tabs:
 * Home (dashboard) · Log (core mechanic) · Learn (lessons) · Coach (AI) · Profile.
 * Wrapped in GameProvider so all screens share one persisted game state.
 */
import React from "react";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { GameProvider, useGame } from "./src/state/GameContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LogScreen } from "./src/screens/LogScreen";
import { LearnScreen } from "./src/screens/LearnScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { CoachScreen } from "./src/screens/CoachScreen";
import { VitalsScreen } from "./src/screens/VitalsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { DeviceScreen } from "./src/screens/DeviceScreen";
import { MedicationsScreen } from "./src/screens/MedicationsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { theme } from "./src/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICON: Record<string, string> = {
  Home: "🩺",
  Log: "➕",
  Vitals: "📈",
  Learn: "📚",
  Coach: "🤖",
  Profile: "🏅",
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 22 : 19 }}>
            {TAB_ICON[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Vitals" component={VitalsScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, profile } = useGame();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your journey…</Text>
      </View>
    );
  }

  if (!profile.onboarded) return <OnboardingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Devices" component={DeviceScreen} />
      <Stack.Screen name="Medications" component={MedicationsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Root />
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
    gap: 12,
  },
  loadingText: { color: theme.colors.subtext, fontSize: 14 },
});
