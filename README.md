# 🚀 Modern Todo App

一个使用 Next.js 构建的现代化待办事项应用，具有优雅的界面设计和强大的功能。

## ✨ 特性

- 🎨 **现代化设计** - 采用渐变背景、毛玻璃效果和流畅动画
- 📝 **智能任务管理** - 创建、编辑、删除和标记完成任务
- 📅 **日期组织** - 按日期组织任务，支持日期导航
- 🔍 **强大搜索** - 全文搜索功能，快速找到任务
- 📤 **导出功能** - 导出任务数据
- ⌨️ **键盘快捷键** - 提高操作效率
- 📱 **响应式设计** - 完美适配各种设备

## 🛠️ 技术栈

- **前端**: Next.js 15, TypeScript, CSS Modules
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **样式**: CSS Modules + 现代化设计系统
- **测试**: Jest + React Testing Library

## 🎯 新设计亮点

### 视觉设计

- **渐变背景**: 紫色到蓝色的优雅渐变
- **毛玻璃效果**: 半透明背景与模糊效果
- **圆角设计**: 统一的 16px 圆角设计语言
- **阴影系统**: 层次分明的阴影效果
- **动画交互**: 悬停和点击的流畅动画

### 用户体验

- **直观布局**: 侧边栏 + 主内容区的经典布局
- **现代化表单**: 大尺寸输入框和按钮
- **智能反馈**: 加载状态、错误提示和成功反馈
- **键盘友好**: 完整的键盘快捷键支持

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 数据库
- npm 或 yarn

### 安装步骤

1. **克隆项目**:

```bash
git clone <repository-url>
cd next-js-todo-app
```

2. **安装依赖**:

```bash
npm install
```

3. **配置环境变量**:

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置数据库连接：

```
DATABASE_URL="postgresql://username:password@localhost:5432/todoapp"
```

4. **初始化数据库**:

```bash
npx prisma migrate dev
npx prisma db seed
```

5. **启动开发服务器**:

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## ⌨️ 键盘快捷键

| 快捷键           | 功能                  |
| ---------------- | --------------------- |
| `n`              | 聚焦到新任务输入框    |
| `Ctrl/Cmd + N`   | 聚焦到新任务输入框    |
| `t`              | 跳转到今天            |
| `s`              | 切换侧边栏折叠状态    |
| `/`              | 切换搜索模式          |
| `Ctrl/Cmd + ←/→` | 在日期间导航          |
| `Enter`          | 提交新任务            |
| `Shift + Enter`  | 在任务输入中换行      |
| `Escape`         | 清空输入/退出编辑模式 |

## 🎨 设计系统

### 颜色方案

- **主色调**: `#667eea` (紫蓝色)
- **次要色**: `#764ba2` (深紫色)
- **成功色**: `#28a745` (绿色)
- **危险色**: `#dc3545` (红色)
- **中性色**: `#6c757d` (灰色)

### 间距系统

- **小间距**: 8px
- **中间距**: 16px
- **大间距**: 24px
- **超大间距**: 32px

### 圆角系统

- **小圆角**: 8px
- **中圆角**: 12px
- **大圆角**: 16px
- **超大圆角**: 20px

## 🧪 测试

运行测试套件：

```bash
npm test
```

监视模式运行测试：

```bash
npm run test:watch
```

## 🚀 部署

应用已配置为在 Vercel 上部署：

1. 将代码推送到 GitHub
2. 在 Vercel 中连接仓库
3. 在 Vercel 控制台设置环境变量
4. 部署

## 📝 API 接口

- `GET /api/todos?date=YYYY-MM-DD` - 获取指定日期的任务
- `POST /api/todos` - 创建新任务
- `PUT /api/todos/[id]` - 更新任务
- `DELETE /api/todos/[id]` - 删除任务
- `GET /api/todos/search?q=query` - 搜索任务
- `GET /api/todos/counts` - 获取各日期的任务统计
- `GET /api/date-aliases` - 获取日期别名
- `POST /api/date-aliases` - 创建/更新日期别名

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 为新功能添加测试
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件
