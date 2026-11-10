<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS notifications (
  id bigserial PRIMARY KEY,
  user_id bigint,
  type varchar(64) NOT NULL,
  title varchar(255) NOT NULL,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
)
SQL);
        DB::statement('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at)');
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS notifications');
    }
};
