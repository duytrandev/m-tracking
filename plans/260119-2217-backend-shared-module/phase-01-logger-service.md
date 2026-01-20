# Phase 1: Logger Service (Winston)

## Context

- [System Architecture - Logging Pattern](../../docs/system-architecture.md)
- [Code Standards](../../docs/code-standards.md)
- Existing usage: `new Logger(ClassName.name)` pattern in NestJS

## Overview

| Property | Value |
|----------|-------|
| Priority | P1 - Foundation for observability |
| Status | pending |
| Effort | 2h |

Implement structured logging service using Winston with JSON output, context awareness, and request tracing capabilities.

## Key Insights

1. **Existing Pattern**: Services use `new Logger(ServiceName.name)` from `@nestjs/common`
2. **Requirement**: Structured JSON logs for production, pretty console for dev
3. **System Architecture ADR**: Log levels - error, warn, info, debug
4. **Interceptor exists**: `common/interceptors/logging.interceptor.ts` needs enhancement

## Requirements

### Functional
- F1: Support log levels: error, warn, info, debug
- F2: JSON formatted output for production
- F3: Pretty console output for development
- F4: Context-aware logging (service name, request ID)
- F5: Automatic request/response logging capability
- F6: Error stack trace preservation

### Non-Functional
- NF1: NestJS `LoggerService` interface compatible
- NF2: Drop-in replacement for NestJS Logger
- NF3: <1ms overhead per log call
- NF4: No memory leaks from buffering

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     LoggerService                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │ NestJS LoggerService Interface                      ││
│  │ log(), error(), warn(), debug(), verbose()          ││
│  └─────────────────────────────────────────────────────┘│
│                          │                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Winston Instance                                    ││
│  │ - Format: JSON (prod) / Pretty (dev)               ││
│  │ - Transports: Console, File (optional)             ││
│  │ - Level: Configurable via LOG_LEVEL env            ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create
| File | Purpose | Lines |
|------|---------|-------|
| `shared/logger/logger.service.ts` | Main logger service | ~100 |
| `shared/logger/logger.constants.ts` | Log formats, levels | ~30 |
| `shared/logger/index.ts` | Barrel export | ~5 |

### Files to Modify
| File | Change |
|------|--------|
| `shared/shared.module.ts` | Add LoggerService provider/export |
| `.env.example` | Add LOG_LEVEL, LOG_FORMAT vars |

## Implementation Steps

### Step 1: Create Logger Constants

```typescript
// shared/logger/logger.constants.ts
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export const LOG_CONTEXT_KEY = 'context';
export const REQUEST_ID_KEY = 'requestId';
```

### Step 2: Implement LoggerService

```typescript
// shared/logger/logger.service.ts
import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    const isDev = configService.get('NODE_ENV') !== 'production';
    const level = configService.get('LOG_LEVEL', 'info');

    this.logger = winston.createLogger({
      level,
      format: isDev ? this.devFormat() : this.prodFormat(),
      transports: [new winston.transports.Console()],
    });
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context: context || this.context });
  }

  private devFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
      }),
    );
  }

  private prodFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    );
  }
}
```

### Step 3: Create Barrel Export

```typescript
// shared/logger/index.ts
export * from './logger.service';
export * from './logger.constants';
```

### Step 4: Update SharedModule

```typescript
// shared/shared.module.ts (additions)
import { LoggerService } from './logger/logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, LoggerService],
  exports: [RedisService, LoggerService],
})
export class SharedModule {}
```

### Step 5: Add Environment Variables

```bash
# .env.example additions
LOG_LEVEL=info
LOG_FORMAT=json
```

## Todo List

- [ ] Create `shared/logger/logger.constants.ts`
- [ ] Create `shared/logger/logger.service.ts`
- [ ] Create `shared/logger/index.ts`
- [ ] Update `shared/shared.module.ts` to register LoggerService
- [ ] Update `.env.example` with LOG_LEVEL
- [ ] Write unit tests for LoggerService
- [ ] Test in development mode (pretty output)
- [ ] Test in production mode (JSON output)

## Success Criteria

- [ ] LoggerService injectable in any service
- [ ] JSON logs in production mode
- [ ] Pretty console logs in development
- [ ] Context preserved across log calls
- [ ] NestJS Logger interface compatible
- [ ] Unit tests pass with >80% coverage

## Testing Strategy

### Unit Tests
```typescript
describe('LoggerService', () => {
  it('should log with context')
  it('should output JSON in production mode')
  it('should output pretty format in development')
  it('should preserve error stack traces')
  it('should respect LOG_LEVEL configuration')
});
```

### Integration Test
- Verify logs appear in console during request handling
- Verify structured JSON output with proper fields

## Security Considerations

- Never log sensitive data (passwords, tokens, PII)
- Sanitize user input before logging
- Rate limit error logging to prevent log flooding attacks

## Next Steps

After completion, proceed to [Phase 2: Queue Service](./phase-02-queue-service.md)
