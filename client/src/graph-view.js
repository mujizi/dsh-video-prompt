import { createScene, createSimulation, fitCamera, labelLines, wheelFactor, worldPoint, zoomCamera } from './graph-engine.js'

// React owns controls and selection; the simulation paints SVG attributes directly.
export function createGraphView(React) {
  const h = React.createElement
  const { useEffect, useMemo, useRef, useState, useCallback } = React
  return function GraphCanvas({ graph, entries, parentId, selected, onSelect, onExpand }) {
    const svg = useRef(null), layer = useRef(null), simulation = useRef(null)
    const nodeEls = useRef(new Map()), edgeEls = useRef(new Map()), memory = useRef(new Map())
    const gesture = useRef(null), lastClick = useRef(null), camera = useRef({ x: 0, y: 0, k: 1 }), frame = useRef(null)
    const [percent, setPercent] = useState(100), [hovered, setHovered] = useState(''), [spacing, setSpacing] = useState(1)
    const [moving, setMoving] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const [pinAfterDrag, setPinAfterDrag] = useState(false), [status, setStatus] = useState(''), [revision, setRevision] = useState(0)
    const [, setPinRevision] = useState(0)
    const scene = useMemo(() => createScene(graph, memory.current, entries, parentId), [graph, entries, parentId, revision])
    const paint = useCallback(() => {
      for (const node of scene.nodes) nodeEls.current.get(node.id)?.setAttribute('transform', `translate(${node.x} ${node.y})`)
      scene.links.forEach((link, index) => {
        const a = link.source, b = link.target, el = edgeEls.current.get(index)
        if (!el || typeof a !== 'object' || typeof b !== 'object') return
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 1
        el.setAttribute('x1', a.x + dx / distance * a.radius); el.setAttribute('y1', a.y + dy / distance * a.radius)
        el.setAttribute('x2', b.x - dx / distance * b.radius); el.setAttribute('y2', b.y - dy / distance * b.radius)
      })
    }, [scene])
    const updateCamera = useCallback(next => {
      camera.current = next
      if (frame.current === null) frame.current = requestAnimationFrame(() => {
        frame.current = null
        const { x, y, k } = camera.current
        layer.current?.setAttribute('transform', `translate(${x} ${y}) scale(${k})`)
        setPercent(Math.round(k * 100))
      })
    }, [])
    const fit = useCallback(() => {
      if (!svg.current) return
      const { width, height } = svg.current.getBoundingClientRect()
      updateCamera(fitCamera(scene.nodes, width, height))
    }, [scene, updateCamera])
    useEffect(() => {
      const sim = createSimulation(scene, spacing)
      simulation.current = sim
      sim.tick(180); paint(); fit()
      sim.on('tick', paint)
      return () => {
        sim.stop(); gesture.current = null; simulation.current = null
      }
    }, [scene, spacing, paint, fit])
    useEffect(() => {
      if (!moving) simulation.current?.alphaTarget(0).stop()
    }, [moving])
    useEffect(() => {
      const observer = new ResizeObserver(fit)
      if (svg.current) observer.observe(svg.current)
      return () => observer.disconnect()
    }, [fit])
    useEffect(() => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }, [])
    const zoom = useCallback((factor, px, py) => {
      if (!svg.current) return
      const box = svg.current.getBoundingClientRect()
      updateCamera(zoomCamera(camera.current, factor, px ?? box.width / 2, py ?? box.height / 2))
    }, [updateCamera])
    useEffect(() => {
      const el = svg.current
      if (!el) return
      const wheel = event => {
        event.preventDefault()
        const box = el.getBoundingClientRect()
        zoom(wheelFactor(event.deltaY, event.deltaMode, event.ctrlKey), event.clientX - box.left, event.clientY - box.top)
      }
      el.addEventListener('wheel', wheel, { passive: false })
      return () => el.removeEventListener('wheel', wheel)
    }, [zoom])
    const start = (event, node) => {
      if (event.button !== 0 || gesture.current) return
      event.preventDefault(); event.stopPropagation()
      svg.current.focus({ preventScroll: true }); svg.current.setPointerCapture(event.pointerId)
      const box = svg.current.getBoundingClientRect(), p = worldPoint(camera.current, event.clientX - box.left, event.clientY - box.top)
      gesture.current = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY,
        node, moved: false, offsetX: node ? node.x - p.x : 0, offsetY: node ? node.y - p.y : 0,
        originalX: node?.x, originalY: node?.y, wasPinned: node?.pinned }
      if (node) { node.fx = node.x; node.fy = node.y }
      svg.current.classList.add('is-dragging')
    }
    const move = event => {
      const drag = gesture.current
      if (!drag || drag.pointer !== event.pointerId) return
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true
      if (!drag.moved) return
      if (drag.node) {
        const box = svg.current.getBoundingClientRect(), p = worldPoint(camera.current, event.clientX - box.left, event.clientY - box.top)
        drag.node.fx = drag.node.x = p.x + drag.offsetX; drag.node.fy = drag.node.y = p.y + drag.offsetY
        if (moving) simulation.current?.alphaTarget(.12).restart()
        else { simulation.current?.alpha(.3).tick(8); paint() }
        paint()
      } else updateCamera({ ...camera.current, x: camera.current.x + event.clientX - drag.x, y: camera.current.y + event.clientY - drag.y })
      drag.x = event.clientX; drag.y = event.clientY
    }
    const end = (cancelled = false) => {
      const drag = gesture.current
      if (!drag) return
      gesture.current = null; svg.current?.classList.remove('is-dragging')
      if (svg.current?.hasPointerCapture(drag.pointer)) svg.current.releasePointerCapture(drag.pointer)
      if (drag.node) {
        const node = drag.node
        node.pinned = drag.wasPinned || (!cancelled && drag.moved && pinAfterDrag)
        if (cancelled) { node.x = drag.originalX; node.y = drag.originalY }
        node.fx = node.pinned ? node.x : null; node.fy = node.pinned ? node.y : null
        if (!cancelled && !drag.moved) {
          const now = performance.now()
          if (lastClick.current?.id === node.id && now - lastClick.current.time < 350 && node.kind === 'cluster') {
            onExpand(node.id); lastClick.current = null
          } else { onSelect(node); lastClick.current = { id: node.id, time: now } }
        }
        if (drag.moved) {
          setStatus(cancelled ? `已取消移动「${node.label}」` : `已移动「${node.label}」${node.pinned ? '，位置已固定' : ''}`)
          setPinRevision(n => n + 1)
          if (moving) simulation.current?.alphaTarget(0).alpha(.28).restart()
          else { simulation.current?.alphaTarget(0).stop(); paint() }
        } else simulation.current?.alphaTarget(0)
      } else if (drag.moved) setStatus('画布已平移')
    }
    const releasePins = () => {
      for (const node of memory.current.values()) { node.pinned = false; node.fx = null; node.fy = null }
      setPinRevision(n => n + 1); setStatus('已释放固定节点')
      if (moving) simulation.current?.alpha(.5).restart()
      else { simulation.current?.alpha(.5).tick(120); paint() }
    }
    const reset = () => { memory.current.clear(); setRevision(n => n + 1); setStatus('已重新排列图谱') }
    const focusId = hovered || selected, related = new Set([focusId])
    scene.links.forEach(edge => { if (edge.from === focusId) related.add(edge.to); if (edge.to === focusId) related.add(edge.from) })
    const hasFocus = scene.byId.has(focusId), pins = scene.nodes.filter(n => n.pinned).length
    return h('section', { className: 'vp-graph-stage', 'aria-label': '交互题材图谱' },
      h('div', { className: 'vp-graph-top' }, h('div', null, h('strong', null, '从一个题材，展开灵感'),
        h('p', null, `${graph.nodes.length} 个分类 · ${entries.length} 个展开条目 · ${graph.edges.length} 条标签关联`)),
        h('button', { className: 'vp-btn', onClick: reset, title: '释放固定节点并重新排列' }, '重新排列')),
      h('div', { className: 'vp-canvas-wrap' },
        h('svg', { ref: svg, className: 'vp-canvas', role: 'group', tabIndex: 0,
          'aria-label': '题材图谱，可拖动节点与空白画布，滚轮缩放，方向键平移',
          onPointerDown: event => start(event), onPointerMove: move, onPointerUp: event => { if (gesture.current?.pointer === event.pointerId) end() }, onPointerCancel: event => { if (gesture.current?.pointer === event.pointerId) end(true) }, onLostPointerCapture: event => { if (gesture.current?.pointer === event.pointerId) end(true) },
          onKeyDown: event => {
            if (event.target !== event.currentTarget) return
            const delta = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[event.key]
            if (delta) { event.preventDefault(); updateCamera({ ...camera.current, x: camera.current.x + delta[0], y: camera.current.y + delta[1] }); setStatus('画布已平移') }
            if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.2) }
            if (event.key === '-') { event.preventDefault(); zoom(1 / 1.2) }
            if (event.key === '0') { event.preventDefault(); fit() }
            if (event.key === 'Escape') { end(true); setHovered('') }
          } },
          h('g', { ref: layer },
            scene.links.map((edge, i) => h('line', { key: `${edge.from}:${edge.to}`, ref: el => { if (el) edgeEls.current.set(i, el); else edgeEls.current.delete(i) },
              className: `vp-force-edge ${edge.kind === 'contains' ? 'contains' : ''} ${hasFocus && edge.from !== focusId && edge.to !== focusId ? 'dim' : ''}`,
              strokeWidth: edge.kind === 'contains' ? 1.3 : 1.2, vectorEffect: 'non-scaling-stroke' },
              h('title', null, edge.kind === 'contains' ? '分类包含的参考条目' : '共享标签：' + edge.shared.join('、')))),
            scene.nodes.map(node => {
              const lines = labelLines(node.label, 4)
              return h('g', { key: node.id, ref: el => { if (el) nodeEls.current.set(node.id, el); else nodeEls.current.delete(node.id) },
                className: `vp-bubble ${node.kind === 'entry' ? 'vp-entry' : ''} ${selected === node.id ? 'selected' : ''} ${hasFocus && !related.has(node.id) ? 'dim' : ''}`,
                style: { '--node-color': node.color }, role: 'button', tabIndex: 0, 'aria-label': `${node.kind === 'entry' ? '打开参考' : '选择分类'}：${node.label}${node.kind === 'cluster' ? `，${node.count} 条` : ''}${node.pinned ? '，已固定' : ''}`,
                'aria-pressed': selected === node.id, onPointerDown: event => start(event, node),
                onClick: event => { if (event.detail === 0) onSelect(node) },
                onMouseEnter: () => setHovered(node.id), onMouseLeave: () => setHovered(''),
                onKeyDown: event => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); if (event.shiftKey && node.kind === 'cluster') onExpand(node.id); else onSelect(node) }
                } }, h('title', null, node.label),
                h('circle', { className: 'vp-bubble-halo', r: node.radius + 5 }), h('circle', { className: 'vp-bubble-body', r: node.radius }),
                lines.map((line, i) => h('text', { key: i, className: 'vp-bubble-label', y: (i - (lines.length - 1) / 2) * (node.kind === 'cluster' ? 20 : 16) - (node.kind === 'cluster' ? 4 : -4) }, line)),
                node.kind === 'cluster' && h('text', { className: 'vp-bubble-count', y: lines.length === 1 ? 17 : 27 }, `${node.count} 条`),
                node.pinned && h('circle', { className: 'vp-pin-mark', cx: node.radius * .65, cy: -node.radius * .65, r: 4 }))
            }))),
        h('div', { className: 'vp-canvas-controls', role: 'toolbar', 'aria-label': '图谱控制' },
          h('button', { 'aria-label': '缩小图谱', onClick: () => zoom(1 / 1.2) }, '−'), h('output', { 'aria-label': '缩放比例' }, `${percent}%`),
          h('button', { 'aria-label': '放大图谱', onClick: () => zoom(1.2) }, '+'), h('span', { className: 'vp-control-divider' }),
          h('button', { onClick: fit, title: '适应全部节点 · 0' }, '适应画布'),
          h('button', { onClick: () => setMoving(v => !v), 'aria-pressed': moving }, moving ? '暂停动态' : '启用动态')),
        h('details', { className: 'vp-graph-settings' }, h('summary', null, '图谱设置'),
          h('div', null, h('label', null, '节点间距', h('input', { type: 'range', min: .7, max: 1.7, step: .1, value: spacing, 'aria-label': '节点间距', onChange: e => setSpacing(Number(e.target.value)) })),
            h('label', null, h('input', { type: 'checkbox', checked: pinAfterDrag, onChange: e => setPinAfterDrag(e.target.checked) }), '拖动后固定'),
            h('button', { className: 'vp-btn', disabled: !pins, onClick: releasePins }, `释放固定节点${pins ? ` (${pins})` : ''}`)))),
      h('div', { className: 'vp-graph-footer' }, h('span', null, '拖动节点 · 拖空白平移 · 滚轮缩放 · 双击展开'),
        h('span', { role: 'status', 'aria-live': 'polite', className: 'vp-gesture-status' }, status)),
      h('div', { className: 'vp-force-legend' }, scene.roots.map(root => h('span', { key: root },
        h('i', { style: { background: scene.nodes.find(n => n.l1 === root)?.color } }), root))))
  }
}
