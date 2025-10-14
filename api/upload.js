import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Vercel免费版限制是4.5MB
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
    console.log('=== API UPLOAD START ===');
    console.log('Request headers:', req.headers);
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', req.body ? Object.keys(req.body) : 'No body');

    // 详细记录请求体内容
    if (req.body) {
      console.log('Request body details:', {
        hasFile: !!req.body.file,
        hasFilename: !!req.body.filename,
        fileKeys: Object.keys(req.body).filter(key => key.includes('file')),
        allKeys: Object.keys(req.body)
      });
    }

    // 从JSON请求体获取base64文件数据
    let file, filename, originalName, mimeType;

    console.log('Looking for JSON base64 data...');

    if (req.body && req.body.file && req.body.filename) {
      file = req.body.file;
      filename = req.body.filename;
      originalName = req.body.originalName;
      mimeType = req.body.mimeType;
      console.log('Found base64 file data in JSON body');
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      console.log('Detected multipart/form-data, but body parsing failed');
      return res.status(400).json({
        error: 'Multipart form data not properly parsed. Please use JSON format.',
        contentType: req.headers['content-type'],
        bodyKeys: req.body ? Object.keys(req.body) : 'No body'
      });
    }

    console.log('File extraction results:', {
      hasFile: !!file,
      hasFilename: !!filename,
      fileType: typeof file,
      filenameType: typeof filename,
      hasOriginalName: !!originalName,
      hasMimeType: !!mimeType
    });

    if (!file || !filename) {
      console.log('Missing file or filename - returning error');
      return res.status(400).json({
        error: 'Missing file or filename',
        hasFile: !!file,
        hasFilename: !!filename,
        requestBodyPresent: !!req.body,
        contentType: req.headers['content-type']
      });
    }

    console.log('Processing upload:', filename);
    console.log('Original name:', originalName);
    console.log('MIME type:', mimeType);
    console.log('Token exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

    // 转换base64为Buffer
    console.log('Converting base64 to buffer...');
    let buffer;
    try {
      // 移除data URL前缀 (例如: data:image/png;base64,)
      const base64Content = file.split(',')[1] || file;
      buffer = Buffer.from(base64Content, 'base64');
      console.log('Buffer created successfully, size:', buffer.length);
    } catch (error) {
      console.error('Failed to convert base64 to buffer:', error);
      throw new Error('Invalid base64 data');
    }

    // 上传文件到Vercel Blob
    console.log('Calling Vercel Blob API...');
    const blob = await put(filename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mimeType || 'application/octet-stream'
    });

    console.log('Upload successful:', blob.url);
    console.log('=== API UPLOAD END ===');

    res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
    });

  } catch (error) {
    console.error('=== API UPLOAD ERROR ===');
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
      requestBody: req.body,
      headers: req.headers
    });
    console.error('=== END ERROR ===');

    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
}
