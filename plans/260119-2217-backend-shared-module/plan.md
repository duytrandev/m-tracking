---
title: "Backend Shared Module Implementation"
description: "Implement Logger, Queue, and Utils services for the backend shared infrastructure"
status: pending
priority: P1
effort: 6h
branch: main
tags: [backend, shared, infrastructure, logger, queue, utils]
created: 2026-01-19
---

# Backend Shared Module Implementation Plan

## Overview

Implementation of shared infrastructure services for the NestJS backend monolith at `services/backend/src/shared/`. The shared module already contains a working RedisService; this plan adds Logger, Queue, and Utils services.

## Current State

| Component | Status | Location |
|-----------|--------|----------|
| SharedModule | Exists | `shared/shared.module.ts` |
| RedisService | Complete | `shared/redis/redis.service.ts` (192 lines) |
| Logger | Empty dir | `shared/logger/` |
| Queue | Empty dir | `shared/queue/` |
| Utils | Missing | N/A |

## Implementation Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-logger-service.md) | Winston Logger Service | 2h | pending |
| [Phase 2](./phase-02-queue-service.md) | BullMQ Queue Service | 2.5h | pending |
| [Phase 3](./phase-03-utils-module.md) | Shared Utilities | 1.5h | pending |

## Dependencies

- `winston: ^3.18.0` (already installed)
- `bullmq: ^5.28.3` (already installed)
- `redis: ^5.10.0` (already installed)
- Existing `RedisService` for queue connections

## Integration Points

1. **SharedModule** - Register all new services, export for global use
2. **GatewayModule** - Use LoggerService in interceptors/filters
3. **EventsModule** - Queue integration for async event processing
4. **Auth Module** - Move EncryptionUtil to shared utils

## Success Criteria

- [ ] Logger service with Winston configured for JSON output
- [ ] Queue service with BullMQ for background jobs
- [ ] Utils module with encryption, date, and validation helpers
- [ ] All services injectable via NestJS DI
- [ ] Unit tests for each service (>80% coverage)
- [ ] SharedModule exports all new services
- [ ] No circular dependencies

## Key Architecture Decisions

1. **Winston over Pino**: Winston already a dependency, better ecosystem support
2. **BullMQ over Bull**: Modern, better TypeScript support, recommended for new projects
3. **Utils in shared vs libs**: Backend-specific utils in shared; cross-project utils in `libs/utils`

## File Structure (Target)

```
services/backend/src/shared/
├── shared.module.ts          # Updated with new providers
├── index.ts                  # Barrel export
├── redis/
│   └── redis.service.ts      # Existing (no changes)
├── logger/
│   ├── logger.service.ts     # Winston logger wrapper
│   ├── logger.constants.ts   # Log levels, formats
│   └── index.ts              # Barrel export
├── queue/
│   ├── queue.service.ts      # BullMQ queue manager
│   ├── queue.constants.ts    # Queue names, config
│   ├── queue.types.ts        # Job payload types
│   └── index.ts              # Barrel export
└── utils/
    ├── encryption.util.ts    # AES-256-GCM (moved from auth)
    ├── date.util.ts          # Date formatting/parsing
    ├── hash.util.ts          # Hashing utilities
    └── index.ts              # Barrel export
```

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Circular dependency with RedisService | Queue uses separate Redis connection |
| Winston memory leaks | Configure max buffer size, rotate logs |
| BullMQ connection failures | Retry logic, graceful degradation |
| Breaking existing Logger usage | NestJS Logger interface compatibility |

## Related Documentation

- [System Architecture](../../docs/system-architecture.md) - ADR-004 (Redis), Logging Pattern
- [Code Standards](../../docs/code-standards.md) - File size limits, naming conventions
- [PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md) - Shared module description

---

**Next Step**: Start with Phase 1 - Logger Service
