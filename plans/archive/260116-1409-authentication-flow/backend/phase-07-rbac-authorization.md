# Phase 7: RBAC Authorization

**Duration:** Week 5-6 | **Priority:** High | **Status:** ⏳ Pending
**Dependencies:** Phase 3 (JWT Session Management)

## Overview
Implement role-based access control with decorator-based guards, permission checking, and Redis caching.

## Context Links
- [RBAC Research Report](../../plans/reports/researcher-rbac-260116-1409.md)

## Key Implementation Points

### Role Hierarchy
- **Admin**: Full system access
- **User**: Standard user operations
- **Guest**: Read-only access

### Permission Format
- Resource:action (e.g., `transactions:write`, `budgets:read`)
- Wildcard support (e.g., `transactions:*`, `*:read`)

### Caching Strategy
- **Layer 1**: In-memory LRU cache (5-15 minutes)
- **Layer 2**: Redis cache (1-24 hours)
- **Layer 3**: Database query (fallback)
- Event-driven invalidation on role changes

## Implementation Files

**Create:**
- `decorators/roles.decorator.ts`
- `decorators/permissions.decorator.ts`
- `guards/roles.guard.ts`
- `guards/permissions.guard.ts`
- `services/rbac.service.ts`

## Todo List
- [ ] Create @Roles() decorator
- [ ] Create @Permissions() decorator
- [ ] Create @Public() decorator
- [ ] Create RolesGuard
- [ ] Create PermissionsGuard
- [ ] Implement RBACService with caching
- [ ] Seed default roles and permissions (migration)
- [ ] Assign default 'user' role on registration
- [ ] Update JWT payload to include roles
- [ ] Implement permission checking logic
- [ ] Implement cache invalidation on role changes
- [ ] Test role-based access
- [ ] Test permission-based access
- [ ] Test wildcard permissions
- [ ] Test cache invalidation
- [ ] Write unit tests

## Success Criteria
- ✅ Roles assigned correctly on registration
- ✅ @Roles() decorator protects routes
- ✅ @Permissions() decorator works
- ✅ Wildcard permissions functional
- ✅ Cache hit rate > 90%
- ✅ Permission checks < 10ms
- ✅ All tests passing
