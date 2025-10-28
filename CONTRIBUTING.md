# Contributing to OFI Route Planner

Thank you for your interest in contributing to OFI Route Planner! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and professional in all interactions.

## Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/zumu-g/ofi_route_planner.git
   cd ofi_route_planner
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Process

### Branch Naming Convention

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `style/` - Code style changes (formatting, missing semicolons, etc)
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add address autocomplete functionality
fix: resolve geocoding error on invalid addresses
docs: update README with new features
style: format components with prettier
refactor: extract address validation logic
test: add unit tests for route optimization
chore: update dependencies
```

## Submitting Changes

### Pull Request Process

1. **Update your branch**
   ```bash
   git pull origin main
   git merge main
   ```

2. **Run checks**
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

3. **Push changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Include screenshots for UI changes
   - List testing steps

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No console.logs left
```

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Define interfaces for all data structures
- Avoid `any` type
- Use meaningful variable names

```typescript
// Good
interface Location {
  id: string;
  address: string;
  coordinates?: Coordinates;
}

// Bad
const location: any = { id: '1', addr: '...' };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

```typescript
// Good
interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ 
  location, 
  onEdit, 
  onDelete 
}) => {
  // Component logic
};
```

### Styling

- Use CSS variables for theming
- Maintain consistent spacing
- Follow mobile-first approach
- Keep animations smooth (60fps)

```css
/* Good */
.card {
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
```

### File Organization

```
src/
├── components/
│   ├── LocationCard.tsx      # Component
│   ├── LocationCard.test.tsx # Tests
│   └── LocationCard.css      # Styles (if needed)
├── utils/
│   ├── route.ts             # Utility functions
│   └── route.test.ts        # Utility tests
└── types/
    └── index.ts             # Type definitions
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

### Writing Tests

- Test user interactions, not implementation
- Cover edge cases
- Mock external dependencies
- Keep tests focused and readable

```typescript
describe('LocationForm', () => {
  it('should prepopulate suburb from previous entry', () => {
    // Test implementation
  });

  it('should handle geocoding errors gracefully', () => {
    // Test implementation
  });
});
```

## Documentation

### Code Comments

- Comment complex logic
- Document function parameters
- Explain non-obvious decisions

```typescript
/**
 * Optimizes route using nearest neighbor algorithm
 * @param locations - Array of locations to optimize
 * @param startTime - Starting time for the route
 * @returns Optimized array of locations
 */
export function optimizeRoute(
  locations: Location[], 
  startTime: string
): Location[] {
  // Implementation
}
```

### README Updates

Update README.md when adding:
- New features
- Environment variables
- Dependencies
- Breaking changes

### API Documentation

Document all utilities and components in:
- `docs/API.md` - Public APIs
- `docs/PROJECT_STRUCTURE.md` - Architecture updates

## Getting Help

- Check existing [issues](https://github.com/zumu-g/ofi_route_planner/issues)
- Read the [documentation](./docs)
- Ask in discussions
- Contact maintainers

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to OFI Route Planner!