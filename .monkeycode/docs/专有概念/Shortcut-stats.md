# 快捷指令统计

发布时从快捷指令文件中解析出的操作信息：操作步骤数、文件大小、访问权限。展示在详情页下载按钮下方的表格中。

## 什么是统计？

iOS 快捷指令文件使用 Apple 专有的二进制 plist 格式（`.shortcut`），包含 `WFWorkflowActions` 数组，记录每一个动作（Action）。发布时后端下载指令文件并用 `rodneyrehm/plist` PHP 库解析，提取三类信息存入 `shortcuts.stats` 字段（JSON 字符串）。

## 统计字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `actionCount` | number | 操作步骤总数（`WFWorkflowActions` 数组长度） |
| `size` | number | 指令文件字节数（同时写入 `file_size` 列） |
| `permissions` | string[] | 访问权限标签数组（去重） |
| `actionTypes` | string[] | 全部动作标识符（如 `is.workflow.actions.openapp`） |

## 抓取流程

1. 调用 CloudKit API `GET https://www.icloud.com/shortcuts/api/records/{id}?locale=zh_CN`
2. 从响应的 `fields.shortcut.value.downloadURL` 获取指令文件下载地址
3. 下载 `.shortcut` 文件，用 `CFPropertyList\CFPropertyList` 解析
4. 读取顶层 `WFWorkflowActions` 数组，遍历每个动作的 `WFWorkflowActionIdentifier`

## 权限推导

`PlistParser.php` 的 `$permissionMap` 属性定义了 42 个动作标识符片段到中文权限标签的映射：

| 动作片段 | 权限标签 |
|---------|---------|
| `savetocameraroll`, `getphotos`, `selectphotos` | 照片 |
| `contact`, `getcontacts`, `selectcontact` | 通讯录 |
| `getlocation`, `getcurrentlocation`, `openinmaps` | 定位 |
| `sendnotification`, `shownotification` | 通知 |
| `openapp`, `runapp`, `launchapp` | 打开应用 |
| `sendmessage` | 信息 |
| `sendemail` | 邮件 |
| `call` | 电话 |
| `files`, `getfile`, `savetofile` | 文件 |
| `gethealth`, `health` | 健康 |
| `getcalendar`, `calendar` | 日历 |
| （共 42 条映射） | |

## 前端渲染

`ShortcutDetail.tsx` 下载按钮下方渲染三列表格：

- **操作步骤**: `{actionCount} 步`
- **文件大小**: `{(size/1024).toFixed(1)} KB`
- **访问权限**: 权限标签通过 `PermissionIcon` 组件展示，带 SVG 图标

`stats` 为空或解析失败时不渲染表格。

## 相关文件

| 文件 | 用途 |
|------|------|
| `php-shortcut/src/PlistParser.php` | `parseShortcutInfo()`、`$permissionMap` 权限映射 |
| `php-shortcut/src/routes/shortcuts.php` | `fetchShortcutMeta()` 元数据抓取 |
| `php-shortcut/src/Database.php` | `shortcuts.stats` 列 |
| `frontend/src/components/shortcut/PermissionIcon.tsx` | 权限图标展示 |
| `frontend/src/pages/ShortcutDetail.tsx` | 统计表格渲染 |
