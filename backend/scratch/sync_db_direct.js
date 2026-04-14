const { Client } = require('pg');

const connectionString = "postgresql://postgres.oiptollngjbrvpyjywah:UsoBateriaPreguntas@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase');
    
    // Add daily_goal to users
    console.log('Adding daily_goal to users...');
    try {
      await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_goal" INTEGER DEFAULT 20;');
      console.log('Column daily_goal added successfully');
    } catch (e) {
      console.log('Note: Column daily_goal might already exist or error:', e.message);
    }

    // Ensure achievements table exists (Drop if corrupted)
    console.log('Replacing achievements table...');
    await client.query(`
      DROP TABLE IF EXISTS "user_achievements" CASCADE;
      DROP TABLE IF EXISTS "achievements" CASCADE;

      CREATE TABLE "achievements" (
        "id" TEXT NOT NULL,
        "code" VARCHAR(50) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT NOT NULL,
        "icon" VARCHAR(50) NOT NULL,
        "type" TEXT NOT NULL,
        "threshold" INTEGER NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

      CREATE TABLE "user_achievements" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "achievement_id" TEXT NOT NULL,
        "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "chat_messages_user_id_idx" ON "chat_messages"("user_id");
    `);
    console.log('Tables achievements, user_achievements and chat_messages ready');

    console.log('Sync complete!');
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await client.end();
  }
}

run();
