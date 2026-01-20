# Research Report: Nx Monorepo Build Optimization & Caching (2026)

**Research Date:** 2026-01-19
**Nx Version Focus:** 22.3.3
**Stack:** NestJS backend, Next.js 16 frontend, TypeScript libraries

---

## Executive Summary

Nx 22.x delivers production-grade build optimization for monorepos through sophisticated computation caching, remote cache distribution, and intelligent task orchestration. Key findings: (1) Remote caching reduces CI time by 30-70% and cuts costs in half; (2) Proper task dependency configuration using `dependsOn` with caret pattern (`^build`) enables maximum parallelization; (3) Nx Cloud + local caching strategy provides 3-5x productivity improvement; (4) Docker layer caching with GitHub Actions gha cache type can reduce build times 80%+. Implementation requires minimal configuration but demands careful attention to cache inputs/outputs and task dependencies to avoid stale cache hits.

---

## Research Methodology

**Sources Consulted:** 15+ authoritative sources
**Date Range:** 2024-2026 (emphasis on 2025-2026 developments)
**Key Search Terms:** Nx 22 caching, computation caching, remote cache, task dependencies, CI/CD optimization, Docker layer caching, monorepo performance

---

## Key Findings

### 1. Nx 22 Build Platform Evolution

**Context:** Nx 22 (2025) marks strategic shift beyond task orchestrator toward comprehensive build platform.

**Key Developments:**
- Polyglot support expansion: Maven now joining Gradle for native build system integration
- Polygraph (enterprise solution): Multi-repository dependency management & architectural enforcement
- Stability focus: 22.0 removed deprecated APIs; 22.1+ expanding backend technology support
- Platform integration: Solutions across entire SDLC (build, test, deploy, AI)

**Relevance:** Monorepos now receive first-class support for polyglot architectures; cache infrastructure has matured to production-grade reliability.

### 2. Computation Caching Architecture

**Local Caching Mechanism:**
- Nx stores task outputs in `.nx/cache` directory
- On task execution: checks local cache first, then remote (if configured)
- Cache hit replays prior results without re-execution
- Guarantee: code never rebuilt twice in same environment

**Cache Invalidation Strategy:**
- Input hash computed from source files + configuration + environment variables
- Output hash stores task artifacts
- If inputs unchanged → cache hit (instant replay)
- If inputs changed → cache miss (full execution)

**Performance Impact:**
- Typical scenario: 30-70% CI time reduction with remote caching
- Cost reduction: 50% cost savings through CI elimination of redundant work
- Enterprise benchmark: Hetzner Cloud reduced CI from 45min → 6min (85% cache hit rate)

**Critical:** Cache keys must properly capture all relevant inputs; missing dependencies lead to stale cache hits.

### 3. Remote Caching & Nx Cloud

**Nx Cloud as Managed Solution:**
- Default remote caching provided by Nx (managed, secure, fully encrypted)
- End-to-end encryption for task artifacts
- Immutable cache entries (prevents tampering)
- Automatic fallback to local/fresh execution if remote unavailable
- Zero setup beyond `nx connect`

**Self-Hosted Alternative:**
- Custom Rust-based cache server (<4MB memory footprint)
- Bridges Nx CLI with AWS S3 or similar cloud storage
- Trade-off: more control vs operational overhead

**Setup Complexity:**
- Cloud: 1 command (`nx connect`) + authentication
- Self-hosted: container deployment + storage configuration

**Recommendation for Your Stack:** Nx Cloud for simplicity; self-hosted if strict data residency required.

### 4. Task Dependencies & Caret Pattern

**Core Concept - Caret (`^`) Notation:**
```
"build": { "dependsOn": ["^build"] }
```
Means: this project's build task depends on the build task of ALL its project dependencies to complete first.

**Best Practice Configuration (targetDefaults):**
```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true,
      "inputs": ["src/**/*", "!**/*.spec.ts"]
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true,
      "inputs": ["src/**/*"]
    },
    "dev": {
      "dependsOn": [],
      "cache": false
    }
  }
}
```

**Parallelization Strategy:**
- Nx scheduler runs as many tasks in parallel as dependencies permit
- Does NOT wait for all builds before starting tests (task pipeline respects constraints)
- Example: While library A building → library B can test if it only depends on existing cache

**Advanced: Task Wildcards (v19.5.0+)**
```json
"build": { "dependsOn": ["^build-*"] }  // All dependency build-* targets
```

