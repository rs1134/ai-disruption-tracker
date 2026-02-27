#!/usr/bin/env node
// Run with: node database/migrate.js
// Requires DATABASE_URL environment variable

const fs = require('fs');
const path = require('path');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const { neon } = require('@neondatabase/serverless');
  const sql = neon(databaseUrl);

  try {
    console.log('🔄 Running database migrations...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    // Split by semicolons and filter empty statements
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message?.includes('already exists')) {
          console.warn(`⚠️  Statement warning: ${err.message}`);
        }
      }
    }

    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
