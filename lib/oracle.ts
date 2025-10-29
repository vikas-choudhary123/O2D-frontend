// lib/oracle.ts
import oracledb from "oracledb";

// ✅ Force Thick mode (required for Oracle 11g)
try {
  if (oracledb.thin) {
    oracledb.initOracleClient({
      libDir: "/opt/oracle/instantclient_23_3_arm64",
    });
    console.log("✅ Oracle Instant Client initialized (Thick mode)");
  } else {
    console.log("ℹ️ Oracle client already initialized (Thick mode)");
  }
} catch (err: any) {
  if (err.message.includes("DPI-1047")) {
    console.error("❌ Cannot locate Oracle Instant Client. Check libDir path.");
  } else if (err.message.includes("DPI-1050")) {
    console.log("ℹ️ Oracle client already initialized.");
  } else {
    console.error("⚠️ Oracle client initialization error:", err.message);
  }
}

// Log which mode we’re actually using
console.log("🔍 OracleDB mode:", oracledb.thin ? "Thin" : "Thick");

let pool: oracledb.Pool | null = null;

/**
 * Create and return an Oracle DB connection pool.
 */
export async function getOraclePool(): Promise<oracledb.Pool> {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });

  console.log("✅ Oracle connection pool created");
  return pool;
}

/**
 * Execute a SQL query and return the result rows.
 */
export async function executeQuery(query: string, binds: any[] = []) {
  const pool = await getOraclePool();
  const conn = await pool.getConnection();

  try {
    const result = await conn.execute(query, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows;
  } finally {
    await conn.close();
  }
}
