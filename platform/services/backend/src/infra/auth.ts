/**
 * auth.ts — OIDC/JWT verification (Vol 4 §auth, Vol 8 §authn).
 * Verifies a bearer token's signature against the IdP's JWKS, then hands the decoded
 * claims to the pure validator (core/auth/session.ts). Requires `jose`.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { validateClaims, type Claims, type Role } from "../core/index.js";

export interface AuthConfig {
  issuer: string; // OIDC issuer URL
  audience: string; // this API's audience
  jwksUri: string; // IdP JWKS endpoint
}

export class AuthError extends Error {}

export function makeVerifier(cfg: AuthConfig) {
  const jwks = createRemoteJWKSet(new URL(cfg.jwksUri));

  /** Verify signature + claims; returns the typed Claims or throws AuthError. */
  return async function verify(token: string, now: number): Promise<Claims> {
    let payload: Record<string, unknown>;
    try {
      ({ payload } = await jwtVerify(token, jwks, { issuer: cfg.issuer, audience: cfg.audience }));
    } catch {
      throw new AuthError("invalid token signature");
    }
    const claims: Claims = {
      sub: String(payload.sub ?? ""),
      role: (payload.role as Role) ?? "patient",
      scope: typeof payload.scope === "string" ? payload.scope.split(" ") : [],
      aud: cfg.audience,
      exp: Number(payload.exp ?? 0),
      mfa: payload.mfa === true || payload.amr instanceof Array,
    };
    const result = validateClaims(claims, {
      now,
      audience: cfg.audience,
      requireMfaFor: ["clinician", "nurse", "admin"],
    });
    if (!result.valid) throw new AuthError(result.errors.join("; "));
    return claims;
  };
}
