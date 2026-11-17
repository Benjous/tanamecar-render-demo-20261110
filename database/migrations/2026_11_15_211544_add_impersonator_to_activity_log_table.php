<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('activity_log', 'impersonator_id')) {
            Schema::table('activity_log', function (Blueprint $table) {
                $table->foreignId('impersonator_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('activity_log', 'impersonator_name')) {
            Schema::table('activity_log', function (Blueprint $table) {
                $table->string('impersonator_name')->nullable()->after('impersonator_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropConstrainedForeignId('impersonator_id');
            $table->dropColumn('impersonator_name');
        });
    }
};
