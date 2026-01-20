---
title: "M-Tracking Project Restructuring"
description: "Comprehensive restructuring of monorepo based on 2026 best practices review"
status: pending
priority: P1
effort: 16h
branch: main
tags: [restructuring, architecture, frontend, backend, monorepo]
created: 2026-01-18
---

# M-Tracking Project Restructuring Plan

## Summary

Restructure M-Tracking monorepo to address 7 high-priority gaps identified in project structure review. Focus on frontend state management, centralized types, backend event system, and shared library architecture.

## Current State

| Area | Score | Status |
|------|-------|--------|
| Monorepo | 8/10 | Good foundation, missing config packages |
| Backend | 9/10 | Excellent modular structure |
| Frontend | 6/10 | Needs state management organization |
| Libraries | 5/10 | Flat structure, no scoping |

## Phases Overview

| Phase | Focus | Effort | Status |
|-------|-------|--------|--------|
| [Phase 1](./phase-01-frontend-state-management.md) | Frontend state mgmt + types | 4h | Pending |
| [Phase 2](./phase-02-type-definitions.md) | Centralized type definitions | 2h | Pending |
| [Phase 3](./phase-03-backend-enhancements.md) | Backend config/common/events | 3h | Pending |
| [Phase 4](./phase-04-shared-libraries.md) | Shared config packages | 4h | Pending |
| [Phase 5](./phase-05-documentation.md) | Documentation updates | 3h | Pending |

## Dependencies

```
Phase 1 ─────┬─────> Phase 2 ────────────────> Phase 5
             │                                    ^
Phase 3 ────>├────> Phase 4 ─────────────────────┘
```

- Phase 1 and 3 can run in parallel
- Phase 2 depends on Phase 1 (uses store structure)
- Phase 4 depends on Phase 3 (backend config patterns)
- Phase 5 depends on all phases (documents final state)

## Key Files to Create

### Frontend (apps/frontend/src/)
- `lib/store/index.ts` - Store barrel export
- `lib/store/ui-store.ts` - UI state (theme, modals)
- `lib/query/index.ts` - Query barrel export
- `lib/query/keys.ts` - Query key factory
- `types/` - Centralized type definitions
- `app/**/_components/` - Private route components

### Backend (services/backend/src/)
- `config/` - Centralized configuration
- `common/` - Global guards/interceptors/pipes/filters
- `events/` - Domain event system
- `database/` - Database module

### Libraries (libs/)
- `config/eslint-config/` - Shared ESLint config
- `config/typescript-config/` - Shared TS config
- `config/prettier-config/` - Shared Prettier config

## Success Criteria

1. Frontend state management follows industry patterns
2. Types centralized with barrel exports
3. Backend has clean config/common separation
4. Shared config packages eliminate duplication
5. All existing tests pass
6. Documentation updated

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Import path breaks | Medium | High | Run lint after each phase |
| Type conflicts | Low | Medium | Incremental type migration |
| Build failures | Medium | High | Test build after each step |

## Testing Checkpoints

After each phase:
1. `pnpm run build` - All packages build
2. `pnpm run lint` - No lint errors
3. `pnpm run test` - All tests pass
4. Manual smoke test - App runs correctly

## Related Documents

- [Project Structure Review](/docs/project-structure-review.md)
- [Code Standards](/docs/code-standards.md)
- [System Architecture](/docs/system-architecture.md)
