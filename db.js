// 有 DATABASE_URL 时使用 PostgreSQL（云端），否则使用 SQLite（本地开发）
let dbPromise;
if (process.env.DATABASE_URL) {
  dbPromise = require('./db-postgres');
} else {
  dbPromise = Promise.resolve(require('./db-sqlite'));
}

module.exports = dbPromise;
