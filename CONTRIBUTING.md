# Contributing to EduSagar

Thank you for your interest in contributing to EduSagar! We welcome contributions from the community. This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand our community values.

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Git
- Supabase account (for testing)

### Setup Development Environment

1. Fork the repository
```bash
git clone https://github.com/yourusername/edusagar.git
cd edusagar
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.local.example .env.local
# Add your credentials
```

4. Start development server
```bash
npm run dev
```

## Development Workflow

### Creating a Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/issue-description
```

### Branch Naming Convention

- **Features**: `feature/short-description` (e.g., `feature/add-quiz-system`)
- **Bug Fixes**: `fix/issue-description` (e.g., `fix/leaderboard-sorting`)
- **Documentation**: `docs/description` (e.g., `docs/update-readme`)
- **Chores**: `chore/description` (e.g., `chore/update-dependencies`)

### Making Changes

1. **Keep commits atomic** - One logical change per commit
2. **Write clear commit messages**:
   ```
   feat: Add new quiz feature
   
   Implement interactive quiz system with instant feedback
   and answer explanations.
   
   Closes #123
   ```

3. **Follow code style** - Use existing patterns in the codebase
4. **Add tests** - Include tests for new features
5. **Update documentation** - Keep docs in sync with code changes

## Code Style Guidelines

### TypeScript/React
- Use TypeScript for type safety
- Follow existing component patterns
- Use functional components with hooks
- Add JSDoc comments for public functions

```typescript
/**
 * Calculates earned points with streak multiplier
 * @param basePoints - Base points for activity
 * @param streakDays - Current learning streak
 * @returns Calculated points with multiplier applied
 */
export function calculateEarnedPoints(basePoints: number, streakDays: number): number {
  const multiplier = getStreakMultiplier(streakDays);
  return Math.floor(basePoints * multiplier);
}
```

### Naming Conventions
- **Components**: PascalCase (e.g., `AuthPage.tsx`)
- **Functions**: camelCase (e.g., `handleLogin()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Files**: kebab-case for services (e.g., `auth-service.ts`)

### File Organization
```
src/
├── components/          # React components
├── services/           # Business logic
├── types/              # TypeScript interfaces
└── utils/              # Helper functions
```

## Commit Message Guidelines

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (no logic changes)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Test additions/changes
- **chore**: Dependency updates, tooling

### Example
```
feat(rewards): Add weekly bonus calculation

Implement automatic weekly bonus system that awards
+50 points when users earn 100+ weekly points.

- Add calculateWeeklyReward() function
- Add weekly points tracking in UserProfile
- Add database migration for weekly_points column

Closes #45
```

## Testing

### Before Submitting PR

1. **Run TypeScript check**
```bash
npx tsc --noEmit
```

2. **Run build**
```bash
npm run build
```

3. **Manual testing**
   - Test on mobile (responsive design)
   - Test all affected features
   - Check for console errors

### Writing Tests

If adding new features, include tests:
```typescript
// Example test structure
describe('calculateEarnedPoints', () => {
  it('should return base points for 1-day streak', () => {
    const result = calculateEarnedPoints(10, 1);
    expect(result).toBe(10);
  });

  it('should apply 1.25x multiplier for 7-day streak', () => {
    const result = calculateEarnedPoints(10, 7);
    expect(result).toBe(12);
  });
});
```

## Pull Request Process

### Before Creating PR

- [ ] Code follows style guidelines
- [ ] TypeScript compilation passes
- [ ] Build succeeds (`npm run build`)
- [ ] Tested locally
- [ ] Commit messages are clear
- [ ] Documentation updated
- [ ] No console errors/warnings

### Creating PR

1. Push to your fork
```bash
git push origin feature/your-feature-name
```

2. Open PR on GitHub with:
   - **Title**: Clear, descriptive title
   - **Description**: What changed and why
   - **Links**: Reference related issues (#123)
   - **Testing**: How to test the changes

3. Example PR description:
```markdown
## Description
Fixes the leaderboard sorting issue where points weren't displayed correctly.

## Changes
- Fixed comparator in leaderboard view
- Updated progress bar calculation
- Added unit tests for sorting

## Testing
1. Go to leaderboard page
2. Verify users are sorted by points (highest first)
3. Check progress bars are accurate

Closes #234
```

### PR Review Process

- Maintainers will review within 2-3 days
- Address feedback promptly
- Re-request review when ready
- Once approved, maintainers will merge

## Documentation

### Update Documentation When:
- Adding new features
- Changing existing APIs
- Updating configuration
- Fixing bugs that affected docs

### Documentation Files
- **README.md** - Project overview
- **ARCHITECTURE.md** - System design
- **CONTRIBUTING.md** - This file
- **docs/** - Detailed guides

## Reporting Issues

### Bug Reports
Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (browser, OS, Node version)
- Screenshots if applicable

### Feature Requests
Include:
- Clear description of the feature
- Why it would be useful
- Possible implementation approach
- Examples or mockups if applicable

## Questions?

- **GitHub Issues** - For bugs and features
- **GitHub Discussions** - For questions
- **Email** - support@edusagar.dev

## Recognition

Contributors will be recognized in:
- README.md acknowledgments
- Release notes
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to EduSagar! 🎓
