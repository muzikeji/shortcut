# frontend/src/components/

前端共享 UI 组件。

## 结构

```
components/
├── Navbar.tsx         # 顶部导航栏（sticky）
└── Footer.tsx         # 底部页脚
```

## 关键文件

| 文件 | 目的 |
|------|------|
| `Navbar.tsx` | 全局导航栏，sticky 定位。包含 logo、搜索框、发布按钮（登录后）、用户头像/用户名链接（登录后）、登录/注册入口（未登录） |
| `Footer.tsx` | 静态页脚，显示版权信息 |

## 依赖

**本模块依赖**:
- `../AuthContext.tsx` -- 通过 `useAuth()` 获取用户状态
- `react-router-dom` -- `Link`, `useNavigate`

**依赖本模块的**:
- `../App.tsx` -- 布局中引用 Navbar 和 Footer

## 规范

### 响应式设计

使用 Tailwind 响应式前缀控制移动端和桌面端的显示差异。例如 Navbar 中的文本在移动端隐藏（`hidden sm:inline`）。
