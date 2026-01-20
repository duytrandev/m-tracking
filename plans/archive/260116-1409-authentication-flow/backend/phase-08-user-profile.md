# Phase 8: User Profile Management

**Duration:** Week 6 | **Priority:** Medium | **Status:** ⏳ Pending
**Dependencies:** Phase 3 (JWT Session Management), Phase 7 (RBAC)

## Overview
Implement user profile management with CRUD operations, avatar upload, password change, and session management.

## API Endpoints

```
GET    /users/me               - Get current user profile
PATCH  /users/me               - Update profile (name, email, phone)
POST   /users/me/avatar        - Upload avatar image
DELETE /users/me/avatar        - Delete avatar
PATCH  /users/me/password      - Change password
GET    /users/me/sessions      - List active sessions
DELETE /users/me/sessions/:id  - Revoke specific session
DELETE /users/me/sessions      - Revoke all sessions (except current)
```

## Implementation Files

**Create:**
- `controllers/user.controller.ts`
- `services/user.service.ts`
- `dto/update-profile.dto.ts`
- `dto/change-password.dto.ts`

## Todo List
- [ ] Create UserController
- [ ] Create UserService
- [ ] Implement GET /users/me
- [ ] Implement PATCH /users/me
- [ ] Implement avatar upload (use multer)
- [ ] Implement avatar deletion
- [ ] Implement password change
- [ ] Implement session listing
- [ ] Implement session revocation
- [ ] Protect endpoints with JwtAuthGuard
- [ ] Validate profile updates
- [ ] Test profile CRUD operations
- [ ] Test avatar upload
- [ ] Test password change
- [ ] Test session management
- [ ] Write unit tests

## Success Criteria
- ✅ Users can view their profile
- ✅ Users can update profile fields
- ✅ Avatar upload works (< 5MB limit)
- ✅ Password change validates old password
- ✅ Users can see active sessions
- ✅ Users can revoke sessions
- ✅ All tests passing
