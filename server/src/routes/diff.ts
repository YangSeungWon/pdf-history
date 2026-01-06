import { Router, Request, Response } from 'express';
import db, { Version } from '../db/database.js';
import { compareTexts } from '../services/diffService.js';
import { requireAuth } from './auth.js';

const router = Router();

router.get('/:id1/:id2', requireAuth, (req: Request, res: Response) => {
  const { id1, id2 } = req.params;

  const version1 = db.prepare(`
    SELECT id, original_name, extracted_text, created_at FROM versions WHERE id = ?
  `).get(id1) as Pick<Version, 'id' | 'original_name' | 'extracted_text' | 'created_at'> | undefined;

  const version2 = db.prepare(`
    SELECT id, original_name, extracted_text, created_at FROM versions WHERE id = ?
  `).get(id2) as Pick<Version, 'id' | 'original_name' | 'extracted_text' | 'created_at'> | undefined;

  if (!version1 || !version2) {
    res.status(404).json({ error: 'One or both versions not found' });
    return;
  }

  const text1 = version1.extracted_text || '';
  const text2 = version2.extracted_text || '';

  const diffResult = compareTexts(text1, text2);

  res.json({
    version1: {
      id: version1.id,
      original_name: version1.original_name,
      created_at: version1.created_at
    },
    version2: {
      id: version2.id,
      original_name: version2.original_name,
      created_at: version2.created_at
    },
    diff: diffResult
  });
});

export default router;
