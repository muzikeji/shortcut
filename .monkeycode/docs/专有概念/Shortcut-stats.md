# 快捷指令统计

发布时从快捷指令文件中解析出的操作信息：操作步骤数、文件大小、访问权限。展示在详情页下载按钮下方的表格中。

## 什么是统计？

iOS 快捷指令文件是 Apple 专有的二进制 plist（bplist），包含 `WFWorkflowActions` 数组，记录每一个动作（Action）。发布时后端下载指令文件并解析，提取三类信息存入 `shortcuts.stats` 字段（JSON 字符串）。

## 统计字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `actionCount` | number | 操作步骤总数（`WFWorkflowActions` 数组长度） |
| `size` | number | 指令文件字节数（同时写入 `file_size` 列） |
| `permissions` | string[] | 访问权限标签数组（去重） |
| `actionTypes` | string[] | 全部动作标识符（如 `is.workflow.actions.openapp`） |

## 抓取流程

1. 调用 CloudKit API `GET https://www.icloud.com/shortcuts/api/records/{id}?locale=zh_CN`（8 秒超时）
2. 从 `fields.shortcut.value.downloadURL` 拿到指令文件下载地址（将 `${f}` 占位符替换为 `shortcut`）
3. 下载文件（15 秒超时），用 `bplist-parser` 解析 `parseBuffer(buf)`
4. 读取顶层 `WFWorkflowActions` 数组，遍历每个动作的 `WFWorkflowActionIdentifier`

> 注意：API 返回的 `signedShortcut` 字段是 AEA1 加密容器，无法解析；必须使用未加密的 `shortcut` 字段。

## 权限推导

每个动作标识符形如 `is.workflow.actions.openapp`，取 `.` 后的最后一段（如 `openapp`）与 `PERMISSION_ACTIONS` 映射表比对，映射到中文权限标签：

| 动作片段 | 权限标签 |
|---------|---------|
| `savetocameraroll`, `getphotos`, `selectphotos` | 照片 |
| `contact`, `getcontacts`, `selectcontact` | 通讯录 |
| `getlocation`, `getcurrentlocation`, `openinmaps` | 定位 |
| `sendnotification`, `shownotification` | 通知 |
| `runapp`, `openapp`, `launchapp`, `open` | 打开应用 |
| `sendmessage` | 信息 |
| `sendemail` | 邮件 |
| `call` | 电话 |
| `files`, `getfile`, `savetofile`, `getcontentsoffolder` | 文件 |
| `gethealth`, `health` | 健康 |
| `getcalendar`, `calendar`, `createevent` | 日历 |
| ...（共 60+ 条映射） | |

## 前端渲染

`ShortcutDetail.tsx` 下载按钮下方渲染三列表格：

- **操作步骤**: `{actionCount} 步`
- **文件大小**: `{(size/1024).toFixed(1)} KB`
- **访问权限**: 权限标签带图标（`PERMISSION_ICONS` 映射 SVG 路径），标签底色为主题色 + 透明度后缀（`${theme}14`）

`stats` 为空或解析失败时不渲染表格。

## 相关文件

| 文件 | 用途 |
|------|------|
| `backend/src/routes/shortcut.js` | `parseShortcutStats()`、`PERMISSION_ACTIONS`、`PERMISSION_ICONS` |
| `backend/package.json` | `bplist-parser` 依赖 |
| `backend/src/database.js` | `shortcuts.stats` 列 |
| `frontend/src/pages/ShortcutDetail.tsx` | 统计表格渲染 |
