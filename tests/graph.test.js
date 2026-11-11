import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { api } from '../lib/api.js'
import { createScene, createSimulation, zoomCamera, worldPoint, fitCamera, wheelFactor, labelLines } from '../client/src/graph-engine.js'

test('zoom keeps the world point under the pointer, including clamps and inverse zoom', () => {
  const camera = { x: 120, y: -45, k: .8 }, x = 321, y = 246
  const p = worldPoint(camera, x, y)
  for (const factor of [.001, .8, 1.25, 100]) {
    const next = zoomCamera(camera, factor, x, y), actual = worldPoint(next, x, y)
    assert.ok(Math.abs(actual.x - p.x) < 1e-9)
    assert.ok(Math.abs(actual.y - p.y) < 1e-9)
    assert.ok(next.k >= .15 && next.k <= 3.5)
  }
  const roundTrip = zoomCamera(zoomCamera(camera, 1.2, x, y), 1 / 1.2, x, y)
  assert.ok(Math.abs(roundTrip.x - camera.x) < 1e-9)
  assert.ok(wheelFactor(3, 1) === wheelFactor(48, 0))
  assert.ok(wheelFactor(100000, 0) > .6)
})

test('the actual corpus settles without overlapping bubbles and fits the viewport', () => {
  const scene = createScene(api.graph()), sim = createSimulation(scene)
  try {
    sim.tick(260)
    for (let i = 0; i < scene.nodes.length; i++) {
      const a = scene.nodes[i]
      assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y))
      for (const b of scene.nodes.slice(i + 1)) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius + 10, `${a.id} overlaps ${b.id}`)
    }
    const camera = fitCamera(scene.nodes, 850, 580)
    for (const node of scene.nodes) {
      assert.ok(camera.x + (node.x - node.radius) * camera.k >= 0)
      assert.ok(camera.x + (node.x + node.radius) * camera.k <= 850)
      assert.ok(camera.y + (node.y - node.radius) * camera.k >= 0)
      assert.ok(camera.y + (node.y + node.radius) * camera.k <= 580)
    }
  } finally { sim.stop() }
})

test('dragged fixed node stays under the pointer and pushes its neighbour away', () => {
  const graph = { nodes: [{ id: 'a', label: 'a', count: 5, l1: '人物与角色' }, { id: 'b', label: 'b', count: 5, l1: '人物与角色' }], edges: [] }
  const scene = createScene(graph), sim = createSimulation(scene)
  try {
    sim.tick(180)
    const [a, b] = scene.nodes, old = { x: b.x, y: b.y }
    a.fx = old.x + 1; a.fy = old.y
    sim.alpha(.8).tick(100)
    assert.equal(a.x, a.fx); assert.equal(a.y, a.fy)
    assert.ok(Math.hypot(b.x - old.x, b.y - old.y) > 30)
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius + 10)
    a.fx = null; a.fy = null
    sim.alpha(.4).tick(120)
    assert.ok(Number.isFinite(a.x) && Number.isFinite(b.y))
  } finally { sim.stop() }
})

test('expansion is bounded and preserves existing positions and pins', () => {
  const graph = api.graph(), memory = new Map(), first = createScene(graph, memory)
  const parent = first.nodes[0]
  parent.x = 123; parent.y = 456; parent.pinned = true; parent.fx = 123; parent.fy = 456
  const entries = api.list({ path: parent.id, limit: 60 }).entries
  const expanded = createScene(graph, memory, entries, parent.id)
  assert.equal(expanded.byId.get(parent.id).x, 123)
  assert.equal(expanded.byId.get(parent.id).fx, 123)
  assert.ok(expanded.nodes.length <= graph.nodes.length + 9)
  assert.equal(expanded.links.filter(e => e.kind === 'contains').length, Math.min(9, entries.length))
  assert.ok(expanded.links.every(e => expanded.byId.has(e.from) && expanded.byId.has(e.to)))
  assert.deepEqual(labelLines('儿童萌娃'), ['儿童萌娃'])
  assert.ok(labelLines('一个非常非常长的提示词条目标题').length <= 2)
})

test('the self-contained client stays within the lightweight bundle budget', () => {
  const code = readFileSync(new URL('../client/index.js', import.meta.url))
  assert.ok(code.length < 80 * 1024, `bundle is ${code.length} bytes`)
  assert.ok(gzipSync(code).length < 25 * 1024)
  assert.ok(!/https?:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net)/.test(code.toString()))
})
