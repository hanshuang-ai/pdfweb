# Vercel Blob 文件上传器

一个基于 Vue 3 的文件上传应用，支持将文件上传到 Vercel Blob Storage。

## 项目配置信息

- **Store ID**: `store_fmATeK5mFkUM5GBd`
- **地区**: `hkg1` (香港)
- **Base URL**: `https://fmatek5mfkum5gbd.public.blob.vercel-storage.com`

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

项目已预配置以下Blob存储信息：
- **Store ID**: `store_fmATeK5mFkUM5GBd`
- **地区**: `hkg1` (香港)
- **读写令牌**: 已配置在 `.env.local` 中

环境变量配置：
```env
VITE_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_fmATeK5mFkUM5GBd_R1FA5xYcMGA6v7nYb64wRsoaQQu1cS
VITE_BLOB_STORE_ID=store_fmATeK5mFkUM5GBd
VITE_BLOB_REGION=hkg1
VITE_BLOB_BASE_URL=https://fmatek5mfkum5gbd.public.blob.vercel-storage.com
```

### 3. 本地开发

项目已配置好所有必要的环境变量，直接启动开发服务器：

```bash
npm run dev
```

应用将在 http://localhost:3000 运行。

### 4. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 在项目设置中配置以下环境变量：
   - `BLOB_READ_WRITE_TOKEN`: `vercel_blob_rw_fmATeK5mFkUM5GBd_R1FA5xYcMGA6v7nYb64wRsoaQQu1cS`
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
│   ├── utils/
│   │   └── blobConfig.js       # Blob 配置工具
│   ├── App.vue                 # 主应用组件
│   ├── main.js                 # 应用入口
│   └── style.css               # 全局样式
├── public/
├── index.html                  # HTML 模板
├── vite.config.js              # Vite 配置
├── package.json                # 项目配置
├── .env.example                # 环境变量示例
├── .env.local                  # 本地环境变量 (已配置)
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