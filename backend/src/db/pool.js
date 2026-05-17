const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'baustellenmappe',
  user:     process.env.DB_USER     || 'beck',
  password: process.env.DB_PASSWORD || '',
});

pool.on('error', (err) => {
  console.error('PostgreSQL Verbindungsfehler:', err);
});

module.exports = pool;
