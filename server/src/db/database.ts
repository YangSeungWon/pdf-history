import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Docker에서는 /app/data, 로컬에서는 프로젝트 루트
const dataDir = process.env.NODE_ENV === 'production'
  ? '/app/data'
  : path.join(__dirname, '../..');

// 디렉토리 생성
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'data.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    extracted_text TEXT,
    memo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface Version {
  id: number;
  filename: string;
  original_name: string;
  extracted_text: string | null;
  memo: string | null;
  created_at: string;
}

export default db;
