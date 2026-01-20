# Documentation Cleanup Proposal

**Date:** 2026-01-18 14:17
**Status:** Proposal - Awaiting Approval
**Current State:** 126 markdown files (1.8MB)

---

## Current Documentation Audit

### Statistics
- **Root level:** 5 files
- **docs/:** 62 files (812KB)
- **plans/:** 59 files (1.0MB)
- **Total:** 126 markdown files

### Problem
**Too much documentation!** Most projects need 10-15 core docs, not 126.

---

## Proposed Cleanup Strategy

### ✅ KEEP (19 files)

#### Root Level (3 files)
1. `README.md` - Project overview
2. `CONTRIBUTING.md` - Contribution guide
3. `SECURITY.md` - Security policies

#### Core Documentation (10 files)
4. `docs/system-architecture.md` - Complete architecture (v1.1, updated)
5. `docs/code-standards.md` - Coding standards (v1.1, updated)
6. `docs/api-documentation.md` - API reference
7. `docs/deployment.md` - Deployment guide
8. `docs/testing.md` - Testing strategy
9. `docs/troubleshooting.md` - Common issues
10. `docs/development-roadmap.md` - Project timeline
11. `docs/project-changelog.md` - Version history
12. `docs/README.md` - Docs index
13. `docs/prd.md` - Product requirements (consolidated)

#### Recent Plans (6 files)
14. `plans/260118-1229-project-restructuring/plan.md` - Recent restructuring plan
15. `plans/260118-1229-project-restructuring/phase-01-frontend-state-management.md`
16. `plans/260118-1229-project-restructuring/phase-02-type-definitions.md`
17. `plans/260118-1229-project-restructuring/phase-03-backend-enhancements.md`
18. `plans/260118-1229-project-restructuring/phase-04-shared-libraries.md`
19. `plans/260118-1229-project-restructuring/phase-05-documentation.md`

**Total to Keep:** 19 files (~400KB)

---

### ❌ REMOVE (78 files)

#### Root Level (2 files)
- `AGENTS.md` → Move content to docs/development-guide.md
- `PROJECT_STRUCTURE.md` → Already in system-architecture.md

#### Duplicate/Redundant docs/ (15 files)
- `docs/brief.md` → Covered in README.md and prd.md
- `docs/front-end-spec.md` → Covered in system-architecture.md
- `docs/architecture-overview.md` → Duplicate of system-architecture.md
- `docs/project-structure-review.md` → Covered in system-architecture.md
- `docs/backend-architecture/` (6 files) → Consolidate into system-architecture.md
- `docs/database-architecture/` (3 files) → Consolidate into system-architecture.md
- `docs/infrastructure-architecture/` (2 files) → Consolidate into system-architecture.md

#### Over-detailed docs/ (44 files)
- `docs/frontend-architecture/` (13 files) → Consolidate into system-architecture.md
  - authentication-ui-ux-design.md
  - component-architecture.md
  - data-fetching.md
  - forms-validation.md
  - index.md
  - performance-optimization.md
  - project-structure.md
  - routing-navigation.md
  - state-management.md
  - styling-theming.md
  - tech-stack.md
  - testing-strategy.md
  - ui-components.md

- `docs/prd/` (17 files) → Consolidate into main prd.md
  - budget-calculation-rules.md
  - cross-cutting-concerns.md
  - currency-rules.md
  - document-approval.md
  - document-control.md
  - executive-summary.md
  - glossary.md
  - income-vs-expense-detection.md
  - index.md
  - multi-currency-rules.md
  - next-steps-after-prd-approval.md
  - phase-1-mvp-conservative-26-weeks.md
  - phase-2-post-launch-weeks-27.md
  - product-scope-phase-planning.md
  - recurring-transaction-detection.md
  - security-privacy-rules.md
  - story-count-summary.md
  - target-users.md
  - transaction-categorization-logic-4-tier-strategy.md
  - user-stories-epic-1.md

- `docs/mockups/` (3 files) → Keep mockups but remove guide docs
  - README.md
  - figma-design-guide.md
  - quick-start-checklist.md

- `docs/stories/` (1 file) → Consolidate into prd.md
  - 1.1.user-registration-login.md

#### Old Plans (30 files)
- `plans/260116-1409-authentication-flow/` → Completed, archive or remove
  - All 30 implementation files from Jan 16

#### Old Reports (53 files)
- Keep only recent reports (last 7 days)
- Archive or remove: 46 old reports from plans/reports/

**Total to Remove:** 78 files (~1.2MB)

---

### 🔄 CONSOLIDATE (29 files → 3 files)

#### Create: `docs/development-guide.md`
Consolidate from:
- AGENTS.md
- docs/troubleshooting.md (keep but reference)
- Development workflow info

