const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      code VARCHAR(6) PRIMARY KEY,
      topic VARCHAR(30) NOT NULL,
      host_name VARCHAR(20) NOT NULL,
      created_at BIGINT NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      room_code VARCHAR(6) NOT NULL REFERENCES rooms(code),
      name VARCHAR(20) NOT NULL,
      token VARCHAR(48) NOT NULL UNIQUE,
      started_at BIGINT,
      ended_at BIGINT,
      created_at BIGINT NOT NULL
    );
  `);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let j = 0; j < 6; j++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function createRoom(topic, hostName) {
  for (let i = 0; i < 20; i++) {
    const code = generateRoomCode();
    const token = generateToken();
    const now = Date.now();
    try {
      await pool.query(
        'INSERT INTO rooms (code, topic, host_name, created_at) VALUES ($1, $2, $3, $4)',
        [code, topic, hostName, now]
      );
      await pool.query(
        'INSERT INTO members (room_code, name, token, created_at) VALUES ($1, $2, $3, $4)',
        [code, hostName, token, now]
      );
      return { code, token };
    } catch (err) {
      if (err.code === '23505') continue; // 主键冲突，换码重试
      throw err;
    }
  }
  throw new Error('房间码生成失败，请重试');
}

async function getRoom(code) {
  const { rows } = await pool.query('SELECT * FROM rooms WHERE code = $1', [code]);
  return rows[0] || null;
}

async function addMember(roomCode, name) {
  const token = generateToken();
  await pool.query(
    'INSERT INTO members (room_code, name, token, created_at) VALUES ($1, $2, $3, $4)',
    [roomCode, name, token, Date.now()]
  );
  return { token };
}

async function getMemberByToken(token) {
  const { rows } = await pool.query('SELECT * FROM members WHERE token = $1', [token]);
  return rows[0] || null;
}

async function getMembers(roomCode) {
  const { rows } = await pool.query(
    'SELECT id, name, started_at, ended_at, created_at FROM members WHERE room_code = $1 ORDER BY id ASC',
    [roomCode]
  );
  return rows;
}

async function startMember(memberId) {
  await pool.query(
    'UPDATE members SET started_at = $1, ended_at = NULL WHERE id = $2 AND started_at IS NULL',
    [Date.now(), memberId]
  );
}

async function endMember(memberId) {
  await pool.query(
    'UPDATE members SET ended_at = $1 WHERE id = $2 AND started_at IS NOT NULL AND ended_at IS NULL',
    [Date.now(), memberId]
  );
}

module.exports = (async () => {
  await init();
  return {
    createRoom,
    getRoom,
    addMember,
    getMemberByToken,
    getMembers,
    startMember,
    endMember,
  };
})();
