# M-Tracking Documentation

**Version:** 2.1
**Last Updated:** 2026-01-20
**Status:** Streamlined & Consolidated + UX Polish Complete

---

## 📋 Documentation Index

### Core Documentation (11 files)

**Getting Started:**

1. **[Development Guide](./development-guide.md)** - Complete developer setup and workflows
2. **[System Architecture](./system-architecture.md)** - Complete technical architecture and design decisions
3. **[Code Standards](./code-standards.md)** - Coding conventions and best practices

**Development:** 4. **[API Documentation](./api-documentation.md)** - REST API reference and endpoints 5. **[Testing Strategy](./testing.md)** - Testing approach and guidelines 6. **[Deployment Guide](./deployment.md)** - Deployment procedures and infrastructure 7. **[Monitoring & Sentry](./monitoring-sentry.md)** - Error tracking and performance monitoring 8. **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

**Project Management:** 9. **[Product Requirements (PRD)](./prd.md)** - Consolidated product requirements 10. **[Development Roadmap](./development-roadmap.md)** - Project timeline and milestones 11. **[Project Changelog](./project-changelog.md)** - Version history and changes

---

## 🚀 Quick Start

### New Developers

1. Read [Development Guide](./development-guide.md) for setup
2. Review [System Architecture](./system-architecture.md) for technical overview
3. Check [Code Standards](./code-standards.md) before coding

### Working on Features

1. Check [Development Roadmap](./development-roadmap.md) for current priorities
2. Review [API Documentation](./api-documentation.md) for endpoints
3. Follow [Testing Strategy](./testing.md) for quality assurance

### Debugging Issues

1. Check [Troubleshooting](./troubleshooting.md) for common problems
2. Review [System Architecture](./system-architecture.md) for design context
3. Use [Development Guide](./development-guide.md) for workflow help

---

## 🏗️ Architecture Overview

**Pattern:** Modular Monolith (NestJS) + Separate Analytics Service (FastAPI)

### Technology Stack

**Frontend:**

- Next.js 16 (App Router)
- React 19 (Server Components)
- TanStack Query + Zustand
- TypeScript 5.9

**Backend:**

- NestJS 11 (Modular Monolith)
- TypeORM + Supabase PostgreSQL
- Redis (Cache & Events)
- FastAPI (Analytics Service)

**Infrastructure:**

- Docker + Docker Compose
- GitHub Actions (CI/CD)
- AWS EC2 + Supabase
- pnpm + Nx (Monorepo)

**Monitoring:**

- Sentry (Error Tracking & Performance)
- Real-time error capture
- Session replay & user tracking
- Privacy-first PII scrubbing

See [System Architecture](./system-architecture.md) for complete details.

---

## 📁 Project Structure

```
m-tracking/
├── apps/
│   └── frontend/          # Next.js 16 App Router
│       ├── app/           # Routes (Next.js App Router)
│       └── src/           # Source code
│           ├── components/  # Shared UI components
│           ├── features/    # Feature modules
│           ├── lib/         # Core libraries
│           └── types/       # Centralized type definitions

├── services/
│   ├── backend/           # NestJS API
│   │   └── src/
│   │       ├── auth/      # Authentication module
│   │       ├── common/    # Common utilities
│   │       ├── config/    # Configuration modules
│   │       ├── events/    # Event system
│   │       └── database/  # Database module
│   └── analytics/         # Python analytics service

└── libs/
    ├── config/            # Shared configs
    │   ├── eslint-config/
    │   ├── typescript-config/
    │   └── prettier-config/
    ├── common/            # Shared utilities
    ├── types/             # Shared types
    └── constants/         # Shared constants
```

---

## 📚 Additional Resources

### Plans & Reports

- **Implementation Plans:** `./plans/`
- **Status Reports:** `./plans/reports/`
- **Archived Plans:** `./plans/archive/`

### External Links

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query)

---

## 🎯 Current Status

### ✅ Phase 1 Complete: Project Restructuring (Jan 16, 2026)

**Completed:**

- Frontend type consolidation (centralized types in `types/api/` and `types/entities/`)
- Backend config modules (database, auth, events)
- Shared configuration packages (ESLint, TypeScript, Prettier)
- Build verification (0 TypeScript errors)
- Documentation consolidation (126 → 11 files)
- Sentry error tracking integration (Backend & Frontend)

### ✅ Phase 2 Complete: Frontend Authentication + UX Polish (Jan 20, 2026)

**Completed:**

- 31 UI components for full authentication flow
- 16 custom hooks for auth state management
- OAuth integration (Google, GitHub, Facebook)
- Two-factor authentication (TOTP, SMS OTP)
- Modern minimalist login page redesign
- Motion library integration (60fps animations)
- Enhanced validation UX with success feedback
- WCAG 2.2 AA accessibility compliance

### ⏳ Next Phase: Backend Core Implementation

**Upcoming:**

- Supabase project setup
- TypeORM entity definitions
- Backend authentication endpoints
- Database migrations and indexing

See [Development Roadmap](./development-roadmap.md) for detailed timeline.

---

## 🔄 Documentation Changelog

### 2026-01-20 (v2.1)

- **UX Polish Documentation:** Added Motion library integration details
- **Updated:** design-guidelines.md with Motion animations and LazyMotion setup
- **Updated:** code-standards.md with animation best practices (v1.2)
- **Updated:** development-guide.md with Motion library setup guide (v1.1)
- **Updated:** development-roadmap.md with Phase 2 UX enhancements status
- **Updated:** project-changelog.md with v0.2.1 release notes
- **Added:** Form animation patterns (entrance, error shake, success states)
- **Added:** Accessibility guidelines for animations (prefers-reduced-motion)
- **Impact:** Enhanced documentation coverage for modern frontend animations

### 2026-01-18 (v2.0)

- **Major cleanup:** Reduced from 126 to 11 core files (70% reduction)
- **Consolidated:** Backend, database, frontend, infrastructure docs → system-architecture.md
- **Consolidated:** PRD subdirectories → prd.md
- **Added:** development-guide.md (comprehensive dev workflows)
- **Archived:** Old implementation plans and reports
- **Updated:** All cross-references and links

### 2026-01-16 (v1.0)

- Initial documentation structure
- Architecture decision records
- Frontend authentication system documentation

---

## 📞 Support & Contributing

**Questions?**

- Check [Troubleshooting](./troubleshooting.md) first
- Review [Development Guide](./development-guide.md) for workflows
- Create an issue on GitHub

**Contributing:**

- See [CONTRIBUTING.md](../CONTRIBUTING.md)
- Follow [Code Standards](./code-standards.md)
- Run tests before submitting PRs

---

**Maintained By:** Development Team
**Documentation Status:** ✅ Clean, Current & Comprehensive
**Last Updated:** Jan 20, 2026
**Next Review:** 2026-02-01
