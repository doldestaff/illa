# ILLA Sorvetes — Security Architecture Document

**Version:** 1.0  
**Date:** 2026-02-23  
**Classification:** Confidential — Internal & Contractual Use  
**Prepared by:** Security Engineering Team

---

## 1. Executive Summary

ILLA Sorvetes is a gamification-enabled loyalty platform built on **Next.js App Router** (Vercel) with **Supabase** as the backend (PostgreSQL, Auth, Storage, RLS). The system manages user XP, points (moedas), drops, daily missions, referrals, VIP tokens, free ice-cream redemptions, and discount offers.

This document describes the security architecture, threat mitigations, and operational guarantees that protect the platform against manipulation, unauthorized access, and data leakage.

**Key Guarantees:**
- All reward mutations are protected by SECURITY DEFINER RPCs — no client can forge XP/points.
- Admin access requires Supabase Auth session + membership in the `admin_users` table.
- Row Level Security (RLS) is enabled on all user-facing tables.
- All API endpoints validate user identity server-side via `supabase.auth.getUser()`.
- Rate limiting is enforced on all claim and admin mutation endpoints.
- Security headers (CSP, HSTS, X-Frame-Options) are applied globally.

---

## 2. Authentication Architecture

### 2.1 Provider
Authentication is handled by **Supabase Auth**, supporting:
- Email/password sign-up and sign-in
- Google OAuth 2.0

### 2.2 Session Management
- JWTs are issued by Supabase and stored in **httpOnly cookies** via `@supabase/ssr`.
- The Next.js middleware (`middleware.ts`) refreshes sessions on every request to `/members/*`.
- Server-side route handlers verify the JWT by calling `supabase.auth.getUser()`, which validates the token against Supabase servers — no local JWT decoding is trusted.

### 2.3 Protected Routes
| Route Pattern       | Protection Level | Mechanism                           |
|---------------------|------------------|-------------------------------------|
| `/members/*`        | Authenticated    | Middleware redirect to `/?login=1`  |
| `/admin`            | Admin            | Client-side + API-level admin check |
| `/api/admin/*`      | Admin            | `requireAdmin()` server-side        |
| `/api/drops/claim`  | Authenticated    | `getUser()` + rate limiting         |
| `/api/missions/*`   | Authenticated    | `getUser()`                         |
| `/api/rewards/*`    | Authenticated    | `getUser()` + rate limiting         |
| `/api/discounts/*`  | Mixed            | Offers: public, Redeem: auth        |
| `/api/ping`         | Public           | Health check with throttle          |

---

## 3. Authorization Model

### 3.1 Row Level Security (RLS)
All user-facing tables have RLS **enabled**. Policies enforce:

| Table                | SELECT         | INSERT           | UPDATE           | DELETE        |
|----------------------|----------------|------------------|------------------|---------------|
| `profiles`           | Own row        | Via auth trigger  | Own row (guarded)| Denied        |
| `mission_instances`  | Own row        | Via RPC           | Own row          | Denied        |
| `drop_claims`        | Own row        | Via RPC only      | Denied           | Denied        |
| `notifications`      | Own row        | Via RPC only      | Own (read_at)    | Denied        |
| `reward_ledger`      | Own row        | Via RPC only      | Denied           | Denied        |
| `referrals`          | Own row        | Via RPC only      | Denied           | Denied        |
| `push_subscriptions` | Own row        | Own row           | Own row          | Own row       |
| `admin_users`        | Self-read only | Service role only | Service role only| Service role  |

### 3.2 RPC-Only Mutations
All reward-altering operations go through `SECURITY DEFINER` PostgreSQL functions:
- `admin_grant_currency` — Admin grants XP/points/drops to a user
- `claim_drop` — User claims an active drop (one-time per drop)
- `claim_mission_reward` — User claims completed mission rewards
- `claim_celebration_reward` — User claims celebration window reward
- `redeem_discount_offer` — User redeems a discount with points
- `redeem_sorvetes_free` — User redeems free ice cream

### 3.3 Column Guard Trigger
A `BEFORE UPDATE` trigger on `profiles` (`trg_guard_reward_columns`) blocks direct modifications to `xp` and `points` columns from authenticated users. Only `SECURITY DEFINER` functions can modify these values.

---

## 4. Data Protection Model

### 4.1 Data at Rest
- All data is stored in Supabase PostgreSQL (encrypted at rest per Supabase infrastructure).
- User passwords are hashed by Supabase Auth using bcrypt.
- File storage (avatars) uses Supabase Storage with bucket-level RLS.

### 4.2 Data in Transit
- All communications with Supabase use TLS 1.2+.
- Vercel enforces HTTPS for all deployments.
- HSTS header (`max-age=31536000; includeSubDomains`) is set globally.

