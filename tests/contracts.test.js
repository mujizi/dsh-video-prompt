import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { api, ROOT } from '../lib/api.js'
import { TOOLS } from '../lib/tools.js'
import { handler } from '../lib/index.js'

const data = readFileSync(join(ROOT, 'data/entries.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
const familyCount = model => data.filter(e => e.model_family === model).length
const build = JSON.parse(readFileSync(join(ROOT, 'catalog/build.json')))
const isPublic = build.distribution === 'licensed-public'

test('input snapshots, row provenance and original prompts are intact', () => {
  const build = JSON.parse(readFileSync(join(ROOT, 'catalog/build.json')))
  if (!isPublic) assert.equal(data.filter(e => ['seedance_prompts.csv', 'wan3_prompts.csv'].includes(e.source_file)).length, 1355)
  else {
    assert.equal(data.length, 80)
    assert.ok(data.every(e => e.source === 'flaqai/awesome_wan-3-0-prompts' && e.license === 'MIT' && e.author === 'Flaq AI' && e.source_url.startsWith('https://github.com/flaqai/')))
  }
  assert.equal(data.length, Object.values(build.input_counts).reduce((a, b) => a + b, 0))
  assert.deepEqual(build.exclusions, [])
  assert.equal(new Set(data.map(e => e.id)).size, data.length)
  for (const [file, sha] of Object.entries(build.inputs)) assert.equal(createHash('sha256').update(readFileSync(join(ROOT, 'inputs', file))).digest('hex'), sha)
  if (!isPublic) {
    assert.equal(build.inputs['seedance_prompts.csv'], 'd9276d867f244a846616bcf0785a027e983be0d74fc57015274b5269003c8af2')
    assert.equal(build.inputs['wan3_prompts.csv'], 'e6fe2deca49b2ee29024d5e9138cc7733fcc538b6cbedd5eee0df839ed1878d9')
  }
  const report = execFileSync('python3', ['-c', `import csv,json,pathlib
p=pathlib.Path('.')
names=[r['file'] for r in json.loads((p/'inputs/sources.json').read_text())]
assert set(names)=={f.name for f in (p/'inputs').glob('*.csv')}
sources={n:list(csv.DictReader((p/'inputs'/n).open(encoding='utf-8-sig',newline=''))) for n in names}
rows=[json.loads(l) for l in (p/'data/entries.jsonl').open() if l.strip()]
assert {r['id'] for r in rows} == {s['id'] for records in sources.values() for s in records}
for r in rows:
 s=sources[r['source_file']][r['source_row']-2]
 assert r['prompt']==s['prompt'],r['id']
 assert r['id']==s['id'],r['id']
print(len(rows))`], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(Number(report.trim()), data.length)
})

test('topic tree has 4–9 branches at category levels and each entry appears once', () => {
  const root = api.index()
  assert.ok(root.children.length >= 4 && root.children.length <= 9)
  const seen = []
  for (const topic of root.children) {
    const second = api.index({ path: topic.path })
    assert.ok(second.children.length >= 4 && second.children.length <= 9)
    for (const leaf of second.children) {
      const index = api.index({ path: leaf.path })
      assert.equal(index.leaf, true)
      assert.equal(index.count, leaf.count)
      assert.match(index.next, /video_prompt_list/)
      for (let offset = 0; offset < leaf.count; offset += 60) seen.push(...api.list({ path: leaf.path, offset, limit: 60 }).entries.map(e => e.id))
    }
  }
  assert.equal(seen.length, data.length)
  assert.equal(new Set(seen).size, data.length)
})

test('unknown paths and IDs fail rather than silently widening retrieval', () => {
  for (const path of ['不存在', '人物与角色/不存在', '人物与角色/儿童萌娃/额外层', '人物与角色/']) {
    assert.throws(() => api.index({ path }))
    assert.throws(() => api.list({ path }))
  }
  assert.throws(() => api.get({ id: 'not-real' }), /条目不存在/)
  assert.throws(() => api.get({}), /不能为空/)
})

test('pagination is stable, bounded and lossless', () => {
  const seen = []
  for (let offset = 0; offset < data.length; offset += 60) {
    const page = api.list({ offset, limit: 60 })
    assert.ok(page.entries.length <= 60)
    seen.push(...page.entries.map(e => e.id))
  }
  assert.equal(new Set(seen).size, data.length)
  for (const limit of [-1, 0, 61, 1.5, 'NaN']) assert.throws(() => api.list({ limit }), /limit/)
})

test('model and visual filters are cross-cutting and do not alter the tree', () => {
  const before = api.index()
  for (const model of api.stats().models) {
    const page = api.list({ model, limit: 60 })
    assert.ok(page.entries.every(e => e.model === model))
    assert.equal(page.count, api.stats().modelCounts[model])
  }
  assert.equal(api.list({ model: 'Seedance' }).count, familyCount('Seedance'))
  assert.equal(api.list({ model: 'Wan3' }).count, familyCount('Wan3'))
  assert.equal(api.stats().mediaCounts.image || 0, data.filter(e => e.media_type === 'image').length)
  assert.equal(api.stats().mediaCounts.video, data.filter(e => e.media_type === 'video').length)
  for (const model of ['Seedance', 'Wan3']) assert.ok(api.list({ model, limit: 60 }).entries.every(e => e.model_family === model))
  const facet = api.stats().visual.find(f => f.count > 0)
  assert.ok(api.list({ facet: facet.name, limit: 60 }).entries.every(e => e.tags.includes(facet.name)))
  assert.throws(() => api.list({ model: 'unknown' }))
  assert.throws(() => api.list({ facet: '视角:unknown' }))
  assert.deepEqual(api.index(), before)
})

test('every CSV prompt has Chinese display and copy data while preserving the original', () => {
  const translated = data.filter(e => e.translation_status === 'codex-translated')
  if (!isPublic) assert.ok(translated.length >= 1265)
  for (const e of data) {
    assert.equal(createHash('sha256').update(e.prompt).digest('hex'), e.prompt_sha256)
    const detail = api.get({ id: e.id })
    assert.equal(detail.prompt_display, e.prompt_zh)
    assert.notEqual(e.translation_status, 'pending', e.id)
    assert.match(e.prompt_zh, /[\u3400-\u9fff]/, e.id)
    assert.match(e.title, /[\u3400-\u9fff]/, e.id)
    if (e.translation_status === 'source-chinese') assert.equal(e.prompt_zh, e.prompt)
  }
  assert.equal(api.stats().translated, data.length)
  const example = isPublic ? data[0] : data.find(e => e.id === 'underwater-animal-orchestra')
  const found = api.list({ query: isPublic ? example.title : '水下 3,000 英尺' })
  assert.ok(found.entries.some(e => e.id === example.id))
})

test('graph relationships are explainable and timeline covers undated entries', () => {
  const graph = api.graph(), nodes = new Map(graph.nodes.map(n => [n.id, n]))
  assert.equal(graph.nodes.reduce((n, v) => n + v.count, 0), data.length)
  assert.ok(graph.edges.length <= 60)
  for (const e of graph.edges) {
    assert.equal(e.weight, e.shared.length)
    assert.ok(e.shared.every(t => nodes.get(e.from).tags.includes(t) && nodes.get(e.to).tags.includes(t)))
  }
  assert.equal(api.timeline().days.reduce((n, v) => n + v.count, 0), data.length)
  for (const model of ['Seedance', 'Wan3']) {
    const count = familyCount(model)
    assert.equal(api.graph({ model }).nodes.reduce((n, v) => n + v.count, 0), count)
    assert.equal(api.timeline({ model }).days.reduce((n, v) => n + v.count, 0), count)
  }
})

test('three namespaced tools support progressive retrieval and canonical results', async () => {
  assert.deepEqual(TOOLS.map(t => t.name), ['video_prompt_index', 'video_prompt_list', 'video_prompt_get'])
  const root = await TOOLS[0].execute({})
  const l1 = root.children.find(x => x.count)
  const l2 = (await TOOLS[0].execute({ path: l1.path })).children.find(x => x.count)
  const leaf = await TOOLS[0].execute({ path: l2.path })
  assert.match(TOOLS[0].output.render({}, leaf)[0].text, new RegExp(`${leaf.count} 条`))
  const list = await TOOLS[1].execute({ path: l2.path, limit: 3 })
  const entry = await TOOLS[2].execute({ id: list.entries[0].id })
  assert.equal(entry.prompt, data.find(e => e.id === entry.id).prompt)
  assert.match(TOOLS[2].output.render({}, entry)[0].text, /来源：/)
  await assert.rejects(TOOLS[1].execute({ path: l2.path, bogus: true }), /未知参数/)
  await assert.rejects(TOOLS[0].execute({}, { signal: AbortSignal.abort() }))
})

test('Host HTTP endpoints, error status, HEAD and read-only behavior', async t => {
  const server = http.createServer(handler)
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  t.after(() => new Promise(r => server.close(r)))
  const base = `http://127.0.0.1:${server.address().port}/video-prompt`
  for (const path of ['', '/api/stats', '/api/index', '/api/entries?limit=3', '/api/graph', '/api/graph?model=Seedance', '/api/graph?model=Wan3', '/api/timeline', '/api/timeline?model=Seedance', '/api/timeline?model=Wan3', '/api/entry?id=' + encodeURIComponent(data[0].id)]) {
    const r = await fetch(base + path)
    assert.equal(r.status, 200, path)
    assert.ok((await r.text()).length > 0)
  }
  for (const [path, status] of [['/api/entry?id=missing', 404], ['/api/index?path=bad', 404], ['/api/entries?limit=-5', 400], ['/missing.js', 404]]) {
    const r = await fetch(base + path); assert.equal(r.status, status, path); assert.ok((await r.json()).error)
  }
  assert.equal((await fetch(base + '/api/index', { method: 'POST' })).status, 405)
  const head = await fetch(base + '/api/stats', { method: 'HEAD' })
  assert.equal(head.status, 200); assert.equal(await head.text(), '')
})

test('client bundle registers unique native panel and sidebar entries', async () => {
  let module
  globalThis.window = { __ModuleLoader__: { load: value => { module = value } } }
  await import('../client/index.js')
  delete globalThis.window
  assert.equal(module.id, 'dsh-video-prompt')
  const plugin = module.factory(() => ({ createElement: () => null }))
  const rows = []
  plugin.apply({ slots: { inject: (_name, fn) => fn(), register: (row, component) => { rows.push(row); assert.equal(typeof component, 'function') } } })
  assert.deepEqual(rows.map(r => [r.name, r.key || r.id]), [['main', 'dsh-video-prompt.panel'], ['sidebar.panellist', 'dsh-video-prompt.panel']])
})
