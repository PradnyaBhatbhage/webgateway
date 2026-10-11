import mysql from "mysql2/promise";
import { SCHEMA_SQL } from "./schema.js";

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

let pool;

export async function initDb() {
  const admin = await mysql.createConnection({ ...config, multipleStatements: true });
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "webgateway"}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();

  pool = mysql.createPool({
    ...config,
    database: process.env.DB_NAME || "webgateway",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });

  const conn = await pool.getConnection();
  try {
    for (const stmt of SCHEMA_SQL) {
      await conn.query(stmt);
    }
  } finally {
    conn.release();
  }
  return pool;
}

export function getPool() {
  if (!pool) throw new Error("Database not initialised");
  return pool;
}

export async function query(sql, params) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

export async function execute(sql, params) {
  const [result] = await getPool().execute(sql, params);
  return result;
}

export async function nextNumber(prefix, table, column) {
  const rows = await query(
    `SELECT ${column} AS n FROM ${table} WHERE ${column} LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );
  const last = rows[0]?.n || `${prefix}0000`;
  const num = Number(String(last).replace(/\D/g, "").slice(-4)) + 1;
  return `${prefix}${String(num).padStart(4, "0")}`;
}
