import { build } from 'esbuild'
import { writeFile, stat, mkdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const result = await build({ entryPoints: ['client/src/index.js'], outfile: 'client/index.js', bundle: true,
  format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'eof', metafile: true, loader: { '.ico': 'dataurl' } })
await mkdir('docs/qa', { recursive: true })
await writeFile('docs/qa/client-build.json', JSON.stringify({
  bytes: (await stat('client/index.js')).size, gzipBytes: gzipSync(readFileSync('client/index.js')).length,
  inputs: Object.keys(result.metafile.inputs), builtAt: new Date().toISOString(),
}, null, 2) + '\n')
console.log('Client bundle built:', (await stat('client/index.js')).size, 'bytes')
