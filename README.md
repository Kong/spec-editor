# Kong Spec Editor

A playground with live editor for Kong's spec renderer.
Supports:
- JSON and YAML file formats
- OpenAPI 2.0, 3.0 and 3.1 (including callbacks)
- AsyncAPI

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check

```sh
pnpm type-check
```

### Lint and fix

Lint package files, and optionally auto-fix detected issues.

```sh
# Stylelint only
pnpm run stylelint

# Stylelint and fix
pnpm run stylelint:fix

# ESLint only
pnpm run lint

# ESLint and fix
pnpm run lint:fix
```

### Build for production
****
```sh
pnpm run build
```

### Committing Changes

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

This repo uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

[Commitizen](https://github.com/commitizen/cz-cli) and [Commitlint](https://github.com/conventional-changelog/commitlint) are used to help build and enforce commit messages.

It is **highly recommended** to use the following command in order to create your commits:

```sh
pnpm run commit
```

This will trigger the Commitizen interactive prompt for building your commit message.

#### Enforcing Commit Format

[Lefthook](https://github.com/evilmartians/lefthook) is used to manage Git Hooks within the repo.

- A `commit-msg` hook is automatically setup that enforces commit message stands with `commitlint`, see [`lefthook.ymal`](./lefthook.yaml)
- A `pre-push` hook is used that runs `eslint` before allowing you to push your changes to the repository

Additionally, CI will use `commitlint` to validate the commits associated with a PR in the `Lint and Validate` job.

