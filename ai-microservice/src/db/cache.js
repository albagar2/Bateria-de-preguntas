const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create or open the cache database
const db = new Database(path.join(DB_DIR, 'ai_cache.db'));

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS explanations (
    hash_key TEXT PRIMARY KEY,
    question_id TEXT,
    explanation TEXT NOT NULL,
    model_used TEXT,
    difficulty_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertExplanation = db.prepare(`
    INSERT OR REPLACE INTO explanations (hash_key, question_id, explanation, model_used, difficulty_level)
    VALUES (@hash_key, @question_id, @explanation, @model_used, @difficulty_level)
`);

const getExplanation = db.prepare(`
    SELECT * FROM explanations WHERE hash_key = ?
`);

/**
 * Generate a deterministic hash key for a question
 */
function generateHashKey(question_text, difficulty) {
    // Simple base64 or string combination for key. 
    // In production, use crypto.createHash('sha256')
    const keyString = `${question_text}_${difficulty}`.toLowerCase().trim();
    return Buffer.from(keyString).toString('base64');
}

module.exports = {
    insertExplanation,
    getExplanation,
    generateHashKey
};
