---
title: "Monorepo Configuration Improvements"
description: "Apply critical configuration optimizations for workspace protocol, TypeScript, Nx caching, and CI/CD"
status: pending
priority: P1
effort: 18h
branch: main
tags: [configuration, devops, typescript, nx, ci-cd]
created: 2026-01-19
---

# Monorepo Configuration Improvements Plan

## Overview

This plan implements recommendations from the configuration review report to optimize the m-tracking monorepo for better type safety, build performance, and developer experience.

**Source:** `plans/reports/configuration-review-260119-2134.md`

## Current State Assessment

| Area | Current Grade | Target Grade | Gap |
|------|---------------|--------------|-----|
| Workspace Protocol | C+ | A | Missing workspace:* protocol |
| TypeScript Config | B- | A | Incomplete path mappings, needs tsconfig.base.json |
| Nx Caching | C+ | A | Generic inputs, no project-specific configs |
| CI/CD | F | B+ | No workflows exist |
| Module Boundaries | C | A | No enforcement via ESLint |

## Phases Overview

| Phase | Focus | Effort | Status |
|-------|-------|--------|--------|
| [Phase 1](./phase-01-critical-fixes.md) | Critical Fixes (workspace, tsconfig, CI) | 9h | Pending |
| [Phase 2](./phase-02-optimization.md) | High Impact Optimization (Nx, boundaries) | 9h | Pending |

## Key Deliverables

### Phase 1 (Critical - 9 hours)
1. Implement `workspace:*` protocol for all internal dependencies
2. Create `tsconfig.base.json` with strict type checking
3. Update `.npmrc` with proper pnpm configuration
4. Create GitHub Actions CI workflow with Nx affected
5. Fix all `project.json` files to use pnpm instead of npm

### Phase 2 (High Impact - 9 hours)
1. Optimize Nx caching with specific named inputs
2. Add project tags for all projects
3. Configure module boundary enforcement via ESLint
4. Optimize shared library package.json files
5. Clean up pnpm-workspace.yaml

## Success Criteria

- [ ] All internal dependencies use `workspace:*` protocol
- [ ] TypeScript strict mode enabled everywhere
- [ ] CI workflow runs lint, test, build on PRs
- [ ] Nx cache hit rate >85% for unchanged files
- [ ] Module boundaries enforced via ESLint

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| TypeScript errors after strict mode | Medium | High | Incremental fix with `any` temporary |
| Dependency resolution issues | Medium | Medium | Test `pnpm install` after each change |
| CI workflow failures | Low | Medium | Test locally with `act` if needed |

## Dependencies

- pnpm 10.28.0 (already installed)
- Nx 22.3.3 (already installed)
- GitHub repository access (for CI workflows)

## Rollback Plan

Each phase includes rollback procedures via git:
```bash
git checkout main -- <modified-files>
pnpm install
```

## Timeline

- **Phase 1:** Day 1-2 (9 hours)
- **Phase 2:** Day 3-4 (9 hours)
- **Total:** 4 working days
