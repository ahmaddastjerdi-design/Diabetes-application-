/** ui.tsx — small reusable presentational components. */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Pressable,
} from "react-native";
import { theme } from "../theme";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({
  value,
  color = theme.colors.primary,
  height = 10,
}: {
  value: number; // 0..1
  color?: string;
  height?: number;
}) {
  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <View
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: color,
          height,
          borderRadius: height,
        }}
      />
    </View>
  );
}

export function Pill({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: color + "22" }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        isGhost ? styles.btnGhost : styles.btnPrimary,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={[styles.btnText, isGhost && { color: theme.colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.space(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  track: {
    backgroundColor: theme.colors.border,
    width: "100%",
    overflow: "hidden",
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.space(2.5),
    paddingVertical: theme.space(1),
    borderRadius: theme.radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: "700" },
  btn: {
    paddingVertical: theme.space(3.5),
    paddingHorizontal: theme.space(5),
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
