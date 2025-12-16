# Setup Instructions

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

Verify: `node --version && npm --version`

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

Compiles TypeScript from `src/` to `dist/`.

## Test

```bash
npm test                # Run tests once
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## Key Files to Know

- **package.json** - Project configuration and dependencies
- **src/** - TypeScript source code
- **dist/** - Compiled JavaScript output
- **tsconfig.json** - TypeScript settings
- **jest.config.js** - Test configuration
- **README.md** - Full documentation

## Quick Start

```bash
npm install && npm run build && npm test
```

For details, see [README.md](README.md).
