# Robot Project Data in Log

一个专为机器人日志（CSV 格式）设计的现代化数据可视化分析工作台。提供丝滑的离线日志导入、多层级字段筛选以及高性能的时间序列波形分析功能。

## 🌟 核心特性

- **🚀 纯前端架构**：完全在浏览器中解析和处理大规模 CSV 日志，数据零上传，绝对安全。
- **📊 智能数据解析**：自动识别 `ProgramTime` 时间列，支持海量行数的快速解析。
- **🎯 强大的字段管理**：支持“传感器列表”层级目录，提供实时搜索过滤和自定义分类 (Pane)。
- **📈 极致的波形渲染**：基于 ECharts 的高性能可视化，支持多信号对比、数据下钻和拖拽缩放。
- **🎨 现代 UI/UX**：扁平化的卡片式布局，支持无缝的拖拽调整侧边栏宽度、丝滑的拖拽上传动画。

---

## 🚀 快速开始 (本地开发)

确保你的电脑已安装 [Node.js](https://nodejs.org/)。

```bash
# 1. 克隆项目
git clone https://github.com/Wann-99/robot-project-data-log.git

# 2. 进入目录
cd robot-project-data-log

# 3. 安装依赖
npm install

# 4. 启动本地开发服务器
npm run dev
```

启动后，在浏览器中访问 `http://localhost:5173` 即可。

---

## 📖 使用指南

### 1. 导入数据
- 在主界面，您可以**点击中间的卡片**或者直接将 `.csv` 日志文件**拖拽到窗口中**。
- 系统会自动显示环形进度条，并在读取、解析完成后平滑进入工作台。
- *提示：底层支持自动检测 `,`、`;` 或 `Tab` 作为分隔符。*

### 2. 字段筛选与分析
- **左侧边栏 (传感器列表)**：
  - 顶部显示总字段数。您可以使用搜索框快速查找如 `pose_x` 或 `imu_az` 等信号字段。
  - 支持创建多个 **Pane**（面板）来分组管理您关心的字段（点击 `+` 增加，选中 Pane 点击 `-` 删除）。
  - 您可以通过拖拽左侧和右侧卡片中间的“透明分隔条”来**自由调整侧边栏的宽度**。

### 3. 数据可视化
- **顶部过滤栏**：可按照 `NodeName`、`NodePath`、`PTName`、`ToolName` 等维度进行下拉过滤。
- **波形展示区**：
  - 勾选左侧传感器列表中的字段后，右侧会自动绘制出该信号的时间序列波形图。
  - 支持框选放大、拖拽平移，鼠标悬停可查看具体时间点的数值。
  - 面板上方会实时计算并显示所选信号的**数据总数**、**平均值**、**最大峰值**和**最小谷值**。

---

## ☁️ 部署到 Cloudflare Pages (推荐)

本项目是基于 Vite + React 的纯静态单页应用 (SPA)，非常适合免费部署在 Cloudflare Pages。

1. **推送代码到 GitHub**：
   确保您的最新代码已推送到 `main` 分支。

2. **在 Cloudflare 创建项目**：
   - 登录 Cloudflare Dashboard，进入 **Workers & Pages**。
   - 点击 **Create application** -> **Pages** -> **Connect to Git**。
   - 选择本仓库 `robot-project-data-log`。

3. **填写构建配置**：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **重要**：在项目中已内置 `public/_redirects` 文件，自动解决 SPA 刷新 404 问题。

4. 点击 **Save and Deploy** 即可上线。

> **部署失败常见问题**：
> 如果部署报错 `Must specify a project name`，请检查 **Deploy command** 设置，确保为 `npx wrangler pages deploy dist --project-name 你的项目名`。

---

## 🛠️ 技术栈

- **框架**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **语言**: TypeScript
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **图表**: [Apache ECharts](https://echarts.apache.org/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **CSV 解析**: [Papa Parse](https://www.papaparse.com/)
- **图标**: [Lucide React](https://lucide.dev/)

---

*Made with ❤️ for Robot Data Analysis.*
