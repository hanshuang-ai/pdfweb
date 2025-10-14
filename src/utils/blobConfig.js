// Vercel Blob 配置工具
export const blobConfig = {
  // Store 配置
  storeId: import.meta.env.VITE_BLOB_STORE_ID || 'store_fmATeK5mFkUM5GBd',
  region: import.meta.env.VITE_BLOB_REGION || 'hkg1',
  baseUrl: import.meta.env.VITE_BLOB_BASE_URL || 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com',

  // 认证令牌
  token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,

  // 上传选项
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

// 验证配置
export const validateConfig = () => {
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

// 获取Blob存储信息
export const getBlobInfo = () => {
  return {
    storeId: blobConfig.storeId,
    region: blobConfig.region,
    baseUrl: blobConfig.baseUrl,
    status: blobConfig.token ? '已配置' : '未配置'
  }
}