// Vercel Blob 配置工具
export const blobConfig = {
  // Store 配置
  storeId: import.meta.env.VITE_BLOB_STORE_ID || 'store_fmATeK5mFkUM5GBd',
  region: import.meta.env.VITE_BLOB_REGION || 'hkg1',
  baseUrl: import.meta.env.VITE_BLOB_BASE_URL || 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com',

  // 认证令牌 (可选，用于显示配置状态)
  token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,

  // 上传选项 (用于显示信息，实际上传由API处理)
  uploadOptions: {
    access: 'public',
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000, // 1年缓存
  }
}

// 生成唯一文件名
export const generateUniqueFilename = (file) => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop()
  const baseName = file.name.split('.').slice(0, -1).join('.')

  return `${timestamp}-${randomString}-${baseName}.${extension}`
}

// 验证配置 (新方案：只需要验证基本配置)
export const validateConfig = () => {
  const { storeId, baseUrl } = blobConfig

  if (!storeId) {
    throw new Error('缺少 BLOB_STORE_ID 环境变量')
  }

  if (!baseUrl) {
    throw new Error('缺少 BLOB_BASE_URL 环境变量')
  }

  return true
}

// === 原有验证配置 (已注释) ===
/*
// 原有验证配置 (客户端直传方案)
export const validateConfigOld = () => {
  const { token, storeId, baseUrl } = blobConfig

  if (!token) {
    throw new Error('缺少 BLOB_READ_WRITE_TOKEN 环境变量')
  }

  if (!storeId) {
    throw new Error('缺少 BLOB_STORE_ID 环境变量')
  }

  if (!baseUrl) {
    throw new Error('缺少 BLOB_BASE_URL 环境变量')
  }

  return true
}
*/

// 获取Blob存储信息 (新方案：服务端直传)
export const getBlobInfo = () => {
  return {
    storeId: blobConfig.storeId,
    region: blobConfig.region,
    baseUrl: blobConfig.baseUrl,
    status: '服务端直传 (已配置)',
    mode: '服务端直传 (最安全)'
  }
}

// === 原有获取Blob存储信息 (已注释) ===
/*
// 原有获取Blob存储信息 (客户端直传)
export const getBlobInfoOld = () => {
  return {
    storeId: blobConfig.storeId,
    region: blobConfig.region,
    baseUrl: blobConfig.baseUrl,
    status: blobConfig.token ? '已配置' : '未配置',
    mode: '客户端直传 (方案1)'
  }
}
*/