#### Update: `docs/system-architecture.md`
Consolidate from:
- docs/architecture-overview.md
- docs/backend-architecture/* (6 files)
- docs/database-architecture/* (3 files)
- docs/frontend-architecture/* (13 files)
- docs/infrastructure-architecture/* (2 files)

#### Update: `docs/prd.md`
Consolidate from:
- docs/prd/* (17 files)
- docs/stories/* (1 file)

---

## Proposed Final Structure

```
/
├── README.md                    # ✅ Project overview
├── CONTRIBUTING.md              # ✅ How to contribute
├── SECURITY.md                  # ✅ Security policies
│
├── docs/
│   ├── README.md                # ✅ Documentation index
│   ├── system-architecture.md   # ✅ Complete architecture (CONSOLIDATED)
│   ├── code-standards.md        # ✅ Coding standards
│   ├── api-documentation.md     # ✅ API reference
│   ├── deployment.md            # ✅ Deployment guide
│   ├── testing.md               # ✅ Testing strategy
│   ├── troubleshooting.md       # ✅ Common issues
│   ├── development-roadmap.md   # ✅ Timeline
│   ├── project-changelog.md     # ✅ Version history
│   ├── development-guide.md     # ✅ NEW: Dev workflows
│   └── prd.md                   # ✅ Product requirements (CONSOLIDATED)
│
└── plans/
    ├── 260118-1229-project-restructuring/  # ✅ Recent plan (6 files)
    │   ├── plan.md
    │   ├── phase-01-frontend-state-management.md
    │   ├── phase-02-type-definitions.md
    │   ├── phase-03-backend-enhancements.md
    │   ├── phase-04-shared-libraries.md
    │   └── phase-05-documentation.md
    │
    ├── reports/                 # ✅ Keep recent (7 days)
    │   ├── README.md
    │   ├── test-summary-260118-1348-restructuring-verification.md
    │   ├── frontend-review-260118-1348-structure-and-refactoring.md
    │   ├── refactoring-260118-1354-phase1-type-consolidation-complete.md
    │   └── verification-260118-1407-refactoring-complete-validation.md
    │
    └── archive/                 # 🗄️  Optional: Old plans/reports
        └── 260116-1409-authentication-flow/
```

**Final Count:** ~20 core files + recent plans/reports

---

## Benefits

### Before Cleanup
- 126 markdown files
- 1.8MB documentation
- Hard to find information
- Duplicate/outdated content
- Overwhelming for new developers

### After Cleanup
- ~25 essential files
- ~500KB documentation
- Easy to navigate
- Single source of truth
- Clear structure

### Key Improvements
- ✅ **70% reduction** in file count
- ✅ **72% reduction** in size
- ✅ Eliminated duplicates
- ✅ Consolidated related info
- ✅ Easier maintenance
- ✅ Better onboarding

---

## Implementation Plan

### Phase 1: Backup (Safety First)
```bash
# Create backup of current docs
tar -czf docs-backup-$(date +%Y%m%d).tar.gz docs/ plans/ *.md
```

### Phase 2: Consolidate (Create New Files)
1. Create `docs/development-guide.md` from AGENTS.md
2. Update `docs/system-architecture.md` with architecture subdirs
3. Update `docs/prd.md` with prd subdirs

### Phase 3: Remove (Delete Old Files)
1. Remove root: AGENTS.md, PROJECT_STRUCTURE.md
2. Remove docs subdirectories (after consolidation)
3. Archive old plans to plans/archive/
4. Remove old reports (keep only last 7 days)

### Phase 4: Verify
1. Check all links still work
2. Update docs/README.md index
3. Test navigation

---

## Risks & Mitigation

### Risks
1. **Lost information** - Some details might be removed
2. **Broken links** - Internal links may break
3. **Team confusion** - People may look for old files

### Mitigation
1. ✅ Create backup before changes
2. ✅ Review consolidation carefully
3. ✅ Update all internal links
4. ✅ Add redirects in docs/README.md
5. ✅ Communicate changes to team
6. ✅ Keep archive/ for reference

---

## Recommended Action

**Option 1: Full Cleanup (Recommended)**
- Execute all phases
- ~70% reduction
- Clean, maintainable docs

**Option 2: Conservative Cleanup**
- Only remove obvious duplicates
- Keep more files
- ~40% reduction

**Option 3: Archive Only**
- Move old files to archive/
- Keep everything accessible
- ~20% reduction in main docs

---

## Next Steps

**If approved:**
1. Create backup
2. Execute consolidation
3. Remove old files
4. Update links
5. Verify completeness

**Estimated time:** 1-2 hours

---

## Questions

1. **Archive or delete?** Should old plans/reports be archived or permanently deleted?
2. **PRD detail level?** How much PRD detail should remain in consolidated version?
3. **Mockups?** Keep mockups directory or move to separate repo?
4. **Old auth plan?** The 260116 auth plan is completed - archive or delete?

---

**Proposal Status:** ⏳ AWAITING APPROVAL
**Recommendation:** Option 1 (Full Cleanup)
**Risk Level:** LOW (with backup)
