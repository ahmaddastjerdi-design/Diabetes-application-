/**
 * Sparkline.tsx — a tiny SVG trend line for organ health over recent days.
 * Values are on a fixed 0..100 scale so the line reflects real level, not just
 * relative shape. Shows a flat baseline gracefully when there's only one point.
 */
import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Circle, Line } from "react-native-svg";
import { theme } from "../theme";

export function Sparkline({
  data,
  color,
  width = 280,
  height = 64,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const pad = 6;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const n = data.length;

  const x = (i: number) => pad + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad + (1 - Math.max(0, Math.min(100, v)) / 100) * h;

  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = data[n - 1] ?? 0;

  // Reference lines at the 40 (strained) and 80 (thriving) thresholds.
  const refs = [40, 80];

  return (
    <View>
      <Svg width={width} height={height}>
        {refs.map((r) => (
          <Line
            key={r}
            x1={pad}
            y1={y(r)}
            x2={width - pad}
            y2={y(r)}
            stroke={theme.colors.border}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
        {n > 1 && (
          <Polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        <Circle cx={x(n - 1)} cy={y(last)} r={4} fill={color} />
      </Svg>
    </View>
  );
}
