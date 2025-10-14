# Vercel Blob 文件上传器 - 项目开发指南

## 📋 项目概述

这是一个基于 Vue 3 的现代化文件上传管理应用，支持将文件上传到 Vercel Blob Storage。项目采用了智能上传策略，支持从几KB到100MB的文件上传。

### 🎯 项目特性

- 🚀 **智能上传策略** - 根据文件大小自动选择最佳上传方式
- 📁 **文件管理** - 完整的文件列表、查看、复制链接、删除功能
- 🎨 **现代化UI** - 玻璃态设计、渐变背景、微交互动画
- 📱 **响应式布局** - 完美适配桌面端、平板、手机
- ⚡ **高性能** - 支持大文件直传，绕过API限制
- 🔒 **安全可靠** - 多重安全策略和错误处理

## 🏗️ 技术架构

### 📦 技术栈

```
前端框架: Vue 3 (Composition API)
构建工具: Vite
UI样式: CSS3 + CSS Grid + Flexbox
文件存储: Vercel Blob Storage
部署平台: Vercel
```

### 🔄 系统架构

```
┌─────────────────┐    ┌─────────────────┐
│   用户界面      │    │   Vercel Blob   │
│   (Vue 3)       │    │   Storage       │
└─────────┬───────┘    └─────────────────┘
          │                    ▲
          ▼                    │
┌─────────────────┐    ┌─────────────────┐
│   上传组件      │    │   API 端点      │
│                 │    │                 │
│ ├─ 智能选择      │    │ ├─ /api/upload  │
│ ├─ 进度显示      │    │ ├─ /api/list-files │
│ ├─ 错误处理      │    │ └─ /api/delete-file│
└─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- Vercel 账号 (用于Blob存储)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd vercel-blob-uploader
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

创建 `.env.local` 文件：
```env
# Vercel Blob 配置
# Store ID: store_fmATeK5mFkUM5GBd
# 地区: hkg1 (香港)
# Base URL: https://fmatek5mfkum5gbd.public.blob.vercel-storage.com

# 客户端环境变量 (可选，用于其他功能)
VITE_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_fmATeK5mFkUM5GBd_R1FA5xYcMGA6v7nYb64wRsoaQQu1cS

# 服务端环境变量 (用于API端点)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_fmATeK5mFkUM5GBd_R1FA5xYcMGA6v7nYb64wRsoaQQu1cS

# Blob 配置信息
VITE_BLOB_STORE_ID=store_fmATeK5mFkUM5GBd
VITE_BLOB_REGION=hkg1
VITE_BLOB_BASE_URL=https://fmatek5mfkum5gbd.public.blob.vercel-storage.com
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开 http://localhost:3002

### 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量 `BLOB_READ_WRITE_TOKEN`
4. 部署项目

## 📁 项目结构

```
vercel-blob-uploader/
├── api/                           # Vercel API 路由
│   ├── upload.js                  # 文件上传端点
│   ├── upload-url.js              # 获取上传URL (备用)
│   ├── list-files.js              # 文件列表端点
│   └── delete-file.js            # 文件删除端点
├── src/
│   ├── components/
│   │   ├── FileUploader.vue      # 文件上传组件
│   │   └── FileList.vue          # 文件列表组件
│   ├── utils/
│   │   └── blobConfig.js        # Blob配置工具
│   ├── App.vue                    # 主应用组件
│   ├── main.js                    # 应用入口
│   └── style.css                  # 全局样式
├── public/
├── index.html                     # HTML 模板
├── vite.config.js                 # Vite 配置
├── package.json                   # 项目配置
├── .env.example                   # 环境变量示例
├── .env.local                     # 本地环境变量
└── README.md                      # 项目说明
```

## 🔧 核心功能实现

### 智能上传策略

#### 📊 文件大小判断逻辑

```javascript
const maxApiSize = 4.5 * 1024 * 1024 // 4.5MB (API限制)
const maxDirectSize = 100 * 1024 * 1024 // 100MB (Vercel Blob限制)

if (file.size <= maxApiSize) {
  // 小文件：通过API上传 (更安全)
  uploadResult = await uploadViaAPI(filename)
} else if (file.size <= maxDirectSize) {
  // 大文件：直接上传到Vercel Blob (绕过API限制)
  uploadResult = await uploadDirectly(filename)
} else {
  // 超大文件：拒绝上传
  showError('文件太大！最大支持 100MB')
}
```

#### 🔄 上传方式对比

