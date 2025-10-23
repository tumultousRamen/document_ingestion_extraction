# Development

## Temporal (local)

You can run Temporal locally via Docker Compose or using the Temporal CLI.

Docker Compose (requires Docker):

```
pnpm temporal:up
pnpm temporal:web
```

CLI (no Docker):

1. Install CLI on macOS: `brew install temporal`
2. Start local server: `pnpm temporal:cli:start`

Worker and example run:

```
pnpm temporal:approve # first time only (allow native deps build)
pnpm temporal:worker  # in one terminal
pnpm temporal:run-example # in another terminal
```

Temporal UI is available at http://localhost:8233.
