import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force'

export const palette = ['#6175d9', '#c77a51', '#b99739', '#5d9b82', '#5d9fb7', '#a87bb5', '#b87591', '#8a9099']
const topics = ['人物与角色', '动物与奇幻生物', '场景与风光', '剧情与动作', '产品与广告', '特效与转场', '其他', '实验与抽象']
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

// Same pointer-anchored camera model as LianZhi's graph-camera.ts.
export function zoomCamera(camera, factor, px, py) {
  const k = clamp(camera.k * factor, .15, 3.5)
  return { x: px - (px - camera.x) * k / camera.k, y: py - (py - camera.y) * k / camera.k, k }
}
export function wheelFactor(delta, mode = 0, pinch = false) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 320 : 1)
  return Math.exp(clamp(-pixels * (pinch ? .012 : .003), -.45, .45))
}
export function worldPoint(camera, x, y) {
  return { x: (x - camera.x) / camera.k, y: (y - camera.y) / camera.k }
}
export function fitCamera(nodes, width, height) {
  if (!nodes.length || width <= 0 || height <= 0) return { x: width / 2, y: height / 2, k: 1 }
  const minX = Math.min(...nodes.map(n => n.x - n.radius - 12))
  const maxX = Math.max(...nodes.map(n => n.x + n.radius + 12))
  const minY = Math.min(...nodes.map(n => n.y - n.radius - 12))
  const maxY = Math.max(...nodes.map(n => n.y + n.radius + 12))
  const k = clamp(Math.min(Math.max(1, width - 56) / (maxX - minX || 1), Math.max(1, height - 100) / (maxY - minY || 1)), .15, 1.4)
  return { x: width / 2 - (minX + maxX) * k / 2, y: height / 2 - 18 - (minY + maxY) * k / 2, k }
}
export function labelLines(title, width = 6) {
  const tokens = title.match(/[A-Za-z0-9]+|[^A-Za-z0-9]/gu) || []
  const size = text => [...text].reduce((n, ch) => n + (ch.charCodeAt(0) < 128 ? .55 : 1), 0)
  const lines = ['']
  for (const token of tokens) {
    let index = lines.length - 1
    if (size(lines[index] + token) > width && lines[index]) {
      if (lines.length === 2) {
        while (size(lines[index]) > width - 1) lines[index] = lines[index].slice(0, -1)
        lines[index] = lines[index].trimEnd() + '…'
        break
      }
      lines.push(''); index++
    }
    lines[index] = (lines[index] + token).trimStart()
  }
  return lines.filter(Boolean)
}
export function createScene(graph, memory = new Map(), entries = [], parentId = '') {
  const roots = [...new Set(graph.nodes.map(n => n.l1))].sort((a, b) => topics.indexOf(a) - topics.indexOf(b))
  const nodes = graph.nodes.map((item, index) => {
    const group = roots.indexOf(item.l1), angle = group / roots.length * Math.PI * 2 - Math.PI / 2
    const siblings = graph.nodes.filter(n => n.l1 === item.l1), ordinal = siblings.findIndex(n => n.id === item.id)
    const anchorX = roots.length > 1 ? Math.cos(angle) * 300 : 0
    const anchorY = roots.length > 1 ? Math.sin(angle) * 260 : 0
    const seed = ordinal / siblings.length * Math.PI * 2
    const previous = memory.get(item.id)
    return { ...item, kind: 'cluster', radius: Math.min(60, 40 + Math.sqrt(item.count) * 1.5), color: palette[Math.max(0, topics.indexOf(item.l1)) % palette.length],
      anchorX, anchorY, x: previous?.x ?? anchorX + Math.cos(seed) * 110, y: previous?.y ?? anchorY + Math.sin(seed) * 100,
      fx: previous?.fx ?? null, fy: previous?.fy ?? null, pinned: previous?.pinned || false }
  })
  const parent = nodes.find(n => n.id === parentId)
  if (parent) entries.slice(0, 9).forEach((entry, i, all) => {
    const id = `entry:${entry.id}`, previous = memory.get(id), angle = i / all.length * Math.PI * 2
    nodes.push({ id, entryId: entry.id, label: entry.title, l1: parent.l1, kind: 'entry', count: 1, radius: 34, color: parent.color,
      anchorX: parent.x, anchorY: parent.y, x: previous?.x ?? parent.x + Math.cos(angle) * 170, y: previous?.y ?? parent.y + Math.sin(angle) * 170,
      fx: previous?.fx ?? null, fy: previous?.fy ?? null, pinned: previous?.pinned || false })
  })
  const links = graph.edges.map(edge => ({ ...edge, source: edge.from, target: edge.to, kind: 'related' }))
  if (parent) for (const node of nodes.filter(n => n.kind === 'entry')) links.push({ source: parent.id, target: node.id, from: parent.id, to: node.id, kind: 'contains', weight: 1, shared: [] })
  for (const node of nodes) memory.set(node.id, node)
  return { nodes, links, roots, byId: new Map(nodes.map(n => [n.id, n])) }
}
export function createSimulation(scene, spacing = 1) {
  return forceSimulation(scene.nodes)
    .force('link', forceLink(scene.links).id(n => n.id).distance(link => (link.kind === 'contains' ? 140 : 195) * spacing).strength(link => link.kind === 'contains' ? .12 : .025))
    .force('charge', forceManyBody().strength(-70 * spacing))
    .force('collision', forceCollide().radius(n => n.radius + 12 * spacing).strength(1).iterations(4))
    .force('x', forceX(n => n.anchorX).strength(.07))
    .force('y', forceY(n => n.anchorY).strength(.07))
    .velocityDecay(.48).alphaDecay(.035).stop()
}
