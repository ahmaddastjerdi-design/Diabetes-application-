/**
 * Roster.tsx — population dashboard (Vol 3 §roster). Patients are risk-stratified by the
 * clinical engine so the clinician triages the highest-risk first.
 */
import React from "react";
import { stratify, timeInRanges, coefficientOfVariation, type PatientMetrics } from "@diabetes-quest/clinical";
import { SAMPLE_PATIENTS, SAMPLE_NOW, type SamplePatient } from "../data/sample.js";
import { RiskBadge } from "../components/clinical.js";

function metricsFor(p: SamplePatient): PatientMetrics {
  const tir = timeInRanges(p.readings);
  return {
    patientId: p.patientId,
    tir: tir.target,
    timeBelow54: tir.veryLow,
    cv: coefficientOfVariation(p.readings),
    lastReadingMs: p.lastReadingMs,
  };
}

export function Roster({ onOpen }: { onOpen: (patientId: string) => void }): React.JSX.Element {
  const ranked = stratify(SAMPLE_PATIENTS.map(metricsFor), SAMPLE_NOW);
  const nameOf = (id: string) => SAMPLE_PATIENTS.find((p) => p.patientId === id)?.name ?? id;
  return (
    <section>
      <h2>Patients ({ranked.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#64748b", fontSize: 13 }}>
            <th style={{ padding: 8 }}>Patient</th>
            <th>Risk</th>
            <th>TIR</th>
            <th>Below 54</th>
            <th>CV</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r) => (
            <tr
              key={r.patientId}
              onClick={() => onOpen(r.patientId)}
              style={{ cursor: "pointer", borderTop: "1px solid #e2e8f0" }}
            >
              <td style={{ padding: 8, fontWeight: 600 }}>{nameOf(r.patientId)}</td>
              <td><RiskBadge tier={r.tier} /></td>
              <td>{r.tir}%</td>
              <td>{r.timeBelow54}%</td>
              <td>{r.cv}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
