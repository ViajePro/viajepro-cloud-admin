module.exports = {
  entryPoints: ['src/admin/app.ts'],
  bundle: true,
  minify: false,
  sourcemap: true,
  platform: 'node',
  target: 'node22',
  outdir: 'dist',
  external: ['aws-sdk'],
  logLevel: 'info',
};