### 4.3 Sensitive Data Handling
- `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the client bundle. Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public.
- Admin credentials are no longer hardcoded — admin access requires Supabase Auth + `admin_users` table membership.
- VAPID private keys are stored in `.env.local` (server-only) and never prefixed with `NEXT_PUBLIC_`.

---

## 5. Reward Integrity Model

### 5.1 Design Principle
**No reward value can be altered by client-side code.** All mutations flow through:

```
User Action → API Route (auth check) → RPC (SECURITY DEFINER) → Database
```

### 5.2 Guarantees

| Threat                        | Mitigation                                           |
|-------------------------------|------------------------------------------------------|
| XP/moedas forged via DevTools | RLS + column guard trigger blocks direct writes       |
| Double-claim a drop           | `claim_drop` RPC checks `drop_claims` uniqueness      |
| Self-referral                 | `referrals` RPC validates `referrer_id != referred_id`|
| Replay mission claim          | `claimed_at` column checked before granting rewards   |
| Rate-based abuse              | In-memory rate limiter on all claim endpoints          |

### 5.3 Audit Trail
All reward changes are logged in `reward_ledger`:
- `kind`: Type of event (mission_claim, drop_claim, admin_grant, etc.)
- `delta_xp`, `delta_points`: Exact amounts changed
- `source_id`: Reference to the originating entity
- `meta`: Additional JSON context
- `created_at`: Immutable timestamp

Users can view their own ledger via `/api/ledger/recent`. The table is **append-only** — `UPDATE` and `DELETE` are revoked from the authenticated role.

---

## 6. Admin Access Control

### 6.1 Authentication Flow
1. Admin navigates to `/admin`.
2. Signs in with email/password via Supabase Auth.
3. Client checks `admin_users` table for the authenticated user's ID.
4. If found, the `AdminDashboard` component is rendered.

### 6.2 API-Level Enforcement
Every `/api/admin/*` route calls `requireAdmin()`:
1. Creates a server-side Supabase client (session-aware via cookies).
2. Calls `supabase.auth.getUser()` to verify the JWT.
3. Queries `admin_users` table to confirm admin membership.
4. Returns 401 (unauthenticated) or 403 (not admin) on failure.

### 6.3 Admin Table Management
The `admin_users` table has **no client-writable RLS policies**. Admin users can only be added via:
- Supabase Dashboard (direct SQL insert)
- Service role API calls
- Database migration scripts

---

## 7. Anti-Fraud Protections

| Attack Vector                    | Protection                                     |
|----------------------------------|------------------------------------------------|
| DevTools XP manipulation         | Column guard trigger + RLS                     |
| Automated claim bots             | Rate limiting (3-10 req/min per user per action)|
| Session hijacking                | httpOnly cookies + JWT verification on server   |
| CSRF                             | SameSite cookies + Supabase PKCE flow          |
| Admin impersonation              | Session-based auth + admin_users table check    |
| Unauthorized notification spam   | Admin-only send endpoint with rate limiting     |
| Inventory inflation              | SECURITY DEFINER RPCs with atomic transactions  |

---

## 8. API Protection Strategy

### 8.1 Authentication
All API routes (except `/api/ping`, `/api/drops/active`, `/api/discounts/offers`) require authenticated session via `supabase.auth.getUser()`.

### 8.2 Rate Limiting
In-memory sliding window rate limiter per user per action:

| Endpoint                    | Limit           |
|-----------------------------|-----------------|
| `/api/drops/claim`          | 5 req/min       |
| `/api/missions/claim`       | 10 req/min      |
| `/api/rewards/claim`        | 3 req/min       |
| `/api/discounts/redeem`     | 5 req/min       |
| `/api/sorvetes-free/redeem` | 3 req/min       |
| `/api/admin/balance`        | 20 req/min      |
| `/api/admin/drops` (POST)   | 10 req/min      |
| `/api/admin/missions`       | 15 req/min      |
| `/api/admin/sorvetes`       | 20 req/min      |
| `/api/admin/notifications`  | 30 req/min      |

### 8.3 Input Validation
- All request bodies are validated for required fields before processing.
- `user_id` is **never** accepted from request body for user-facing routes — always derived from session.
- Admin routes that accept `target_user_id` are protected by the `requireAdmin()` gate.

---

## 9. Infrastructure Security

### 9.1 Vercel (Hosting)
- Automatic HTTPS enforcement
- Edge-level DDoS protection
- Environment variable isolation (dev/preview/production)
- No SSH access to production machines
- Immutable deployments with rollback support

### 9.2 Supabase (Backend)
- PostgreSQL with RLS enforced
- Auth with bcrypt password hashing
- JWT rotation and refresh token management
- Storage with bucket-level access control
- API rate limiting at the project level
- Daily automated backups

### 9.3 Security Headers
Applied globally via `next.config.ts`:

| Header                     | Value                                              |
|----------------------------|----------------------------------------------------|
| Content-Security-Policy    | Strict CSP (self + Supabase + Google OAuth)         |
| X-Frame-Options            | DENY                                               |
| X-Content-Type-Options     | nosniff                                            |
| Referrer-Policy            | strict-origin-when-cross-origin                    |
| Permissions-Policy         | camera=(), microphone=(), geolocation=()           |
| Strict-Transport-Security  | max-age=31536000; includeSubDomains                |
| X-DNS-Prefetch-Control     | on                                                 |

---

## 10. Compliance Notes (LGPD-Ready)

The system is designed with LGPD (Lei Geral de Proteção de Dados) principles in mind:

- **Data Minimization:** Only necessary data is collected (email, name, birth date).
- **Purpose Limitation:** Data is used solely for gamification and loyalty features.
- **User Access:** Users can view their profile and reward history.
- **Data Portability:** Ledger data is exportable via API.
- **Right to Deletion:** Supabase Auth supports account deletion, with cascade to dependent tables.
- **Consent:** OAuth consent flows are standard; no silent data collection occurs.
- **Data Residency:** Supabase project region should be configured for Brazil compliance.

---

## 11. Threat Model Summary (OWASP)

| OWASP Category                    | Status    | Notes                                          |
|-----------------------------------|-----------|------------------------------------------------|
| A01 - Broken Access Control       | Mitigated | RLS + requireAdmin() + session-based auth       |
| A02 - Cryptographic Failures      | Mitigated | HTTPS everywhere, bcrypt passwords              |
| A03 - Injection                   | Mitigated | Parameterized queries via Supabase SDK          |
| A04 - Insecure Design             | Mitigated | SECURITY DEFINER RPCs for all mutations         |
| A05 - Security Misconfiguration   | Mitigated | Security headers, no debug in production        |
| A06 - Vulnerable Components       | Monitor   | Regular dependency audits recommended           |
| A07 - Auth Failures               | Mitigated | Supabase Auth + server-side verification        |
| A08 - Data Integrity Failures     | Mitigated | Immutable ledger, column guard triggers         |
| A09 - Logging Failures            | Partial   | Reward ledger exists; add structured logging    |
| A10 - SSRF                        | N/A       | No server-side URL fetching from user input     |

---

## 12. Audit & Logging Strategy

### 12.1 Reward Ledger
All reward mutations are logged to `reward_ledger` with:
- User ID, timestamp, type, deltas, source reference, and metadata.
- Table is append-only (no UPDATE/DELETE for authenticated users).

### 12.2 Application Logs
- Vercel provides structured logging for all API routes.
- Errors are logged with `console.error` and visible in Vercel dashboard.
- Future enhancement: integrate Sentry for real-time error tracking.

### 12.3 Auth Logs
- Supabase Auth logs all sign-in/sign-up/sign-out events.
- Failed auth attempts are logged server-side.

---

## 13. Rate Limiting & Abuse Prevention

### 13.1 Implementation
- **Server-side in-memory sliding window** rate limiter (`lib/admin-auth.ts`).
- Keyed by `{action}:{userId}` for per-user limits.
- Separate limits per endpoint category (see Section 8.2).

### 13.2 Response
- Returns HTTP `429 Too Many Requests` with JSON error body.
- Client should implement exponential backoff on 429.

### 13.3 Scalability Note
The current rate limiter is in-memory (per serverless instance). For high-traffic production:
- Upgrade to Redis-based rate limiting (e.g., Upstash Redis with `@upstash/ratelimit`).
- Consider Vercel Edge Middleware for pre-route rate limiting.

---

## 14. Disaster Recovery Notes

### 14.1 Database Backups
- Supabase provides daily automated backups (Pro plan: point-in-time recovery).
- SQL migration files are version-controlled in `supabase/sql/`.

### 14.2 Deployment Recovery
- Vercel supports instant rollback to any previous deployment.
- All code is version-controlled in Git.

### 14.3 Incident Response
1. Detect anomaly via Vercel logs or reward ledger monitoring.
2. Disable affected RPC or endpoint via feature flag or Supabase function drop.
3. Investigate root cause using reward_ledger audit trail.
4. Apply fix and deploy via Vercel.
5. Post-incident review and documentation.

---

## 15. Security Checklist for Deployment

### Pre-Deployment
- [ ] All `SUPABASE_SERVICE_ROLE_KEY` values are server-only (not `NEXT_PUBLIC_`).
- [ ] Admin users seeded in `admin_users` table via Supabase Dashboard.
- [ ] All RLS policies applied via `security_hardening.sql`.
- [ ] Column guard trigger active on `profiles` table.
- [ ] Security headers verified via `curl -I` or securityheaders.com.
- [ ] No hardcoded secrets in source code (grep for tokens/keys).
- [ ] Rate limiting tested on claim endpoints.
- [ ] CSP tested — no console errors on login, OAuth, or main flows.

### Post-Deployment
- [ ] Verify admin login flow works (email/password + admin_users check).
- [ ] Verify non-admin users are blocked from `/admin` routes.
- [ ] Verify reward claims work and ledger entries are created.
- [ ] Run `npm audit` and address critical vulnerabilities.
- [ ] Schedule regular dependency audits (monthly).

---

**Document End**

*This document is intended for internal security review and contractual presentation. It reflects the security architecture as of the date stated above. The system should be periodically re-audited as features are added.*
