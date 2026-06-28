/**
 * App.tsx — navigation root.
 *
 * Bottom-tab layout: Home (dashboard) · Log (core mechanic) · Learn (lessons) ·
 * Profile (badges). Wrapped in GameProvider so all screens share one persisted
 * game state.
 */
import React, { useEffect } from "react";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { tapLight } from "./src/services/haptics";
import {
  configureNotifications,
  onReminderTapped,
  getInitialReminderScreen,
} from "./src/services/notifications";

import { GameProvider, useGame } from "./src/state/GameContext";
import { RewardProvider } from "./src/components/RewardLayer";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LogScreen } from "./src/screens/LogScreen";
import { LearnScreen } from "./src/screens/LearnScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { TutorialOverlay } from "./src/components/TutorialOverlay";
import { theme } from "./src/theme";

const Tab = createBottomTabNavigator();

const TAB_ICON: Record<string, string> = {
  Home: "🩺",
  Log: "➕",
  Learn: "📚",
  Profile: "🏅",
};

function Root() {
  const { ready, profile, updateProfile } = useGame();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your journey…</Text>
      </View>
    );
  }

  if (!profile.onboarded) {
    return <OnboardingScreen />;
  }

  return (
    <>
      <Tabs />
      {!profile.tutorialSeen && (
        <TutorialOverlay onDone={() => updateProfile({ tutorialSeen: true })} />
      )}
    </>
  );
}

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenListeners={{ tabPress: () => tapLight() }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
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
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const navigationRef = createNavigationContainerRef();

/** Navigate to a tab if the navigator is mounted (tabs exist post-onboarding). */
function deepLink(screen: string) {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate(screen as never);
    } catch {
      // route not available (e.g. still onboarding) — ignore
    }
  }
}

export default function App() {
  useEffect(() => {
    configureNotifications();
    // Tapping a medication reminder deep-links to the Log screen.
    const sub = onReminderTapped(deepLink);
    getInitialReminderScreen().then((screen) => {
      if (screen) setTimeout(() => deepLink(screen), 300); // let tabs mount
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <GameProvider>
        <RewardProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="dark" />
            <Root />
          </NavigationContainer>
        </RewardProvider>
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
