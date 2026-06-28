/**
 * session.ts — token CLAIMS validation (Vol 4 §auth, Vol 8 §authn).
 *
 * Signature verification (OIDC/JWT) happens in the infra layer with a real key set
 * (see src/infra/auth.ts, using `jose`). This pure layer validates the DECODED claims:
 * expiry, audience, scope, and the MFA requirement for clinical roles. Keeping it pure
 * makes the security rules directly unit-testable (Vol 9).
 */
import type { Role } from "./rbac.js";

export interface Claims {
  sub: string; // user id
  role: Role;
  scope: string[];
  aud: string; // intended audience (this API)
  exp: number; // epoch seconds
  mfa?: boolean;
}

export interface ValidateOptions {
  now: number; // epoch seconds
  audience: string;
  /** Roles that must have completed MFA (clinicians handle PHI for many patients). */
  requireMfaFor?: Role[];
}

export interface ClaimsValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateClaims(claims: Claims, opts: ValidateOptions): ClaimsValidationResult {
  const errors: string[] = [];
  if (claims.exp <= opts.now) errors.push("token expired");
  if (claims.aud !== opts.audience) errors.push("audience mismatch");
  if (!claims.sub) errors.push("missing subject");
  if ((opts.requireMfaFor ?? []).includes(claims.role) && claims.mfa !== true)
    errors.push(`MFA required for role '${claims.role}'`);
  return { valid: errors.length === 0, errors };
}

export function hasScope(claims: Claims, scope: string): boolean {
  return claims.scope.includes(scope);
}
