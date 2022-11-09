const { build } = require('esbuild')
const { dependencies } = require('./package.json')

build({
  entryPoints: ['src/jwt.ts'],
  outdir: 'dist',
  bundle: true,
  external: Object.keys(dependencies),
})
