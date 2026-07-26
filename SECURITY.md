# Security & Hardening Guide

This document outlines the security measures implemented in AIMediaOS and guidance for deploying to production.

## Current Implementation Status

### MVP (Development)
- ✅ Input validation (prompts, image URLs, file types/sizes)
- ✅ Error sanitization (no SQL/connection details leaked)
- ✅ Environment validation on startup
- ✅ Rate limiting framework
- ✅ Security headers (MIME type, XSS, clickjacking, etc.)
- ✅ Request timeout protection
- ✅ Structured logging with request IDs
- ⚠️ RLS policies (permissive - see notes below)

### Not Yet Implemented (Required for Production)
- 🔲 User authentication (Supabase Auth, OAuth, etc.)
- 🔲 Authorization & access control
- 🔲 Database encryption at rest
- 🔲 TLS/HTTPS enforcement
- 🔲 CSRF protection
- 🔲 DDoS protection
- 🔲 Audit logging
- 🔲 Secrets rotation
- 🔲 API key management

## Database Security

### Row Level Security (RLS)

**Current Policy (MVP):**
The `media_jobs` table and `media` storage bucket have permissive RLS policies (`INSERT` and `SELECT` allowed for anonymous users) because the application has no authentication yet.

**Before Production:**
Replace permissive policies with:
```sql
-- Only authenticated users can read/write their own jobs
create policy "users can read own jobs" on public.media_jobs
  for select to authenticated using (auth.uid() = created_by_user_id);

create policy "users can create jobs" on public.media_jobs
  for insert to authenticated with check (auth.uid() = created_by_user_id);

create policy "users can update own jobs" on public.media_jobs
  for update to authenticated using (auth.uid() = created_by_user_id);
```

Add a `created_by_user_id` column to `media_jobs` and populate it from `auth.uid()`.

## Input Validation

All user input is validated server-side:

- **Prompts**: Length 1-1000 characters, no SQL injection
- **Image URLs**: Must be http/https, valid URL format
- **File uploads**: Type whitelist (image/png, jpeg, webp, gif), max 8MB
- **Job IDs**: UUID format validation
- **Aspect ratios**: Whitelist (1:1, 3:4, 4:3, 16:9, 9:16)
- **Resolutions**: Whitelist (SD, HD, 1080p, 4K)

See `packages/db/src/validation.ts` for implementation.

## Error Handling

All API errors are sanitized to prevent information leakage:

- ✅ SQL errors → "Database operation failed."
- ✅ Connection errors → "Service temporarily unavailable."
- ✅ Stack traces → Hidden in production
- ✅ Request IDs → Attached to all logs for tracing

See `apps/web/src/lib/logging.ts` for implementation.

## Rate Limiting

Basic rate limiting is implemented:
- **Window**: 1 minute
- **Limit**: 100 requests per IP
- **Enforcement**: Per-endpoint in middleware

This is a placeholder. For production, use:
- CloudFlare Rate Limiting
- AWS WAF
- nginx/Caddy rate limiting
- Supabase API shields

## API Security Headers

All responses include security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer control |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Disable dangerous APIs |

## Request Timeouts

All API requests have a 30-second timeout to prevent:
- Long-running queries hanging
- Memory leaks from stuck connections
- DoS via slow requests

## Environment Configuration

### Development
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

### Production
Ensure these environment variables are set:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key  # Or use service role key
NODE_ENV=production
```

### Validation
The app validates environment configuration on startup. Missing critical variables will cause graceful degradation (local preview only).

## Deployment Checklist

Before deploying to production:

- [ ] Add user authentication (Supabase Auth or similar)
- [ ] Update RLS policies to use `auth.uid()`
- [ ] Add `created_by_user_id` column to `media_jobs`
- [ ] Set up rate limiting (CloudFlare/AWS WAF)
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring & alerting (Sentry/Datadog)
- [ ] Enable database backups
- [ ] Rotate all API keys
- [ ] Review & tighten CORS settings
- [ ] Set up audit logging
- [ ] Load test with expected traffic
- [ ] Document incident response procedures

## Secrets Management

### Current (Development)
Secrets are stored in `.env.local` (ignored by git).

### Production
Use environment variable management:
- **AWS**: Secrets Manager, Parameter Store
- **GCP**: Secret Manager
- **Azure**: Key Vault
- **Supabase**: Use service role key from secured environment

**Never commit secrets to git.**

## Incident Response

If a security issue is found:

1. **Identify**: Determine scope and impact
2. **Isolate**: Limit exposure (revoke keys, block IP, etc.)
3. **Assess**: Gather logs and evidence
4. **Fix**: Patch the vulnerability
5. **Test**: Verify fix doesn't introduce regressions
6. **Deploy**: Release patched version
7. **Monitor**: Watch for related issues
8. **Communicate**: Notify affected users (if applicable)

## Future Improvements

- [ ] Add CSRF tokens for state-changing operations
- [ ] Implement API key rotation
- [ ] Add IP whitelisting for admin endpoints
- [ ] Set up WAF rules
- [ ] Add database query auditing
- [ ] Implement secrets scanning in CI/CD
- [ ] Add penetration testing

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
