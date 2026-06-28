/**
 * anim.tsx — small reusable animation primitives built on the RN Animated API
 * (no native-config dependency). Respects the OS "reduce motion" setting.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Text,
  TextStyle,
  StyleProp,
  View,
  ViewStyle,
  AccessibilityInfo,
} from "react-native";

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => (reduceMotion = v))
  .catch(() => {});

/** Animated count from the previous value to the next when `value` changes. */
export function CountUp({
  value,
  style,
  suffix = "",
  duration = 700,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  duration?: number;
}) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(Math.round(value));

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(Math.round(value));
      anim.setValue(value);
      return;
    }
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value, anim, duration]);

  return (
    <Text style={style}>
      {display}
      {suffix}
    </Text>
  );
}

/** A progress bar whose fill animates smoothly to `value` (0..1). */
export function AnimatedBar({
  value,
  color,
  trackColor = "#e2e8f0",
  height = 10,
}: {
  value: number;
  color: string;
  trackColor?: string;
  height?: number;
}) {
  const anim = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, value));
    if (reduceMotion) {
      anim.setValue(clamped);
      return;
    }
    Animated.timing(anim, {
      toValue: clamped,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: trackColor,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Animated.View
        style={{ height, borderRadius: height, backgroundColor: color, width }}
      />
    </View>
  );
}

/** Fades + slides its children up on mount; `delay` staggers a list. */
export function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Wraps a value setter so children can `pop` (scale bounce) imperatively. */
export function Pop({
  trigger,
  children,
  style,
}: {
  trigger: number; // change this to fire the pop
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.18,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}
