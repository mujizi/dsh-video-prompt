import { createGraphView } from './graph-view.js'
import { graphCss } from './graph-style.js'
const seedanceLogo = "https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/favicon_1/favicon.ico"
const wanLogo = "https://g.alicdn.com/sail-web/wan-static-resources/0.0.30/images/favicon.ico"

window.__ModuleLoader__.load({
  id: 'dsh-video-prompt',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef } = React
    const PANEL = 'dsh-video-prompt.panel'
    const BASE = '/video-prompt/api/'
    const GraphCanvas = createGraphView(React)
    const NO_ENTRIES = []
    const css = `
      .vp-root{--vp-bg:var(--dsw-alias-bg-base,#fff);--vp-card:var(--dsw-alias-bg-layer-1,#f8f9fc);--vp-line:var(--dsw-alias-border-l1,#e4e6eb);--vp-text:var(--dsw-alias-label-primary,#25262d);--vp-muted:var(--dsw-alias-label-secondary,#777b89);--vp-accent:var(--dsw-alias-brand-primary,#5266dd);height:100%;min-height:0;display:flex;flex-direction:column;color:var(--vp-text);background:var(--vp-bg);font:14px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;isolation:isolate}
      .vp-root *{box-sizing:border-box}.vp-root button,.vp-root input,.vp-root select{font:inherit;color:inherit}.vp-root button{cursor:pointer}.vp-root button:disabled{opacity:.45;cursor:default}.vp-root button:focus-visible,.vp-root select:focus-visible,.vp-root input:focus-visible,.vp-root [tabindex]:focus-visible{outline:2px solid var(--vp-accent);outline-offset:3px}
      .vp-header{padding:calc(var(--dsh-frame-top-clearance,0px) + 20px) 28px 18px;border-bottom:1px solid var(--vp-line);display:flex;align-items:flex-start;gap:20px}.vp-header h1{font-size:23px;line-height:1.4;margin:0 0 6px;letter-spacing:-.5px}.vp-sub{font-size:12px;color:var(--vp-muted);margin:0}.vp-header-actions{display:flex;gap:8px;margin-left:auto;align-items:center;padding-top:4px}.vp-btn{border:1px solid var(--vp-line);background:var(--vp-bg);border-radius:8px;padding:6px 12px;white-space:nowrap}.vp-btn:hover{background:var(--vp-card)}.vp-primary{background:var(--vp-accent);color:white!important;border-color:transparent}.vp-pill{display:inline-flex;border:1px solid var(--vp-line);border-radius:20px;padding:2px 9px;font-size:11px;color:var(--vp-muted);margin:6px 5px 0 0}.vp-tabs{display:flex;gap:22px;padding:0 28px;border-bottom:1px solid var(--vp-line);flex-shrink:0}.vp-tab{background:none;border:none;border-bottom:2px solid transparent;padding:12px 2px;color:var(--vp-muted)!important}.vp-tab[aria-selected=true]{color:var(--vp-accent)!important;border-bottom-color:var(--vp-accent);font-weight:600}.vp-tabs .vp-sub{margin:auto 0 auto auto}
      .vp-filters{display:flex;gap:8px;align-items:center;padding:14px 28px;flex-wrap:wrap;border-bottom:1px solid var(--vp-line)}.vp-filters label{display:flex;align-items:center;gap:6px;color:var(--vp-muted);font-size:12px}.vp-filters select,.vp-filters input{border:1px solid var(--vp-line);background:var(--vp-bg);border-radius:7px;padding:6px 9px;max-width:230px;min-width:120px;color:var(--vp-text)}.vp-filters form{display:flex;gap:6px;margin-left:auto}.vp-filters input{width:210px}.vp-body{flex:1;min-height:0;position:relative;overflow:hidden}.vp-scroll{height:100%;overflow:auto;padding:22px 28px}.vp-empty{padding:45px 24px;text-align:center;color:var(--vp-muted)}.vp-error{border:1px solid #d88989;border-radius:10px;padding:18px;margin:24px;color:var(--vp-text)}
      .vp-model-options{display:flex;align-items:center;gap:5px;padding:3px;border:1px solid var(--vp-line);border-radius:10px;background:var(--vp-card);margin-right:8px}.vp-model-options button{display:flex;align-items:center;gap:7px;min-height:34px;padding:5px 11px;border:1px solid transparent;border-radius:7px;background:transparent;white-space:nowrap;font-size:12px}.vp-model-options button[aria-pressed=true]{background:var(--vp-bg);border-color:var(--vp-line);box-shadow:0 1px 4px #00000008;color:var(--vp-accent);font-weight:600}.vp-model-options img{width:20px;height:20px;object-fit:contain;border-radius:4px;flex-shrink:0}.vp-model-options small{font-size:10px;font-weight:400;color:var(--vp-muted);font-variant-numeric:tabular-nums}.vp-model-pair{display:flex;align-items:center}.vp-model-pair img{width:17px;height:17px;background:var(--vp-bg);border:1px solid var(--vp-bg)}.vp-model-pair img+img{margin-left:-5px}.vp-original{margin-top:18px;border-top:1px solid var(--vp-line);padding-top:12px}.vp-original summary{cursor:pointer;color:var(--vp-muted);font-size:12px}.vp-language-count{font-size:11px;color:var(--vp-muted);margin-left:8px}
      .vp-graph-layout{height:100%;display:grid;grid-template-columns:minmax(0,1fr) 310px}.vp-side{border-left:1px solid var(--vp-line);display:flex;min-height:0;flex-direction:column;background:var(--vp-bg)}.vp-side-head{padding:17px 18px;border-bottom:1px solid var(--vp-line)}.vp-side-head h2{font-size:15px;margin:0 0 4px}.vp-side-list{flex:1;min-height:0;overflow:auto;padding:12px}.vp-cluster{display:flex;justify-content:space-between;width:100%;text-align:left;margin-bottom:6px;border:1px solid var(--vp-line);border-radius:8px;padding:8px 10px;background:var(--vp-bg)}.vp-cluster small{color:var(--vp-muted)}
      .vp-card{display:block;text-align:left;width:100%;border:1px solid var(--vp-line);border-radius:10px;background:var(--vp-bg);padding:14px;margin-bottom:10px;transition:border-color .15s}.vp-card:hover{border-color:var(--vp-accent)}.vp-card-title{font-weight:600;font-size:13px;line-height:1.55}.vp-card-summary{font-size:12px;color:var(--vp-muted);margin:7px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.vp-card-meta{font-size:11px;color:var(--vp-muted);display:flex;gap:7px;flex-wrap:wrap}.vp-card-tags{margin-top:7px}.vp-card-tags span{font-size:10px;padding:2px 6px;border-radius:4px;background:var(--vp-card);margin:0 4px 4px 0;display:inline-block;color:var(--vp-muted)}.vp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:10px}.vp-grid .vp-card{margin:0;height:100%}.vp-day{margin-bottom:28px}.vp-day h2{font-size:14px;margin:0 0 12px;position:sticky;top:-22px;background:var(--vp-bg);padding:10px 0;z-index:1}.vp-day h2 span{font-size:11px;font-weight:400;color:var(--vp-muted);margin-left:10px}.vp-pagination{display:flex;gap:8px;align-items:center;justify-content:center;padding:15px 0;font-size:12px;color:var(--vp-muted)}
      .vp-wiki{height:100%;display:grid;grid-template-columns:225px minmax(0,1fr)}.vp-tree{border-right:1px solid var(--vp-line);overflow:auto;padding:18px 12px}.vp-tree details{margin-bottom:6px}.vp-tree summary{cursor:pointer;list-style:none;padding:7px 5px;font-weight:500}.vp-tree summary:before{content:'›';display:inline-block;width:16px}.vp-tree details[open]>summary:before{content:'⌄'}.vp-tree button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:6px 10px 6px 23px;border-radius:6px;font-size:12px;color:var(--vp-muted)}.vp-tree button[aria-current=page]{background:var(--vp-card);color:var(--vp-accent)}.vp-tree button:hover{background:var(--vp-card)}.vp-crumbs{display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12px;color:var(--vp-muted)}.vp-crumbs button{border:0;background:none;padding:0;color:var(--vp-accent)}.vp-wiki h2{font-size:19px;margin:0 0 8px}.vp-wiki .vp-desc{color:var(--vp-muted);font-size:12px;margin-bottom:18px}.vp-category{display:flex;gap:15px;align-items:flex-start;border:1px solid var(--vp-line);border-radius:10px;padding:16px;text-align:left;background:var(--vp-bg);width:100%;margin-bottom:10px}.vp-category strong{display:block;font-size:14px}.vp-category p{color:var(--vp-muted);font-size:12px;margin:4px 0 0}.vp-category>span{margin-left:auto;font-size:12px;color:var(--vp-muted);white-space:nowrap}
      .vp-dialog{color:var(--vp-text);background:var(--vp-bg);border:1px solid var(--vp-line);border-radius:15px;width:min(850px,calc(100vw - 60px));max-height:85vh;padding:0;box-shadow:0 24px 100px #0003}.vp-dialog::backdrop{background:#0006}.vp-dialog-head{padding:20px 24px;position:sticky;top:0;background:var(--vp-bg);border-bottom:1px solid var(--vp-line);display:flex;gap:15px;z-index:1}.vp-dialog-head h2{font-size:18px;margin:0 0 8px}.vp-dialog-body{padding:20px 24px}.vp-dialog-body h3{font-size:13px;margin:20px 0 9px}.vp-dialog pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.8 ui-monospace,SFMono-Regular,monospace;padding:17px;background:var(--vp-card);border:1px solid var(--vp-line);border-radius:9px}.vp-dialog a{color:var(--vp-accent);overflow-wrap:anywhere}.vp-source{font-size:12px;color:var(--vp-muted)}.vp-copy-note{font-size:12px;color:var(--vp-accent);min-height:20px}.vp-detail-actions{display:flex;gap:8px;flex-wrap:wrap}.vp-status{font-size:12px;padding:8px 11px;background:var(--vp-card);border-radius:7px;color:var(--vp-muted)}
      @media(max-width:1100px){.vp-header{padding-left:18px;padding-right:18px}.vp-filters{padding:12px 18px}.vp-filters form{margin-left:0}.vp-graph-layout{grid-template-columns:minmax(0,1fr) 260px}.vp-wiki{grid-template-columns:185px minmax(0,1fr)}}@media(max-width:780px){.vp-graph-layout{grid-template-columns:1fr;grid-template-rows:55% 45%}.vp-side{border-left:0;border-top:1px solid var(--vp-line)}.vp-wiki{grid-template-columns:150px minmax(0,1fr)}.vp-header{gap:8px}.vp-header h1{font-size:20px}.vp-header-actions .vp-sub{display:none}}
      ${graphCss}
    `
    async function request(action, params = {}, signal) {
      const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))
      const response = await fetch(BASE + action + (query.size ? '?' + query : ''), { signal })
      const value = await response.json()
      if (!response.ok) throw new Error(value.error || `读取失败（${response.status}）`)
      return value
    }
    function useApi(action, params, refresh = 0) {
      const key = JSON.stringify(params || {})
      const [state, set] = useState({ loading: true, value: null, error: '' })
      useEffect(() => {
        if (!action) { set({ loading: false, value: null, error: '' }); return }
        const controller = new AbortController()
        set({ loading: true, value: null, error: '' })
        request(action, JSON.parse(key), controller.signal).then(value => set({ loading: false, value, error: '' })).catch(error => {
          if (!controller.signal.aborted) set({ loading: false, value: null, error: error.message })
        })
        return () => controller.abort()
      }, [action, key, refresh])
      return state
    }
    const Empty = ({ children }) => h('div', { className: 'vp-empty', role: 'status' }, children)
    function Pending({ state }) {
      return state.error ? h('div', { className: 'vp-error', role: 'alert' }, state.error) : h(Empty, null, '正在读取本地提示词库…')
    }
    function Card({ entry, onOpen }) {
      return h('button', { className: 'vp-card', onClick: () => onOpen(entry.id), 'aria-label': `查看提示词：${entry.title}` },
        h('div', { className: 'vp-card-title' }, entry.title),
        h('div', { className: 'vp-card-summary' }, entry.summary),
        h('div', { className: 'vp-card-meta' }, h('span', null, entry.model), h('span', null, entry.date || '未标日期'), entry.media_type === 'image' && h('span', null, '图片参考')),
        h('div', { className: 'vp-card-tags' }, entry.tags.slice(0, 3).map(tag => h('span', { key: tag }, tag))))
    }
    function Pager({ value, onOffset }) {
      return h('div', { className: 'vp-pagination' },
        h('button', { className: 'vp-btn', disabled: value.offset === 0, onClick: () => onOffset(Math.max(0, value.offset - value.limit)) }, '上一页'),
        h('span', null, `${value.count ? value.offset + 1 : 0}–${Math.min(value.count, value.offset + value.entries.length)} / ${value.count}`),
        h('button', { className: 'vp-btn', disabled: value.nextOffset === null, onClick: () => onOffset(value.nextOffset) }, '下一页'))
    }
    function Detail({ id, onClose }) {
      const state = useApi('entry', { id })
      const ref = useRef(null)
      const [copied, setCopied] = useState('')
      useEffect(() => { ref.current.showModal(); return () => ref.current?.close() }, [])
      const copy = async value => {
        try { await navigator.clipboard.writeText(value); setCopied('已复制到剪贴板') } catch { setCopied('复制失败，请选中原文手动复制') }
      }
      const e = state.value
      return h('dialog', { ref, className: 'vp-dialog', 'aria-label': '提示词详情', onCancel: onClose, onClick: event => { if (event.target === ref.current) onClose() } },
        h('div', { className: 'vp-dialog-head' }, h('div', { style: { flex: 1 } }, h('h2', null, e?.title || '提示词详情'), e && h('p', { className: 'vp-sub' }, `${e.model} · ${e.l1} / ${e.l2}`)), h('button', { className: 'vp-btn', onClick: onClose, autoFocus: true }, '关闭')),
        !e ? h(Pending, { state }) : h('div', { className: 'vp-dialog-body' },
          h('p', null, e.summary),
          h('div', { className: 'vp-detail-actions' }, h('button', { className: 'vp-btn', onClick: () => copy(e.prompt_zh || e.prompt) }, e.prompt_zh ? '复制中文提示词' : '复制原文'), h('button', { className: 'vp-btn', onClick: () => copy(`id: ${e.id}\n${e.title}\n${e.author || e.source}\n${e.source_url}${e.license ? '\n许可：' + e.license + ' ' + e.license_url : ''}`) }, '复制引用')),
          h('div', { className: 'vp-copy-note', role: 'status' }, copied),
          e.media_type === 'image' && h('p', { className: 'vp-status' }, '此条在原 CSV 中标为图片参考。'),
          e.source_note && h('p', { className: 'vp-status' }, e.source_note),
          e.license && h('p', { className: 'vp-status' }, `来源：${e.author || e.source} · 许可：${e.license} · `, h('a', { href: e.license_url, target: '_blank', rel: 'noopener noreferrer' }, '许可原文')),
          e.prompt_zh ? h(React.Fragment, null, h('h3', null, '中文提示词'), h('pre', null, e.prompt_zh),
            h('details', { className: 'vp-original' }, h('summary', null, e.translation_status === 'source-chinese' ? '查看来源原文（原文为中文）' : '对照来源原文'),
              h('button', { className: 'vp-btn', onClick: () => copy(e.prompt) }, '复制原文'), h('pre', null, e.prompt)))
            : h(React.Fragment, null, h('p', { className: 'vp-status' }, '此条中文正文尚待翻译，以下为完整来源原文。'), h('h3', null, '来源原文'), h('pre', null, e.prompt)),
          h('h3', null, '来源与引用'), h('div', { className: 'vp-source' },
            h('p', null, `条目 id：${e.id}`), h('p', null, `${e.author || '作者未标注'} · ${e.date || '未标日期'} · ${e.source}`),
            /^https?:\/\//i.test(e.source_url) && h('a', { href: e.source_url, target: '_blank', rel: 'noopener noreferrer' }, e.source_url),
            h('p', null, `本地来源：${e.source_file} 第 ${e.source_row} 行`))))
    }
    function Graph({ filters, refresh, onOpen }) {
      const state = useApi('graph', filters, refresh)
      const [selected, setSelected] = useState(''), [offset, setOffset] = useState(0), [expanded, setExpanded] = useState(false)
      const list = useApi(selected ? 'entries' : null, { ...filters, path: selected, limit: 9, offset }, refresh)
      useEffect(() => { setSelected(''); setOffset(0); setExpanded(false) }, [JSON.stringify(filters)])
      if (!state.value) return h(Pending, { state })
      const g = state.value
      if (!g.nodes.length) return h(Empty, null, '没有匹配的条目，请放宽筛选条件。')
      const choose = (id, expand = false) => { setSelected(id); setOffset(0); setExpanded(expand) }
      return h('div', { className: 'vp-graph-layout' },
        h(GraphCanvas, { graph: g, entries: expanded ? (list.value?.entries || NO_ENTRIES) : NO_ENTRIES,
          parentId: expanded ? selected : '', selected,
          onSelect: node => node.kind === 'entry' ? onOpen(node.entryId) : choose(node.id), onExpand: id => choose(id, true) }),
        h('aside', { className: 'vp-side', 'aria-label': '图谱条目列表' },
          h('div', { className: 'vp-side-head' }, h('h2', null, selected ? selected.split('/').pop() : '选择一个题材'),
            h('p', { className: 'vp-sub' }, selected ? `${list.value?.count ?? '…'} 条参考 · 点击卡片查看提示词` : '点击气泡浏览参考，也可以从下方选择'),
            selected && h('div', { style: { marginTop: 10, display: 'flex', gap: 6 } },
              h('button', { className: 'vp-btn', onClick: () => { setSelected(''); setExpanded(false) } }, '全部分类'),
              h('button', { className: 'vp-btn', onClick: () => setExpanded(v => !v) }, expanded ? '收起条目' : '展开条目节点'))),
          h('div', { className: 'vp-side-list' }, !selected ? g.nodes.map(n => h('button', { className: 'vp-cluster', key: n.id, onClick: () => choose(n.id) },
            h('span', null, n.label), h('small', null, n.count)))
            : !list.value ? h(Pending, { state: list }) : h(React.Fragment, null,
              list.value.entries.map(e => h(Card, { entry: e, key: e.id, onOpen })), h(Pager, { value: list.value, onOffset: setOffset })))))
    }
    function Timeline({ filters, refresh, onOpen }) {
      const state = useApi('timeline', filters, refresh)
      const [shown, setShown] = useState(8)
      useEffect(() => setShown(8), [JSON.stringify(filters)])
      if (!state.value) return h(Pending, { state })
      if (!state.value.count) return h(Empty, null, '没有匹配的条目，请放宽筛选条件。')
      return h('div', { className: 'vp-scroll' }, state.value.days.slice(0, shown).map(day => h('section', { className: 'vp-day', key: day.date },
        h('h2', null, day.date || '未标日期', h('span', null, `${day.count} 条`)), h('div', { className: 'vp-grid' }, day.entries.map(e => h(Card, { key: e.id, entry: e, onOpen }))))),
        shown < state.value.days.length && h('div', { className: 'vp-pagination' }, h('button', { className: 'vp-btn', onClick: () => setShown(n => n + 8) }, '加载更早日期')))
    }
    function TreeBranch({ node, path, onPath }) {
      const state = useApi('index', { path: node.path })
      return h('details', { open: path === node.path || path.startsWith(node.path + '/') }, h('summary', null, node.name, h('span', { className: 'vp-sub' }, ` ${node.count}`)),
        h('button', { onClick: () => onPath(node.path) }, '查看此题材'), state.value?.children.map(child => h('button', { key: child.path, 'aria-current': path === child.path ? 'page' : undefined, onClick: () => onPath(child.path) }, `${child.name} (${child.count})`)))
    }
    function Wiki({ filters, refresh, onOpen, roots }) {
      const [path, setPath] = useState(''), [offset, setOffset] = useState(0)
      const state = useApi('index', { path }, refresh)
      const list = useApi(state.value?.leaf ? 'entries' : null, { ...filters, path, offset, limit: 18 }, refresh)
      const navigate = p => { setPath(p); setOffset(0) }
      useEffect(() => setOffset(0), [JSON.stringify(filters)])
      useEffect(() => navigate(filters.path), [filters.path])
      return h('div', { className: 'vp-wiki' },
        h('nav', { className: 'vp-tree', 'aria-label': '题材目录树' }, h('button', { onClick: () => navigate('') }, '全部题材'), roots.map(node => h(TreeBranch, { key: node.path, node, path, onPath: navigate }))),
        h('div', { className: 'vp-scroll' },
          h('nav', { className: 'vp-crumbs', 'aria-label': '目录面包屑' }, h('button', { onClick: () => navigate('') }, '根目录'), path.split('/').filter(Boolean).map((part, i, parts) => h(React.Fragment, { key: i }, h('span', null, '›'), h('button', { onClick: () => navigate(parts.slice(0, i + 1).join('/')) }, part)))),
          !state.value ? h(Pending, { state }) : h(React.Fragment, null,
            h('h2', null, path.split('/').pop() || '全部题材'), h('p', { className: 'vp-desc' }, state.value.leaf ? '点击条目查看原文、复制提示词并追溯来源。' : '每个目录描述一种题材。先判断需求属于哪里，再逐层下钻。'),
            state.value.children.map(c => h('button', { className: 'vp-category', key: c.path, onClick: () => navigate(c.path) }, h('div', null, h('strong', null, c.name), h('p', null, c.desc)), h('span', null, `${c.count} 条 →`))),
            state.value.leaf && (!list.value ? h(Pending, { state: list }) : h(React.Fragment, null,
              list.value.entries.length ? h('div', { className: 'vp-grid' }, list.value.entries.map(e => h(Card, { key: e.id, entry: e, onOpen }))) : h(Empty, null, '该目录在当前筛选下没有条目。'),
              h(Pager, { value: list.value, onOffset: setOffset }))))))
    }
    function Library({ ctx }) {
      const [tab, setTab] = useState('graph'), [refresh, setRefresh] = useState(0), [detail, setDetail] = useState('')
      const [filters, setFilters] = useState({ model: '', path: '', facet: '', query: '' }), [search, setSearch] = useState('')
      const stats = useApi('stats', {}, refresh), roots = useApi('index', {}, refresh)
      const update = (key, value) => setFilters(f => ({ ...f, [key]: value }))
      const data = stats.value
      const shared = { filters, refresh, onOpen: setDetail }
      return h('div', { className: 'vp-root' }, h('style', null, css),
        h('header', { className: 'vp-header', 'data-window-drag': '' },
          h('div', null, h('h1', null, '生视频提示词库'), h('p', { className: 'vp-sub' }, '从题材出发，找到可以借鉴的镜头与叙事。'),
            data && h('div', null, h('span', { className: 'vp-pill' }, `${data.total} 条参考`), h('span', { className: 'vp-pill' }, `${data.mediaCounts?.video || 0} 视频 · ${data.mediaCounts?.image || 0} 图片`), h('span', { className: 'vp-language-count' }, `中文正文 ${data.translated}/${data.total}`))),
          h('div', { className: 'vp-header-actions' }, h('span', { className: 'vp-sub' }, '本地语料'), h('button', { className: 'vp-btn', onClick: () => setRefresh(n => n + 1) }, '刷新'), h('button', { className: 'vp-btn', onClick: () => ctx.layout.selectPanel(null) }, '返回对话'))),
        h('div', { className: 'vp-tabs', role: 'tablist', 'aria-label': '提示词库视图' }, [['graph', '图谱'], ['timeline', '时间线'], ['wiki', 'Wiki']].map(([id, label]) => h('button', { key: id, className: 'vp-tab', role: 'tab', 'aria-selected': tab === id, onClick: () => setTab(id) }, label)), h('span', { className: 'vp-sub' }, 'dsh-video-prompt')),
        h('div', { className: 'vp-filters' },
          h('div', { className: 'vp-model-options', role: 'group', 'aria-label': '筛选模型' },
            [['', '全部'], ['Seedance', 'Seedance'], ['Wan3', 'Wan3']].map(([value, label]) => h('button', {
              key: label, type: 'button', 'aria-pressed': filters.model === value, 'aria-label': `模型：${label}`,
              onClick: () => update('model', value) },
              value ? h('img', { src: value === 'Seedance' ? seedanceLogo : wanLogo, alt: '', 'aria-hidden': true })
                : h('span', { className: 'vp-model-pair', 'aria-hidden': true }, h('img', { src: seedanceLogo, alt: '' }), h('img', { src: wanLogo, alt: '' })),
              h('span', null, label), h('small', null, value ? (data ? (data.familyCounts?.[value] ?? 0) : '…') : (data?.total ?? '…'))))),
          h('label', null, '题材', h('select', { 'aria-label': '筛选题材', value: filters.path, onChange: e => update('path', e.target.value) }, h('option', { value: '' }, '全部题材'), roots.value?.children.map(n => h('option', { key: n.path, value: n.path }, n.name)))),
          h('label', null, '视觉', h('select', { 'aria-label': '筛选视觉标签', value: filters.facet, onChange: e => update('facet', e.target.value) }, h('option', { value: '' }, '全部视觉标签'), data?.visual.filter(f => f.count).map(f => h('option', { key: f.name, value: f.name }, `${f.name} (${f.count})`)))),
          h('form', { onSubmit: e => { e.preventDefault(); update('query', search) } }, h('input', { 'aria-label': '搜索提示词文字', placeholder: '搜索标题或原文', value: search, onChange: e => setSearch(e.target.value) }), h('button', { className: 'vp-btn', type: 'submit' }, '搜索')),
          Object.values(filters).some(Boolean) && h('button', { className: 'vp-btn', onClick: () => { setFilters({ model: '', path: '', facet: '', query: '' }); setSearch('') } }, '清除筛选')),
        h('main', { className: 'vp-body', role: 'tabpanel', 'aria-label': { graph: '图谱视图', timeline: '时间线视图', wiki: 'Wiki 视图' }[tab] },
          !data || !roots.value ? h(Pending, { state: stats.error ? stats : roots }) : tab === 'graph' ? h(Graph, shared) : tab === 'timeline' ? h(Timeline, shared) : h(Wiki, { ...shared, roots: roots.value.children })),
        detail && h(Detail, { key: detail, id: detail, onClose: () => setDetail('') }))
    }
    function Icon({ size = 18 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true },
        h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 3 }), h('path', { d: 'M3 9h18M8 4v5m8-5v5m-6 3 5 3-5 3z' }))
    }
    return {
      inject: ['slots', 'layout'],
      apply(ctx) {
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL }, () => h(Library, { ctx })))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL, order: 18, label: '生视频提示词库' }, Icon))
      },
    }
  },
})