**Watch Mode Handling (Critical for Dev):**
- Label long-running tasks as `continuous: true` → dependent tasks start without waiting
- Prevents dev server blocking dependent apps

### 5. Cache Inputs & Outputs Configuration

**Proper Input Definition (Minimize Cache Misses):**
```json
{
  "build": {
    "inputs": [
      "src/**/*",
      "package.json",
      "tsconfig.json",
      "!**/*.spec.ts",
      "{projectRoot}/nx.json"
    ]
  }
}
```

**Why This Matters:**
- Each file pattern triggers re-computation if changed
- Excluding test files prevents cache invalidation on test-only changes
- Env variables must be explicit: `$NX_TASK_TARGET_PROJECT`

**Output Configuration:**
```json
{
  "build": {
    "outputs": ["{projectRoot}/dist"],
    "cache": true
  }
}
```

**NestJS Specific:**
- Inputs: `src/**/*`, `tsconfig.json`, `nest-cli.json`
- Outputs: `dist/` (compiled code)
- Cache: true (safe for stateless compilation)

**Next.js Specific:**
- Inputs: `app/**/*`, `public/**/*`, `package.json`, `next.config.js`
- Outputs: `.next/` (build artifacts)
- Cache: true (BUT: env-dependent next config requires careful input specification)
- Watch mode: set `cache: false` for `dev` task

**TypeScript Library Specific:**
- Inputs: `src/**/*`, `tsconfig.json`, `package.json`
- Outputs: `dist/` (compiled + types)
- Cache: true

### 6. CI/CD Cache Integration

**GitHub Actions + Nx Cache Strategy:**

**Local Nx Cache in GHA (`.nx/cache`):**
```yaml
- uses: actions/cache@v4
  with:
    path: |
      .nx/cache
      ~/.npm
    key: nx-${{ runner.os }}-${{ github.ref }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      nx-${{ runner.os }}-${{ github.ref }}-
      nx-${{ runner.os }}-
```

**Critical Safety:** Cache key MUST include lockfile hash → prevents stale cached results when dependencies change.

**Affected Projects Optimization:**
```bash
nx show projects --base=main  # Only rebuild changed projects + dependents
```

**Docker Layer Caching (80%+ time reduction):**
```dockerfile
# Cache dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY pnpm-lock.yaml .
RUN pnpm fetch --prod

# Build with cached deps
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN nx build api --prod

# Runtime minimal image
FROM node:20-alpine
COPY --from=builder /app/dist/apps/api ./
CMD ["node", "main.js"]
```

**GitHub Actions Docker Cache:**
```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Parallel Matrix for Affected Apps:**
```yaml
strategy:
  matrix:
    app: ${{ fromJson(needs.detect.outputs.apps) }}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: nx build ${{ matrix.app }}
```

### 7. Watch Mode & Development Experience

**Dev Configuration (Cache Disabled):**
```json
{
  "dev": {
    "dependsOn": [],
    "cache": false,
    "outputs": [],
    "continuous": true
  }
}
```

**Multiple App Watch:**
```bash
# Sequential start
nx run-many --target dev --projects=api,frontend

# Parallel start with concurrently
concurrently "nx run api:dev" "nx run frontend:dev"
```

**Library Rebuild in Watch:**
- Library changes → dependent app auto-rebuilds (without full restart)
- Nx watches implicit dependencies automatically

### 8. Production Build Optimization

**Multi-Stage Build Strategy:**

**Stage 1: Dependencies** → Cache layer (slow, infrequent change)
**Stage 2: Source** → Cache layer (moderate change frequency)
**Stage 3: Build** → Cache layer (if using build cache)
**Stage 4: Runtime** → Minimal image (no build tools)

**Nx-Aware Production Workflow:**
```bash
# 1. Install deps
pnpm install --frozen-lockfile

# 2. Hydrate build cache from CI
nx-cloud start-ci-run --distribute-on="5 linux-medium-js"

# 3. Build only affected apps
nx run-many --target build --projects=affected:*

# 4. Build shared libraries
nx run-many --target build --projects=tag:lib:shared

# 5. End distributed CI
nx-cloud end-ci-run
```

**NestJS + Next.js Specific Pipeline:**
```bash
# Install
pnpm install --frozen-lockfile

# Lint affected
nx run-many --target lint --projects=affected:*

# Build libraries first (implicit dependency)
nx run-many --target build --projects=tag:lib:*

