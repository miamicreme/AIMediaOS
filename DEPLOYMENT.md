# Deployment Guide

This guide covers deploying AIMediaOS to production and staging environments.

## Pre-Deployment Checklist

### Security
- [ ] Review `SECURITY.md` section "Deployment Checklist"
- [ ] Rotate all API keys and secrets
- [ ] Enable database backups with retention policy
- [ ] Set up monitoring and alerting (Sentry, Datadog, etc.)
- [ ] Review RLS policies - ensure `auth.uid()` based access control
- [ ] Set `NODE_ENV=production`
- [ ] Disable debug logging and verbose errors
- [ ] Enable HTTPS/TLS (enforce in production)
- [ ] Set up DDoS protection (CloudFlare, AWS WAF)
- [ ] Configure CORS properly for your domain

### Infrastructure
- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Storage bucket created with proper permissions
- [ ] Environment variables configured
- [ ] Request timeouts set (30 seconds for API, longer for workers)
- [ ] Database connection pooling enabled
- [ ] Cache headers configured for static assets

### Testing
- [ ] Run full test suite: `npm run test`
- [ ] Run linter: `npm run lint`
- [ ] Manually test critical flows:
  - [ ] Text-to-image generation
  - [ ] Image upload and processing
  - [ ] Job polling and completion
  - [ ] Error handling for invalid inputs
- [ ] Load testing with expected traffic patterns
- [ ] Smoke tests on staging environment

### Documentation
- [ ] Update README with production URLs
- [ ] Document any custom configurations
- [ ] Create runbook for common issues
- [ ] Document incident response procedures
- [ ] Gather team feedback on deployment plan

## Environment Configuration

### Local Development
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit with local Supabase credentials
npm install
npm run dev
```

### Staging
1. Create Supabase project for staging
2. Set environment variables:
```bash
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=staging-key
NODE_ENV=production
```
3. Deploy and run smoke tests

### Production
1. Create Supabase project for production
2. Set environment variables via platform (Vercel, GitHub Actions, etc.)
3. Enable database backups
4. Set up monitoring alerts
5. Deploy and monitor

## Deployment Steps

### Vercel (Recommended)
1. Connect repository to Vercel
2. Set environment variables in project settings
3. Enable automatic deployments from main branch
4. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
CMD ["pnpm", "start"]
```

### Manual/Other Platforms
1. Clone repository
2. Install dependencies: `pnpm install`
3. Build: `pnpm run build`
4. Set environment variables
5. Start: `pnpm start`

## Post-Deployment

### Verification
- [ ] Health check: `GET /api/health` returns 200
- [ ] Can upload an image
- [ ] Can create a generation job
- [ ] Can poll job status
- [ ] Monitor logs for errors

### Monitoring
- Set up alerts for:
  - High error rates (>1%)
  - Response time > 5 seconds
  - Database connection pool exhaustion
  - Storage quota exceeded
  - Unexpected request patterns

### Rollback Plan
If issues occur:
1. Check logs for error pattern
2. If critical: revert to previous version
3. Fix issue on separate branch
4. Deploy patched version
5. Post-mortem analysis

## Scaling Considerations

### Database
- Monitor connection pool usage
- Enable Supabase Performance Insights
- Index frequently queried columns (already done: `created_at`)
- Archive old jobs periodically
- Set up read replicas if needed

### Storage
- Monitor bucket size
- Clean up old media files (add TTL policy)
- Consider CDN for media delivery
- Set up access logging

### API
- Monitor request patterns
- Scale based on traffic (auto-scaling in most platforms)
- Consider caching responses (status polling)
- Implement GraphQL if complexity grows

## Maintenance

### Regular Tasks
- Review security logs weekly
- Audit API key usage
- Check backup integrity
- Monitor database performance
- Update dependencies monthly

### Quarterly
- Security audit (internal or third-party)
- Load testing
- Disaster recovery drill
- Review and update runbooks

## Support

For issues during deployment:
1. Check logs: `pnpm run logs` or platform dashboard
2. Verify environment variables are set correctly
3. Check Supabase dashboard for database/storage status
4. Review SECURITY.md for common issues
5. Contact support if issue persists
