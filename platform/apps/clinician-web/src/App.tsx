/**
 * App.tsx — clinician panel shell (Vol 3). Roster ↔ patient detail. Auth/MFA and the
 * live backend timeline API are wired as Phase 3 continues (see README); the panel
 * currently renders deterministic, non-PHI sample data.
 */
import React, { useState } from "react";
import { Roster } from "./screens/Roster.js";
import { PatientDetail } from "./screens/PatientDetail.js";

export function App(): React.JSX.Element {
  const [openPatient, setOpenPatient] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "system-ui", color: "#0f172a", minHeight: "100vh", background: "#fff" }}>
      <header style={{ background: "#2563eb", color: "white", padding: "12px 24px" }}>
        <strong>Diabetes Quest — Clinician Panel</strong>
        <span style={{ float: "right", fontSize: 12, opacity: 0.9 }}>
          Decision support only — not a diagnostic device
        </span>
      </header>
      <main style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
        {openPatient ? (
          <PatientDetail patientId={openPatient} onBack={() => setOpenPatient(null)} />
        ) : (
          <Roster onOpen={setOpenPatient} />
        )}
      </main>
    </div>
  );
}