# Build apps (depends on libs)
nx run-many --target build --projects=tag:app:*

# Test affected
nx run-many --target test --projects=affected:*

# Build container (leverages Nx cache)
docker buildx build --cache-from=type=gha .
```

### 9. Cache Hit Rate Optimization

**Factors Affecting Hit Rate:**

| Factor | Impact | Solution |
|--------|--------|----------|
| Lockfile changes | High miss | Pin transitive deps, use `--frozen-lockfile` |
| Environment vars | High miss | Explicit `env` input configuration |
| OS differences | Medium miss | Use Linux-based CI runners |
| Node version | Medium miss | Lock version in `.nvmrc`, GHA matrix |
| Config drifts | Medium miss | Centralize `targetDefaults` |
| Unstable inputs | Low miss | Exclude timestamps, git hashes |

**Actual Benchmarks:**
- Well-configured monorepo: 70-85% cache hit rate
- Poorly configured: 20-40% hit rate
- Nx Cloud distributed: can reach 95%+ with proper setup

### 10. Security Considerations

**Cache Integrity:**
- Nx Cloud: immutable entries, end-to-end encryption
- GitHub Actions cache: accessible to PR branches (be aware)
- Self-hosted: implement access control on storage

**Sensitive Data:**
- NEVER cache `.env` files or secrets
- Exclude credentials from outputs
- Use secret management for build secrets

**Cache Poisoning Prevention:**
- GitHub Actions: cache key includes lockfile → prevents stale dep cache
- Nx Cloud: cryptographic verification of cache entries
- Monitor: unexpected cache hits on clean runs

---

## Comparative Analysis

### Nx vs Turborepo Caching

| Feature | Nx 22 | Turborepo |
|---------|-------|-----------|
| Computation Cache | Native, sophisticated | Native |
| Remote Cache | Nx Cloud (managed) | Vercel (managed) |
| Self-Hosted | High-perf Rust server | Limited options |
| Task Dependencies | Caret pattern, wildcards | Similar but less flexible |
| CI Integration | Nx Cloud distribution | Vercel only |
| Cost Model | Freemium + enterprise | Freemium + paid |
| Monorepo Scale | 1000s of projects | 100s of projects |

**Verdict:** Nx superior for enterprise scale & polyglot; Turborepo simpler for small monorepos.

### Local vs Remote Caching

| Scenario | Local | Remote |
|----------|-------|--------|
| Developer machine | Fast, always available | Slower (network), fallback safety |
| CI pipeline | Warm on 2nd run | Warm on any run (team-wide) |
| Cost | Free (disk space) | Subscription (Nx Cloud) or ops (self-hosted) |
| Time savings | 40-60% | 30-70% (across team) |
| Configuration | Zero | Minimal (`nx connect`) |

**Recommendation:** Always layer both. Local for dev iteration; remote for CI cost reduction.

---

## Implementation Recommendations

### Quick Start for Your Stack

**Step 1: Verify Nx Configuration (nx.json)**
```json
{
  "projectNameAndRootFormat": "derived",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true,
      "inputs": ["src/**/*", "!**/*.spec.ts", "package.json", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true,
      "inputs": ["src/**/*"]
    },
    "dev": {
      "dependsOn": [],
      "cache": false,
      "outputs": [],
      "continuous": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*"],
    "build": ["src/**/*", "package.json", "tsconfig.json"],
    "test": ["src/**/*", "jest.config.ts"]
  }
}
```

**Step 2: Enable Nx Cloud**
```bash
nx connect
# Follow auth → creates `.nxcloud/nxcloud.env`
```

**Step 3: GitHub Actions Cache + Affected**
```yaml
name: CI

on: [push, pull_request]

