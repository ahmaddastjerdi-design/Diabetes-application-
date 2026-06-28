/**
 * App.tsx — clinician panel shell (Vol 3). A minimal, real entry that renders the
 * planned navigation areas. Each area is a placeholder linking to its spec section;
 * screens are built out in Phase 3 (see README). It imports the shared domain so the
 * panel and the patient app speak the exact same marker/organ language.
 */
import React from "react";
import { ORGANS, MARKERS, type OrganKey, type MarkerKey } from "@diabetes-quest/shared";

const AREAS = [
  "Patient roster / population dashboard",
  "Patient timeline",
  "AGP-style glucose trends",
  "Organ-health view",
  "Decision support & alerts",
  "Secure messaging",
  "Remote-monitoring triage",
  "Clinical reports",
] as const;

export function App(): React.JSX.Element {
  const organs = Object.keys(ORGANS) as OrganKey[];
  const markers = Object.keys(MARKERS) as MarkerKey[];
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 880, margin: "0 auto" }}>
      <h1>Diabetes Quest — Clinician Panel</h1>
      <p style={{ color: "#475569" }}>
        Scaffold (Vol 3). Shares the <code>@diabetes-quest/shared</code> domain with the
        patient app: organs <strong>{organs.map((o) => ORGANS[o].label).join(", ")}</strong>; markers{" "}
        <strong>{markers.map((m) => MARKERS[m].label).join(", ")}</strong>.
      </p>
      <h2>Planned areas</h2>
      <ul>
        {AREAS.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Decision support is a clinician aid — never autonomous diagnosis (Vol 3 / Vol 6).
      </p>
    </main>
  );
}
