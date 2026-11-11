# 生视频提示词库（cx版）

DeepSeek Harness 原生侧边栏插件：用交互图谱、时间线和题材目录浏览中文视频提示词，复制正文并追溯来源。

**公开版 v0.3.1 内置 80 条 MIT 许可的原创 Wan3 中文提示词。Seedance 筛选入口保留，当前公开数据为 0 条。** 原作者为 [Flaq AI](https://github.com/flaqai/awesome_wan-3-0-prompts)，逐条附作者、固定版本来源链接和许可证。详情见 [语料许可核对记录](docs/LICENSE_AUDIT.md)。

## 安装

要求 **DeepSeek Harness 0.2.2-rc.1**（当前验证版本）。插件已经包含构建产物，普通用户无需安装 Python、运行 npm 或配置翻译 API。

1. 打开 DSH 的 **插件 → 添加插件 → 安装第三方插件**。
2. 输入 GitHub 地址：

   ```text
   https://github.com/mujizi/dsh-video-prompt
   ```

3. 安装并启用，点击左侧 **生视频提示词库（cx版）**。如果 DSH 提示需要重启，按提示重启。

若正在使用本地自定义数据版本，请先备份自己的插件目录；公开版本的数据仅包含以上 80 条。不要用公开包覆盖尚未备份的自定义语料。

## 功能

- **图谱**：节点拖动、碰撞、连线牵引；拖空白处平移；滚轮或触控板围绕指针缩放；双击节点展开最多 9 条参考。支持适应画布、暂停动态、固定与释放节点。
- **时间线**：按来源日期浏览，未标注日期单独归组。当前 Flaq 数据没有发布日期，不虚构时间。
- **Wiki**：按题材逐级浏览，支持文字、模型、视觉标签筛选。
- **详情**：中文正文、来源原文、作者与许可证；“复制中文提示词”和“复制引用”使用相同的可读按钮样式。

图谱使用轻量 D3 物理布局，动画冷却后停止计算；宿主提供 React，无 iframe。中文正文和检索全部在本地运行，无模型请求、翻译 API、遥测或远程脚本。模型标识图片从品牌官网 HTTPS 地址加载；断网时文字筛选及全部提示词功能仍可用。

键盘：Tab 聚焦节点；Enter/空格选择；Shift+Enter 展开；方向键平移；`+`/`-` 缩放；`0` 适应画布；Escape 取消拖动。

## 给 DSH Agent 的工具

```text
video_prompt_index({})
video_prompt_index({"path":"剧情与动作"})
video_prompt_list({"path":"剧情与动作/追逐逃亡","limit":3})
video_prompt_get({"id":"从列表返回的 id"})
```

先看题材树，再选 3–5 条参考，最后读取详情。模型、日期和视觉标签作为横向筛选。包名为 `dsh-video-prompt`，路由为 `/video-prompt`，原生面板 key 为 `dsh-video-prompt.panel`。

## 开发与验证

开发要求 Node.js >=24.9、npm、Python 3。构建只读取仓库内登记的本地 CSV，不下载语料、不调用翻译服务。

```sh
npm ci
npm run build:data
npm test
```

`client/src/` 是客户端源码，`client/index.js` 是提交的构建产物。`inputs/sources.json` 记录数据和许可；`docs/verified-entries.json` 记录 80 条原文的哈希与上游提交。测试覆盖数据来源、中文正文、分页、模型空结果、只读 HTTP、工具协议和图谱交互数学。

修改数据后重新构建并测试。新增数据需要明确允许再分发；不要提交只标注了来源、却没有正文授权的帖子、第三方案例库或私人采集记录。

## 许可与反馈

插件代码采用 [MIT](LICENSE)；Flaq 原创提示词采用 [Flaq AI MIT](licenses/Flaq-AI-MIT.txt)；D3 依赖的 ISC 声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。保留来源署名和相应许可证。

这是独立社区插件，与 DeepSeek、ByteDance、Alibaba 和 Flaq AI 无隶属或背书关系。品牌图片用于识别模型，不包含在本仓库或发布包中。

问题、纠错或权利人移除请求请提交 [GitHub Issue](https://github.com/mujizi/dsh-video-prompt/issues)，附条目 ID、来源和说明。
