/**
 * rbac.ts — role-based access control (Vol 8 §authz, Vol 4 §auth).
 *
 * Pure permission matrix. RBAC answers "may this ROLE perform this ACTION at all?".
 * It is necessary but NOT sufficient: access to a specific patient additionally
 * requires consent/ownership — see access.ts. Both gates must pass.
 */

export type Role = "patient" | "clinician" | "nurse" | "admin";

export type Action =
  | "read:own" // a patient reading their own data
  | "write:own" // a patient logging their own data
  | "read:patient" // a clinician reading a consented patient
  | "write:clinical" // a clinician writing clinical notes/messages
  | "manage:consent" // grant/revoke a care relationship
  | "admin:all"; // administrative operations

const PERMISSIONS: Readonly<Record<Role, readonly Action[]>> = {
  patient: ["read:own", "write:own", "manage:consent"],
  clinician: ["read:patient", "write:clinical"],
  nurse: ["read:patient"],
  admin: ["admin:all"],
};

export function hasPermission(role: Role, action: Action): boolean {
  if (role === "admin") return true; // admin is all-powerful by design (audited)
  return PERMISSIONS[role].includes(action);
}
