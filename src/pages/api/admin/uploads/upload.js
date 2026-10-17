import cloudinary from '../../../../lib/cloudinary';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../../../../lib/auth';
import cookie from 'cookie';

export const config = {
  api: { bodyParser: false },
};

function parseForm(req) {
  const form = formidable({ multiples: false, keepExtensions: true, maxFileSize: 5 * 1024 * 1024 }); // 5MB default
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  // auth check
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {

  const { fields, files } = await parseForm(req);
  let file = files.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  // formidable may return an array for files with same field name
  if (Array.isArray(file)) file = file[0];

  // validate by mime/type and extension
  const mime = (file.mimetype || file.type || '').toString();
  const filename = (file.originalFilename || file.name || file.filename || '').toString();
  const ext = path.extname(filename).toLowerCase();
  const isImage = mime.startsWith('image/');
  const isPdf = ext === '.pdf' || mime === 'application/pdf' || mime.includes('pdf');
  const isDoc = ['.doc', '.docx'].includes(ext) || mime.includes('word');

  // allowed types: images for thumbnails, pdf/doc/docx for CV
  if (!isImage && !isPdf && !isDoc) return res.status(400).json({ error: 'Unsupported file type. Allowed: PDF, DOC, DOCX, images.' });

    // enforce max size: use file.size if available, formidable  sets limit
    if (file.size && file.size > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });

    // upload to Cloudinary if configured; otherwise fall back to saving locally under /public/uploads
    try {
      const uploadOptions = { resource_type: isPdf ? 'raw' : 'image', folder: `portfolio/${isPdf ? 'cv' : 'media'}`, use_filename: true, unique_filename: true, overwrite: false };
      const result = await cloudinary.uploader.upload(file.filepath || file.path, uploadOptions);
      try { fs.unlinkSync(file.filepath || file.path); } catch (e) {}
      return res.json({ url: result.secure_url, public_id: result.public_id, resource_type: result.resource_type });
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr && cloudErr.message);
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${(filename || 'upload').replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
        const dest = path.join(uploadsDir, safeName);
        fs.renameSync(file.filepath || file.path, dest);
        const publicUrl = `/uploads/${safeName}`;
        return res.json({ url: publicUrl, public_id: null, resource_type: isPdf ? 'raw' : 'image' });
      } catch (e) {
        console.error('Local save failed', e);
        return res.status(500).json({ error: 'Upload failed' });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
