import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

export const ROOT = fileURLToPath(new URL('../', import.meta.url))
export const BASE = '/video-prompt'
export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}

let cached, revision
function load() {
  const files = ['data/entries.jsonl', 'catalog/tree.json', 'catalog/facets.json', 'catalog/descriptions.json', 'catalog/build.json']
  const next = files.map(p => { const s = statSync(join(ROOT, p)); return `${s.mtimeMs}:${s.size}` }).join('|')
  if (cached && next === revision) return cached
  const entries = readFileSync(join(ROOT, files[0]), 'utf8').trim().split('\n').map(JSON.parse)
  const [catalog, facets, descriptions, build] = files.slice(1).map(p => JSON.parse(readFileSync(join(ROOT, p), 'utf8')))
  cached = { entries, byId: new Map(entries.map(r => [r.id, r])), tree: catalog.tree, facets, descriptions, build }
  revision = next
  return cached
}

function string(value, name, max = 200) {
  if (value === undefined) return ''
  if (typeof value !== 'string' || value.length > max) throw new InputError(`${name} 必须是长度不超过 ${max} 的字符串`)
  return value.trim()
}
function integer(value, name, fallback, min, max) {
  if (value === undefined || value === '') return fallback
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isInteger(n) || n < min || n > max) throw new InputError(`${name} 必须是 ${min}–${max} 的整数`)
  return n
}
function selection(path = '') {
  path = string(path, 'path')
  const { tree, entries } = load()
  if (!path) return { path, ids: entries.map(r => r.id), level: 0 }
  const parts = path.split('/')
  if (parts.length > 2 || parts.some(s => !s)) throw new InputError('目录路径必须为「一级题材」或「一级题材/细分题材」')
  const [l1, l2] = parts
  if (!Object.hasOwn(tree, l1) || (l2 && !Object.hasOwn(tree[l1], l2))) throw new InputError(`目录不存在：${path}`, 404)
  return { path, l1, l2, level: parts.length, ids: l2 ? tree[l1][l2] : Object.values(tree[l1]).flat() }
}
const slim = e => ({
  id: e.id, title: e.title, summary: e.summary, model: e.model, path: `${e.l1}/${e.l2}`,
  model_family: e.model_family, media_type: e.media_type, translation_status: e.translation_status,
  date: e.date, author: e.author, source_url: e.source_url, translated: Boolean(e.prompt_zh),
  tags: Object.entries(e.facets).flatMap(([dim, values]) => values.map(v => `${dim}:${v}`)),
})
function filterRows(args = {}) {
  const { byId, facets } = load()
  const chosen = selection(args.path)
  const model = string(args.model, 'model'), facet = string(args.facet, 'facet'), query = string(args.query, 'query')
  if (model && !['Seedance', 'Wan3'].includes(model) && !Object.hasOwn(facets.by_model, model) && !Object.hasOwn(facets.by_family, model)) throw new InputError(`模型不存在：${model}`, 404)
  let facetIds
  if (facet) {
    const split = facet.indexOf(':')
    const dim = facet.slice(0, split), value = facet.slice(split + 1)
    if (split < 1 || !Object.hasOwn(facets.visual, dim) || !Object.hasOwn(facets.visual[dim], value)) throw new InputError(`视觉标签不存在：${facet}`, 404)
    facetIds = new Set(facets.visual[dim][value])
  }
  return chosen.ids.map(id => byId.get(id)).filter(e => e && (!model || e.model === model || e.model_family === model) && (!facetIds || facetIds.has(e.id)) && (!query || [e.title, e.summary, e.prompt, e.prompt_zh, e.id].some(s => (s || '').toLowerCase().includes(query.toLowerCase()))))
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
}

export const api = {
  index({ path = '' } = {}) {
    const chosen = selection(path)
    const { tree, descriptions } = load()
    const children = chosen.level === 0
      ? Object.entries(tree).map(([name, leaves]) => ({ name, path: name, count: Object.values(leaves).flat().length, desc: descriptions[name].desc }))
      : chosen.level === 1
        ? Object.entries(tree[chosen.l1]).map(([name, ids]) => ({ name, path: `${chosen.l1}/${name}`, count: ids.length, desc: descriptions[chosen.l1].children[name] }))
        : []
    return { path: chosen.path, count: chosen.ids.length, leaf: chosen.level === 2, children,
      next: chosen.level === 2 ? `调用 video_prompt_list，path=${chosen.path}，limit=5；从摘要选择 3–5 条后调用 video_prompt_get。` : '只从 children 返回的 path 中选择一个，再调用 video_prompt_index。' }
  },
  list(args = {}) {
    const limit = integer(args.limit, 'limit', 20, 1, 60), offset = integer(args.offset, 'offset', 0, 0, 100000)
    const rows = filterRows(args)
    return { path: string(args.path, 'path'), count: rows.length, offset, limit, entries: rows.slice(offset, offset + limit).map(slim),
      nextOffset: offset + limit < rows.length ? offset + limit : null,
      next: '调用 video_prompt_get 读取选中条目的中文正文及原文。写新提示词时综合写法并注明参考 id 和来源，勿整段照抄。' }
  },
  get({ id } = {}) {
    id = string(id, 'id')
    if (!id) throw new InputError('id 不能为空；请从 video_prompt_list 返回的条目中选择')
    const e = load().byId.get(id)
    if (!e) throw new InputError(`条目不存在：${id}`, 404)
    return { ...e, tags: slim(e).tags, prompt_display: e.prompt_zh || e.prompt }
  },
  stats() {
    const { entries, tree, facets, build } = load()
    return { total: entries.length, topics: Object.keys(tree).length, clusters: Object.values(tree).reduce((n, v) => n + Object.values(v).filter(a => a.length).length, 0),
      models: Object.keys(facets.by_model), modelCounts: build.models, translated: entries.filter(e => e.prompt_zh).length,
      familyCounts: build.families, mediaCounts: build.media, translationCounts: build.translation, inputCounts: build.input_counts,
      visual: Object.entries(facets.visual).flatMap(([dim, vs]) => Object.entries(vs).map(([value, ids]) => ({ name: `${dim}:${value}`, count: ids.length }))),
      package: 'dsh-video-prompt', version: JSON.parse(readFileSync(join(ROOT, 'package.json'))).version, inputs: build.inputs }
  },
  graph(args = {}) {
    const rows = filterRows(args), groups = new Map()
    for (const e of rows) {
      const id = `${e.l1}/${e.l2}`
      if (!groups.has(id)) groups.set(id, { id, label: e.l2, l1: e.l1, count: 0, tags: new Set() })
      const g = groups.get(id); g.count++
      for (const tag of slim(e).tags) g.tags.add(tag)
    }
    const nodes = [...groups.values()].map(n => ({ ...n, tags: [...n.tags] })), edges = []
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].tags.filter(t => nodes[j].tags.includes(t))
      if (shared.length >= 3) edges.push({ from: nodes[i].id, to: nodes[j].id, weight: shared.length, shared })
    }
    edges.sort((a, b) => b.weight - a.weight || a.from.localeCompare(b.from))
    return { count: rows.length, nodes, edges: edges.slice(0, 60) }
  },
  timeline(args = {}) {
    const rows = filterRows(args), grouped = new Map()
    for (const e of rows) {
      if (!grouped.has(e.date)) grouped.set(e.date, [])
      grouped.get(e.date).push(slim(e))
    }
    return { count: rows.length, days: [...grouped].map(([date, entries]) => ({ date, count: entries.length, entries })) }
  },
}
