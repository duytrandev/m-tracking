# Git Hooks Guide

This document explains the Git hooks configuration and best practices for the M-Tracking project.

## Pre-commit Hook

The pre-commit hook runs automatically before each commit to ensure code quality and prevent broken code from being committed.

### Current Configuration

Location: `.husky/pre-commit`

The hook performs the following checks in order:

1. **Lint-staged** - Formats and lints only staged files
2. **Type Check** - Verifies TypeScript types in affected projects
3. **Tests** (optional) - Runs tests on affected projects

### Why These Checks?

#### 1. Lint-staged (Fast, ~2-5s)

- **What**: Runs ESLint and Prettier only on staged files
- **Why**: Ensures consistent code style and catches common errors
- **Performance**: Very fast since it only checks modified files
- **Configuration**: See `lint-staged` in `package.json`

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

#### 2. Type Check (Fast, ~3-10s)

- **What**: Runs `tsc --noEmit` on affected projects only
- **Why**: Catches TypeScript errors before commit
- **Performance**: Uses Nx affected detection to only check changed code
- **Benefits**: Prevents type errors from breaking CI/CD pipeline

#### 3. Tests (Optional, ~10-60s)

- **What**: Runs tests on affected projects
- **Why**: Ensures changes don't break existing functionality
- **Performance**: Only tests affected by your changes
- **Note**: Currently commented out by default (can be slow for large changes)

### Performance Optimization

The hook uses several strategies to stay fast:

1. **Parallel Execution**: Runs tasks across multiple projects simultaneously (`--parallel=3`)
2. **Affected Detection**: Only checks/tests projects affected by your changes
3. **Staged Files Only**: lint-staged only processes files you're committing
4. **Fail Fast**: Stops immediately on first error

### Expected Performance

| Check                      | Typical Time | Large Change Time |
| -------------------------- | ------------ | ----------------- |
| Lint-staged                | 2-5s         | 5-10s             |
| Type Check (affected)      | 3-8s         | 8-15s             |
| Tests (affected, optional) | 5-30s        | 30-120s           |
| **Total (without tests)**  | **5-15s**    | **15-30s**        |

### Configuration Options

#### Option 1: Fast (Current Default)

Best for rapid development. Includes linting and type checking.

```sh
# Lint-staged ✓
# Type check ✓
# Tests ✗
```

**Use when**: Making frequent small commits, rapid iteration

#### Option 2: Comprehensive (Recommended for Critical Code)

Includes all checks including tests.

To enable, uncomment the test section in `.husky/pre-commit`:

```sh
# Run tests on affected projects
echo "\n🧪 Testing affected projects..."
pnpm nx affected -t test --parallel=3 || {
  echo "❌ Tests failed. Please fix failing tests."
  exit 1
}
```

**Use when**: Working on critical features, before pushing to main/develop

#### Option 3: Ultra-Fast (For Large Refactors)

Only lint-staged, no type checking or tests.

Edit `.husky/pre-commit` to comment out type checking:

```sh
# Type check affected projects
# echo "\n🔎 Type checking affected projects..."
# pnpm nx affected -t type-check --parallel=3 || {
#   echo "❌ Type check failed. Please fix TypeScript errors."
#   exit 1
# }
```

**Use when**: Making large refactors, want to commit WIP without full validation

## Bypassing Hooks (Use Sparingly)

In rare cases, you may need to bypass pre-commit hooks:

```bash
git commit --no-verify -m "WIP: work in progress"
```

⚠️ **Warning**: Only use `--no-verify` for:

- WIP commits on feature branches
- Emergency hotfixes (but run checks manually after)
- Known false positives in linting

**Never** use `--no-verify` for:

- Commits to main/develop/master
- Pull request final commits
- Production deployments

## Troubleshooting

### Hook Not Running

If the hook doesn't run automatically:

```bash
# Reinstall Husky hooks
pnpm prepare

# Check hook is executable
chmod +x .husky/pre-commit

# Verify Git hooks path
git config core.hooksPath
```

### "Type check failed" Error

If type check fails on unrelated files:

```bash
# Check what's affected
pnpm nx affected:graph

# Run type check manually to see errors
pnpm type-check

# Clear Nx cache if stale
pnpm nx reset
```

### Hook Too Slow

If hooks are taking too long:

1. **Check affected projects**: `pnpm nx affected:graph`
2. **Disable tests temporarily**: Comment out test section
3. **Reduce parallelism**: Change `--parallel=3` to `--parallel=1`
4. **Clear cache**: `pnpm nx reset`

### Lint-staged Errors

If lint-staged fails with unexpected errors:

```bash
# Run lint-staged manually
pnpm lint-staged

# Or run on specific file
pnpm eslint --fix path/to/file.ts
pnpm prettier --write path/to/file.ts

# Check lint-staged config
cat package.json | grep -A 10 "lint-staged"
```

## CI/CD Integration

The same checks run in CI/CD pipeline but on **all** code (not just affected):

```bash
# CI runs these commands
pnpm lint           # Lint all projects
pnpm type-check     # Type check all projects
pnpm test           # Test all projects
```

This ensures:

- Pre-commit catches most issues locally (fast feedback)
- CI catches edge cases and integration issues (comprehensive)

## Best Practices

### DO ✅

- **Commit frequently** with small, focused changes
- **Fix lint/type errors immediately** when hook fails
- **Run manual checks** before large commits: `pnpm lint && pnpm type-check && pnpm test`
- **Keep commits atomic** - one logical change per commit
- **Use descriptive commit messages** that explain why, not what

### DON'T ❌

- **Don't use `--no-verify`** habitually
- **Don't commit commented-out code** or debugging statements
- **Don't commit secrets** (.env files, API keys)
- **Don't commit broken code** even on feature branches
- **Don't ignore linting errors** - fix them or configure eslint if false positive

## Additional Hooks

### Pre-push Hook (Future)

Consider adding a pre-push hook for heavier checks:

```sh
# .husky/pre-push
pnpm nx affected -t test --parallel=3
pnpm nx affected -t build --parallel=3
```

This runs before pushing to remote, catching issues before CI.

### Commit Message Hook (Future)

Enforce conventional commit format:

```sh
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

Requires `@commitlint/cli` and `@commitlint/config-conventional`.

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Nx Affected Commands](https://nx.dev/concepts/affected)
- [Conventional Commits](https://www.conventionalcommits.org/)