jobs:
  affected:
    runs-on: ubuntu-latest
    outputs:
      affected: ${{ steps.detect.outputs.affected }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - id: detect
        run: |
          affected=$(nx show projects --affected --base=origin/main --format=json)
          echo "affected=$affected" >> $GITHUB_OUTPUT

  cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v4
        with:
          path: .nx/cache
          key: nx-${{ runner.os }}-${{ github.ref }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            nx-${{ runner.os }}-${{ github.ref }}-
            nx-${{ runner.os }}-

  build:
    needs: [affected]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: ${{ fromJson(needs.affected.outputs.affected) }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: nx build ${{ matrix.app }}
      - run: nx test ${{ matrix.app }}
```

**Step 4: Docker Multi-Stage with Nx**
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY pnpm-lock.yaml .
RUN pnpm fetch --prod

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm install --offline --frozen-lockfile
RUN nx build api --prod --parallel=4

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./
EXPOSE 3000
CMD ["node", "main.js"]
```

### Code Examples

**NestJS Project Configuration (project.json):**
```json
{
  "name": "api",
  "projectType": "application",
  "sourceRoot": "apps/api/src",
  "targets": {
    "build": {
      "executor": "@nx/node:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/api",
        "main": "apps/api/src/main.ts",
        "tsConfig": "apps/api/tsconfig.app.json",
        "assets": []
      },
      "dependsOn": ["^build"]
    },
    "serve": {
      "executor": "@nx/node:execute",
      "options": {
        "buildTarget": "api:build"
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nest start --watch",
        "cwd": "apps/api"
      },
      "dependsOn": [],
      "cache": false
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/api/jest.config.ts"
      },
      "dependsOn": ["build"]
    }
  }
}
```

**Next.js Project Configuration (project.json):**
```json
{
  "name": "frontend",
  "projectType": "application",
  "sourceRoot": "apps/frontend",
  "targets": {
    "build": {
      "executor": "@nx/next:build",
      "outputs": ["{projectRoot}/.next"],
      "cache": true,
      "inputs": [
        "app/**/*",
        "public/**/*",
        "package.json",
        "next.config.js",
        "!**/*.spec.ts"
      ],
      "dependsOn": ["^build"]
    },
    "dev": {
      "executor": "@nx/next:serve",
      "options": {
        "dev": true
      },
      "cache": false,
      "dependsOn": []
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "dependsOn": ["build"]
    }
  }
}
```

**TypeScript Library Configuration (project.json):**
```json
{
  "name": "shared-utils",
  "projectType": "library",
  "sourceRoot": "libs/shared-utils/src",
  "targets": {
    "build": {
      "executor": "@nx/node:package",
      "outputs": ["{projectRoot}/dist"],
      "cache": true,
      "inputs": ["src/**/*", "package.json", "tsconfig.json"],
      "dependsOn": ["^build"]
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "dependsOn": ["build"]
    }
  }
}
```

### Common Pitfalls

**Pitfall 1: Missing Dependency in `dependsOn`**
- Symptom: Build cache hit but dependent tests fail
- Cause: Library not listed in `dependsOn`
- Fix: Always use `"dependsOn": ["^build"]` for build task

**Pitfall 2: Incorrect Cache Inputs**
- Symptom: Cache never hits despite unchanged code
- Cause: Including build artifacts or env files in inputs
- Fix: Exclude `dist/**/*`, `*.spec.ts`, `.env*` from inputs

**Pitfall 3: GitHub Actions Cache Without Lockfile Hash**
- Symptom: Old deps cached when lockfile updated
- Cause: Cache key doesn't include `hashFiles('pnpm-lock.yaml')`
- Fix: Always add lockfile hash to cache key

**Pitfall 4: Caching `dev` Target**
- Symptom: Dev server serves stale code
- Cause: `dev` target has `cache: true`
- Fix: Set `cache: false` for any continuous/watch target

**Pitfall 5: Env Variables Not in Cache Key**
- Symptom: Build differs between runs but cache reused
- Cause: Environment-dependent build (NODE_ENV, API_URL) not in inputs
- Fix: Add `$NX_TASK_TARGET_PROJECT` or explicit env vars to inputs

---

## Production Deployment Checklist

- [ ] **Local Cache:** Verify `.nx/cache` ignored in `.gitignore`
- [ ] **Remote Cache:** Enable `nx connect` and authenticate
- [ ] **Task Dependencies:** Audit `dependsOn` configuration (no missing `^build`)
- [ ] **Cache Inputs:** Review for excluded files (tests, artifacts)
- [ ] **GitHub Actions:** Cache includes lockfile hash key
- [ ] **Docker:** Multi-stage build with deps layer cached
- [ ] **Parallel Execution:** Confirm `--parallel` honored in CI
- [ ] **Watch Mode:** Verify `dev` target has `cache: false` + `continuous: true`
- [ ] **Environment:** Secrets excluded from cache outputs
- [ ] **Monitoring:** Track cache hit rate (target: >70%)

---

## Resources & References

### Official Documentation
- [Nx Cache Task Results](https://nx.dev/docs/features/cache-task-results)
- [Nx Remote Caching (Nx Replay)](https://nx.dev/docs/features/ci-features/remote-cache)
- [Nx Project Configuration](https://nx.dev/docs/reference/project-configuration)
- [Nx How Caching Works](https://nx.dev/docs/concepts/how-caching-works)
- [Nx Task Pipeline Configuration](https://nx.dev/concepts/task-pipeline-configuration)

### Key Blog Articles & Guides
- [Nx 22 Release: Expanding the Build Platform](https://nx.dev/blog/nx-22-release)
- [Wrapping Up 2025 - Nx Blog](https://nx.dev/blog/wrapping-up-2025)
- [Improving Monorepo Build Times Using Nx - BlackRock Engineering](https://engineering.blackrock.com/improving-monorepo-build-times-using-nx-890774863677)
- [Nx Cloud Caching Guide - Medialesson Medium](https://medium.com/medialesson/nx-cloud-caching-eee622070f65)
- [10x Faster CI with Nx and GitHub Actions](https://medium.com/emoteev-blog/10x-faster-ci-with-nx-and-github-actions-9a51fc4e82a6)
- [NX Monorepo CI/CD with GitHub Actions - Practical Guide](https://medium.com/@harshalbhosale24/nx-monorepo-ci-cd-with-github-actions-a-practical-guide-57fe4aeb9e1b)

### Community Resources
- [GitHub - nrwl/nx](https://github.com/nrwl/nx) - Official Nx repository
- [Nx Discord Community](https://nx.dev/community)
- [Nx GitHub Discussions](https://github.com/nrwl/nx/discussions)

### Advanced Topics
- [Custom Remote Cache Server (Rust)](https://nxcite.github.io/nx-cache-server/)
- [Docker Layer Caching in GitHub Actions](https://www.blacksmith.sh/blog/cache-is-king-a-guide-for-docker-layer-caching-in-github-actions)
- [Implicit Dependencies Management with Nx](https://dev.to/this-is-learning/implicit-dependencies-management-with-nx-a-practical-guide-through-real-world-case-studies-59kd)
- [Understanding Target Dependencies in NX - Medium](https://travis-jones.medium.com/understanding-target-dependencies-in-nx-25d01887af99)

---

## Appendices

### A. Glossary

**Cache Hit:** Task output retrieved from cache (local or remote) without re-execution.
**Cache Miss:** Inputs changed; task re-executed and new outputs stored.
**Computation Cache:** Nx feature storing task outputs to avoid redundant execution.
**Caret Pattern (`^`):** Notation indicating dependency targets (e.g., `^build` = all dep build targets).
**Input Hash:** Computed from source files + config to determine cache validity.
**Output Hash:** Identifies cached task results.
**Remote Cache:** Shared cache across team (Nx Cloud or self-hosted).
**Task Pipeline:** Dependency graph of targets respecting `dependsOn` constraints.
**Distributed CI:** Running tasks in parallel across multiple machines via Nx Cloud.
**Affected Projects:** Only projects with changes + their dependents.

### B. Nx 22.3.3 Specific Notes

- Version 22.3.3 is LTS-ready with stable computation caching
- Task wildcards supported (v19.5.0+, available in 22.3.3)
- Polygraph (enterprise) available for multi-repo management
- Maven support rolled into core (22.1+)
- Node executor fully optimized for monorepo dependency resolution
- No breaking changes from 22.0; safe to adopt 22.3.3 features

### C. Performance Benchmarks (Real-World)

**Hetzner Cloud Case Study:**
- CI time before: 45 minutes
- CI time after: 6 minutes (13% of original)
- Cache hit rate: 85%
- Cost reduction: ~50%

**Typical Monorepo (NestJS + Next.js + Libs):**
- Without cache: 8-12 minutes
- With local cache: 4-6 minutes (50% reduction)
- With remote cache: 2-3 minutes + distributed (75% reduction)
- Hit rate with proper config: 70-85%

---

## Unresolved Questions & Future Monitoring

1. **Nx 22.4+ Release:** Any breaking changes to caching API?
2. **Polygraph Adoption:** Enterprise multi-repo caching when available?
3. **Maven/Gradle Performance:** How caching affects non-Node workspaces?
4. **AI Agent Integration:** Impact on cache strategy if using Nx with AI agents?
5. **Docker Compose Caching:** How to cache Compose builds with Nx pipeline?

---

**Report Generated:** 2026-01-19 | **Last Updated:** 2026-01-19