| 特性 | API上传 (≤4.5MB) | 直接上传 (4.5MB-100MB) |
|------|-------------------|----------------------|
| **安全性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **性能** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **CORS** | 无问题 | 无问题 |
| **令牌安全** | 服务端保护 | 客户端暴露 |
| **进度跟踪** | 精确 | 模拟 |

### API 端点详解

#### `/api/upload` - 文件上传
```javascript
// 处理Base64编码的文件上传
export default async function handler(req, res) {
  const { file, filename, mimeType } = req.body

  // 转换Base64为Buffer
  const base64Content = file.split(',')[1] || file
  const buffer = Buffer.from(base64Content, 'base64')

  // 上传到Vercel Blob
  const blob = await put(filename, buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: mimeType
  })

  return res.json({ url: blob.url })
}
```

#### `/api/list-files` - 文件列表
```javascript
export default async function handler(req, res) {
  const { blobs } = await list({
    token: process.env BLOB_READ_WRITE_TOKEN,
  })

  // 格式化文件信息
  const fileList = blobs.map(blob => ({
    url: blob.url,
    pathname: blob.pathname,
    originalName: blob.pathname.replace(/^\d{13}-[a-z0-9]{13}-/, ''),
    formattedSize: formatFileSize(blob.size),
    formattedDate: new Date(blob.uploadedAt).toLocaleString('zh-CN'),
  }))

  return res.json({ files: fileList, total: fileList.length })
}
```

#### `/api/delete-file` - 文件删除
```javascript
export default async function handler(req, res) {
  const { pathname } = req.body

  await del(pathname, {
    token: process.env BLOB_READ_WRITE_TOKEN,
  })

  return res.json({ success: true, pathname })
}
```

### 前端组件架构

#### FileUploader.vue - 上传组件

**核心功能**:
- 文件拖拽和点击选择
- 智能上传方式选择
- 实时进度显示
- 文件大小检查
- 错误处理和重试

**关键方法**:
```javascript
// 主上传函数
const uploadFile = async () => {
  // 智能选择上传方式
  const uploadResult = file.size <= maxApiSize
    ? await uploadViaAPI(filename)
    : await uploadDirectly(filename)
}

// API上传 (小文件)
const uploadViaAPI = async (filename) => {
  const base64Data = await fileToBase64(file)
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: base64Data, filename })
  })
  return response.json()
}

// 直接上传 (大文件)
const uploadDirectly = async (filename) => {
  const { put } = await import('@vercel/blob')
  const blob = await put(filename, file, {
    access: 'public',
    token: blobConfig.token
  })
  return { url: blob.url }
}
```

#### FileList.vue - 文件管理组件

**核心功能**:
- 文件列表展示
- 文件类型识别和图标
- 操作按钮 (查看、复制、删除)
- 统计信息显示
- 自动刷新机制

**文件类型识别**:
```javascript
const getFileTypeIcon = (contentType) => {
  if (contentType?.includes('image')) return '🖼️'
  if (contentType?.includes('video')) return '🎬'
  if (contentType?.includes('pdf')) return '📕'
  // ... 更多类型
  return '📄'
}
```

## 🎨 UI 设计系统

### 设计原则

1. **玻璃态设计** - 现代化半透明效果
2. **渐变配色** - 丰富的色彩层次
3. **微交互** - 细腻的用户反馈
4. **响应式** - 适配各种设备

### 色彩系统

```css
/* 主色调 */
--primary: #6366f1;
--primary-dark: #4f46e5;
--primary-light: #8b5cf6;

/* 辅助色 */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;

/* 中性色 */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-900: #111827;
```

### 动画系统

```css
/* 核心动画 */
@keyframes bounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

## 🚨 错误处理与安全

### 错误处理策略

1. **文件大小验证**
2. **网络错误重试**
3. **API降级处理**
4. **用户友好的错误提示**

### 安全考虑

1. **令牌保护**
   - API上传：服务端处理令牌
   - 直接上传：客户端使用，但限制大小

2. **文件类型验证**
3. **上传大小限制**
4. **CORS配置**

## 📱 响应式设计

### 断点设置

```css
/* 桌面端 */
@media (min-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

/* 平板端 */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .upload-card {
    padding: 1.5rem;
  }
}

