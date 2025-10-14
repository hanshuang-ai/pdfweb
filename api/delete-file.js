import { del } from '@vercel/blob';

export default async function handler(req, res) {
  // 允许CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DELETE FILE API START ===');
    console.log('Request body:', req.body);

    const { pathname } = req.body;

    if (!pathname) {
      return res.status(400).json({
        error: 'Missing pathname',
        requestBody: req.body
      });
    }

    console.log('Deleting file:', pathname);
    console.log('Token exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

    // 删除文件
    await del(pathname, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('File deleted successfully:', pathname);
    console.log('=== DELETE FILE API END ===');

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      pathname: pathname
    });

  } catch (error) {
    console.error('=== DELETE FILE ERROR ===');
    console.error('Delete file error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
      requestBody: req.body
    });
    console.error('=== END ERROR ===');

    res.status(500).json({
      error: 'Failed to delete file',
      details: error.message
    });
  }
}