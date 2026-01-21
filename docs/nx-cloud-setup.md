# NX Cloud Setup & Remote Caching Guide

**Last Updated:** 2026-01-21

## Overview

NX Cloud enables remote/distributed caching for build artifacts, reducing CI build times by 2-4x. This document explains the setup and usage of NX Cloud in the M-Tracking monorepo.

## Current Status

- **nx-cloud**: v19.1.0 installed
- **Runner**: `nx-cloud` configured in `nx.json`
- **Access Token**: Read from `NX_CLOUD_ACCESS_TOKEN` environment variable
- **Cacheable Operations**: `build`, `test`, `lint`, `type-check`

## Setup Instructions

### For CI/CD (GitHub Actions)

1. **Create NX Cloud Workspace**
   - Visit https://cloud.nx.app
   - Sign up (free tier available)
   - Create a new workspace (name it after your org/project)

2. **Get Access Token**
   - In NX Cloud dashboard, go to Settings → Auth Tokens
   - Generate a token
   - Copy the full token value

3. **Add to GitHub Secrets**

   ```bash
   # Using GitHub CLI
   gh secret set NX_CLOUD_ACCESS_TOKEN --body "your-token-value-here"
   ```

   Or manually via GitHub UI:
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `NX_CLOUD_ACCESS_TOKEN`
   - Value: (paste token)

4. **Verify CI Workflow**
   - `.github/workflows/ci.yml` includes `NX_CLOUD_ACCESS_TOKEN` environment variable
   - CI automatically uses the token for cache operations

### For Local Development

1. **Get Access Token** (as above from NX Cloud)

2. **Set Environment Variable (choose one)**

   **Option A: In your shell profile**

   ```bash
   export NX_CLOUD_ACCESS_TOKEN="your-token-value-here"
   ```

   Add to `~/.bashrc`, `~/.zshrc`, or equivalent

   **Option B: In .env.local (project)**

   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local

   # Edit .env.local and add:
   NX_CLOUD_ACCESS_TOKEN=your-token-value-here

   # Load with:
   source .env.local
   ```

3. **Verify Setup**

   ```bash
   pnpm nx build @m-tracking/frontend

   # Check output for "remote cache hit" messages
   # Visit https://cloud.nx.app to see cache entries
   ```

## Configuration Details

### nx.json Settings

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "accessToken": "${NX_CLOUD_ACCESS_TOKEN}",
        "cacheableOperations": ["build", "test", "lint", "type-check"],
        "canTrackAnalytics": false
      }
    }
  }
}
```

- **runner**: Uses `nx-cloud` for distributed caching
- **accessToken**: Reads from environment variable (secure, never hardcoded)
- **cacheableOperations**: Tasks that can be cached
- **canTrackAnalytics**: Disabled to avoid sending telemetry

### Environment Variables

| Variable                | Source                                  | Purpose                     |
| ----------------------- | --------------------------------------- | --------------------------- |
| `NX_CLOUD_ACCESS_TOKEN` | GitHub Secret (CI) / .env.local (local) | Authenticates with NX Cloud |

## Usage

### Build Commands (Unchanged)

All standard commands work as before - remote caching is automatic:

```bash
# Builds locally first time, then caches
pnpm nx build @m-tracking/frontend

# Check only tests that were affected
pnpm nx affected -t test --base=origin/main

# Run linting with cache benefits
pnpm nx lint @m-tracking/frontend

# Type checking with cache
pnpm nx type-check @m-tracking/backend
```

### Cache Behavior

1. **First Run (Local)**
   - Task executes normally
   - Output uploaded to NX Cloud
   - Cache saved in `.nx/cache` locally

2. **Subsequent Runs (Local or CI)**
   - Cache hash computed from inputs
   - If hash exists in NX Cloud, artifacts downloaded
   - Build time drops from minutes to seconds

3. **Cache Hits**
   Look for output like:
   ```
   > nx run @m-tracking/frontend:build [local cache]
   > nx run @m-tracking/backend:build [remote cache]
   ```

## Monitoring & Insights

### NX Cloud Dashboard

Visit https://cloud.nx.app to:

- **View Cache Statistics**
  - Hit rates per project
  - Cache size and growth
  - Most cached tasks

- **Track Performance**
  - Build time trends
  - Slowest tasks
  - Performance improvements over time

- **Manage Team Access**
  - Invite team members
  - Set member permissions
  - View member activity

### Expected Improvements

**Before NX Cloud (local cache only)**

- PR CI run: 3-5 minutes (rebuilds from scratch)
- Developer machine: 30-60 seconds (local cache)

**After NX Cloud (shared cache)**

- PR CI run: 1-2 minutes (remote cache hit 70-90%)
- Developer machine: 5-10 seconds (team cache hit)
- Second CI run: <1 minute (full cache hit)

## Security Considerations

- **Never commit tokens** to git repository
- **Use GitHub Secrets** for CI access
- **Use environment variables** for local development
- **Rotate tokens** periodically (via NX Cloud dashboard)
- **Cache contents**: Build artifacts only (no secrets stored)
- **Access tokens**: Read-only mode available (advanced)

## Troubleshooting

### Cache Not Working

1. **Token missing or invalid**

   ```bash
   echo $NX_CLOUD_ACCESS_TOKEN  # Should not be empty
   ```

   Re-generate token in NX Cloud dashboard if needed

2. **Cache not being used**

   ```bash
   pnpm nx build @m-tracking/frontend --verbose
   # Look for cache-related log lines
   ```

3. **Different cache across machines**
   - Ensure same Node.js version
   - Ensure same package-lock state
   - Check that `nx.json` is identical

### Performance Issues

1. **Slow cache downloads**
   - Check network speed
   - Try during off-peak hours
   - Consider regional NX Cloud instances

2. **Cache invalidation**
   - Automatically handled by NX
   - Manual clear: `pnpm nx reset`

3. **Verification**
   ```bash
   pnpm nx reset  # Clear local cache
   pnpm nx build @m-tracking/frontend  # Full rebuild
   # Second run should hit remote cache
   ```

## Advanced Configuration

### Read-Only Mode (Advanced)

For distributed CI without write permissions:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "accessToken": "${NX_CLOUD_ACCESS_TOKEN}",
        "readOnly": true,
        "cacheableOperations": ["build", "test", "lint", "type-check"]
      }
    }
  }
}
```

### Custom Cache Directory

```bash
# Clear entire cache if needed
pnpm nx reset
```

### Excluding Tasks from Cache

In `nx.json` per-project or globally:

```json
{
  "targetDefaults": {
    "dev": { "cache": false },
    "serve": { "cache": false }
  }
}
```

## Next Steps

1. **Setup Complete** - NX Cloud is configured
2. **Get Token** - Create workspace and token at https://cloud.nx.app
3. **Add to GitHub** - Store token in GitHub Secrets
4. **Verify Locally** - Test with `pnpm nx build` command
5. **Monitor** - Check NX Cloud dashboard after CI runs
6. **Team Onboarding** - Share this guide with team members

## References

- [NX Cloud Documentation](https://nx.dev/nx-cloud)
- [Performance Optimization Guide](https://nx.dev/core-features/cache-task-results)
- [Security Best Practices](https://nx.dev/core-features/share-your-cache)

---

**Questions?** Check `.env.example` for token setup instructions or review the troubleshooting section above.
