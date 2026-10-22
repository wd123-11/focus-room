const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// Railway 部署时把持久化卷挂载到 /data；本地开发用项目下的 data 目录
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'focusroom.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    code TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    host_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code TEXT NOT NULL,
    name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    started_at INTEGER,
    ended_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (room_code) REFERENCES rooms(code)
  );
`);

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 20; i++) {
    let code = '';
    for (let j = 0; j < 6; j++) {
      code += chars[crypto.randomInt(chars.length)];
    }
    const existing = db.prepare('SELECT code FROM rooms WHERE code = ?').get(code);
    if (!existing) return code;
  }
  throw new Error('房间码生成失败，请重试');
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function createRoom(topic, hostName) {
  const code = generateRoomCode();
  const token = generateToken();
  const now = Date.now();
  db.prepare(
    'INSERT INTO rooms (code, topic, host_name, created_at) VALUES (?, ?, ?, ?)'
  ).run(code, topic, hostName, now);
  db.prepare(
    'INSERT INTO members (room_code, name, token, created_at) VALUES (?, ?, ?, ?)'
  ).run(code, hostName, token, now);
  return { code, token };
}

function getRoom(code) {
  return db.prepare('SELECT * FROM rooms WHERE code = ?').get(code);
}

function addMember(roomCode, name) {
  const token = generateToken();
  db.prepare(
    'INSERT INTO members (room_code, name, token, created_at) VALUES (?, ?, ?, ?)'
  ).run(roomCode, name, token, Date.now());
  return { token };
}

function getMemberByToken(token) {
  return db.prepare('SELECT * FROM members WHERE token = ?').get(token);
}

function getMembers(roomCode) {
  return db.prepare(
    'SELECT id, name, started_at, ended_at, created_at FROM members WHERE room_code = ? ORDER BY id ASC'
  ).all(roomCode);
}

function startMember(memberId) {
  db.prepare(
    'UPDATE members SET started_at = ?, ended_at = NULL WHERE id = ? AND started_at IS NULL'
  ).run(Date.now(), memberId);
}

function endMember(memberId) {
  db.prepare(
    'UPDATE members SET ended_at = ? WHERE id = ? AND started_at IS NOT NULL AND ended_at IS NULL'
  ).run(Date.now(), memberId);
}

module.exports = {
  createRoom,
  getRoom,
  addMember,
  getMemberByToken,
  getMembers,
  startMember,
  endMember,
};
