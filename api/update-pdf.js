import { put, del } from '@vercel/blob';

export default async function handler(req, res) {
  // 允许CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== UPDATE PDF API START ===');
    console.log('Request body:', req.body);

    const { pathname, newPdfData, mimeType = 'application/pdf' } = req.body;

    if (!pathname || !newPdfData) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['pathname', 'newPdfData'],
        received: { pathname: !!pathname, newPdfData: !!newPdfData }
      });
    }

    console.log('Updating PDF:', pathname);
    console.log('Token exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

    // 转换 Base64 数据为 Buffer
    let pdfBuffer;
    try {
      const base64Content = newPdfData.includes(',')
        ? newPdfData.split(',')[1]
        : newPdfData;

      pdfBuffer = Buffer.from(base64Content, 'base64');
    } catch (bufferError) {
      console.error('Base64 conversion failed:', bufferError);
      return res.status(400).json({
        error: 'Invalid PDF data format',
        details: 'Failed to convert base64 data to buffer'
      });
    }

    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');

    // 先删除原文件（如果存在）
    try {
      await del(pathname, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log('Old file deleted:', pathname);
    } catch (deleteError) {
      // 如果文件不存在，继续执行上传
      console.log('No existing file to delete or delete failed:', deleteError.message);
    }

    // 上传新文件
    const blob = await put(pathname, pdfBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mimeType
    });

    console.log('PDF updated successfully:', blob.url);
    console.log('=== UPDATE PDF API END ===');

    res.status(200).json({
      success: true,
      message: 'PDF updated successfully',
      url: blob.url,
      pathname: pathname,
      size: pdfBuffer.length
    });

  } catch (error) {
    console.error('=== UPDATE PDF ERROR ===');
    console.error('Update PDF error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
      requestBody: {
        pathname: req.body.pathname,
        hasNewPdfData: !!req.body.newPdfData,
        mimeType: req.body.mimeType
      }
    });
    console.error('=== END ERROR ===');

    res.status(500).json({
      error: 'Failed to update PDF',
      details: error.message
    });
  }
}