/* 手机端 */
@media (max-width: 480px) {
  .upload-card {
    padding: 1rem;
  }

  .action-btn {
    flex-direction: column;
  }
}
```

## 🔧 配置选项

### 环境变量

| 变量名 | 必需 | 描述 |
|---------|------|------|
| `VITE_BLOB_READ_WRITE_TOKEN` | 是 | Vercel Blob 读写令牌 |
| `BLOB_READ_WRITE_TOKEN` | 是 | 服务端API令牌 |
| `VITE_BLOB_STORE_ID` | 否 | Blob存储ID |
| `VITE_BLOB_REGION` | 否 | 存储地区 |
| `VITE_BLOB_BASE_URL` | 否 | 存储基础URL |

### 自定义配置

```javascript
// src/utils/blobConfig.js
export const blobConfig = {
  storeId: 'your-store-id',
  region: 'hkg1',
  baseUrl: 'https://your-store.public.blob.vercel-storage.com',
  token: process.env.VITE_BLOB_READ_WRITE_TOKEN,
  uploadOptions: {
    access: 'public',
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000,
  }
}
```

## 🚀 性能优化

### 上传优化

1. **智能选择策略** - 根据文件大小选择最佳上传方式
2. **Base64优化** - 小文件使用Base64编码避免FormData问题
3. **直连上传** - 大文件直接上传，减少服务器负担
4. **进度模拟** - 大文件上传使用模拟进度提升用户体验

### 内存管理

1. **及时清理** - 上传完成后清理临时数据
2. **懒加载** - 动态导入大型依赖
3. **分批处理** - 大文件分批读取和处理

## 🔧 开发工具

### 脚本命令

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 开发依赖

```json
{
  "dependencies": {
    "@vercel/blob": "^2.0.0",
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

## 🐛 部署指南

### Vercel 部署

1. **推送代码**
```bash
git add .
git commit -m "feat: 添加文件上传功能"
git push origin main
```

2. **Vercel配置**
   - 导入GitHub仓库
   - 配置环境变量
   - 设置自动部署

3. **环境变量配置**
   ```
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```

### 自定义域名

1. 在Vercel项目设置中添加域名
2. 配置DNS记录
3. 启用HTTPS

## 🧪 测试指南

### 本地测试

1. **小文件测试** (1-2MB)
2. **中等文件测试** (5-10MB)
3. **大文件测试** (50MB+)
4. **边界测试** (接近100MB)

### 功能测试清单

- [ ] 文件拖拽上传
- [ ] 点击选择文件
- [ ] 文件大小验证
- [ ] 上传进度显示
- [ ] 上传成功提示
- [ ] 文件列表显示
- [ ] 文件查看功能
- [ ] 链接复制功能
- [ ] 文件删除功能
- [ ] 错误处理显示
- [ ] 响应式布局

## 🔮 故障排除

### 常见问题

#### Q: 上传失败，提示CORS错误
A: 检查是否部署到Vercel，本地开发可能存在CORS问题

#### Q: 大文件上传超时
A: 检查网络连接，考虑增加超时时间或分片上传

#### Q: 令牌错误
A: 确认环境变量 `BLOB_READ_WRITE_TOKEN` 配置正确

#### Q: 文件列表为空
A: 检查Blob存储权限和令牌有效性

### 调试技巧

1. **查看浏览器控制台** - 检查网络请求和错误信息
2. **查看Vercel函数日志** - 检查API端点执行情况
3. **检查环境变量** - 确认配置正确性

## 📈 扩展功能建议

### 短期扩展

1. **分片上传** - 支持超大文件 (>100MB)
2. **批量上传** - 同时上传多个文件
3. **文件夹上传** - 支持整个文件夹结构
4. **上传暂停/恢复** - 支持中断续传

### 长期规划

1. **用户认证** - 添加用户登录系统
2. **文件分享** - 生成分享链接和权限控制
3. **文件预览** - 内置文件预览功能
4. **云同步** - 多设备同步文件
5. **版本控制** - 文件版本历史管理

## 📄 更新日志

### v1.0.0 (当前版本)
- ✅ 基础文件上传功能
- ✅ 智能上传策略 (4.5MB分界)
- ✅ 文件管理界面
- ✅ 现代化UI设计
- ✅ 响应式布局
- ✅ 完整的错误处理

---

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 项目地址: [GitHub Repository](https://github.com/your-username/vercel-blob-uploader)
- 问题反馈: [Issues](https://github.com/your-username/vercel-blob-uploader/issues)

---

*本项目使用 Vercel Blob Storage，感谢 Vercel 提供的优秀云存储服务！* 🚀