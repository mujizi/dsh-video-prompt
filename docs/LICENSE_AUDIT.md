# 语料许可核对记录

核对日期：2026-11-12。发布决定针对提示词正文及其中文显示内容，单独检查仓库代码许可是否覆盖第三方提示词。

| 来源 | 本地条数 | 核对结果 | 公开版处理 |
|---|---:|---|---|
| LearnPrompt/awesome-seedance | 1036 | README 明确：MIT 只覆盖代码，整理内容为 CC BY 4.0，提示词和媒体仍归原作者，仓库不授予底层正文许可 | 不包含正文或译文 |
| ai-boost/awesome-image-video-prompts | 60 | GPL-3.0 适用于代码和笔记，提示词与视频归原发布者 | 不包含正文或译文 |
| flaqai/awesome_wan-3-0-prompts | 80 | README 明确声明原创提示词，原创文本和代码均为 MIT | 包含 80 条；保留 Flaq AI 版权声明、许可和逐条来源 |
| AtlasCloudAI/awesome-wan-3.0-prompts | 80 | 仓库声明 CC BY 4.0，但本地这些条目分别归因于阿里官方和第三方 X 作者，未确认原作者授权链 | 暂不包含 |
| 本周 X 精选 | 71 | 采集记录包含原作者与链接，没有逐条正文再分发授权 | 暂不包含 |
| 其他官方文档、网站、Reddit/X 来源 | 99 | 现有快照未提供覆盖正文再分发的明确许可证据 | 暂不包含 |

本地共 1426 条；公开版包含 80 条，未纳入 1346 条。未纳入意味着本次没有确认可随包分发，不代表判定其禁止一切使用。本文记录发布取舍，不替代针对具体用途的法律判断。

## 纳入语料的可核验证据

- 上游仓库：[Flaq AI](https://github.com/flaqai/awesome_wan-3-0-prompts)
- 固定提交：`bf264109c3d714a6f1e5e164eff89fe8b2ced6ab`
- [原创文本与许可说明](https://github.com/flaqai/awesome_wan-3-0-prompts/blob/bf264109c3d714a6f1e5e164eff89fe8b2ced6ab/README.md#contributing-and-license)
- [上游 MIT 原文](https://github.com/flaqai/awesome_wan-3-0-prompts/blob/bf264109c3d714a6f1e5e164eff89fe8b2ced6ab/LICENSE)，完整副本见 [Flaq-AI-MIT.txt](../licenses/Flaq-AI-MIT.txt)。
- 80 条逐一与上游 `prompts/*.md` 的正文比对，忽略空白差异后全部相同。具体路径、原文哈希和提交见 [verified-entries.json](verified-entries.json)。
- 补充 Flaq AI 作者署名、固定提交来源链接和逐条 MIT 标签；分类与摘要由本插件生成。原文保留在输入 CSV 中。

## 未纳入来源的依据

- [LearnPrompt：Copyright & Takedown Notice](https://github.com/LearnPrompt/awesome-seedance#copyright--takedown-notice)
- [ai-boost：License](https://github.com/ai-boost/awesome-image-video-prompts#license)
- [AtlasCloudAI：LICENSE](https://github.com/AtlasCloudAI/awesome-wan-3.0-prompts/blob/main/LICENSE)
- ofoxai 的仓库为 CC0，但本次数据中没有直接以该仓库作为来源的记录；不据此替其他原作者授予权利。

## 代码与品牌标识

本插件代码采用 MIT，D3 依赖保留 ISC 声明。Seedance 和 Wan 标识由客户端引用其官网 favicon URL，仅用于识别，未打包或再分发图片文件，不对第三方品牌声明 MIT 授权。网络图片不可用时仍显示模型文字。
