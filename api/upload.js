import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // 允许CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Upload request received');

    // 从请求中获取文件和文件名
    const file = req.body.file;
    const filename = req.body.filename;

    if (!file || !filename) {
      return res.status(400).json({
        error: 'Missing file or filename',
        hasFile: !!file,
        hasFilename: !!filename
      });
    }

    console.log('Processing upload:', filename);
    console.log('Token exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

    // 上传文件到Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('Upload successful:', blob.url);

    res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
}
