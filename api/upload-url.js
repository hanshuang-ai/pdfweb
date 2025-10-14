import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // 生成上传URL
    const blob = await put(filename, new Blob([]), {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      handleUploadUrl: true, // 关键：获取上传URL而不是直接上传
    });

    res.status(200).json({
      url: blob.url,
      uploadUrl: blob.uploadUrl, // 用于直接上传的URL
      pathname: blob.pathname,
    });

  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({
      error: 'Failed to generate upload URL',
      details: error.message
    });
  }
}