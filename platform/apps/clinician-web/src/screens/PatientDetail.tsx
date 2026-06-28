/**
 * PatientDetail.tsx — individual patient view (Vol 3 §timeline/AGP/decision support).
 * Shows the AGP, time-in-range, key metrics, and the decision-support flags — all
 * derived from the clinical engine and clearly labelled as clinician aids.
 */
import React from "react";
import { timeInRanges, meanGlucose, gmi, coefficientOfVariation, agpByHour, evaluate } from "@diabetes-quest/clinical";
import { SAMPLE_PATIENTS, SAMPLE_NOW } from "../data/sample.js";
import { TimeInRangeBar, AgpChart, FlagList } from "../components/clinical.js";

export function PatientDetail({ patientId, onBack }: { patientId: string; onBack: () => void }): React.JSX.Element {
  const patient = SAMPLE_PATIENTS.find((p) => p.patientId === patientId);
  if (!patient) return <p>Unknown patient.</p>;

  const tir = timeInRanges(patient.readings);
  const mean = meanGlucose(patient.readings);
  const flags = evaluate({ readings: patient.readings, lastReadingMs: patient.lastReadingMs }, SAMPLE_NOW);

  const stat = (label: string, value: string) => (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, minWidth: 120 }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );

  return (
    <section>
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Back to roster</button>
      <h2 style={{ marginTop: 0 }}>{patient.name}</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {stat("Mean glucose", `${Math.round(mean)} mg/dL`)}
        {stat("GMI (est. A1C)", `${gmi(mean)}%`)}
        {stat("Variability (CV)", `${coefficientOfVariation(patient.readings)}%`)}
        {stat("Time-in-range", `${tir.target}%`)}
      </div>

      <h3>Ambulatory glucose profile</h3>
      <AgpChart bands={agpByHour(patient.readings)} />

      <h3>Time in ranges</h3>
      <TimeInRangeBar tir={tir} />

      <h3>Decision support <span style={{ fontWeight: 400, fontSize: 13, color: "#64748b" }}>(clinician aid — not diagnosis)</span></h3>
      <FlagList flags={flags} />
    </section>
  );
}
