# Contributing to micro-requester

First of all, thank you for considering contributing to `micro-requester`! It's people like you that make this package such a great tool.

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to make this better together.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue list](https://github.com/iiMuhammadRashed/micro-requester/issues) as you might find out that you don't need to create one.

**When creating a bug report, include:**

- **Clear title and description**
- **Exact steps to reproduce** (with code sample if possible)
- **Expected behavior** vs. **actual behavior**
- **Node.js version** (`node --version`)
- **Package version** (`npm ls micro-requester`)
- **Environment** (OS, runtime)

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Create client with..
2. Call method...
3. Error occurs...

**Expected behavior**
What should happen instead?

**Environment**
- Node.js: 18.12.0
- micro-requester: 0.1.0
- OS: macOS
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues with the `enhancement` label.

**When suggesting an enhancement, include:**

- **Use case** — why is this useful?
- **Example API** — how would this look in code?
- **Alternatives** — what workarounds exist?

```markdown
**Description**
What enhancement would be useful?

**Use Case**
Why would this be helpful?

**Example**
```typescript
// Pseudocode showing desired API
```

### Pull Requests

**Process:**

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit with clear messages: `git commit -m 'feat: add amazing feature'`
5. Push to your fork
6. Open a Pull Request

**Guidelines:**

- Follow the existing code style (TypeScript strict mode)
- Write clear commit messages using [Conventional Commits](https://www.conventionalcommits.org/)
- Update documentation if needed
- Run `npm run typecheck` and `npm run build` before pushing
- Reference any related issues

**Commit Message Format:**

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**
```
feat(retry): add exponential backoff jitter
fix(client): handle undefined response body
docs: improve NestJS integration guide
chore: update dependencies
```

## Development Setup

### Installation

```bash
# Clone your fork
git clone https://github.com/your-username/micro-requester.git
cd micro-requester

# Install dependencies
npm install

# Create a branch for your changes
git checkout -b feature/your-feature
```

### Running Commands

```bash
# TypeScript type checking
npm run typecheck

# Build all formats (ESM, CJS, types)
npm run build

# Build individual formats
npm run build:esm    # ES modules
npm run build:cjs    # CommonJS
npm run build:types  # TypeScript definitions

# Clean build output
npm run clean
```

### Project Structure

```
src/
├── http/               # HTTP client & retry logic
│   ├── create-client.ts
│   ├── http-forwarder.types.ts
│   ├── retry-policy.ts
│   ├── error-mapper.ts
│   ├── correlation.ts
│   └── hooks.ts
├── utils/              # Helper utilities
│   ├── backoff.ts
│   ├── sleep.ts
│   ├── url.ts
│   └── sanitize.ts
└── index.ts            # Public API

dist/
├── esm/                # ES modules
├── cjs/                # CommonJS
└── types/              # TypeScript definitions

.github/workflows/      # CI/CD pipelines
```

### Code Style

- **TypeScript strict mode** — no `any` types
- **Functional approach** — prefer pure functions
- **Error handling** — explicit, not silent
- **Comments** — explain "why", not "what"
- **Naming** — clear, descriptive names

### Before Submitting

```bash
# 1. Type check
npm run typecheck

# 2. Build
npm run build

# 3. Test your changes work
# (add test cases if applicable)

# 4. Verify package.json hasn't changed unexpectedly
git diff package.json

# 5. Push
git push origin feature/your-feature
```

## Review Process

Once you submit a PR:

1. Automated checks run (TypeScript, build, security audit)
2. Maintainers review the code
3. Address any feedback
4. Once approved, it gets merged!

## Release Process

Versions follow [Semantic Versioning](https://semver.org/).

- **MAJOR** (0.x.0): Breaking changes
- **MINOR** (x.1.0): New features
- **PATCH** (x.x.1): Bug fixes

**Releasing:**

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Update CHANGELOG.md with changes
# See CHANGELOG.md for format

# 3. Commit and push
git push origin main
git push origin --tags

# 4. GitHub Actions automatically publishes to npm
```

## Questions?

- **Documentation**: Check [README.md](../README.md)
- **Issues**: Search [existing issues](https://github.com/iiMuhammadRashed/micro-requester/issues)
- **Discussions**: [GitHub Discussions](https://github.com/iiMuhammadRashed/micro-requester/discussions)

---

**Thank you for making micro-requester better!** ❤️
