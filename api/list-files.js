import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // 允许CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== LIST FILES API START ===');
    console.log('Token exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

    // 获取文件列表
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`Found ${blobs.length} files`);

    // 格式化文件信息
    const fileList = blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
      size: blob.size || 'unknown',
      contentType: blob.contentType || 'unknown',
      // 提取原始文件名（移除时间戳前缀）
      originalName: blob.pathname.replace(/^\d{13}-[a-z0-9]{13}-/, ''),
      // 格式化大小
      formattedSize: formatFileSize(blob.size || 0),
      // 格式化时间
      formattedDate: new Date(blob.uploadedAt).toLocaleString('zh-CN'),
    }));

    // 按上传时间倒序排列
    fileList.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    console.log('=== LIST FILES API END ===');

    res.status(200).json({
      files: fileList,
      total: fileList.length,
    });

  } catch (error) {
    console.error('=== LIST FILES ERROR ===');
    console.error('List files error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.error('=== END ERROR ===');

    res.status(500).json({
      error: 'Failed to list files',
      details: error.message
    });
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}