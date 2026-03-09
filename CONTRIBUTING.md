# Contributing to Shared Pomodoro

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

Be respectful, constructive, and collaborative.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment** (browser, OS, Node version)

### Suggesting Features

Feature requests are welcome! Please provide:

- **Clear description** of the feature
- **Use case** - why would this be useful?
- **Examples** of how it would work
- **Alternatives** you've considered

### Pull Requests

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Shared-Pomodoro.git
   cd Shared-Pomodoro
   ```

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test Locally**
   ```bash
   npm run dev
   # Test your changes thoroughly
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
   
   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Formatting, missing semicolons, etc
   - `refactor:` - Code restructuring
   - `perf:` - Performance improvements
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

6. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

## Development Setup

See [README.md](README.md#getting-started) for detailed setup instructions.

## Project Architecture

### Key Technologies
- **Next.js 16** - App Router, Server Components
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **NextAuth v5** - Authentication
- **Tailwind CSS** - Styling

### Code Organization

```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # React components
├── lib/              # Utility functions & shared logic
└── generated/        # Generated Prisma types
```

### Important Patterns

**1. API Routes**
- Use NextAuth for protected routes
- Return proper HTTP status codes
- Include error handling

**2. Client Components**
- Mark with `"use client"` when using hooks
- Keep state management simple
- Use TypeScript types from Prisma

**3. Database**
- Use Prisma for all DB operations
- Create migrations for schema changes
- Keep queries efficient

**4. Styling**
- Use Tailwind CSS classes
- Follow Shadcn UI patterns
- Keep responsive design in mind

## Testing Changes

Before submitting:

1. ✅ Code compiles without errors (`npm run build`)
2. ✅ All pages load correctly
3. ✅ Timer functionality works
4. ✅ Multi-user sync works (test with multiple browser windows)
5. ✅ No console errors
6. ✅ Responsive on mobile

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## Recognition

Contributors will be recognized in the README. Thank you! 🙏
