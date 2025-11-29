# Contributing to Deployments Registry

Thank you for considering contributing to the Deployments Registry project! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project follows the [Open Healthcare Network Code of Conduct](https://ohc.network/code-of-conduct). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Verify the bug exists in the latest version
3. Collect information about your environment

Include in your bug report:
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, Node.js version)

### Suggesting Features

Feature requests are welcome! Please:
1. Check existing feature requests
2. Provide clear use case and rationale
3. Describe the expected behavior
4. Consider implementation complexity

### Pull Requests

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/deployments_registry.git
   cd deployments_registry
   pnpm install
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Changes**
   - Follow the existing code style
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Test Locally**
   ```bash
   pnpm dev          # Test in development
   pnpm build        # Verify build succeeds
   pnpm lint         # Check for linting errors
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add feature X" # or "fix: resolve issue Y"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues
   - Describe changes and motivation
   - Add screenshots for UI changes

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- Git

### Environment Setup

1. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Start development server:
   ```bash
   pnpm dev
   ```

## Project Structure

```
deployments_registry/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── map/               # Map components
│   ├── filters/           # Filter components
│   ├── ui/                # shadcn UI components
│   └── theme-provider.tsx # Theme context
├── lib/
│   ├── config.ts          # App configuration
│   ├── data.ts            # Data utilities
│   ├── map-utils.ts       # Map helpers
│   └── utils.ts           # General utilities
├── types/
│   └── deployment.ts      # TypeScript types
├── public/
│   └── deployments.json   # Deployment data
├── .env.example           # Environment template
└── next.config.ts         # Next.js config
```

## Coding Standards

### TypeScript
- Use strict mode
- Define explicit types for function parameters and return values
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes

### React
- Use functional components with hooks
- Mark client components with `"use client"`
- Keep components focused and single-purpose
- Use descriptive prop names

### Styling
- Use Tailwind CSS utility classes
- Follow shadcn/ui patterns for components
- Ensure responsive design (mobile-first)
- Test both light and dark themes

### File Naming
- Components: PascalCase (`DeploymentMap.tsx`)
- Utilities: kebab-case (`map-utils.ts`)
- Types: kebab-case (`deployment.ts`)

## Adding New Features

### Adding a New Program Type

1. Update `types/deployment.ts`:
   ```typescript
   export type ProgramType = "10bedicu" | "kerala-care" | "palliative-ngo" | "hmis" | "new-program";
   ```

2. Update `lib/map-utils.ts`:
   ```typescript
   export const PROGRAM_COLORS: Record<ProgramType, string> = {
     // ... existing programs
     "new-program": "#your-color",
   };

   export const PROGRAM_LABELS: Record<ProgramType, string> = {
     // ... existing programs
     "new-program": "Display Name",
   };
   ```

3. Add deployments to `public/deployments.json` with the new program type

### Adding a New Filter

1. Add state in `app/page.tsx`
2. Create filter component in `components/filters/`
3. Pass filter state to `DeploymentMap`
4. Update filtering logic in map component

### Modifying Data Structure

1. Update types in `types/deployment.ts`
2. Update `public/deployments.json` format
3. Update components consuming the data
4. Update README with new structure
5. Consider backward compatibility

## Testing

Currently, the project doesn't have automated tests. Contributions to add testing infrastructure are welcome!

Manual testing checklist:
- [ ] Map loads correctly
- [ ] Markers appear at correct locations
- [ ] Clustering works as expected
- [ ] Filters modify visible deployments
- [ ] Search finds deployments
- [ ] Popups show correct information
- [ ] Dark mode toggles properly
- [ ] Responsive on mobile devices
- [ ] Static export builds successfully

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(map): add custom marker icons
fix(filters): resolve search case sensitivity
docs: update deployment guide
refactor(map): extract clustering logic
```

## Documentation

When adding features, update relevant documentation:
- Code comments for complex logic
- JSDoc for public functions
- README for user-facing changes
- DEPLOYMENT.md for deployment-related changes
- This CONTRIBUTING.md for development changes

## Questions?

- Open a GitHub Discussion
- Email: contribute@ohc.network
- Join our community chat (link in README)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to open healthcare technology! 🏥
