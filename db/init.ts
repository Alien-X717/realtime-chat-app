import { Pool } from 'pg'

async function initDatabase() {
  // Connect to postgres database to create chatapp database
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: 'postgres', // Connect to default postgres database
  })

  try {
    const dbName = process.env.POSTGRES_DB || 'realtime_chat_app'

    // Check if database exists
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname='${dbName}'`
    )

    if (result.rowCount === 0) {
      // Create database if it doesn't exist
      await pool.query(`CREATE DATABASE ${dbName}`)
      console.log(`✓ Database "${dbName}" created successfully`)
    } else {
      console.log(`✓ Database "${dbName}" already exists`)
    }
  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

initDatabase()
