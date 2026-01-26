import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { Version } from '../db/database.js';
import { requireAuth } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

const router = Router();

router.get('/', requireAuth, (req: Request, res: Response) => {
  const versions = db.prepare(`
    SELECT id, filename, original_name, memo, created_at
    FROM versions
    ORDER BY created_at DESC
  `).all() as Omit<Version, 'extracted_text'>[];

  res.json(versions);
});

router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const version = db.prepare(`
    SELECT id, filename, original_name, extracted_text, memo, created_at
    FROM versions
    WHERE id = ?
  `).get(req.params.id) as Version | undefined;

  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }

  res.json(version);
});

router.get('/:id/pdf', requireAuth, (req: Request, res: Response) => {
  const version = db.prepare(`
    SELECT filename, original_name FROM versions WHERE id = ?
  `).get(req.params.id) as Pick<Version, 'filename' | 'original_name'> | undefined;

  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }

  const filePath = path.join(uploadsDir, version.filename);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(version.original_name)}"`);
  res.sendFile(filePath);
});

router.put('/:id/memo', requireAuth, (req: Request, res: Response) => {
  const { memo } = req.body;

  const result = db.prepare(`
    UPDATE versions SET memo = ? WHERE id = ?
  `).run(memo, req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }

  res.json({ success: true });
});

router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const version = db.prepare(`
    SELECT filename FROM versions WHERE id = ?
  `).get(req.params.id) as Pick<Version, 'filename'> | undefined;

  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }

  const filePath = path.join(uploadsDir, version.filename);

  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('File deletion error:', err);
  }

  db.prepare('DELETE FROM versions WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

export default router;
