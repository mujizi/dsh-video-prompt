import { api } from './api.js'

const text = value => [{ type: 'text', text: value }]
const schema = properties => ({ type: 'object', properties, additionalProperties: false })
const str = description => ({ type: 'string', description })
function renderIndex(v) {
  return `# ${v.path || '题材根目录'}（${v.count} 条）\n` + v.children.map(c => `- ${c.path}（${c.count} 条）：${c.desc}`).join('\n') + `\n\n${v.next}`
}
function renderList(v) {
  return `# ${v.path || '提示词库'}（共 ${v.count} 条，本页 ${v.entries.length} 条）\n` + v.entries.map(e => `- id: ${e.id}\n  ${e.title}\n  ${e.summary}\n  ${e.model} · ${e.date || '未标日期'} · ${e.tags.join(' / ')}`).join('\n') +
    (v.nextOffset === null ? '' : `\n下一页 offset=${v.nextOffset}`) + `\n\n${v.next}`
}
function renderEntry(e) {
  return `# ${e.title}\nid: ${e.id}\n${e.model} · ${e.l1}/${e.l2}\n${e.summary}\n\n` +
    (e.prompt_zh ? `## 中文提示词\n${e.prompt_zh}\n\n` : '译文状态：中文正文尚待翻译，以下为完整来源原文。\n\n') +
    `## 原文 prompt\n${e.prompt}\n\n来源：${e.source_url}\n作者：${e.author || '未标注'}\n原始记录：${e.source_file} 第 ${e.source_row} 行`
}
function tool(name, description, parameters, call, render) {
  return { name, description, parameters, timeoutMs: 15000,
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => text(render(value)) },
    async execute(args, execution) {
      execution?.signal?.throwIfAborted()
      if (args === null || typeof args !== 'object' || Array.isArray(args)) throw new Error('参数必须为对象')
      for (const key of Object.keys(args)) if (!Object.hasOwn(parameters.properties, key)) throw new Error(`未知参数：${key}`)
      return call(args)
    },
  }
}
export const TOOLS = [
  tool('video_prompt_index', 'dsh-video-prompt 生视频提示词库（cx版）：先读题材树再逐层选择。空 path 读根目录；选择返回的完整 path 下钻。到 leaf 后用 video_prompt_list，取 3–5 条后用 video_prompt_get。不要直接扫描全部语料。',
    schema({ path: str('可选；根目录为空，其他路径必须来自上一层返回的 children.path。') }), api.index, renderIndex),
  tool('video_prompt_list', 'dsh-video-prompt 生视频提示词库（cx版）：列出选定题材的摘要。先用 video_prompt_index 走树；模型、视角是可选横向筛选。选择 3–5 条供后续读取和重组写法。',
    schema({ path: str('来自目录的完整 path。'), model: str('可选品牌：Seedance、Wan3。也支持精确版本 Seedance 2.5、Seedance 2.0、Seedance（未标版本）、Wan 3.0。'), facet: str('可选，如 视角:窥视/树洞 或 风格:电影感。'), limit: { type: 'integer', minimum: 1, maximum: 60, description: '默认 20，建议取 5。' }, offset: { type: 'integer', minimum: 0, description: '分页偏移，默认 0。' } }), api.list, renderList),
  tool('video_prompt_get', 'dsh-video-prompt 生视频提示词库（cx版）：按真实 id 读取完整原文、译文状态和来源。综合多个参考的镜头语言、分镜时间轴与约束，不复制整段原文；成稿附参考 id 和来源。',
    { ...schema({ id: str('video_prompt_list 返回的条目 id。') }), required: ['id'] }, api.get, renderEntry),
]
