# Bwain.app PWA - Deployment Runbook

This document provides step-by-step instructions for deploying and managing the Bwain.app PWA.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Deployment](#initial-deployment)
3. [Updating the App](#updating-the-app)
4. [Rollback Procedure](#rollback-procedure)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access

- GitHub repository access
- Vercel account with deployment permissions
- Google OAuth 2.0 credentials configured

### Required Tools

- Node.js 18+ installed locally
- npm or yarn package manager
- Git command line tools

### Environment Variables

Ensure these environment variables are set in Vercel:

```bash
NEXTAUTH_URL=https://bwaincell.sunny-stack.com
NEXTAUTH_SECRET=(your NextAuth secret)
GOOGLE_CLIENT_ID=(your Google OAuth client ID)
GOOGLE_CLIENT_SECRET=(your Google OAuth secret)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=(same as GOOGLE_CLIENT_ID)
NODE_ENV=production
```

Note: `NEXT_PUBLIC_API_URL` is NOT needed - the frontend uses Next.js API routes (relative `/api` URLs)

---

## Initial Deployment

### Step 1: Prepare the Code

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd bwaincell-pwa
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build locally to verify:**

   ```bash
   npm run build
   ```

4. **Test the production build:**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:3000` and verify all features work.

### Step 2: Deploy to Vercel

1. **Install Vercel CLI (if not already installed):**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**

   ```bash
   vercel login
   ```

3. **Deploy to production:**

   ```bash
   vercel --prod
   ```

4. **Set environment variables:**

   ```bash
   vercel env add NEXTAUTH_URL production
   # Enter: https://bwaincell.sunny-stack.com

   vercel env add NEXTAUTH_SECRET production
   # Enter: (your NextAuth secret)

   vercel env add GOOGLE_CLIENT_ID production
   # Enter: (your Google OAuth client ID)

   vercel env add GOOGLE_CLIENT_SECRET production
   # Enter: (your Google OAuth secret)

   vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
   # Enter: (same as GOOGLE_CLIENT_ID)
   ```

5. **Verify deployment:**
   - Visit the Vercel deployment URL
   - Test login functionality
   - Test all 6 features (Tasks, Lists, Notes, Reminders, Budget, Schedule)
   - Test offline mode (disable network in DevTools)
   - Test install prompt (on Chrome/Android)

### Step 3: Configure Custom Domain (Optional)

1. **Add domain in Vercel Dashboard:**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **Verify HTTPS:**
   - Ensure the domain uses HTTPS
   - Update manifest.json if needed

---

## Updating the App

### Standard Update Process

1. **Make code changes:**

   ```bash
   git checkout -b feature/my-update
   # Make changes...
   git add .
   git commit -m "Description of changes"
   git push origin feature/my-update
   ```

2. **Test locally:**

   ```bash
   npm run build
   npm start
   ```

3. **Merge to main branch:**

   ```bash
   git checkout main
   git merge feature/my-update
   git push origin main
   ```

4. **Deploy to production:**

   ```bash
   vercel --prod
   ```

5. **Verify deployment:**
   - Check Vercel deployment logs
   - Test affected features
   - Monitor for errors in Vercel Analytics

### Service Worker Updates

When updating the service worker configuration:

1. **Update `next.config.js`:**
   - Modify caching strategies as needed
   - Update cache names if breaking changes

2. **Test caching behavior:**

   ```bash
   npm run build
   npm start
   # Test in DevTools > Application > Service Workers
   ```

3. **Deploy:**
   - Service workers automatically update on next visit
   - Users may need to reload twice to get the new worker

4. **Clear old caches (if needed):**
   - Add cache cleanup logic to service worker
   - Or instruct users to clear browser data

---

## Rollback Procedure

If a deployment causes issues, rollback immediately:

### Option 1: Vercel Dashboard Rollback

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Click on "Deployments"

2. **Find the last working deployment:**
   - Locate the previous stable deployment
   - Click the three-dot menu (⋮)
   - Select "Promote to Production"

3. **Verify rollback:**
   - Visit the production URL
   - Test critical features
   - Monitor error logs

### Option 2: CLI Rollback

1. **List recent deployments:**

   ```bash
   vercel ls
   ```

2. **Promote a previous deployment:**

   ```bash
   vercel promote <deployment-url>
   ```

3. **Verify:**
   ```bash
   curl -I https://your-domain.com
   # Check headers for deployment ID
   ```

### Post-Rollback Actions

1. **Identify the issue:**
   - Review Vercel logs
   - Check browser console errors
   - Review recent code changes

2. **Fix the issue:**
   - Create a hotfix branch
   - Fix the bug
   - Test thoroughly locally

3. **Redeploy:**
   - Follow standard update process
   - Monitor closely after redeployment

---

## Monitoring

### Daily Checks

1. **Vercel Analytics:**
   - Check page load times
   - Monitor error rates
   - Review visitor counts

2. **Backend API Health:**
   - Verify API is responsive
   - Check Fly.io metrics
   - Review API logs for errors

3. **User Reports:**
   - Check for user-reported issues
   - Monitor feedback channels

### Weekly Checks

1. **Performance Audit:**

   ```bash
   # Run Lighthouse audit
   # Chrome DevTools > Lighthouse > Generate Report
   ```

   - Target: All scores >90
   - Performance: >90
   - Accessibility: >90
   - Best Practices: >90
   - SEO: >90
   - PWA: Installable

2. **Bundle Size Analysis:**

   ```bash
   npm run build
   # Review .next/static/chunks/ sizes
   ```

   - Monitor for unexpected growth
   - Keep initial bundle <200KB

3. **Dependency Updates:**
   ```bash
   npm outdated
   # Review and update dependencies
   npm update
   npm run build
   npm start
   # Test thoroughly before deploying
   ```

### Alerts to Set Up

1. **Vercel Alerts:**
   - Deployment failures
   - High error rates
   - Performance degradation

2. **API Monitoring:**
   - Backend downtime
   - High response times
   - 5xx errors

---

## Troubleshooting

### Common Deployment Issues

#### Build Fails

**Symptoms:**

- Vercel build fails with errors
- Deployment doesn't complete

**Solutions:**

1. Check build logs in Vercel dashboard
2. Verify all dependencies are in package.json
3. Test build locally: `npm run build`
4. Check for TypeScript errors: `npm run lint`
5. Ensure Node version matches (18+)

#### Environment Variables Not Working

**Symptoms:**

- API calls fail in production
- Features don't work as expected

**Solutions:**

1. Verify environment variables in Vercel dashboard
2. Ensure variables start with `NEXT_PUBLIC_` for client-side access
3. Redeploy after adding/changing variables
4. Check browser console for API URL

#### Service Worker Not Updating

**Symptoms:**

- Users see old version of the app
- Changes don't appear for users

**Solutions:**

1. Users need to reload the page twice
2. Clear browser cache and reload
3. Update cache names in `next.config.js`
4. Add skip waiting logic to force update

#### PWA Not Installable

**Symptoms:**

- Install prompt doesn't appear
- App doesn't meet PWA criteria

**Solutions:**

1. Verify manifest.json is accessible
2. Ensure HTTPS is enabled
3. Check service worker is registered
4. Run Lighthouse PWA audit
5. Review manifest icons (192px and 512px required)

### Performance Issues

#### Slow Page Load

**Solutions:**

1. Check bundle size: `npm run build`
2. Verify service worker caching
3. Review network tab in DevTools
4. Optimize images and assets
5. Enable compression in Vercel

#### High API Response Times

**Solutions:**

1. Check backend API health
2. Verify database performance
3. Review API endpoint efficiency
4. Consider adding API caching
5. Monitor Fly.io metrics

---

## Emergency Contacts

- **Vercel Support:** https://vercel.com/support
- **Backend API:** https://bwaincell.fly.dev
- **Project Repository:** [Insert GitHub URL]
- **Project Owner:** [Insert contact info]

---

## Deployment Checklist

Use this checklist for every production deployment:

- [ ] Code changes tested locally
- [ ] Build succeeds without errors
- [ ] All features tested manually
- [ ] Environment variables verified
- [ ] Deployment completed successfully
- [ ] Production URL accessible
- [ ] Login functionality works
- [ ] All 6 features work correctly
- [ ] Offline mode works
- [ ] Install prompt appears (on supported browsers)
- [ ] No console errors
- [ ] Lighthouse scores >90
- [ ] Backend API healthy
- [ ] Rollback plan identified
- [ ] Team notified of deployment

---

## Version History Template

Keep a log of deployments:

```
## 2025-10-07 - Phase 4 Launch
- Added offline support
- Implemented install prompt
- Added loading skeletons
- Lazy loaded Recharts component
- Added error boundaries
- Implemented confirmation dialogs
- Improved accessibility
- Created user documentation

## 2025-09-30 - Phase 3 Complete
- Implemented all 6 features
- Added real-time polling
- Integrated with backend API
- Mobile responsive design
```

---

**End of Deployment Runbook**

_Last updated: 2025-10-07_
_Version: 1.0.0_
