interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Accessible summary of the trend for screen readers. */
  ariaLabel: string;
  /** Optional reference band (min/max) drawn behind the line. */
  band?: { low?: number; high?: number };
}

/** Tiny dependency-free SVG trend line. Decorative path is aria-hidden; the
 *  <svg> carries an accessible text summary. */
export function Sparkline({
  values,
  width = 280,
  height = 64,
  ariaLabel,
  band,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
      />
    );
  }

  const pad = 6;
  const min = Math.min(...values, band?.low ?? Infinity);
  const max = Math.max(...values, band?.high ?? -Infinity);
  const range = max - min || 1;
  const x = (i: number) =>
    pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) =>
    height - pad - ((v - min) / range) * (height - pad * 2);

  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      {band && band.low !== undefined && band.high !== undefined && (
        <rect
          x={pad}
          y={y(band.high)}
          width={width - pad * 2}
          height={Math.max(0, y(band.low) - y(band.high))}
          fill="var(--hp-ok-bg)"
          aria-hidden="true"
        />
      )}
      <polyline
        points={line}
        fill="none"
        stroke="var(--hp-primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      />
      <circle
        cx={x(values.length - 1)}
        cy={y(values[values.length - 1]!)}
        r={3.5}
        fill="var(--hp-primary-strong)"
        aria-hidden="true"
      />
    </svg>
  );
}
