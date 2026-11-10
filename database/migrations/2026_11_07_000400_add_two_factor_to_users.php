<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret text');
        DB::statement('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_recovery_codes text');
        DB::statement('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_confirmed_at timestamptz');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS two_factor_secret');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS two_factor_recovery_codes');
        DB::statement('ALTER TABLE users DROP COLUMN IF EXISTS two_factor_confirmed_at');
    }
};
