import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { api, BASE, ROOT, InputError } from './api.js'
import { TOOLS } from './tools.js'

export const name = 'dsh-video-prompt'
export const inject = ['webServer', 'tools']

function send(req, res, status, body, type = 'application/json; charset=utf-8') {
  const value = type.startsWith('application/json') ? JSON.stringify(body) : body
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
  res.end(req.method === 'HEAD' ? undefined : value)
}

export async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('allow', 'GET, HEAD')
      return send(req, res, 405, { error: '只读接口仅接受 GET 或 HEAD' })
    }
    const routes = { index: api.index, entries: api.list, entry: api.get, graph: api.graph, timeline: api.timeline, stats: api.stats }
    const suffix = url.pathname.slice(BASE.length)
    if (suffix.startsWith('/api/')) {
      const action = routes[suffix.slice(5)]
      if (!action) throw new InputError('接口不存在', 404)
      return send(req, res, 200, action(Object.fromEntries(url.searchParams)))
    }
    if (suffix === '' || suffix === '/') return send(req, res, 200,
      '<!doctype html><html lang="zh"><meta charset="utf-8"><title>生视频提示词库</title><body><h1>生视频提示词库</h1><p>dsh-video-prompt 已运行。请在 DeepSeek Harness 左侧点击「生视频提示词库」，使用图谱、时间线和 Wiki。</p><p><a href="/video-prompt/api/stats">查看运行状态</a></p></body></html>', 'text/html; charset=utf-8')
    if (suffix === '/icon.svg') return send(req, res, 200, readFileSync(join(ROOT, 'icon.svg')), 'image/svg+xml')
    throw new InputError('页面不存在', 404)
  } catch (error) {
    return send(req, res, error.status || 500, { error: error.status ? error.message : '读取提示词库失败，请检查插件数据文件' })
  }
}

export function apply(ctx) {
  for (const tool of TOOLS) ctx.tools.register(tool)
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: BASE, handler }))
}
