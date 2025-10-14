# Vercel Blob 文件上传器

一个基于 Vue 3 的文件上传应用，支持将文件上传到 Vercel Blob Storage。

## 功能特性

- 📁 支持拖拽上传
- 🖱️ 点击选择文件
- 📊 实时上传进度显示
- 🔗 上传后获取文件URL
- 🎨 现代化UI设计
- 📱 响应式布局

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 进入你的项目设置
3. 在 "Environment Variables" 中添加一个新的变量：
   - **名称**: `BLOB_READ_WRITE_TOKEN`
   - **值**: 你的 Blob 读写令牌

4. 如果还没有 Blob 存储配置：
   - 在 Vercel 项目中添加 Blob 存储
   - 创建一个读写令牌

### 3. 本地开发

复制 `.env.example` 文件为 `.env.local`：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填入你的令牌：

```env
VITE_BLOB_READ_WRITE_TOKEN=你的实际令牌
```

启动开发服务器：

```bash
npm run dev
```

应用将在 http://localhost:3000 运行。

### 4. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 在项目设置中配置环境变量 `BLOB_READ_WRITE_TOKEN`
4. 部署项目

## 使用方法

1. 打开应用
2. 点击上传区域或拖拽文件到上传区域
3. 选择要上传的文件
4. 点击"开始上传"按钮
5. 等待上传完成
6. 上传成功后可以点击链接访问文件

## 支持的文件类型

支持所有文件类型的上传，包括但不限于：
- 图片文件 (jpg, png, gif, webp 等)
- 文档文件 (pdf, doc, docx, txt 等)
- 视频文件 (mp4, mov, avi 等)
- 音频文件 (mp3, wav, flac 等)
- 压缩文件 (zip, rar, 7z 等)

## 技术栈

- **Vue 3** - 前端框架
- **@vercel/blob** - Vercel Blob SDK
- **Vite** - 构建工具
- **CSS** - 样式

## 项目结构

```
vercel-blob-uploader/
├── src/
│   ├── components/
│   │   └── FileUploader.vue    # 文件上传组件
│   ├── App.vue                 # 主应用组件
│   ├── main.js                 # 应用入口
│   └── style.css               # 全局样式
├── public/
├── index.html                  # HTML 模板
├── vite.config.js              # Vite 配置
├── package.json                # 项目配置
├── .env.example                # 环境变量示例
└── README.md                   # 项目说明
```

## 注意事项

1. 确保 Vercel Blob 令牌有足够的权限
2. 文件大小限制取决于你的 Vercel 计划
3. 上传的文件默认为公开访问
4. 请妥善保管你的 Blob 令牌，不要提交到版本控制

## 故障排除

### 上传失败
- 检查环境变量是否正确配置
- 确认 Blob 令牌是否有效
- 检查网络连接

### 环境变量不生效
- 确保 `.env.local` 文件存在
- 变量名必须以 `VITE_` 开头
- 重启开发服务器

## 许可证

MIT License