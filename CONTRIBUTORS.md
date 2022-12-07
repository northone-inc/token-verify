# Contributor

## Node
- Active development is done on node 16 (see [.nvmrc](./.nvmrc))

## Vitest - Testing

```sh
npm run test -- run # run vitest once
npm run test # run vitest watch (default)
```

## ESbuild - building

```sh
npm run build # outputs to ./dist/jwt.js and ./dist/jwt.d.ts
VITEST_USE_DIST=true npm run build # run tests against build asset ./dist/jwt.js (used for cross-node version testing)
```

## Publishing

`brew bundle` to install [github cli](https://cli.github.com/) package (uses [`Brewfile`](Brewfile))