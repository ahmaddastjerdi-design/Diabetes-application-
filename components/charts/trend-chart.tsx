'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TrendPoint {
  label: string; // x-axis label (date)
  value: number;
  value2?: number; // optional second series (e.g. diastolic)
}

/**
 * Accessible trend line. The chart is decorative (aria-hidden); a text summary
 * and a data table carry the information for screen readers
 * (docs/ACCESSIBILITY_CHECKLIST.md §6 — never chart-only).
 */
export function TrendChart({
  points,
  unit,
  seriesLabel,
  series2Label,
  band,
  summary,
}: {
  points: TrendPoint[];
  unit: string;
  seriesLabel: string;
  series2Label?: string;
  band?: { low?: number; high?: number };
  summary: string;
}) {
  if (points.length === 0) return null;

  return (
    <figure className="m-0">
      <div aria-hidden className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            {band && band.low !== undefined && band.high !== undefined && (
              <ReferenceArea
                y1={band.low}
                y2={band.high}
                fill="hsl(var(--success))"
                fillOpacity={0.08}
              />
            )}
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis
              width={44}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v} ${unit}`, '']}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={seriesLabel}
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 2 }}
            />
            {series2Label && (
              <Line
                type="monotone"
                dataKey="value2"
                name={series2Label}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
